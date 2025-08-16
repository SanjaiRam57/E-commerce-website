import React, { useState, useEffect } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ShoppingCart, Heart, Search, User, Menu, X, Star, ArrowRight, Package, Users, MapPin, Phone, Mail } from 'lucide-react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Card, CardContent, CardHeader } from './components/ui/card';
import { Badge } from './components/ui/badge';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Mock data for development
const mockProducts = [
  {
    id: '1',
    title: 'Children\'s Winter Clothes Bundle',
    price: 15.99,
    originalPrice: 45.00,
    image: 'https://images.unsplash.com/photo-1604467794349-0b74285de7e7?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHwxfHxjaGlsZHJlbiUyMGNsb3RoZXN8ZW58MHx8fHwxNzU1MzMyMTU0fDA&ixlib=rb-4.1.0&q=85',
    category: 'Clothing',
    condition: 'Very Good',
    description: 'Bundle of warm winter clothes including jackets, sweaters, and pants. Perfect for keeping children warm during cold months.',
    donor: 'Sarah M.',
    location: 'New York',
    rating: 4.8,
    reviews: 12
  },
  {
    id: '2',
    title: 'Educational Building Blocks Set',
    price: 8.50,
    originalPrice: 25.00,
    image: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzd8MHwxfHNlYXJjaHwzfHx0b3lzfGVufDB8fHx8MTc1NTMzMjE1OHww&ixlib=rb-4.1.0&q=85',
    category: 'Toys',
    condition: 'Good',
    description: 'Colorful Lego-compatible building blocks set. Great for developing creativity and motor skills in children.',
    donor: 'Michael K.',
    location: 'California',
    rating: 4.9,
    reviews: 8
  },
  {
    id: '3',
    title: 'Classic Children\'s Book Collection',
    price: 12.00,
    originalPrice: 35.00,
    image: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODB8MHwxfHNlYXJjaHw0fHxib29rc3xlbnwwfHx8fDE3NTUzMzIxNjJ8MA&ixlib=rb-4.1.0&q=85',
    category: 'Books',
    condition: 'Excellent',
    description: 'Collection of timeless children\'s books including fairy tales and educational stories. Perfect for building reading skills.',
    donor: 'Emma L.',
    location: 'Texas',
    rating: 5.0,
    reviews: 15
  },
  {
    id: '4',
    title: 'Wooden Train Play Set',
    price: 18.75,
    originalPrice: 55.00,
    image: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzd8MHwxfHNlYXJjaHwyfHx0b3lzfGVufDB8fHx8MTc1NTMzMjE1OHww&ixlib=rb-4.1.0&q=85',
    category: 'Toys',
    condition: 'Very Good',
    description: 'Beautiful wooden train set with tracks and accessories. Encourages imaginative play and fine motor development.',
    donor: 'James R.',
    location: 'Florida',
    rating: 4.7,
    reviews: 10
  },
  {
    id: '5',
    title: 'Summer Clothes Variety Pack',
    price: 10.25,
    originalPrice: 30.00,
    image: 'https://images.unsplash.com/photo-1574681357916-9d4464642696?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHwyfHxjaGlsZHJlbiUyMGNsb3RoZXN8ZW58MHx8fHwxNzU1MzMyMTU0fDA&ixlib=rb-4.1.0&q=85',
    category: 'Clothing',
    condition: 'Good',
    description: 'Colorful summer clothing collection including t-shirts, shorts, and dresses in various sizes.',
    donor: 'Lisa W.',
    location: 'Arizona',
    rating: 4.6,
    reviews: 7
  },
  {
    id: '6',
    title: 'LEGO Minifigures Collection',
    price: 22.00,
    originalPrice: 60.00,
    image: 'https://images.unsplash.com/photo-1599623560574-39d485900c95?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzd8MHwxfHNlYXJjaHwxfHx0b3lzfGVufDB8fHx8MTc1NTMzMjE1OHww&ixlib=rb-4.1.0&q=85',
    category: 'Toys',
    condition: 'Excellent',
    description: 'Rare collection of LEGO minifigures and accessories. Perfect for creative building and storytelling.',
    donor: 'David H.',
    location: 'Illinois',
    rating: 4.9,
    reviews: 14
  }
];

const categories = ['All', 'Clothing', 'Toys', 'Books', 'Electronics', 'Sports'];

// Header Component
const Header = ({ cartItems, toggleCart }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  return (
    <header className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Heart className="h-8 w-8 text-rose-600" />
            <span className="text-xl font-bold text-gray-900">CharityFinds</span>
          </Link>
          
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-700 hover:text-rose-600 transition-colors">Home</Link>
            <Link to="/products" className="text-gray-700 hover:text-rose-600 transition-colors">Shop</Link>
            <Link to="/donate" className="text-gray-700 hover:text-rose-600 transition-colors">Donate</Link>
            <Link to="/about" className="text-gray-700 hover:text-rose-600 transition-colors">About</Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input 
                placeholder="Search for items..." 
                className="pl-10 w-64"
              />
            </div>
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleCart}
              className="relative"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartItems.length > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-rose-600 text-white text-xs">
                  {cartItems.length}
                </Badge>
              )}
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
        
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col space-y-4">
              <Link to="/" className="text-gray-700 hover:text-rose-600 transition-colors">Home</Link>
              <Link to="/products" className="text-gray-700 hover:text-rose-600 transition-colors">Shop</Link>
              <Link to="/donate" className="text-gray-700 hover:text-rose-600 transition-colors">Donate</Link>
              <Link to="/about" className="text-gray-700 hover:text-rose-600 transition-colors">About</Link>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input placeholder="Search for items..." className="pl-10" />
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

// Product Card Component
const ProductCard = ({ product, onAddToCart }) => {
  const savings = ((product.originalPrice - product.price) / product.originalPrice * 100).toFixed(0);
  
  return (
    <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="relative overflow-hidden rounded-t-lg">
        <img 
          src={product.image} 
          alt={product.title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <Badge className="absolute top-2 right-2 bg-green-600 text-white">
          {savings}% OFF
        </Badge>
        <Badge className="absolute top-2 left-2 bg-blue-600 text-white">
          {product.condition}
        </Badge>
      </div>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-900 line-clamp-2 flex-1">{product.title}</h3>
        </div>
        <div className="flex items-center space-x-1 mb-2">
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          <span className="text-sm text-gray-600">{product.rating} ({product.reviews})</span>
        </div>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold text-rose-600">${product.price}</span>
            <span className="text-sm text-gray-500 line-through">${product.originalPrice}</span>
          </div>
          <Badge variant="outline">{product.category}</Badge>
        </div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-1 text-sm text-gray-500">
            <MapPin className="h-3 w-3" />
            <span>{product.location}</span>
          </div>
          <span className="text-sm text-gray-600">by {product.donor}</span>
        </div>
        <Button 
          onClick={() => onAddToCart(product)}
          className="w-full bg-rose-600 hover:bg-rose-700 text-white"
        >
          Add to Cart
        </Button>
      </CardContent>
    </Card>
  );
};

// Hero Section
const HeroSection = () => {
  return (
    <div className="relative bg-gradient-to-r from-rose-50 to-orange-50 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
              Give Hope,
              <span className="text-rose-600"> Share Love</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Find quality second-hand items at incredible prices while supporting orphanages. 
              Every purchase helps provide essentials to children who need them most.
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <Button size="lg" className="bg-rose-600 hover:bg-rose-700 text-white px-8 py-4">
                Shop Now <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="border-rose-600 text-rose-600 hover:bg-rose-50 px-8 py-4">
                Donate Items
              </Button>
            </div>
            <div className="flex items-center space-x-8 mt-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-rose-600">10K+</div>
                <div className="text-sm text-gray-600">Items Donated</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-rose-600">50+</div>
                <div className="text-sm text-gray-600">Orphanages Helped</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-rose-600">5K+</div>
                <div className="text-sm text-gray-600">Happy Donors</div>
              </div>
            </div>
          </div>
          <div className="relative">
            <img 
              src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDN8MHwxfHNlYXJjaHwxfHxjaGFyaXR5JTIwY2hpbGRyZW58ZW58MHx8fHwxNzU1MzMyMTI4fDA&ixlib=rb-4.1.0&q=85"
              alt="Happy Children"
              className="w-full rounded-lg shadow-2xl"
            />
            <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-lg shadow-lg">
              <div className="flex items-center space-x-3">
                <Package className="h-8 w-8 text-rose-600" />
                <div>
                  <div className="font-semibold text-gray-900">Free Shipping</div>
                  <div className="text-sm text-gray-600">On all orders over $25</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Featured Categories
const FeaturedCategories = () => {
  const categoryImages = {
    'Clothing': 'https://images.unsplash.com/photo-1604467794349-0b74285de7e7?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHwxfHxjaGlsZHJlbiUyMGNsb3RoZXN8ZW58MHx8fHwxNzU1MzMyMTU0fDA&ixlib=rb-4.1.0&q=85',
    'Toys': 'https://images.unsplash.com/photo-1599623560574-39d485900c95?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzd8MHwxfHNlYXJjaHwxfHx0b3lzfGVufDB8fHx8MTc1NTMzMjE1OHww&ixlib=rb-4.1.0&q=85',
    'Books': 'https://images.unsplash.com/photo-1604866830893-c13cafa515d5?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODB8MHwxfHNlYXJjaHwxfHxib29rc3xlbnwwfHx8fDE3NTUzMzIxNjJ8MA&ixlib=rb-4.1.0&q=85'
  };
  
  return (
    <div className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Popular Categories</h2>
          <p className="text-lg text-gray-600">Discover amazing deals across all categories</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {Object.entries(categoryImages).map(([category, image]) => (
            <Card key={category} className="group hover:shadow-xl transition-all duration-300 cursor-pointer">
              <div className="relative overflow-hidden rounded-t-lg">
                <img 
                  src={image} 
                  alt={category}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-10 transition-all duration-300"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <h3 className="text-2xl font-bold text-white text-center">{category}</h3>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

// Footer Component
const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Heart className="h-6 w-6 text-rose-600" />
              <span className="text-xl font-bold">CharityFinds</span>
            </div>
            <p className="text-gray-400">
              Connecting generous hearts with children in need. Every purchase makes a difference.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <div className="space-y-2">
              <Link to="/" className="text-gray-400 hover:text-white transition-colors block">Home</Link>
              <Link to="/products" className="text-gray-400 hover:text-white transition-colors block">Shop</Link>
              <Link to="/donate" className="text-gray-400 hover:text-white transition-colors block">Donate</Link>
              <Link to="/about" className="text-gray-400 hover:text-white transition-colors block">About</Link>
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <div className="space-y-2">
              <a href="#" className="text-gray-400 hover:text-white transition-colors block">Help Center</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors block">Shipping Info</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors block">Returns</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors block">Contact Us</a>
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Contact</h3>
            <div className="space-y-2 text-gray-400">
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span>1-800-CHARITY</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>help@charityfinds.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>New York, NY</span>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2024 CharityFinds. All rights reserved. Made with ❤️ for children in need.</p>
        </div>
      </div>
    </footer>
  );
};

// Home Page
const Home = () => {
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  const addToCart = (product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };
  
  const toggleCart = () => setIsCartOpen(!isCartOpen);
  
  const featuredProducts = mockProducts.slice(0, 3);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header cartItems={cartItems} toggleCart={toggleCart} />
      <HeroSection />
      <FeaturedCategories />
      
      {/* Featured Products */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Items</h2>
            <p className="text-lg text-gray-600">Hand-picked items that make the biggest impact</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {featuredProducts.map(product => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onAddToCart={addToCart}
              />
            ))}
          </div>
          <div className="text-center mt-12">
            <Button size="lg" className="bg-rose-600 hover:bg-rose-700 text-white">
              View All Products <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Impact Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Your Impact Matters</h2>
              <p className="text-lg text-gray-600 mb-6">
                Every item you purchase directly supports orphanages and provides essential resources to children in need. 
                Together, we're building a better future, one purchase at a time.
              </p>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Users className="h-6 w-6 text-rose-600" />
                  <span className="text-gray-700">Direct support to 50+ orphanages nationwide</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Package className="h-6 w-6 text-rose-600" />
                  <span className="text-gray-700">100% of proceeds go to child welfare programs</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Heart className="h-6 w-6 text-rose-600" />
                  <span className="text-gray-700">Transparent tracking of your contribution's impact</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDN8MHwxfHNlYXJjaHwxfHxjaGFyaXR5JTIwY2hpbGRyZW58ZW58MHx8fHwxNzU1MzMyMTI4fDA&ixlib=rb-4.1.0&q=85"
                alt="Children at orphanage"
                className="w-full rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
      
      {/* Shopping Cart Sidebar */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={toggleCart}></div>
          <div className="absolute right-0 top-0 h-full w-96 bg-white shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Shopping Cart ({cartItems.length})</h2>
              <Button variant="ghost" size="icon" onClick={toggleCart}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {cartItems.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Your cart is empty</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cartItems.map(item => (
                    <div key={item.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                      <img src={item.image} alt={item.title} className="w-16 h-16 object-cover rounded" />
                      <div className="flex-1">
                        <h3 className="font-medium text-sm">{item.title}</h3>
                        <p className="text-rose-600 font-semibold">${item.price}</p>
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {cartItems.length > 0 && (
              <div className="border-t p-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-semibold">Total: </span>
                  <span className="font-bold text-rose-600">
                    ${cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
                  </span>
                </div>
                <Button className="w-full bg-rose-600 hover:bg-rose-700 text-white">
                  Proceed to Checkout
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Products Page
const Products = () => {
  const [cartItems, setCartItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  
  const addToCart = (product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };
  
  const filteredProducts = mockProducts.filter(product => {
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header cartItems={cartItems} toggleCart={() => {}} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">All Products</h1>
          
          {/* Filters */}
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mb-8">
            <div className="flex space-x-2 overflow-x-auto">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                    selectedCategory === category
                      ? 'bg-rose-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input 
                placeholder="Search products..." 
                className="pl-10 w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <p className="text-gray-600">{filteredProducts.length} products found</p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onAddToCart={addToCart}
            />
          ))}
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

// Main App Component
function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/donate" element={<div>Donate Page Coming Soon</div>} />
          <Route path="/about" element={<div>About Page Coming Soon</div>} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;