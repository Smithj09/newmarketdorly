import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingBag, 
  User as UserIcon, 
  Search, 
  X, 
  Plus, 
  Minus, 
  Trash2, 
  ChevronRight, 
  Package, 
  LayoutDashboard, 
  LogOut,
  Menu,
  Instagram,
  Twitter,
  Facebook,
  Mail,
  ArrowRight,
  CheckCircle2,
  Clock,
  Truck,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from './supabaseClient';
import { Product, User, CartItem, Order } from './types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- API Service ---
const API_URL = '';

const api = {
  async syncUser(id: string, username: string) {
    const res = await fetch(`${API_URL}/api/auth/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, username })
    });
    return res.json();
  },
  async getProducts() {
    const res = await fetch(`${API_URL}/api/products`);
    return res.json();
  },
  async createOrder(items: CartItem[], totalPrice: number, token: string) {
    const res = await fetch(`${API_URL}/api/orders`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ items, total_price: totalPrice })
    });
    return res.json();
  },
  async getMyOrders(token: string) {
    const res = await fetch(`${API_URL}/api/orders/my`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  },
  async getAllOrders(token: string) {
    const res = await fetch(`${API_URL}/api/orders`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  },
  async updateOrderStatus(id: number, status: string, token: string) {
    const res = await fetch(`${API_URL}/api/orders/${id}/status`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });
    return res.json();
  },
  async createProduct(product: Omit<Product, 'id'>, token: string) {
    const res = await fetch(`${API_URL}/api/products`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(product)
    });
    return res.json();
  },
  async updateProduct(id: number, product: Omit<Product, 'id'>, token: string) {
    const res = await fetch(`${API_URL}/api/products/${id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(product)
    });
    return res.json();
  },
  async deleteProduct(id: number, token: string) {
    const res = await fetch(`${API_URL}/api/products/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  }
};

// --- Components ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [view, setView] = useState<'shop' | 'admin' | 'orders'>('shop');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);

  // Auth initialization
  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const syncData = await api.syncUser(session.user.id, session.user.email || 'User');
        setUser(syncData.user);
        setToken(syncData.token);
      }
      setLoading(false);
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const syncData = await api.syncUser(session.user.id, session.user.email || 'User');
        setUser(syncData.user);
        setToken(syncData.token);
      } else {
        setUser(null);
        setToken(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      const data = await api.getProducts();
      setProducts(data);
    };
    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckout = async () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    if (!token) return;

    try {
      await api.createOrder(cart, cartTotal, token);
      setCart([]);
      setIsCartOpen(false);
      setView('orders');
      alert('Order placed successfully!');
    } catch (error) {
      alert('Failed to place order');
    }
  };

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setToken(null);
    setView('shop');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Configuration Warning */}
      {!supabase && (
        <div className="bg-yellow-50 border-b border-yellow-100 py-2 px-4 text-center text-xs text-yellow-800 font-medium">
          Supabase is not configured. Authentication features are disabled. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment.
        </div>
      )}

      {/* Navbar */}
      <nav className="sticky top-0 z-40 glass-morphism border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <button 
                onClick={() => setView('shop')}
                className="text-2xl font-bold tracking-tighter text-primary flex items-center gap-2"
              >
                <ShoppingBag className="w-8 h-8" />
                <span>ADORLY</span>
              </button>
              
              <div className="hidden md:flex items-center gap-6">
                <button 
                  onClick={() => setView('shop')}
                  className={cn("text-sm font-medium transition-colors", view === 'shop' ? "text-primary" : "text-gray-600 hover:text-primary")}
                >
                  Shop
                </button>
                {user && (
                  <button 
                    onClick={() => setView('orders')}
                    className={cn("text-sm font-medium transition-colors", view === 'orders' ? "text-primary" : "text-gray-600 hover:text-primary")}
                  >
                    My Orders
                  </button>
                )}
                {user?.role === 'admin' && (
                  <button 
                    onClick={() => setView('admin')}
                    className={cn("text-sm font-medium transition-colors", view === 'admin' ? "text-primary" : "text-gray-600 hover:text-primary")}
                  >
                    Admin
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-gray-50 border-none rounded-full text-sm focus:ring-2 focus:ring-primary/20 transition-all w-64"
                />
              </div>

              <button 
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 hover:bg-gray-50 rounded-full transition-colors"
              >
                <ShoppingBag className="w-6 h-6 text-gray-700" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                    {cart.reduce((s, i) => s + i.quantity, 0)}
                  </span>
                )}
              </button>

              {user ? (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                    {user.username[0].toUpperCase()}
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="p-2 hover:bg-gray-50 rounded-full transition-colors text-gray-500"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setIsAuthModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  <UserIcon className="w-4 h-4" />
                  <span>Sign In</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow">
        {view === 'shop' && (
          <>
            {/* Hero Section */}
            <section className="relative h-[400px] flex items-center overflow-hidden">
              <div className="absolute inset-0 pink-gradient opacity-10" />
              <div className="absolute -right-20 -top-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
              <div className="absolute -left-20 -bottom-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
              
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="max-w-2xl"
                >
                  <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-black mb-6">
                    Elevate Your <span className="text-primary italic">Style</span>
                  </h1>
                  <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                    Discover our curated collection of premium perfumes, trendy clothes, and the latest electronics. Adorly Market brings you the best of lifestyle and tech.
                  </p>
                  <div className="flex gap-4">
                    <button className="px-8 py-4 bg-black text-white rounded-full font-semibold hover:bg-gray-800 transition-all flex items-center gap-2 group">
                      Shop Now
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button className="px-8 py-4 border-2 border-black rounded-full font-semibold hover:bg-black hover:text-white transition-all">
                      View Collections
                    </button>
                  </div>
                </motion.div>
              </div>
            </section>

            {/* Categories & Products */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                <div className="flex flex-wrap gap-2">
                  {['All', 'Perfume', 'Clothes', 'Phone', 'Electronics'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={cn(
                        "px-6 py-2 rounded-full text-sm font-medium transition-all",
                        selectedCategory === cat 
                          ? "bg-primary text-white pink-glow" 
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <div className="text-sm text-gray-500 font-medium">
                  Showing {filteredProducts.length} products
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                <AnimatePresence mode="popLayout">
                  {filteredProducts.map((product) => (
                    <motion.div
                      layout
                      key={product.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="group bg-white rounded-3xl overflow-hidden border border-gray-100 hover:border-primary/20 transition-all hover:shadow-xl"
                    >
                      <div className="relative aspect-square overflow-hidden bg-gray-50">
                        <img 
                          src={product.image_url} 
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-4 left-4">
                          <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-[10px] font-bold uppercase tracking-wider text-primary">
                            {product.category}
                          </span>
                        </div>
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button 
                            onClick={() => addToCart(product)}
                            className="p-3 bg-white rounded-full text-black hover:bg-primary hover:text-white transition-all transform translate-y-4 group-hover:translate-y-0"
                          >
                            <ShoppingBag className="w-6 h-6" />
                          </button>
                        </div>
                      </div>
                      <div className="p-6">
                        <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">{product.name}</h3>
                        <p className="text-gray-500 text-sm line-clamp-2 mb-4">{product.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xl font-bold">${product.price.toFixed(2)}</span>
                          <button 
                            onClick={() => addToCart(product)}
                            className="text-sm font-bold text-primary hover:underline"
                          >
                            Add to Cart
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </section>
          </>
        )}

        {view === 'orders' && user && token && (
          <UserOrders token={token} />
        )}

        {view === 'admin' && user?.role === 'admin' && token && (
          <AdminPanel token={token} products={products} onRefresh={() => api.getProducts().then(setProducts)} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-black text-white pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-1">
              <div className="text-2xl font-bold tracking-tighter text-primary flex items-center gap-2 mb-6">
                <ShoppingBag className="w-8 h-8" />
                <span>ADORLY</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                Your premier destination for luxury lifestyle products. We curate the finest perfumes, fashion, and technology for the modern individual.
              </p>
              <div className="flex gap-4">
                <a href="#" className="p-2 bg-gray-900 rounded-full hover:bg-primary transition-colors"><Instagram className="w-5 h-5" /></a>
                <a href="#" className="p-2 bg-gray-900 rounded-full hover:bg-primary transition-colors"><Twitter className="w-5 h-5" /></a>
                <a href="#" className="p-2 bg-gray-900 rounded-full hover:bg-primary transition-colors"><Facebook className="w-5 h-5" /></a>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold mb-6 uppercase tracking-wider text-xs">Shop</h4>
              <ul className="space-y-4 text-sm text-gray-400">
                <li><button onClick={() => { setView('shop'); setSelectedCategory('Perfume'); }} className="hover:text-primary transition-colors">Perfumes</button></li>
                <li><button onClick={() => { setView('shop'); setSelectedCategory('Clothes'); }} className="hover:text-primary transition-colors">Clothing</button></li>
                <li><button onClick={() => { setView('shop'); setSelectedCategory('Phone'); }} className="hover:text-primary transition-colors">Smartphones</button></li>
                <li><button onClick={() => { setView('shop'); setSelectedCategory('Electronics'); }} className="hover:text-primary transition-colors">Electronics</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-6 uppercase tracking-wider text-xs">Support</h4>
              <ul className="space-y-4 text-sm text-gray-400">
                <li><a href="#" className="hover:text-primary transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Shipping Policy</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Returns & Exchanges</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">FAQs</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-6 uppercase tracking-wider text-xs">Newsletter</h4>
              <p className="text-gray-400 text-sm mb-4">Subscribe to receive updates, access to exclusive deals, and more.</p>
              <div className="relative">
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  className="w-full bg-gray-900 border-none rounded-full py-3 px-6 text-sm focus:ring-2 focus:ring-primary/50 transition-all"
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary rounded-full hover:bg-primary-dark transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
            <p>© 2026 Adorly Market. All rights reserved.</p>
            <div className="flex gap-8">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-50 shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <ShoppingBag className="w-6 h-6 text-primary" />
                  Your Cart
                </h2>
                <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto p-6 space-y-6">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                      <ShoppingBag className="w-10 h-10 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Your cart is empty</h3>
                    <p className="text-gray-500 text-sm mb-8">Looks like you haven't added anything to your cart yet.</p>
                    <button 
                      onClick={() => setIsCartOpen(false)}
                      className="px-8 py-3 bg-black text-white rounded-full font-semibold hover:bg-gray-800 transition-colors"
                    >
                      Start Shopping
                    </button>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.id} className="flex gap-4 group">
                      <div className="w-24 h-24 bg-gray-50 rounded-2xl overflow-hidden flex-shrink-0">
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-grow">
                        <div className="flex justify-between mb-1">
                          <h4 className="font-semibold text-sm">{item.name}</h4>
                          <button 
                            onClick={() => removeFromCart(item.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mb-4">{item.category}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 bg-gray-50 rounded-full px-3 py-1">
                            <button onClick={() => updateQuantity(item.id, -1)} className="hover:text-primary transition-colors">
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className="hover:text-primary transition-colors">
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <span className="font-bold">${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-6 border-t border-gray-100 bg-gray-50/50">
                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Subtotal</span>
                      <span>${cartTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Shipping</span>
                      <span className="text-green-600 font-medium">Free</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                      <span>Total</span>
                      <span className="text-primary">${cartTotal.toFixed(2)}</span>
                    </div>
                  </div>
                  <button 
                    onClick={handleCheckout}
                    className="w-full py-4 bg-black text-white rounded-full font-bold hover:bg-gray-800 transition-all pink-glow"
                  >
                    Checkout Now
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Auth Modal */}
      <AnimatePresence>
        {isAuthModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="text-3xl font-bold tracking-tight">
                      {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
                    </h2>
                    <p className="text-gray-500 mt-1">
                      {authMode === 'login' ? 'Sign in to continue shopping' : 'Join the Adorly community'}
                    </p>
                  </div>
                  <button onClick={() => setIsAuthModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <AuthForm 
                  mode={authMode} 
                  onSuccess={() => {
                    setIsAuthModalOpen(false);
                  }} 
                />

                <div className="mt-8 text-center">
                  <button 
                    onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                    className="text-sm font-medium text-gray-500 hover:text-primary transition-colors"
                  >
                    {authMode === 'login' ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AuthForm({ mode, onSuccess }: { mode: 'login' | 'register', onSuccess: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setError('Authentication is currently unavailable (Supabase not configured).');
      return;
    }
    setLoading(true);
    setError('');

    try {
      if (mode === 'register') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Registration successful! Please check your email for verification.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}
      <div className="space-y-1">
        <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Email Address</label>
        <input 
          type="email" 
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all"
          placeholder="name@example.com"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Password</label>
        <input 
          type="password" 
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all"
          placeholder="••••••••"
        />
      </div>
      <button 
        type="submit"
        disabled={loading}
        className="w-full py-4 bg-black text-white rounded-2xl font-bold hover:bg-gray-800 transition-all disabled:opacity-50 mt-4"
      >
        {loading ? 'Processing...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
      </button>
    </form>
  );
}

function UserOrders({ token }: { token: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMyOrders(token).then(data => {
      setOrders(data);
      setLoading(false);
    });
  }, [token]);

  if (loading) return <div className="p-20 text-center">Loading orders...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="flex items-center gap-4 mb-12">
        <div className="p-3 bg-primary/10 rounded-2xl">
          <Package className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h2 className="text-3xl font-bold">My Orders</h2>
          <p className="text-gray-500">Track and manage your purchases</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-gray-50 rounded-[2rem] p-12 text-center">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
          <p className="text-gray-500 mb-8">When you make a purchase, it will appear here.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map(order => (
            <div key={order.id} className="bg-white border border-gray-100 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="p-6 border-b border-gray-100 flex flex-wrap justify-between items-center gap-4 bg-gray-50/50">
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Order ID</p>
                    <p className="font-mono text-sm">#ORD-{order.id.toString().padStart(5, '0')}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Date</p>
                    <p className="text-sm">{new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Status</p>
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      order.status === 'delivered' ? "bg-green-100 text-green-700" :
                      order.status === 'pending' ? "bg-yellow-100 text-yellow-700" :
                      "bg-blue-100 text-blue-700"
                    )}>
                      {order.status}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Total Amount</p>
                  <p className="text-xl font-bold text-primary">${order.total_price.toFixed(2)}</p>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {order.items?.map(item => (
                    <div key={item.id} className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-gray-300" />
                        </div>
                        <div>
                          <p className="font-medium">{item.product_name}</p>
                          <p className="text-gray-500 text-xs">Qty: {item.quantity} × ${item.price.toFixed(2)}</p>
                        </div>
                      </div>
                      <p className="font-bold">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminPanel({ token, products, onRefresh }: { token: string, products: Product[], onRefresh: () => void }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (activeTab === 'orders') {
      api.getAllOrders(token).then(setOrders);
    }
  }, [activeTab, token]);

  const handleUpdateStatus = async (id: number, status: string) => {
    await api.updateOrderStatus(id, status, token);
    api.getAllOrders(token).then(setOrders);
  };

  const handleDeleteProduct = async (id: number) => {
    if (confirm('Are you sure you want to delete this product?')) {
      await api.deleteProduct(id, token);
      onRefresh();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-black rounded-2xl">
            <LayoutDashboard className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold">Admin Dashboard</h2>
            <p className="text-gray-500">Manage your store inventory and orders</p>
          </div>
        </div>
        
        <div className="flex bg-gray-100 p-1 rounded-2xl">
          <button 
            onClick={() => setActiveTab('products')}
            className={cn("px-6 py-2 rounded-xl text-sm font-bold transition-all", activeTab === 'products' ? "bg-white shadow-sm text-black" : "text-gray-500 hover:text-black")}
          >
            Products
          </button>
          <button 
            onClick={() => setActiveTab('orders')}
            className={cn("px-6 py-2 rounded-xl text-sm font-bold transition-all", activeTab === 'orders' ? "bg-white shadow-sm text-black" : "text-gray-500 hover:text-black")}
          >
            Orders
          </button>
        </div>
      </div>

      {activeTab === 'products' ? (
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">Inventory Management</h3>
            <button 
              onClick={() => setIsAddingProduct(true)}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-full font-bold hover:bg-primary-dark transition-all pink-glow"
            >
              <Plus className="w-5 h-5" />
              Add New Product
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map(product => (
              <div key={product.id} className="bg-white border border-gray-100 rounded-[2rem] p-6 flex gap-4 group hover:shadow-lg transition-all">
                <div className="w-24 h-24 bg-gray-50 rounded-2xl overflow-hidden flex-shrink-0">
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-grow">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-bold text-sm">{product.name}</h4>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-primary">{product.category}</p>
                    </div>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => setEditingProduct(product)}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-black transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteProduct(product.id)}
                        className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-lg font-bold">${product.price.toFixed(2)}</span>
                    <span className="text-xs text-gray-400">ID: #{product.id}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <h3 className="text-xl font-bold mb-8">Order Fulfillment</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-y-4">
              <thead>
                <tr className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-6">
                  <th className="pb-4 pl-6">Order</th>
                  <th className="pb-4">Customer</th>
                  <th className="pb-4">Date</th>
                  <th className="pb-4">Total</th>
                  <th className="pb-4">Status</th>
                  <th className="pb-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm group hover:shadow-md transition-all">
                    <td className="py-6 pl-6 rounded-l-2xl">
                      <p className="font-mono text-sm font-bold">#ORD-{order.id.toString().padStart(5, '0')}</p>
                    </td>
                    <td className="py-6">
                      <p className="text-sm font-medium">{(order as any).username}</p>
                    </td>
                    <td className="py-6">
                      <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
                    </td>
                    <td className="py-6">
                      <p className="text-sm font-bold text-primary">${order.total_price.toFixed(2)}</p>
                    </td>
                    <td className="py-6">
                      <select 
                        value={order.status}
                        onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                        className={cn(
                          "text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border-none focus:ring-2 focus:ring-primary/20",
                          order.status === 'delivered' ? "bg-green-100 text-green-700" :
                          order.status === 'pending' ? "bg-yellow-100 text-yellow-700" :
                          "bg-blue-100 text-blue-700"
                        )}
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="py-6 pr-6 text-right rounded-r-2xl">
                      <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Product Modal */}
      <AnimatePresence>
        {(isAddingProduct || editingProduct) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setIsAddingProduct(false); setEditingProduct(null); }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-bold">
                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                  </h2>
                  <button onClick={() => { setIsAddingProduct(false); setEditingProduct(null); }} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <ProductForm 
                  product={editingProduct || undefined} 
                  token={token} 
                  onSuccess={() => {
                    setIsAddingProduct(false);
                    setEditingProduct(null);
                    onRefresh();
                  }} 
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProductForm({ product, token, onSuccess }: { product?: Product, token: string, onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || 0,
    image_url: product?.image_url || '',
    category: product?.category || 'Perfume'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (product) {
        await api.updateProduct(product.id, formData, token);
      } else {
        await api.createProduct(formData, token);
      }
      onSuccess();
    } catch (error) {
      alert('Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1 col-span-2">
          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 ml-1">Product Name</label>
          <input 
            type="text" 
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-6 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 ml-1">Price ($)</label>
          <input 
            type="number" 
            step="0.01"
            required
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
            className="w-full px-6 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 ml-1">Category</label>
          <select 
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-6 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all"
          >
            <option value="Perfume">Perfume</option>
            <option value="Clothes">Clothes</option>
            <option value="Phone">Phone</option>
            <option value="Electronics">Electronics</option>
          </select>
        </div>
        <div className="space-y-1 col-span-2">
          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 ml-1">Image URL</label>
          <input 
            type="url" 
            required
            value={formData.image_url}
            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
            className="w-full px-6 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
        <div className="space-y-1 col-span-2">
          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 ml-1">Description</label>
          <textarea 
            required
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-6 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all resize-none"
          />
        </div>
      </div>
      <button 
        type="submit"
        disabled={loading}
        className="w-full py-4 bg-black text-white rounded-2xl font-bold hover:bg-gray-800 transition-all disabled:opacity-50 mt-4"
      >
        {loading ? 'Saving...' : (product ? 'Update Product' : 'Create Product')}
      </button>
    </form>
  );
}
