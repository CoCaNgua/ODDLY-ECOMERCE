import React, { useState, useEffect } from 'react';
import { 
  Search, ShoppingCart, Heart, RefreshCw, Star, ArrowRight, 
  CheckCircle, Trash2, Plus, Minus, X, LayoutDashboard, Tag, Award,
  User, Lock, LogOut, LogIn, UserPlus
} from 'lucide-react';
import { api } from './api/client';

export default function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [view, setView] = useState('home'); 
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showAnnouncement, setShowAnnouncement] = useState(true);
  const [orderResult, setOrderResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quantityInput, setQuantityInput] = useState(1);

  // Danh sách tài khoản lưu tạm (Mock Users Database)
  const [registeredUsers, setRegisteredUsers] = useState([
    { name: 'Khách hàng Demo', email: 'user@oddly.vn', password: '123' }
  ]);

  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' hoặc 'register'
  const [authError, setAuthError] = useState('');
  const [pendingAction, setPendingAction] = useState(null);

  const [authForm, setAuthForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [formData, setFormData] = useState({
    fullName: '', email: '', phone: '', address: '', note: ''
  });

  const categories = [
    { id: 'all', name: 'Tất cả sản phẩm' },
    { id: 1, name: 'Đồ dùng tiện ích' },
    { id: 2, name: 'Phụ kiện cá nhân' },
    { id: 3, name: 'Đồ chơi & Quà tặng' },
    { id: 4, name: 'Đồ công nghệ' },
    { id: 5, name: 'Hài hước & Độc lạ' },
  ];

  useEffect(() => {
    setLoading(true);
    api.getProducts()
      .then(data => { setProducts(data); setLoading(false); })
      .catch(err => { console.error('Lỗi kết nối Backend:', err); setLoading(false); });
  }, []);

  // --- Chức năng Yêu cầu Đăng nhập/Đăng ký ---
  const checkAuthAndProceed = (action) => {
    if (!isLoggedIn) {
      setPendingAction(() => action);
      setAuthError('');
      setShowAuthModal(true);
      return false;
    }
    action();
    return true;
  };

  // --- Xử lý Đăng nhập ---
  const handleLogin = (e) => {
    e.preventDefault();
    setAuthError('');

    const foundUser = registeredUsers.find(u => u.email.toLowerCase() === authForm.email.toLowerCase());

    if (!foundUser) {
      setAuthError('Tài khoản chưa tồn tại! Vui lòng chuyển sang tab "Đăng ký".');
      return;
    }

    if (foundUser.password !== authForm.password) {
      setAuthError('Mật khẩu không chính xác.');
      return;
    }

    // Đăng nhập thành công
    setIsLoggedIn(true);
    setCurrentUser(foundUser);
    setFormData(prev => ({ ...prev, fullName: foundUser.name, email: foundUser.email }));
    setShowAuthModal(false);

    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  // --- Xử lý Đăng ký ---
  const handleRegister = (e) => {
    e.preventDefault();
    setAuthError('');

    if (authForm.password !== authForm.confirmPassword) {
      setAuthError('Mật khẩu nhập lại không khớp.');
      return;
    }

    const existingUser = registeredUsers.find(u => u.email.toLowerCase() === authForm.email.toLowerCase());
    if (existingUser) {
      setAuthError('Email này đã được đăng ký. Vui lòng chuyển sang tab "Đăng nhập".');
      return;
    }

    // Tạo tài khoản mới
    const newUser = {
      name: authForm.name || 'Người dùng Oddly',
      email: authForm.email,
      password: authForm.password
    };

    setRegisteredUsers(prev => [...prev, newUser]);
    setIsLoggedIn(true);
    setCurrentUser(newUser);
    setFormData(prev => ({ ...prev, fullName: newUser.name, email: newUser.email }));
    setShowAuthModal(false);

    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setView('home');
  };

  // --- Cart operations ---
  const addToCart = (product, qty = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + qty } : item);
      }
      return [...prev, { ...product, quantity: qty }];
    });
  };

  const updateQuantity = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(item => item.id !== id));
  const toggleFavorite = (id) => setFavorites(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingFee = cartSubtotal >= 500000 || cartSubtotal === 0 ? 0 : 30000;
  const cartTotal = cartSubtotal + shippingFee;

  const filteredProducts = products.filter(p => {
    const matchCat = selectedCategory === 'all' || p.category_id === Number(selectedCategory);
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  }).sort((a, b) => {
    if (sortBy === 'price_asc') return a.price - b.price;
    if (sortBy === 'price_desc') return b.price - a.price;
    if (sortBy === 'popular') return b.review_count - a.review_count;
    return b.id - a.id;
  });

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      customer_name: formData.fullName,
      customer_email: formData.email,
      customer_phone: formData.phone,
      shipping_address: formData.address,
      note: formData.note || '',
      payment_method: 'COD',
      items: cart.map(item => ({ product_id: item.id, quantity: item.quantity }))
    };

    try {
      const res = await api.createOrder(payload);
      setOrderResult(res);
      setCart([]);
      setView('success');
    } catch (err) {
      alert(`Đặt hàng thất bại: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#FAF9F6] text-slate-800">
      
      {/* Announcement Bar */}
      {showAnnouncement && (
        <div className="bg-slate-900 text-white text-xs py-2 px-4 flex justify-between items-center z-50">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-center w-full">
            <Tag className="w-3.5 h-3.5 text-orange-400" />
            <span>🎉 Nhập mã <strong>ODDLY2026</strong> giảm 15% • Miễn phí vận chuyển đơn từ 500.000đ</span>
          </div>
          <button onClick={() => setShowAnnouncement(false)} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between gap-6">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setView('home'); setSelectedCategory('all'); }}>
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white font-black text-2xl shadow-md">O</div>
            <div>
              <span className="text-2xl font-black tracking-tight text-slate-900">Oddly</span>
              <span className="block text-[10px] font-semibold text-orange-600 uppercase tracking-widest -mt-1">Độc & Lạ</span>
            </div>
          </div>

          <div className="flex-1 max-w-lg hidden md:block">
            <div className="relative">
              <input type="text" placeholder="Tìm món đồ độc lạ..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-11 pr-4 py-2.5 bg-slate-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
              <Search className="absolute left-4 top-3 w-4 h-4 text-slate-400" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => setView('admin')} className="hidden sm:flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-xl">
              <LayoutDashboard className="w-4 h-4 text-orange-500" /> Admin
            </button>

            {/* Account Info / Login Button */}
            {isLoggedIn ? (
              <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-2xl">
                <div className="w-7 h-7 rounded-full bg-orange-500 text-white font-bold text-xs flex items-center justify-center">
                  {currentUser?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="text-xs font-bold text-slate-700 hidden md:inline">{currentUser?.name}</span>
                <button onClick={handleLogout} title="Đăng xuất" className="text-slate-400 hover:text-red-500 p-1">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => { setAuthMode('login'); setAuthError(''); setShowAuthModal(true); }} 
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-2xl transition"
              >
                <User className="w-4 h-4 text-orange-500" /> Đăng nhập
              </button>
            )}

            {/* Cart Button */}
            <button 
              onClick={() => checkAuthAndProceed(() => setView('cart'))} 
              className="relative p-2.5 rounded-2xl hover:bg-slate-100"
            >
              <ShoppingCart className="w-6 h-6 text-slate-700" />
              {cart.length > 0 && (
                <span className="absolute top-1 right-1 bg-orange-500 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {cart.reduce((a, b) => a + b.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        {view === 'home' && (
          <div>
            <div className="bg-slate-900 rounded-3xl p-8 md:p-12 text-white mb-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-full text-xs font-bold mb-4"><Award className="w-3.5 h-3.5" /> Bán Chạy 2026</span>
                <h1 className="text-4xl md:text-5xl font-black mb-4">Đồ lạ mỗi ngày.<br /><span className="text-orange-500">Niềm vui mỗi món.</span></h1>
                <p className="text-slate-300 text-sm max-w-md mb-6">Sản phẩm tiện ích, đồ trang trí hài hước và phụ kiện độc đáo dành cho giới trẻ.</p>
                <a href="#products-grid" className="px-6 py-3 bg-orange-500 text-white font-bold rounded-2xl shadow-lg inline-flex items-center gap-2">Khám phá ngay <ArrowRight className="w-4 h-4" /></a>
              </div>
              <img src="https://placehold.co/600x600/FF6B35/FFF?text=Oddly+Store" alt="Hero" className="w-full md:w-72 h-64 object-cover rounded-2xl border-2 border-slate-700" />
            </div>

            <div className="flex items-center justify-between gap-4 mb-8 overflow-x-auto pb-2">
              <div className="flex gap-2">
                {categories.map(cat => (
                  <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap ${selectedCategory === cat.id ? 'bg-slate-900 text-white' : 'bg-white border text-slate-600'}`}>{cat.name}</button>
                ))}
              </div>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-white border rounded-2xl px-3 py-2 text-xs font-semibold">
                <option value="newest">Mới nhất</option>
                <option value="popular">Bán chạy nhất</option>
                <option value="price_asc">Giá: Thấp -&gt; Cao</option>
                <option value="price_desc">Giá: Cao -&gt; Thấp</option>
              </select>
            </div>

            {/* Product Grid */}
            <div id="products-grid">
              {loading ? (
                <div className="py-16 text-center text-slate-400"><RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-orange-500" /> Đang tải sản phẩm từ PostgreSQL...</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {filteredProducts.map(p => (
                    <div key={p.id} className="bg-white rounded-3xl border overflow-hidden shadow-sm hover:shadow-lg transition flex flex-col">
                      <div 
                        className="relative aspect-square cursor-pointer" 
                        onClick={() => checkAuthAndProceed(() => { setSelectedProduct(p); setView('detail'); })}
                      >
                        <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                        <button onClick={(e) => { e.stopPropagation(); toggleFavorite(p.id); }} className="absolute top-3 right-3 p-2 bg-white/80 rounded-full">
                          <Heart className={`w-4 h-4 ${favorites.includes(p.id) ? 'fill-red-500 text-red-500' : ''}`} />
                        </button>
                      </div>

                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-1 text-amber-400 text-xs font-bold mb-1"><Star className="w-3.5 h-3.5 fill-amber-400" /> {p.rating}</div>
                          <h3 
                            onClick={() => checkAuthAndProceed(() => { setSelectedProduct(p); setView('detail'); })} 
                            className="font-bold text-sm text-slate-800 line-clamp-2 hover:text-orange-500 cursor-pointer"
                          >
                            {p.name}
                          </h3>
                        </div>

                        <div className="pt-3 border-t flex items-center justify-between mt-4">
                          <span className="text-base font-black text-slate-900">{p.price.toLocaleString('vi-VN')}đ</span>
                          <button 
                            onClick={() => checkAuthAndProceed(() => addToCart(p))} 
                            className="p-2.5 bg-slate-900 text-white hover:bg-orange-500 rounded-2xl transition"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* View Detail */}
        {view === 'detail' && selectedProduct && (
          <div className="max-w-3xl mx-auto bg-white rounded-3xl border p-8 shadow-lg">
            <button onClick={() => setView('home')} className="text-xs font-bold text-slate-500 mb-6">← Quay lại</button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <img src={selectedProduct.image_url} alt={selectedProduct.name} className="w-full aspect-square object-cover rounded-2xl bg-slate-100" />
              <div className="flex flex-col justify-between">
                <div>
                  <h1 className="text-2xl font-black mb-2">{selectedProduct.name}</h1>
                  <p className="text-slate-500 text-sm mb-6">{selectedProduct.description}</p>
                  <div className="text-3xl font-black text-orange-600 mb-6">{selectedProduct.price.toLocaleString('vi-VN')}đ</div>
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-xs font-bold">Số lượng:</span>
                    <div className="flex items-center border rounded-xl bg-slate-50">
                      <button onClick={() => setQuantityInput(Math.max(1, quantityInput - 1))} className="p-2"><Minus className="w-4 h-4" /></button>
                      <span className="px-3 font-bold">{quantityInput}</span>
                      <button onClick={() => setQuantityInput(quantityInput + 1)} className="p-2"><Plus className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
                <button onClick={() => { addToCart(selectedProduct, quantityInput); setView('cart'); }} className="w-full py-3.5 bg-orange-500 text-white font-bold rounded-2xl">Thêm Vào Giỏ Hàng</button>
              </div>
            </div>
          </div>
        )}

        {/* View Cart */}
        {view === 'cart' && (
          <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-black mb-6">Giỏ Hàng Của Bạn</h1>
            {cart.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center border">
                <p className="text-slate-500 mb-4">Giỏ hàng đang trống</p>
                <button onClick={() => setView('home')} className="px-6 py-2.5 bg-orange-500 text-white font-bold rounded-xl text-xs">Mua sắm ngay</button>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border p-6 space-y-4">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center justify-between border-b pb-4">
                    <div className="flex items-center gap-3">
                      <img src={item.image_url} alt={item.name} className="w-16 h-16 rounded-xl object-cover bg-slate-100" />
                      <div>
                        <h4 className="font-bold text-sm">{item.name}</h4>
                        <div className="text-orange-600 font-bold text-sm">{item.price.toLocaleString('vi-VN')}đ</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center border rounded-lg bg-slate-50">
                        <button onClick={() => updateQuantity(item.id, -1)} className="p-1"><Minus className="w-3.5 h-3.5" /></button>
                        <span className="px-2 font-bold text-xs">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="p-1"><Plus className="w-3.5 h-3.5" /></button>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
                <div className="pt-2 flex justify-between text-lg font-black">
                  <span>Tổng thanh toán:</span>
                  <span className="text-orange-600">{cartTotal.toLocaleString('vi-VN')}đ</span>
                </div>
                <button onClick={() => setView('checkout')} className="w-full py-3.5 bg-orange-500 text-white font-bold rounded-2xl">Tiến Hành Thanh Toán</button>
              </div>
            )}
          </div>
        )}

        {/* View Checkout */}
        {view === 'checkout' && (
          <div className="max-w-md mx-auto bg-white rounded-3xl border p-8 shadow-lg">
            <h2 className="text-xl font-black mb-6">Thông Tin Giao Hàng (COD)</h2>
            <form onSubmit={handleCheckoutSubmit} className="space-y-4">
              <input required type="text" placeholder="Họ tên" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full p-3 bg-slate-50 border rounded-xl text-sm" />
              <input required type="email" placeholder="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-3 bg-slate-50 border rounded-xl text-sm" />
              <input required type="tel" placeholder="Số điện thoại" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-3 bg-slate-50 border rounded-xl text-sm" />
              <textarea required rows={2} placeholder="Địa chỉ nhận hàng" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full p-3 bg-slate-50 border rounded-xl text-sm" />
              <button disabled={isSubmitting} type="submit" className="w-full py-3.5 bg-emerald-600 text-white font-bold rounded-2xl">
                {isSubmitting ? 'Đang gửi...' : `Xác Nhận Đặt Hàng (${cartTotal.toLocaleString('vi-VN')}đ)`}
              </button>
            </form>
          </div>
        )}

        {/* View Success */}
        {view === 'success' && orderResult && (
          <div className="max-w-md mx-auto bg-white rounded-3xl border p-8 text-center shadow-lg">
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-2xl font-black mb-2">Đặt Hàng Thành Công!</h2>
            <p className="text-slate-500 text-xs mb-6">Mã đơn hàng: <strong className="text-orange-600 font-mono">{orderResult.code}</strong></p>
            <button onClick={() => setView('home')} className="w-full py-3 bg-slate-900 text-white font-bold rounded-2xl text-xs">Trở Về Trang Chủ</button>
          </div>
        )}

        {/* View Admin */}
        {view === 'admin' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-black">DANH SÁCH SẢN PHẨM</h1>
              <button onClick={() => setView('home')} className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl">Về Cửa hàng</button>
            </div>
            <div className="bg-white rounded-3xl border p-6">
              <h3 className="font-bold text-sm mb-4">Sản phẩm hiện có trong PostgreSQL ({products.length})</h3>
              <div className="divide-y text-xs">
                {products.map(p => (
                  <div key={p.id} className="py-3 flex justify-between items-center">
                    <span className="font-bold">{p.name}</span>
                    <span className="text-orange-600 font-bold">{p.price.toLocaleString('vi-VN')}đ</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* --- POP-UP MODAL TÍCH HỢP ĐĂNG NHẬP / ĐĂNG KÝ --- */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative animate-in fade-in zoom-in duration-200">
            
            <button 
              onClick={() => { setShowAuthModal(false); setPendingAction(null); }} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Tab Header Switcher */}
            <div className="flex border-b border-slate-200 mb-6">
              <button 
                onClick={() => { setAuthMode('login'); setAuthError(''); }} 
                className={`flex-1 pb-3 font-bold text-sm transition text-center ${authMode === 'login' ? 'text-orange-600 border-b-2 border-orange-500' : 'text-slate-400'}`}
              >
                Đăng Nhập
              </button>
              <button 
                onClick={() => { setAuthMode('register'); setAuthError(''); }} 
                className={`flex-1 pb-3 font-bold text-sm transition text-center ${authMode === 'register' ? 'text-orange-600 border-b-2 border-orange-500' : 'text-slate-400'}`}
              >
                Đăng Ký
              </button>
            </div>

            {/* Error Banner */}
            {authError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl font-semibold">
                {authError}
              </div>
            )}

            {/* FORM ĐĂNG NHẬP */}
            {authMode === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email</label>
                  <input 
                    type="email" 
                    required 
                    placeholder="user@oddly.vn"
                    value={authForm.email} 
                    onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} 
                    className="w-full p-3 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mật khẩu</label>
                  <input 
                    type="password" 
                    required 
                    placeholder="123"
                    value={authForm.password} 
                    onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} 
                    className="w-full p-3 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>

                <button type="submit" className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl shadow-lg shadow-orange-500/30 transition text-sm flex items-center justify-center gap-2">
                  <LogIn className="w-4 h-4" /> Đăng Nhập
                </button>
              </form>
            ) : (
              /* FORM ĐĂNG KÝ */
              <form onSubmit={handleRegister} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Họ và tên</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Nguyễn Văn A"
                    value={authForm.name} 
                    onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })} 
                    className="w-full p-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email</label>
                  <input 
                    type="email" 
                    required 
                    placeholder="email@example.com"
                    value={authForm.email} 
                    onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} 
                    className="w-full p-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mật khẩu</label>
                  <input 
                    type="password" 
                    required 
                    placeholder="Nhập mật khẩu"
                    value={authForm.password} 
                    onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} 
                    className="w-full p-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Xác nhận mật khẩu</label>
                  <input 
                    type="password" 
                    required 
                    placeholder="Nhập lại mật khẩu"
                    value={authForm.confirmPassword} 
                    onChange={(e) => setAuthForm({ ...authForm, confirmPassword: e.target.value })} 
                    className="w-full p-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>

                <button type="submit" className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg transition text-sm flex items-center justify-center gap-2 mt-2">
                  <UserPlus className="w-4 h-4" /> Tạo Tài Khoản Mới
                </button>
              </form>
            )}

            <div className="mt-4 text-center">
              <span className="text-[11px] text-slate-400">
                {authMode === 'login' ? 'Chưa có tài khoản? Chuyển sang tab Đăng ký' : 'Đã có tài khoản? Chuyển sang tab Đăng nhập'}
              </span>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}