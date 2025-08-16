import requests
import sys
import json
from datetime import datetime

class CharityFindsAPITester:
    def __init__(self, base_url="https://charity-finds.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_user_email = f"test_user_{datetime.now().strftime('%H%M%S')}@test.com"
        self.test_product_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}" if not endpoint.startswith('http') else endpoint
        
        if headers is None:
            headers = {'Content-Type': 'application/json'}
        
        if self.token and 'Authorization' not in headers:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test health check endpoint"""
        return self.run_test("Health Check", "GET", "health", 200)

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root Endpoint", "GET", "", 200)

    def test_categories(self):
        """Test categories endpoint"""
        return self.run_test("Get Categories", "GET", "categories", 200)

    def test_products_endpoint(self):
        """Test products endpoint"""
        return self.run_test("Get Products", "GET", "products", 200)

    def test_user_registration(self):
        """Test user registration"""
        user_data = {
            "name": "Test User",
            "email": self.test_user_email,
            "password": "TestPass123!",
            "role": "buyer"
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=user_data
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            if 'user' in response:
                self.user_id = response['user']['id']
            print(f"   Token obtained: {self.token[:20]}...")
            return True
        return False

    def test_user_login(self):
        """Test user login"""
        login_data = {
            "email": self.test_user_email,
            "password": "TestPass123!"
        }
        
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            if 'user' in response:
                self.user_id = response['user']['id']
            print(f"   Login successful, token: {self.token[:20]}...")
            return True
        return False

    def test_create_donor_user(self):
        """Create a donor user for product creation"""
        donor_email = f"donor_{datetime.now().strftime('%H%M%S')}@test.com"
        user_data = {
            "name": "Test Donor",
            "email": donor_email,
            "password": "TestPass123!",
            "role": "donor"
        }
        
        success, response = self.run_test(
            "Donor Registration",
            "POST",
            "auth/register",
            200,
            data=user_data
        )
        
        if success and 'access_token' in response:
            # Store donor token for product creation
            self.donor_token = response['access_token']
            self.donor_id = response['user']['id']
            print(f"   Donor token obtained: {self.donor_token[:20]}...")
            return True
        return False

    def test_create_product(self):
        """Test product creation (requires donor role)"""
        if not hasattr(self, 'donor_token'):
            print("❌ No donor token available for product creation")
            return False
            
        product_data = {
            "title": "Test Product for Charity",
            "description": "This is a test product created for API testing purposes.",
            "price": 15.99,
            "original_price": 45.00,
            "category": "Toys",
            "condition": "Very Good",
            "image_url": "https://images.unsplash.com/photo-1587654780291-39c9404d746b",
            "location": "Test City",
            "donor_id": self.donor_id
        }
        
        # Use donor token for this request
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.donor_token}'
        }
        
        success, response = self.run_test(
            "Create Product",
            "POST",
            "products",
            200,
            data=product_data,
            headers=headers
        )
        
        if success and 'id' in response:
            self.test_product_id = response['id']
            print(f"   Product created with ID: {self.test_product_id}")
            return True
        return False

    def test_get_single_product(self):
        """Test getting a single product"""
        if not self.test_product_id:
            print("❌ No product ID available for single product test")
            return False
            
        return self.run_test(
            "Get Single Product",
            "GET",
            f"products/{self.test_product_id}",
            200
        )

    def test_cart_operations(self):
        """Test cart operations"""
        if not self.token:
            print("❌ No authentication token for cart operations")
            return False
            
        # Test get empty cart
        success1, _ = self.run_test("Get Empty Cart", "GET", "cart", 200)
        
        # Test add to cart (need a product ID)
        if self.test_product_id:
            cart_item = {
                "product_id": self.test_product_id,
                "quantity": 2
            }
            success2, _ = self.run_test("Add to Cart", "POST", "cart/add", 200, data=cart_item)
            
            # Test get cart with items
            success3, _ = self.run_test("Get Cart with Items", "GET", "cart", 200)
            
            # Test remove from cart
            success4, _ = self.run_test("Remove from Cart", "DELETE", f"cart/remove/{self.test_product_id}", 200)
            
            return success1 and success2 and success3 and success4
        
        return success1

    def test_orders(self):
        """Test order operations"""
        if not self.token:
            print("❌ No authentication token for order operations")
            return False
            
        # Test get orders (should be empty initially)
        success1, _ = self.run_test("Get Orders", "GET", "orders", 200)
        
        return success1

    def test_products_with_filters(self):
        """Test products endpoint with various filters"""
        # Test with category filter
        success1, _ = self.run_test("Products - Category Filter", "GET", "products?category=Toys", 200)
        
        # Test with search
        success2, _ = self.run_test("Products - Search Filter", "GET", "products?search=test", 200)
        
        # Test with price range
        success3, _ = self.run_test("Products - Price Filter", "GET", "products?min_price=10&max_price=50", 200)
        
        return success1 and success2 and success3

def main():
    print("🚀 Starting CharityFinds API Testing...")
    print("=" * 60)
    
    tester = CharityFindsAPITester()
    
    # Basic endpoint tests
    print("\n📋 BASIC ENDPOINT TESTS")
    print("-" * 30)
    tester.test_health_check()
    tester.test_root_endpoint()
    tester.test_categories()
    tester.test_products_endpoint()
    
    # Authentication tests
    print("\n🔐 AUTHENTICATION TESTS")
    print("-" * 30)
    if not tester.test_user_registration():
        print("❌ Registration failed, trying login with existing user...")
        if not tester.test_user_login():
            print("❌ Both registration and login failed, skipping authenticated tests")
            return 1
    
    # Create donor user for product operations
    print("\n👤 DONOR USER CREATION")
    print("-" * 30)
    tester.test_create_donor_user()
    
    # Product tests
    print("\n📦 PRODUCT TESTS")
    print("-" * 30)
    tester.test_create_product()
    tester.test_get_single_product()
    tester.test_products_with_filters()
    
    # Cart tests
    print("\n🛒 CART TESTS")
    print("-" * 30)
    tester.test_cart_operations()
    
    # Order tests
    print("\n📋 ORDER TESTS")
    print("-" * 30)
    tester.test_orders()
    
    # Print final results
    print("\n" + "=" * 60)
    print("📊 FINAL RESULTS")
    print("=" * 60)
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Tests Failed: {tester.tests_run - tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run*100):.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed. Check the logs above for details.")
        return 1

if __name__ == "__main__":
    sys.exit(main())