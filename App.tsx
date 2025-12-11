import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutGrid, 
  ChefHat, 
  UtensilsCrossed, 
  ShoppingBag, 
  CheckCircle2, 
  Plus,
  ArrowLeft,
  Sparkles,
  Receipt,
  X,
  CreditCard,
  User,
  Send,
  MessageSquare,
  Lock,
  Edit3,
  Trash2,
  Save,
  Image as ImageIcon
} from 'lucide-react';
import { INITIAL_TABLES, INITIAL_MENU_ITEMS } from './constants';
import { Order, OrderStatus, Table, TableStatus, MenuItem, OrderItem, MenuItemCategory } from './types';
import { getChefRecommendation, analyzeOrderSentiment, getMenuAssistantResponse } from './services/geminiService';

// --- Components ---

// 1. Sidebar Navigation (Staff Only)
const Navigation = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (t: string) => void }) => (
  <nav className="fixed bottom-0 w-full md:w-20 md:h-full md:left-0 bg-slate-900 text-white flex md:flex-col justify-around md:justify-start md:pt-8 z-50 shadow-2xl">
    <div className="hidden md:block text-center mb-8 font-bold text-xl tracking-wider text-orange-500">
      RF
    </div>
    <NavBtn 
      active={activeTab === 'waiter'} 
      onClick={() => setActiveTab('waiter')} 
      icon={<LayoutGrid size={24} />} 
      label="Salon" 
    />
    <NavBtn 
      active={activeTab === 'kitchen'} 
      onClick={() => setActiveTab('kitchen')} 
      icon={<ChefHat size={24} />} 
      label="Mutfak" 
    />
     <NavBtn 
      active={activeTab === 'menu'} 
      onClick={() => setActiveTab('menu')} 
      icon={<Edit3 size={24} />} 
      label="Menü" 
    />
    <NavBtn 
      active={activeTab === 'history'} 
      onClick={() => setActiveTab('history')} 
      icon={<Receipt size={24} />} 
      label="Geçmiş" 
    />
    <div className="mt-auto mb-4 hidden md:flex justify-center w-full">
        <button onClick={() => setActiveTab('customer')} className="p-2 text-slate-500 hover:text-white" title="Çıkış / Müşteri Ekranı">
            <User size={20} />
        </button>
    </div>
  </nav>
);

const NavBtn = ({ active, onClick, icon, label }: any) => (
  <button 
    onClick={onClick}
    className={`p-4 flex flex-col items-center gap-1 transition-colors w-full md:w-auto ${active ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
  >
    {icon}
    <span className="text-[10px] font-medium uppercase tracking-wide">{label}</span>
  </button>
);

// 2. Kitchen Display System
const KitchenView = ({ orders, updateStatus }: { orders: Order[], updateStatus: (id: string, status: OrderStatus) => void }) => {
  const activeOrders = orders.filter(o => o.status !== OrderStatus.PAID && o.status !== OrderStatus.DELIVERED);

  return (
    <div className="p-6 md:ml-20 min-h-screen bg-slate-100">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Mutfak Ekranı</h1>
          <p className="text-slate-500">Canlı sipariş akışı</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg shadow-sm font-mono text-lg">
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeOrders.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400">
            <ChefHat size={64} className="mb-4 opacity-20" />
            <p className="text-xl">Her şey yolunda! Aktif sipariş yok.</p>
          </div>
        )}
        {activeOrders.map(order => (
          <div key={order.id} className={`bg-white rounded-xl shadow-md overflow-hidden border-l-4 ${order.status === OrderStatus.PENDING ? 'border-yellow-400' : 'border-blue-500'}`}>
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <span className="font-bold text-lg">Masa {order.tableId}</span>
              <span className="text-xs font-mono text-slate-500">#{order.id.slice(-4)}</span>
            </div>
            <div className="p-4 space-y-3">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start">
                  <div className="flex gap-2">
                    <span className="font-bold text-slate-700">{item.quantity}x</span>
                    <span className="text-slate-800">{item.name}</span>
                  </div>
                </div>
              ))}
            </div>
            {order.aiRecommendation && (
              <div className="px-4 py-2 bg-purple-50 text-xs text-purple-700 italic border-t border-purple-100">
                 AI Notu: {order.aiRecommendation}
              </div>
            )}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
              {order.status === OrderStatus.PENDING && (
                <button 
                  onClick={() => updateStatus(order.id, OrderStatus.PREPARING)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <UtensilsCrossed size={18} /> Başla
                </button>
              )}
              {order.status === OrderStatus.PREPARING && (
                <button 
                  onClick={() => updateStatus(order.id, OrderStatus.READY)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={18} /> Hazır
                </button>
              )}
               {order.status === OrderStatus.READY && (
                <div className="flex-1 bg-green-100 text-green-700 py-2 rounded-lg font-bold text-center flex items-center justify-center gap-2">
                  <CheckCircle2 size={18} /> Servis Bekliyor
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 3. Menu Management View (Admin)
const MenuManagementView = ({ menuItems, onAdd, onDelete }: { menuItems: MenuItem[], onAdd: (i: Omit<MenuItem, 'id'>) => void, onDelete: (id: string) => void }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newItem, setNewItem] = useState({
        name: '',
        description: '',
        price: '',
        category: MenuItemCategory.STARTER,
        imageUrl: 'https://picsum.photos/200/200'
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAdd({
            name: newItem.name,
            description: newItem.description,
            price: Number(newItem.price),
            category: newItem.category,
            imageUrl: newItem.imageUrl
        });
        setIsAdding(false);
        setNewItem({ name: '', description: '', price: '', category: MenuItemCategory.STARTER, imageUrl: 'https://picsum.photos/200/200' });
    };

    return (
        <div className="p-6 md:ml-20 min-h-screen bg-slate-100">
             <header className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Menü Yönetimi</h1>
                    <p className="text-slate-500">Ürün ekle, çıkar veya düzenle</p>
                </div>
                <button 
                    onClick={() => setIsAdding(!isAdding)}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium"
                >
                    {isAdding ? <X size={20}/> : <Plus size={20}/>}
                    {isAdding ? 'İptal' : 'Yeni Ürün Ekle'}
                </button>
            </header>

            {isAdding && (
                <div className="bg-white p-6 rounded-xl shadow-lg mb-8 border border-orange-200 animate-in slide-in-from-top-4">
                    <h3 className="font-bold text-lg mb-4">Yeni Ürün Bilgileri</h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Ürün Adı</label>
                            <input required type="text" className="w-full p-2 border rounded-lg" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
                        </div>
                        <div className="col-span-2 md:col-span-1">
                             <label className="block text-sm font-medium text-slate-700 mb-1">Fiyat (TL)</label>
                             <input required type="number" className="w-full p-2 border rounded-lg" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} />
                        </div>
                        <div className="col-span-2">
                             <label className="block text-sm font-medium text-slate-700 mb-1">Açıklama</label>
                             <textarea required className="w-full p-2 border rounded-lg" rows={2} value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} />
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-slate-700 mb-1">Kategori</label>
                             <select className="w-full p-2 border rounded-lg" value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value as MenuItemCategory})}>
                                 {Object.values(MenuItemCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                             </select>
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-slate-700 mb-1">Resim URL</label>
                             <input type="text" className="w-full p-2 border rounded-lg" value={newItem.imageUrl} onChange={e => setNewItem({...newItem, imageUrl: e.target.value})} />
                        </div>
                        <div className="col-span-2 flex justify-end mt-4">
                            <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2">
                                <Save size={18} /> Kaydet
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {menuItems.map(item => (
                    <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex gap-4 group">
                         <img src={item.imageUrl} alt={item.name} className="w-24 h-24 object-cover rounded-lg bg-slate-200" />
                         <div className="flex-1">
                             <div className="flex justify-between items-start">
                                 <div>
                                     <h4 className="font-bold text-slate-800">{item.name}</h4>
                                     <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600">{item.category}</span>
                                 </div>
                                 <button onClick={() => onDelete(item.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                                     <Trash2 size={18} />
                                 </button>
                             </div>
                             <p className="text-xs text-slate-500 line-clamp-2 mt-2">{item.description}</p>
                             <div className="mt-2 font-bold text-orange-600">{item.price} ₺</div>
                         </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// 4. POS / Waiter View
const WaiterView = ({ 
  tables, 
  orders, 
  onSelectTable, 
  selectedTable, 
  onCloseTable,
  onPlaceOrder,
  onCheckout,
  menuItems
}: any) => {
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<MenuItemCategory>(MenuItemCategory.STARTER);
  const [aiSuggestion, setAiSuggestion] = useState<string>("");
  const [loadingAi, setLoadingAi] = useState(false);

  const currentTableOrder = useMemo(() => {
    if (!selectedTable || !selectedTable.currentOrderId) return null;
    return orders.find((o: Order) => o.id === selectedTable.currentOrderId);
  }, [selectedTable, orders]);

  useEffect(() => {
    setCart([]);
    setAiSuggestion("");
  }, [selectedTable]);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.itemId === item.id);
      if (existing) {
        return prev.map(i => i.itemId === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { itemId: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(i => i.itemId !== itemId));
  };

  const getAiHelp = async () => {
    setLoadingAi(true);
    const suggestion = await getChefRecommendation(
      cart.map(c => menuItems.find((m: MenuItem) => m.id === c.itemId)!), 
      activeCategory === MenuItemCategory.DRINK ? 'İçecek' : 'Yemek'
    );
    setAiSuggestion(suggestion);
    setLoadingAi(false);
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    const names = cart.map(c => c.name).join(", ");
    const vibe = await analyzeOrderSentiment(names);

    onPlaceOrder(selectedTable.id, cart, vibe);
    onCloseTable();
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const activeOrderTotal = currentTableOrder ? currentTableOrder.total : 0;
  const grandTotal = activeOrderTotal + cartTotal;

  if (!selectedTable) {
    return (
      <div className="p-6 md:ml-20 min-h-screen bg-slate-100">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Salon Görünümü</h1>
          <p className="text-slate-500">İşlem yapmak için bir masa seçin</p>
        </header>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {tables.map((table: Table) => {
            const statusColor = 
              table.status === TableStatus.OCCUPIED ? 'bg-orange-100 border-orange-300 text-orange-800' : 
              table.status === TableStatus.RESERVED ? 'bg-purple-100 border-purple-300 text-purple-800' :
              'bg-white border-slate-200 text-slate-600 hover:border-blue-400 hover:shadow-md';

            return (
              <button 
                key={table.id}
                onClick={() => onSelectTable(table)}
                className={`p-8 rounded-2xl border-2 flex flex-col items-center justify-center gap-4 transition-all ${statusColor}`}
              >
                <div className="relative">
                   <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold ${
                     table.status === TableStatus.OCCUPIED ? 'bg-orange-500 text-white' : 'bg-slate-200'
                   }`}>
                     {table.id}
                   </div>
                   {table.status === TableStatus.OCCUPIED && (
                     <span className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-orange-500"></span>
                     </span>
                   )}
                </div>
                <span className="font-medium">{table.name}</span>
                <span className="text-xs uppercase tracking-wider opacity-70">
                    {table.status === TableStatus.EMPTY ? 'BOŞ' : 
                     table.status === TableStatus.OCCUPIED ? 'DOLU' : 'REZERVE'}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="md:ml-20 min-h-screen bg-slate-50 flex flex-col md:flex-row h-screen overflow-hidden">
      {/* Menu Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="bg-white p-4 border-b flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={onCloseTable} className="p-2 hover:bg-slate-100 rounded-full">
              <ArrowLeft size={24} />
            </button>
            <div>
              <h2 className="text-xl font-bold">{selectedTable.name}</h2>
              <span className="text-sm text-slate-500 uppercase tracking-wider font-semibold">
                {selectedTable.status === TableStatus.OCCUPIED ? 'DOLU' : 'BOŞ'}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            {Object.values(MenuItemCategory).map(cat => (
              <button 
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === cat ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4">
           {/* Gemini Suggestion Box */}
           <div className="mb-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-4 text-white shadow-lg relative overflow-hidden group">
              <div className="relative z-10 flex gap-3 items-start">
                 <Sparkles className="shrink-0 mt-1" />
                 <div className="flex-1">
                    <h3 className="font-bold text-lg">Şef Asistanı</h3>
                    <p className="text-indigo-100 text-sm mt-1">
                      {loadingAi ? "Şefe danışılıyor..." : (aiSuggestion || "Mevcut sepete göre eşleşme önerisi almak için dokunun.")}
                    </p>
                 </div>
                 <button 
                  onClick={getAiHelp}
                  disabled={loadingAi}
                  className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                 >
                   {aiSuggestion ? "Yenile" : "AI'a Sor"}
                 </button>
              </div>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
             {menuItems.filter((i: MenuItem) => i.category === activeCategory).map((item: MenuItem) => (
               <button 
                key={item.id} 
                onClick={() => addToCart(item)}
                className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all text-left flex gap-3 group"
               >
                 <img src={item.imageUrl} alt={item.name} className="w-20 h-20 object-cover rounded-lg bg-slate-200" />
                 <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-slate-800 leading-tight group-hover:text-blue-600 transition-colors">{item.name}</h4>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">{item.description}</p>
                    </div>
                    <div className="font-bold text-slate-900 mt-2">{item.price} ₺</div>
                 </div>
                 <div className="self-end bg-blue-50 text-blue-600 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                   <Plus size={16} />
                 </div>
               </button>
             ))}
           </div>
        </div>
      </div>

      {/* Sidebar Cart */}
      <div className="w-full md:w-96 bg-white border-l shadow-xl flex flex-col h-[40vh] md:h-full shrink-0 z-40">
        <div className="p-4 border-b bg-slate-50">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <ShoppingBag size={20} /> Adisyon
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Previous/Active Orders */}
          {currentTableOrder && currentTableOrder.status !== OrderStatus.PAID && (
            <div className="mb-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Mutfakta ({currentTableOrder.status === OrderStatus.PENDING ? 'BEKLİYOR' : currentTableOrder.status === OrderStatus.PREPARING ? 'HAZIRLANIYOR' : 'HAZIR'})</h4>
              {currentTableOrder.items.map((item, idx) => (
                <div key={`prev-${idx}`} className="flex justify-between items-center text-slate-500 text-sm py-1">
                  <span>{item.quantity}x {item.name}</span>
                  <span>{(item.price * item.quantity).toFixed(2)} ₺</span>
                </div>
              ))}
              <div className="border-t border-dashed my-2 pt-2 flex justify-between font-bold text-slate-600">
                <span>Ara Toplam</span>
                <span>{currentTableOrder.total.toFixed(2)} ₺</span>
              </div>
            </div>
          )}

          {/* New Cart Items */}
          {cart.length > 0 && (
            <div>
               <h4 className="text-xs font-bold text-blue-500 uppercase mb-2">Yeni Ürünler</h4>
               {cart.map((item, idx) => (
                 <div key={`new-${idx}`} className="flex justify-between items-center py-2 border-b border-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="font-bold text-slate-800">{item.quantity}x</div>
                      <div className="text-sm font-medium">{item.name}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-bold">{(item.price * item.quantity).toFixed(2)} ₺</div>
                      <button onClick={() => removeFromCart(item.itemId)} className="text-red-400 hover:text-red-600">
                        <X size={16} />
                      </button>
                    </div>
                 </div>
               ))}
            </div>
          )}
          
          {cart.length === 0 && !currentTableOrder && (
            <div className="text-center text-slate-400 py-10">
              <p>Sepet Boş</p>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t space-y-4">
          <div className="flex justify-between items-end">
            <span className="text-slate-500">Genel Toplam</span>
            <span className="text-2xl font-bold text-slate-900">{grandTotal.toFixed(2)} ₺</span>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
             {cart.length > 0 ? (
               <button 
                onClick={handlePlaceOrder}
                className="col-span-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-200 transition-all active:scale-95"
               >
                 Mutfağa Gönder
               </button>
             ) : (
               currentTableOrder && (
                 <button 
                  onClick={() => onCheckout(selectedTable.id)}
                  className="col-span-2 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-200"
                 >
                   <CreditCard size={18} /> Ödeme Al & Kapat
                 </button>
               )
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

// 5. Customer / Self-Ordering View
const CustomerView = ({ 
  tables, 
  onPlaceOrder, 
  orders,
  onAdminLogin,
  menuItems
}: { 
  tables: Table[], 
  onPlaceOrder: (id: number, items: OrderItem[], vibe?: string) => void,
  orders: Order[],
  onAdminLogin: () => void,
  menuItems: MenuItem[]
}) => {
  const [activeTableId, setActiveTableId] = useState<number | null>(null);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<MenuItemCategory>(MenuItemCategory.STARTER);
  const [viewState, setViewState] = useState<'tables' | 'menu' | 'ai'>('tables');
  
  // AI State
  const [aiQuery, setAiQuery] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // Active Order tracking
  const activeOrder = useMemo(() => {
    if (!activeTableId) return null;
    return orders.find(o => o.tableId === activeTableId && o.status !== OrderStatus.PAID);
  }, [activeTableId, orders]);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.itemId === item.id);
      if (existing) {
        return prev.map(i => i.itemId === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { itemId: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(i => i.itemId !== itemId));
  };

  const handlePlaceOrder = () => {
    if (!activeTableId || cart.length === 0) return;
    onPlaceOrder(activeTableId, cart, "Müşteri Kendisi Verdi");
    setCart([]);
  };

  const handleAskAI = async () => {
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    const response = await getMenuAssistantResponse(aiQuery, menuItems);
    setAiResponse(response);
    setAiLoading(false);
  };

  // 4.1 Table Selection Screen (Landing Page)
  if (viewState === 'tables') {
    return (
      <div className="min-h-screen bg-slate-900 p-6 flex flex-col items-center justify-center text-white relative">
        <button 
          onClick={onAdminLogin}
          className="absolute top-6 right-6 flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-full text-sm font-medium transition-colors border border-slate-700"
        >
          <Lock size={16} />
          Personel
        </button>

        <h1 className="text-4xl font-bold mb-2">RestoFlow'a Hoşgeldiniz</h1>
        <p className="text-slate-400 mb-8 text-lg">Başlamak için lütfen masa numaranızı seçiniz</p>
        
        <div className="grid grid-cols-3 gap-4 w-full max-w-md">
          {tables.map(table => (
            <button
              key={table.id}
              onClick={() => { setActiveTableId(table.id); setViewState('menu'); }}
              className="aspect-square rounded-2xl bg-slate-800 hover:bg-orange-600 transition-colors flex flex-col items-center justify-center border border-slate-700 group"
            >
              <span className="text-2xl font-bold group-hover:scale-110 transition-transform">{table.id}</span>
              <span className="text-[10px] uppercase mt-1 text-slate-500 group-hover:text-white/80">Masa</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // 4.2 AI Assistant View
  if (viewState === 'ai') {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="p-4 border-b flex items-center gap-4 bg-indigo-600 text-white">
          <button onClick={() => setViewState('menu')}><ArrowLeft /></button>
          <h2 className="font-bold text-lg">Yapay Zeka Menü Asistanı</h2>
        </div>
        <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-6">
           <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4">
             <Sparkles size={32} />
           </div>
           
           {!aiResponse ? (
             <>
               <h3 className="text-2xl font-bold text-slate-800">Karar veremediniz mi?</h3>
               <p className="text-slate-500 max-w-xs">Ne tarz bir şey istediğinizi söyleyin, size en uygun yemeği önerelim.</p>
               <div className="w-full max-w-md space-y-2">
                 {["Acı bir şeyler istiyorum", "Çocuklar için uygun ne var?", "Deniz ürünü severim"].map(q => (
                   <button key={q} onClick={() => setAiQuery(q)} className="block w-full text-left p-3 rounded-lg bg-slate-50 hover:bg-indigo-50 text-indigo-600 text-sm font-medium border border-slate-200">
                     "{q}"
                   </button>
                 ))}
               </div>
             </>
           ) : (
             <div className="bg-indigo-50 p-6 rounded-2xl max-w-md text-left border border-indigo-100 animate-in fade-in slide-in-from-bottom-4">
               <div className="flex items-center gap-2 text-indigo-700 font-bold mb-2">
                 <Sparkles size={16} /> Öneri
               </div>
               <p className="text-slate-800 leading-relaxed">{aiResponse}</p>
               <button onClick={() => { setAiResponse(""); setAiQuery(""); }} className="mt-4 text-sm text-indigo-600 underline">Başka bir soru sor</button>
             </div>
           )}

           <div className="w-full max-w-md relative mt-4">
              <input 
                type="text" 
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                placeholder="Örn: 'Vejetaryen neyiniz var?'"
                className="w-full p-4 pr-12 rounded-full border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
              />
              <button 
                onClick={handleAskAI}
                disabled={aiLoading}
                className="absolute right-2 top-2 p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50"
              >
                {aiLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={20} />}
              </button>
           </div>
        </div>
      </div>
    )
  }

  // 4.3 Customer Menu View
  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-0">
      {/* Header */}
      <div className="bg-white p-4 sticky top-0 z-20 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
             <button onClick={() => setViewState('tables')} className="p-1 hover:bg-slate-100 rounded">
                <ArrowLeft size={20} className="text-slate-400"/>
             </button>
             <div className="bg-orange-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold">
               {activeTableId}
             </div>
             <div>
               <h1 className="font-bold text-lg leading-none">RestoFlow</h1>
               <span className="text-xs text-slate-500">Masa {activeTableId}</span>
             </div>
          </div>
          <button 
            onClick={() => setViewState('ai')}
            className="p-2 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 transition-colors"
          >
            <MessageSquare size={20} />
          </button>
        </div>
        
        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {Object.values(MenuItemCategory).map(cat => (
            <button 
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2 whitespace-nowrap rounded-full text-sm font-bold transition-all ${
                activeCategory === cat ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Active Order Status Banner */}
      {activeOrder && (
         <div className="mx-4 mt-4 bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
           <div className="flex justify-between items-center mb-2">
             <span className="text-xs font-bold uppercase text-blue-500 tracking-wider">Sipariş Durumu</span>
             <span className={`px-2 py-1 rounded text-xs font-bold ${
               activeOrder.status === OrderStatus.READY ? 'bg-green-100 text-green-700' : 
               activeOrder.status === OrderStatus.PREPARING ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
             }`}>
               {activeOrder.status === OrderStatus.PENDING ? 'BEKLİYOR' : 
                activeOrder.status === OrderStatus.PREPARING ? 'HAZIRLANIYOR' : 'HAZIR'}
             </span>
           </div>
           <p className="text-sm text-slate-600">
             {activeOrder.items.length} ürün. Toplam: {activeOrder.total.toFixed(2)} ₺
           </p>
         </div>
      )}

      {/* Menu Grid */}
      <div className="p-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {menuItems.filter(i => i.category === activeCategory).map(item => (
          <div key={item.id} className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex gap-4">
            <img src={item.imageUrl} className="w-24 h-24 rounded-xl object-cover bg-slate-200" alt={item.name} />
            <div className="flex-1 flex flex-col justify-between py-1">
              <div>
                <h3 className="font-bold text-slate-800 line-clamp-1">{item.name}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 mt-1">{item.description}</p>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="font-bold text-lg">{item.price} ₺</span>
                <button 
                  onClick={() => addToCart(item)}
                  className="bg-slate-900 text-white w-8 h-8 rounded-full flex items-center justify-center active:scale-95 transition-transform"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Floating Cart / Checkout */}
      {cart.length > 0 && (
        <div className="fixed bottom-4 left-0 right-0 p-4 z-30">
          <div className="bg-white rounded-2xl shadow-2xl p-4 border border-slate-100 max-w-2xl mx-auto">
            <div className="max-h-40 overflow-y-auto mb-4 space-y-2">
              {cart.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm">
                   <div className="flex items-center gap-2">
                     <span className="font-bold bg-slate-100 w-6 h-6 flex items-center justify-center rounded text-xs">{item.quantity}</span>
                     <span>{item.name}</span>
                   </div>
                   <div className="flex items-center gap-3">
                      <span>{(item.price * item.quantity).toFixed(2)} ₺</span>
                      <button onClick={() => removeFromCart(item.itemId)} className="text-slate-400 hover:text-red-500"><X size={14} /></button>
                   </div>
                </div>
              ))}
            </div>
            <button 
              onClick={handlePlaceOrder}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-xl font-bold flex justify-between px-6 shadow-lg shadow-orange-200 active:scale-95 transition-all"
            >
              <span>Siparişi Ver</span>
              <span>{cart.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2)} ₺</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// 6. History View (Simple)
const HistoryView = ({ orders }: { orders: Order[] }) => {
  const paidOrders = orders.filter(o => o.status === OrderStatus.PAID);
  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="p-6 md:ml-20 min-h-screen bg-slate-100">
      <header className="mb-8">
         <h1 className="text-3xl font-bold text-slate-800">Sipariş Geçmişi</h1>
         <div className="mt-4 p-4 bg-white rounded-lg shadow-sm inline-block">
           <span className="text-slate-500 text-sm">Bugünkü Ciro</span>
           <div className="text-2xl font-bold text-green-600">{totalRevenue.toFixed(2)} ₺</div>
         </div>
      </header>
      
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-4 font-semibold text-slate-600">ID</th>
              <th className="p-4 font-semibold text-slate-600">Masa</th>
              <th className="p-4 font-semibold text-slate-600">Saat</th>
              <th className="p-4 font-semibold text-slate-600">Ürünler</th>
              <th className="p-4 font-semibold text-slate-600 text-right">Tutar</th>
            </tr>
          </thead>
          <tbody>
            {paidOrders.map(order => (
              <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-4 font-mono text-slate-500">#{order.id.slice(-4)}</td>
                <td className="p-4">Masa {order.tableId}</td>
                <td className="p-4 text-slate-500 text-sm">{order.createdAt.toLocaleTimeString()}</td>
                <td className="p-4 text-sm max-w-xs truncate">{order.items.map(i => i.name).join(", ")}</td>
                <td className="p-4 font-bold text-right">{order.total.toFixed(2)} ₺</td>
              </tr>
            ))}
            {paidOrders.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400">Henüz tamamlanan sipariş yok.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


// --- Main App Component ---

const App: React.FC = () => {
  // Default to 'customer' view as requested
  const [activeTab, setActiveTab] = useState('customer');
  const [tables, setTables] = useState<Table[]>(INITIAL_TABLES);
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(INITIAL_MENU_ITEMS);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);

  // Check for completed orders to notify waiter
  useEffect(() => {
    const readyOrder = orders.find(o => o.status === OrderStatus.READY);
  }, [orders]);

  const handlePlaceOrder = (tableId: number, items: OrderItem[], aiRecommendation?: string) => {
    const tableIndex = tables.findIndex(t => t.id === tableId);
    if (tableIndex === -1) return;

    let updatedOrders = [...orders];
    const existingOrderId = tables[tableIndex].currentOrderId;
    
    if (existingOrderId) {
      updatedOrders = updatedOrders.map(o => {
        if (o.id === existingOrderId) {
          return {
            ...o,
            items: [...o.items, ...items],
            total: o.total + items.reduce((acc, i) => acc + (i.price * i.quantity), 0),
            status: OrderStatus.PENDING,
            aiRecommendation: aiRecommendation || o.aiRecommendation
          };
        }
        return o;
      });
    } else {
      const newOrder: Order = {
        id: crypto.randomUUID(),
        tableId,
        items,
        status: OrderStatus.PENDING,
        createdAt: new Date(),
        total: items.reduce((acc, i) => acc + (i.price * i.quantity), 0),
        aiRecommendation
      };
      updatedOrders.push(newOrder);
      
      const updatedTables = [...tables];
      updatedTables[tableIndex] = {
        ...updatedTables[tableIndex],
        status: TableStatus.OCCUPIED,
        currentOrderId: newOrder.id
      };
      setTables(updatedTables);
      
      if (activeTab === 'waiter') {
         setSelectedTable(updatedTables[tableIndex]); 
      }
    }
    
    setOrders(updatedOrders);
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
  };

  const handleCheckout = (tableId: number) => {
    const table = tables.find(t => t.id === tableId);
    if (!table?.currentOrderId) return;

    setOrders(prev => prev.map(o => o.id === table.currentOrderId ? { ...o, status: OrderStatus.PAID } : o));
    setTables(prev => prev.map(t => t.id === tableId ? { ...t, status: TableStatus.EMPTY, currentOrderId: undefined } : t));
    setSelectedTable(null);
  };

  const handleAddMenuItem = (item: Omit<MenuItem, 'id'>) => {
    const newItem = { ...item, id: crypto.randomUUID() };
    setMenuItems(prev => [...prev, newItem]);
  };

  const handleDeleteMenuItem = (id: string) => {
    setMenuItems(prev => prev.filter(item => item.id !== id));
  };

  // If we are in 'customer' mode, we render just the customer view covering everything
  if (activeTab === 'customer') {
      return (
          <CustomerView 
            tables={tables} 
            onPlaceOrder={handlePlaceOrder} 
            orders={orders} 
            onAdminLogin={() => setActiveTab('waiter')}
            menuItems={menuItems}
          />
      );
  }

  // Staff View Layout
  return (
    <div className="bg-slate-50 min-h-screen text-slate-900 font-sans">
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="pb-20 md:pb-0">
        {activeTab === 'waiter' && (
          <WaiterView 
            tables={tables} 
            orders={orders}
            onSelectTable={setSelectedTable}
            selectedTable={selectedTable}
            onCloseTable={() => setSelectedTable(null)}
            onPlaceOrder={handlePlaceOrder}
            onCheckout={handleCheckout}
            menuItems={menuItems}
          />
        )}
        {activeTab === 'kitchen' && (
          <KitchenView orders={orders} updateStatus={updateOrderStatus} />
        )}
        {activeTab === 'menu' && (
          <MenuManagementView 
            menuItems={menuItems}
            onAdd={handleAddMenuItem}
            onDelete={handleDeleteMenuItem}
          />
        )}
        {activeTab === 'history' && (
          <HistoryView orders={orders} />
        )}
      </main>
    </div>
  );
};

export default App;