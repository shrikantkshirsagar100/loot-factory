/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Search, Menu, ExternalLink, MessageCircle, Moon, Sun, Share2, Flame, ArrowUp, TrendingUp, Clock, ShoppingCart, X, Heart, Trash2 } from 'lucide-react';

interface Product {
  id: string;
  title: string;
  price: string;
  link: string;
  image_url: string;
  posted_at: string;
  coupon?: string;
  category?: string;
  keywords?: string[];
  mrp?: string;
  discount?: number;
}

const CATEGORIES = {
  'Electronics': ['phone', 'smartphone', 'laptop', 'tv', 'television', 'earbuds', 'headphone', 'earphone', 'watch', 'smartwatch', 'speaker', 'charger', 'cable', 'powerbank', 'camera', 'monitor', 'keyboard', 'mouse', 'apple', 'samsung', 'sony', 'boat', 'noise', 'tablet', 'ipad', 'macbook', 'ssd', 'hdd', 'pendrive', 'router'],
  'Fashion': ['shirt', 't-shirt', 'tshirt', 'jeans', 'trouser', 'pant', 'shoes', 'sneakers', 'sandal', 'slipper', 'kurta', 'saree', 'dress', 'jacket', 'sweater', 'hoodie', 'bag', 'wallet', 'belt', 'sunglasses', 'nike', 'adidas', 'puma', 'rebook', 'crocs', 'clothing', 'wear'],
  'Home & Kitchen': ['bed', 'sofa', 'table', 'chair', 'cookware', 'gas', 'stove', 'mixer', 'grinder', 'blender', 'kettle', 'bottle', 'container', 'box', 'towel', 'curtain', 'bedsheet', 'pillow', 'blanket', 'decor', 'lamp', 'bulb', 'fan', 'ac', 'cooler', 'fridge', 'refrigerator', 'washing machine', 'iron', 'vacuum'],
  'Beauty': ['makeup', 'lipstick', 'cream', 'lotion', 'shampoo', 'conditioner', 'soap', 'wash', 'perfume', 'deodorant', 'trimmer', 'shaver', 'hair', 'skin', 'face', 'serum', 'moisturizer', 'sunscreen', 'cosmetic'],
  'Groceries': ['rice', 'dal', 'oil', 'sugar', 'salt', 'tea', 'coffee', 'biscuit', 'snack', 'chocolate', 'dry fruit', 'nut', 'spice', 'sauce', 'jam', 'honey', 'noodle', 'pasta', 'maggi', 'grocery', 'pantry'],
  'Sports': ['bat', 'ball', 'racket', 'dumbbell', 'mat', 'protein', 'supplement', 'gym', 'cycle', 'bicycle', 'helmet', 'glove', 'fitness', 'yoga', 'treadmill'],
  'Toys & Baby': ['toy', 'game', 'puzzle', 'car', 'doll', 'diaper', 'wipes', 'baby', 'kids', 'lego', 'pram', 'stroller'],
  'Books': ['book', 'novel', 'pen', 'pencil', 'notebook', 'diary', 'paper', 'marker', 'color', 'stationery']
};

const CountdownTimer = ({ id, variant = 'inline' }: { id: string, variant?: 'inline' | 'overlay' }) => {
  const [timeLeft, setTimeLeft] = useState(() => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    // Deterministic seconds remaining (between 15 mins and 3 hours)
    return ((Math.abs(hash) % 165) + 15) * 60;
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (timeLeft <= 0) return null;

  const h = Math.floor(timeLeft / 3600);
  const m = Math.floor((timeLeft % 3600) / 60);
  const s = timeLeft % 60;
  
  const timeString = `${h > 0 ? `${h}h ` : ''}${m}m ${s}s`;

  if (variant === 'overlay') {
    return (
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent pt-4 sm:pt-6 md:pt-8 pb-1 sm:pb-1.5 md:pb-2 px-0.5 sm:px-1 md:px-2 flex justify-center z-20">
        <div className="flex items-center gap-0.5 sm:gap-1 md:gap-1.5 text-white font-bold text-[7px] sm:text-[9px] md:text-xs bg-red-600/90 backdrop-blur-sm px-1 sm:px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-full shadow-lg border border-red-400/30 whitespace-nowrap">
          <Clock className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3.5 md:h-3.5 animate-pulse" />
          Ends in {timeString}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 text-red-600 dark:text-red-400 font-bold text-[10px] sm:text-xs bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded w-fit border border-red-100 dark:border-red-800/30 mb-2">
      <Clock className="w-3 h-3 animate-pulse" />
      Ends in: {timeString}
    </div>
  );
};

function detectCategoryAndKeywords(title: string) {
  const lowerTitle = title.toLowerCase();
  let bestCategory = 'Other';
  let maxMatches = 0;
  let matchedKeywords: string[] = [];

  for (const [category, keywords] of Object.entries(CATEGORIES)) {
    let matchCount = 0;
    for (const kw of keywords) {
      const regex = new RegExp(`\\b${kw}\\b`, 'i');
      if (regex.test(lowerTitle)) {
        matchCount++;
        matchedKeywords.push(kw);
      } else if (lowerTitle.includes(kw) && kw.length > 4) {
        matchCount++;
        matchedKeywords.push(kw);
      }
    }
    if (matchCount > maxMatches) {
      maxMatches = matchCount;
      bestCategory = category;
    }
  }

  return { category: bestCategory, keywords: [...new Set(matchedKeywords)] };
}

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cart, setCart] = useState<Product[]>([]);
  const [sortBy, setSortBy] = useState('newest');
  const [showScrollTop, setShowScrollTop] = useState(false);

  const toggleCartItem = (product: Product) => {
    setCart(prev => {
      const exists = prev.find(p => p.id === product.id);
      if (exists) return prev.filter(p => p.id !== product.id);
      return [...prev, product];
    });
  };

  const isInCart = (id: string) => cart.some(p => p.id === id);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getClickCount = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return (Math.abs(hash) % 130) + 15;
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        const enrichedProducts = data.map((p: Product) => {
          const { category, keywords } = detectCategoryAndKeywords(p.title);
          return { ...p, category, keywords };
        });
        setProducts(enrichedProducts);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const filteredProducts = products.filter(p => {
    const searchLower = searchQuery.toLowerCase().trim();
    if (!searchLower) return true;
    
    return (
      p.title.toLowerCase().includes(searchLower) ||
      (p.category && p.category.toLowerCase().includes(searchLower)) ||
      (p.keywords && p.keywords.some(kw => kw.includes(searchLower) || searchLower.includes(kw)))
    );
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price-low') {
      const pA = parseInt(a.price.replace(/[^\d]/g, '')) || 0;
      const pB = parseInt(b.price.replace(/[^\d]/g, '')) || 0;
      return pA - pB;
    } else if (sortBy === 'price-high') {
      const pA = parseInt(a.price.replace(/[^\d]/g, '')) || 0;
      const pB = parseInt(b.price.replace(/[^\d]/g, '')) || 0;
      return pB - pA;
    }
    // 'newest' is default, assuming they come sorted by posted_at DESC from backend
    return new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime();
  });

  const handleShare = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    const text = `🔥 *${product.title}*\n💰 Price: ${product.price}${product.mrp ? ` (MRP: ${product.mrp})` : ''}\n👉 Grab here: ${product.link}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 font-sans pb-20 transition-colors duration-200">
      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[80] flex justify-end">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setIsCartOpen(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-gray-900 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-800 bg-[#32CD32] dark:bg-[#228B22] text-white">
              <h2 className="text-lg font-bold flex items-center gap-2"><ShoppingCart className="w-5 h-5" /> Your Cart ({cart.length})</h2>
              <button onClick={() => setIsCartOpen(false)} className="p-1 hover:bg-black/10 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {cart.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400 mt-10">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>Your cart is empty.</p>
                  <p className="text-sm mt-1">Like some products to add them here!</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {cart.map(item => (
                    <div key={item.id} className="flex gap-3 border border-gray-200 dark:border-gray-700 p-2 rounded-md items-center bg-gray-50 dark:bg-gray-800/50">
                      <img src={item.image_url} alt={item.title} className="w-16 h-16 object-contain bg-white dark:bg-gray-800 rounded" referrerPolicy="no-referrer" />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{item.title}</h4>
                        <div className="text-[#32CD32] font-bold text-sm mt-1">{item.price}</div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <a href={item.link} target="_blank" rel="noopener noreferrer" className="bg-[#ff9f00] text-white px-3 py-1.5 rounded text-xs font-medium text-center hover:bg-[#f39800] transition-colors">Grab</a>
                        <button onClick={() => toggleCartItem(item)} className="text-red-500 p-1.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded flex justify-center transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[60] transition-opacity backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-[70] w-64 bg-white dark:bg-gray-900 shadow-2xl transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-800 bg-[#32CD32] dark:bg-[#228B22] text-white">
          <span className="text-xl font-extrabold italic tracking-tight">LootFactory</span>
          <button onClick={() => setIsSidebarOpen(false)} className="p-1 hover:bg-black/10 rounded-full transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="p-4 flex flex-col gap-4 overflow-y-auto h-[calc(100vh-64px)]">
          <div className="flex items-center justify-between py-2 border-b dark:border-gray-800">
            <span className="text-gray-800 dark:text-gray-200 font-medium">Dark Mode</span>
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>
          <div className="py-2">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Categories</h3>
            <ul className="space-y-2">
              {Object.keys(CATEGORIES).map(cat => (
                <li key={cat}>
                  <button 
                    onClick={() => {
                      setSearchQuery(cat);
                      setIsSidebarOpen(false);
                    }}
                    className="text-gray-700 dark:text-gray-300 hover:text-[#32CD32] dark:hover:text-[#32CD32] font-medium text-sm transition-colors w-full text-left py-1"
                  >
                    {cat}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Header - Flipkart style */}
      <header className="bg-[#32CD32] dark:bg-[#228B22] text-white sticky top-0 z-50 shadow-md transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2 sm:gap-4">
              <button onClick={() => setIsSidebarOpen(true)} className="p-1 hover:bg-black/10 rounded-full transition-colors -ml-1">
                <Menu className="h-6 w-6 cursor-pointer" />
              </button>
              <div className="flex flex-col cursor-pointer">
                <span className="text-2xl sm:text-3xl font-extrabold italic tracking-tight">LootFactory</span>
                <span className="text-[10px] sm:text-xs text-yellow-300 font-medium hover:underline">
                  Shopping Sites Live Sale & Hidden Deals
                </span>
              </div>
            </div>
            
            <div className="w-full max-w-md ml-auto mr-6 hidden sm:block">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search for products, brands and more"
                  className="w-full bg-white/95 dark:bg-gray-800 dark:text-white text-black px-5 py-1.5 rounded-full focus:outline-none focus:ring-2 focus:ring-white/50 shadow-inner transition-all text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="absolute right-4 top-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsCartOpen(true)}
                className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 hover:scale-110 active:scale-95 transition-all duration-300 relative"
                title="Cart"
              >
                <ShoppingCart className="h-5 w-5" />
                {cart.length > 0 && (
                  <span className="absolute top-0.5 right-0.5 bg-red-500 text-white text-[8px] font-bold w-3.5 h-3.5 flex items-center justify-center rounded-full border border-white dark:border-gray-900">
                    {cart.length}
                  </span>
                )}
              </button>
              <a
                href={`https://t.me/${import.meta.env.VITE_TELEGRAM_CHANNEL || 'FlashLootDealsx'}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 sm:gap-2 font-medium bg-white dark:bg-gray-800 text-[#32CD32] dark:text-[#32CD32] px-3 sm:px-6 py-1.5 rounded-sm shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 hover:-translate-y-0.5 hover:shadow-md active:scale-95 transition-all duration-300"
                title="Loot Factory | Flash Sale"
              >
                <MessageCircle className="h-5 w-5" />
                <span className="hidden sm:inline">Join TG</span>
              </a>
            </div>
          </div>
          {/* Mobile Search */}
          <div className="pb-3 px-1 sm:hidden">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for products..."
                className="w-full bg-white/95 dark:bg-gray-800 dark:text-white text-black px-5 py-1.5 rounded-full focus:outline-none focus:ring-2 focus:ring-white/50 shadow-inner transition-all text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute right-4 top-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
            </div>
          </div>
        </div>
      </header>

      {/* Category Bar */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 shadow-sm overflow-x-auto sticky top-16 z-40 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 flex gap-2 sm:gap-3 text-sm whitespace-nowrap hide-scrollbar snap-x snap-mandatory">
          <button 
            onClick={() => setSearchQuery('')}
            className={`snap-start px-4 py-1.5 rounded-full font-medium hover:scale-105 active:scale-95 transition-all duration-300 ${searchQuery === '' ? 'bg-[#32CD32] text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
          >
            All Deals
          </button>
          {Object.keys(CATEGORIES).map(cat => (
            <button 
              key={cat}
              onClick={() => setSearchQuery(cat)}
              className={`snap-start px-4 py-1.5 rounded-full font-medium hover:scale-105 active:scale-95 transition-all duration-300 ${searchQuery.toLowerCase() === cat.toLowerCase() ? 'bg-[#32CD32] text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 shadow-sm rounded-sm mb-6 transition-colors duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b dark:border-gray-700 pb-3 mb-4 gap-3">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              Today's Top Deals
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Sort by:</span>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-sm focus:ring-[#32CD32] focus:border-[#32CD32] block p-1.5 outline-none"
              >
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#32CD32]"></div>
            </div>
          ) : sortedProducts.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <p className="text-lg">No deals found right now.</p>
              <p className="text-sm mt-2">Check back later or join <a href={`https://t.me/${import.meta.env.VITE_TELEGRAM_CHANNEL || 'FlashLootDealsx'}`} target="_blank" rel="noopener noreferrer" className="text-[#32CD32] hover:underline font-medium">Loot Factory | Flash Sale</a> on Telegram for instant updates!</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-5 gap-1.5 sm:gap-2 md:gap-4">
              {sortedProducts.map((product, index) => {
                // Deterministically decide if a product is ending soon based on grid position (assuming 5 cols)
                const rowIndex = Math.floor(index / 5);
                const colIndex = index % 5;
                let isEndingSoon = false;
                
                if (rowIndex === 0) {
                  // 1st line: 2nd and 4th products
                  isEndingSoon = (colIndex === 1 || colIndex === 3);
                } else {
                  // 2nd line: 1st, 3rd line: 5th, 4th line: 3rd, 5th line: 2nd, 6th line: 4th...
                  const pattern = [0, 4, 2, 1, 3];
                  isEndingSoon = (colIndex === pattern[(rowIndex - 1) % pattern.length]);
                }

                return (
                <a 
                  key={product.id}
                  href={product.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col border border-gray-200 dark:border-gray-700 rounded-sm hover:shadow-xl dark:hover:shadow-green-900/20 hover:-translate-y-1.5 transition-all duration-300 bg-white dark:bg-gray-800 overflow-hidden relative"
                >
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleCartItem(product); }}
                    className="absolute top-1 right-1 sm:top-2 sm:right-2 z-20 p-1 sm:p-1.5 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full shadow-md hover:scale-110 active:scale-95 transition-all border border-gray-100 dark:border-gray-700"
                  >
                    <Heart className={`w-3 h-3 sm:w-4 sm:h-4 transition-colors ${isInCart(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-400 dark:text-gray-500'}`} />
                  </button>
                  {product.discount && product.discount > 0 ? (
                    <span className="absolute top-1 left-1 sm:top-2 sm:left-2 bg-green-500 text-white text-[8px] sm:text-[10px] font-bold px-1 sm:px-2 py-0.5 sm:py-1 rounded-sm shadow-md z-10">
                      {product.discount}% OFF
                    </span>
                  ) : null}
                  <div className="relative pt-[100%] bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                    {product.image_url ? (
                      <img 
                        src={product.image_url} 
                        alt={product.title}
                        className="absolute inset-0 w-full h-full object-contain p-2 sm:p-4 group-hover:scale-110 transition-transform duration-500 ease-out"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-[10px] sm:text-sm text-gray-400 dark:text-gray-500">
                        No Image
                      </div>
                    )}
                    {isEndingSoon && <CountdownTimer id={product.id} variant="overlay" />}
                  </div>
                  <div className="p-1.5 sm:p-2 md:p-4 flex flex-col flex-grow">
                    {product.category && product.category !== 'Other' && (
                      <span className="text-[8px] sm:text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-[#32CD32] mb-0.5 sm:mb-1">
                        {product.category}
                      </span>
                    )}
                    <h3 className="text-[9px] leading-tight sm:text-[11px] md:text-sm text-gray-800 dark:text-gray-200 font-medium line-clamp-2 mb-1 sm:mb-1.5 md:mb-2 group-hover:text-[#32CD32] dark:group-hover:text-[#32CD32] transition-colors">
                      {product.title}
                    </h3>
                    {product.coupon && (
                      <div className="mb-1 sm:mb-1.5 md:mb-2">
                        <span className="inline-block bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 text-[8px] sm:text-[9px] md:text-xs px-1 sm:px-1.5 md:px-2 py-0.5 rounded border border-green-200 dark:border-green-800 font-mono font-bold">
                          Code: {product.coupon}
                        </span>
                      </div>
                    )}
                    <div className="mt-auto">
                      <div className="flex items-baseline gap-0.5 sm:gap-1 md:gap-2 mb-1.5 sm:mb-2 md:mb-3">
                        <span className="text-[11px] sm:text-sm md:text-lg font-bold text-gray-900 dark:text-white">
                          {product.price}
                        </span>
                        {product.mrp && (
                          <span className="text-[8px] sm:text-[9px] md:text-xs text-gray-500 dark:text-gray-400 line-through">
                            {product.mrp}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1 sm:gap-1.5 md:gap-2">
                        <button className="flex-1 bg-[#ff9f00] hover:bg-[#f39800] text-white font-medium py-1 sm:py-1.5 md:py-2 px-1 sm:px-2 md:px-3 rounded-sm flex items-center justify-center gap-0.5 sm:gap-1 hover:scale-[1.02] active:scale-95 hover:shadow-md transition-all duration-300 text-[8px] sm:text-[10px] md:text-sm">
                          Grab <span className="hidden sm:inline">Deal</span> <ExternalLink className="h-2 w-2 sm:h-2.5 sm:w-2.5 md:h-4 md:w-4" />
                        </button>
                        <button 
                          onClick={(e) => handleShare(e, product)}
                          className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 p-1 sm:p-1.5 md:p-2 rounded-sm hover:scale-[1.05] active:scale-95 transition-all duration-300 flex items-center justify-center"
                          title="Share on WhatsApp"
                        >
                          <Share2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4" />
                        </button>
                      </div>
                      <div className="mt-1 sm:mt-1.5 md:mt-3 text-center">
                        <span className="text-[7px] sm:text-[8px] md:text-[11px] text-gray-500 dark:text-gray-400 font-medium flex items-center justify-center gap-0.5">
                          <TrendingUp className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 text-red-500" /> {getClickCount(product.id)} <span className="hidden sm:inline">grabbed today</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </a>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 p-3 bg-[#32CD32] text-white rounded-full shadow-lg hover:bg-[#28a428] hover:scale-110 active:scale-95 transition-all duration-300 z-50 flex items-center justify-center"
          title="Scroll to Top"
        >
          <ArrowUp className="h-6 w-6" />
        </button>
      )}

    </div>
  );
}
