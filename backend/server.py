from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
from passlib.context import CryptContext
import jwt
from email_validator import validate_email, EmailNotValidError
import bcrypt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="CharityFinds API", description="E-commerce API for second-hand charity items")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.environ.get("SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Models
class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: str = Field(default="buyer", pattern="^(buyer|donor|admin)$")

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    role: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True

class ProductCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=200)
    description: str = Field(..., min_length=10, max_length=1000)
    price: float = Field(..., gt=0)
    original_price: float = Field(..., gt=0)
    category: str = Field(..., pattern="^(Clothing|Toys|Books|Electronics|Sports|Other)$")
    condition: str = Field(..., pattern="^(New|Excellent|Very Good|Good|Fair)$")
    image_url: str
    location: str = Field(..., min_length=2, max_length=100)
    donor_id: str

class Product(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    price: float
    original_price: float
    category: str
    condition: str
    image_url: str
    location: str
    donor_id: str
    donor_name: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_available: bool = True
    rating: float = 0.0
    reviews_count: int = 0

class OrderCreate(BaseModel):
    items: List[Dict[str, Any]]  # [{product_id, quantity, price}]
    shipping_address: Dict[str, str]
    payment_method: str

class Order(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    items: List[Dict[str, Any]]
    total_amount: float
    shipping_address: Dict[str, str]
    payment_method: str
    status: str = "pending"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class CartItem(BaseModel):
    product_id: str
    quantity: int = Field(..., gt=0)

class Cart(BaseModel):
    user_id: str
    items: List[CartItem]
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Utility functions
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    user = await db.users.find_one({"email": email})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return User(**user)

# Routes
@api_router.get("/")
async def root():
    return {"message": "CharityFinds API is running!", "version": "1.0.0"}

@api_router.get("/health")
async def health_check():
    try:
        # Test database connection
        await db.command("ping")
        return {"status": "healthy", "database": "connected", "timestamp": datetime.utcnow()}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e), "timestamp": datetime.utcnow()}

# Authentication routes
@api_router.post("/auth/register", response_model=Dict[str, Any])
async def register(user_data: UserCreate):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    user_dict = user_data.dict()
    user_dict.pop("password")
    user_dict["hashed_password"] = hashed_password
    
    user = User(**user_dict)
    await db.users.insert_one(user.dict())
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
    }

@api_router.post("/auth/login", response_model=Dict[str, Any])
async def login(user_credentials: UserLogin):
    user = await db.users.find_one({"email": user_credentials.email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(user_credentials.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"]}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "role": user["role"]
        }
    }

# Product routes
@api_router.get("/products", response_model=List[Product])
async def get_products(
    category: Optional[str] = None,
    search: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    condition: Optional[str] = None,
    limit: int = 50,
    skip: int = 0
):
    query = {"is_available": True}
    
    if category and category != "All":
        query["category"] = category
    
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    
    if min_price is not None:
        query["price"] = {"$gte": min_price}
    
    if max_price is not None:
        if "price" in query:
            query["price"]["$lte"] = max_price
        else:
            query["price"] = {"$lte": max_price}
    
    if condition:
        query["condition"] = condition
    
    products = await db.products.find(query).skip(skip).limit(limit).to_list(limit)
    
    # Add donor names
    for product in products:
        donor = await db.users.find_one({"id": product["donor_id"]})
        if donor:
            product["donor_name"] = donor["name"]
    
    return [Product(**product) for product in products]

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id, "is_available": True})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Add donor name
    donor = await db.users.find_one({"id": product["donor_id"]})
    if donor:
        product["donor_name"] = donor["name"]
    
    return Product(**product)

@api_router.post("/products", response_model=Product)
async def create_product(product_data: ProductCreate, current_user: User = Depends(get_current_user)):
    if current_user.role not in ["donor", "admin"]:
        raise HTTPException(status_code=403, detail="Only donors can create products")
    
    product_dict = product_data.dict()
    product_dict["donor_id"] = current_user.id
    product_dict["donor_name"] = current_user.name
    
    product = Product(**product_dict)
    await db.products.insert_one(product.dict())
    
    return product

@api_router.put("/products/{product_id}", response_model=Product)
async def update_product(
    product_id: str, 
    product_data: ProductCreate, 
    current_user: User = Depends(get_current_user)
):
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if current_user.role != "admin" and product["donor_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this product")
    
    updated_data = product_data.dict()
    updated_data["donor_id"] = product["donor_id"]  # Keep original donor
    
    await db.products.update_one({"id": product_id}, {"$set": updated_data})
    
    updated_product = await db.products.find_one({"id": product_id})
    return Product(**updated_product)

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, current_user: User = Depends(get_current_user)):
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if current_user.role != "admin" and product["donor_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this product")
    
    await db.products.update_one({"id": product_id}, {"$set": {"is_available": False}})
    return {"message": "Product deleted successfully"}

# Cart routes
@api_router.get("/cart", response_model=Dict[str, Any])
async def get_cart(current_user: User = Depends(get_current_user)):
    cart = await db.carts.find_one({"user_id": current_user.id})
    if not cart:
        return {"items": [], "total": 0.0}
    
    # Get product details for each cart item
    cart_items = []
    total = 0.0
    
    for item in cart["items"]:
        product = await db.products.find_one({"id": item["product_id"], "is_available": True})
        if product:
            item_total = product["price"] * item["quantity"]
            cart_items.append({
                "product": Product(**product).dict(),
                "quantity": item["quantity"],
                "item_total": item_total
            })
            total += item_total
    
    return {"items": cart_items, "total": total}

@api_router.post("/cart/add")
async def add_to_cart(cart_item: CartItem, current_user: User = Depends(get_current_user)):
    # Check if product exists
    product = await db.products.find_one({"id": cart_item.product_id, "is_available": True})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Get or create cart
    cart = await db.carts.find_one({"user_id": current_user.id})
    if not cart:
        cart = {"user_id": current_user.id, "items": [], "updated_at": datetime.utcnow()}
    
    # Update quantity if item exists, otherwise add new item
    existing_item = None
    for item in cart["items"]:
        if item["product_id"] == cart_item.product_id:
            existing_item = item
            break
    
    if existing_item:
        existing_item["quantity"] += cart_item.quantity
    else:
        cart["items"].append(cart_item.dict())
    
    cart["updated_at"] = datetime.utcnow()
    
    await db.carts.replace_one({"user_id": current_user.id}, cart, upsert=True)
    
    return {"message": "Item added to cart successfully"}

@api_router.delete("/cart/remove/{product_id}")
async def remove_from_cart(product_id: str, current_user: User = Depends(get_current_user)):
    cart = await db.carts.find_one({"user_id": current_user.id})
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    cart["items"] = [item for item in cart["items"] if item["product_id"] != product_id]
    cart["updated_at"] = datetime.utcnow()
    
    await db.carts.replace_one({"user_id": current_user.id}, cart)
    
    return {"message": "Item removed from cart successfully"}

@api_router.delete("/cart/clear")
async def clear_cart(current_user: User = Depends(get_current_user)):
    await db.carts.delete_one({"user_id": current_user.id})
    return {"message": "Cart cleared successfully"}

# Order routes
@api_router.post("/orders", response_model=Order)
async def create_order(order_data: OrderCreate, current_user: User = Depends(get_current_user)):
    # Calculate total from items
    total_amount = 0.0
    for item in order_data.items:
        product = await db.products.find_one({"id": item["product_id"], "is_available": True})
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item['product_id']} not found")
        total_amount += product["price"] * item["quantity"]
    
    order_dict = order_data.dict()
    order_dict["user_id"] = current_user.id
    order_dict["total_amount"] = total_amount
    
    order = Order(**order_dict)
    await db.orders.insert_one(order.dict())
    
    # Clear cart after successful order
    await db.carts.delete_one({"user_id": current_user.id})
    
    return order

@api_router.get("/orders", response_model=List[Order])
async def get_orders(current_user: User = Depends(get_current_user)):
    query = {"user_id": current_user.id}
    if current_user.role == "admin":
        query = {}  # Admin can see all orders
    
    orders = await db.orders.find(query).sort("created_at", -1).to_list(100)
    return [Order(**order) for order in orders]

@api_router.get("/orders/{order_id}", response_model=Order)
async def get_order(order_id: str, current_user: User = Depends(get_current_user)):
    query = {"id": order_id}
    if current_user.role != "admin":
        query["user_id"] = current_user.id
    
    order = await db.orders.find_one(query)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return Order(**order)

# Statistics routes (for admin dashboard)
@api_router.get("/stats/overview")
async def get_stats_overview(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    total_products = await db.products.count_documents({"is_available": True})
    total_orders = await db.orders.count_documents({})
    total_users = await db.users.count_documents({"is_active": True})
    
    # Calculate total revenue
    orders = await db.orders.find({}).to_list(1000)
    total_revenue = sum(order["total_amount"] for order in orders)
    
    return {
        "total_products": total_products,
        "total_orders": total_orders,
        "total_users": total_users,
        "total_revenue": total_revenue
    }

# Categories endpoint
@api_router.get("/categories")
async def get_categories():
    return {
        "categories": [
            "Clothing",
            "Toys", 
            "Books",
            "Electronics",
            "Sports",
            "Other"
        ]
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    logger.info("CharityFinds API starting up...")
    try:
        # Test database connection
        await db.command("ping")
        logger.info("Database connection successful")
        
        # Create indexes
        await db.users.create_index("email", unique=True)
        await db.products.create_index([("title", "text"), ("description", "text")])
        await db.products.create_index("category")
        await db.products.create_index("price")
        await db.orders.create_index("user_id")
        
        logger.info("Database indexes created")
    except Exception as e:
        logger.error(f"Startup error: {e}")

@app.on_event("shutdown")
async def shutdown_db_client():
    logger.info("Shutting down CharityFinds API...")
    client.close()