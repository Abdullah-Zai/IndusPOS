import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/Modal';

const Pos = () => {
  const { authFetch } = useAuth();
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedCat, setSelectedCat] = useState('all');
  const [search, setSearch] = useState('');
  
  // Cart State
  const [cart, setCart] = useState([]);
  const [orderType, setOrderType] = useState('dine_in');
  const [tableNo, setTableNo] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [loading, setLoading] = useState(false);
  const [receiptModal, setReceiptModal] = useState(null);

  // Expanded Prototyping States
  const [tables, setTables] = useState([]);
  const [riders, setRiders] = useState([]);
  const [selectedRider, setSelectedRider] = useState('');
  const [showAddRiderModal, setShowAddRiderModal] = useState(false);
  const [newRiderName, setNewRiderName] = useState('');
  const [newRiderPhone, setNewRiderPhone] = useState('');

  useEffect(() => {
    // Load Tables
    const savedTables = localStorage.getItem('indus_tables');
    if (savedTables) {
      setTables(JSON.parse(savedTables));
    } else {
      const defaults = [];
      for (let i = 1; i <= 10; i++) {
        defaults.push({ id: i, name: `Table ${i}`, capacity: 4, status: 'available', isActive: true });
      }
      setTables(defaults);
    }

    // Load Riders
    const savedRiders = localStorage.getItem('indus_riders');
    if (savedRiders) {
      setRiders(JSON.parse(savedRiders));
    } else {
      const defaultRiders = [
        { id: 1, name: 'Ali Khan', phone: '0300-1112223' },
        { id: 2, name: 'Bilal Ahmed', phone: '0321-4445556' }
      ];
      localStorage.setItem('indus_riders', JSON.stringify(defaultRiders));
      setRiders(defaultRiders);
    }
  }, []);

  useEffect(() => {
    authFetch('/api/menu/categories')
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(err => console.error(err));

    authFetch('/api/menu/items?is_available=true')
      .then(res => res.json())
      .then(data => setItems(data))
      .catch(err => console.error(err));
  }, []);

  const filteredItems = items.filter(item => {
    const matchesCat = selectedCat === 'all' || item.category_id === selectedCat;
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                          (item.variant && item.variant.toLowerCase().includes(search.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const addToCart = (item) => {
    setCart(prev => {
      const existingIdx = prev.findIndex(ci => ci.id === item.id);
      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx].qty += 1;
        return updated;
      } else {
        return [...prev, { ...item, qty: 1 }];
      }
    });
  };

  const updateQty = (id, delta) => {
    setCart(prev => {
      return prev.map(ci => {
        if (ci.id === id) {
          const newQty = ci.qty + delta;
          return newQty > 0 ? { ...ci, qty: newQty } : null;
        }
        return ci;
      }).filter(Boolean);
    });
  };

  const clearCart = () => {
    setCart([]);
    setTableNo('');
    setSelectedRider('');
  };

  const totalAmount = cart.reduce((sum, item) => sum + (Number(item.price) * item.qty), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return alert('Cart is empty!');
    if (orderType === 'dine_in' && !tableNo.trim()) {
      return alert('Please select a Table for Dine-In orders!');
    }
    if (orderType === 'delivery' && !selectedRider) {
      return alert('Please select a Delivery Rider!');
    }

    setLoading(true);
    try {
      const payload = {
        table_no: orderType === 'delivery' ? selectedRider.substring(0, 20) : (tableNo || null),
        order_type: orderType,
        payment_method: paymentMethod,
        items: cart.map(ci => ({
          item_id: ci.id,
          quantity: ci.qty,
          price: Number(ci.price)
        }))
      };

      const res = await authFetch('/api/orders/checkout', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Checkout failed');

      setReceiptModal(data);
      clearCart();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintReceipt = () => {
    const printContent = document.getElementById('pos-receipt-print-area').innerHTML;
    const printWindow = window.open('', '', 'width=600,height=800');
    printWindow.document.write('<html><head><title>Print Receipt</title>');
    printWindow.document.write('<style>');
    printWindow.document.write(`
      body { font-family: monospace; padding: 20px; color: #000; background: #fff; }
      .receipt-title { font-size: 1.5rem; font-weight: bold; text-align: center; margin-bottom: 5px; text-transform: uppercase; }
      .receipt-subtitle { font-size: 0.85rem; text-align: center; color: #555; margin-bottom: 20px; }
      .receipt-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; font-size: 0.85rem; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 15px; }
      .receipt-items { display: flex; flex-direction: column; gap: 5px; font-size: 0.9rem; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 15px; }
      .receipt-item { display: flex; justify-content: space-between; }
      .receipt-total { display: flex; justify-content: space-between; font-size: 1.2rem; font-weight: bold; margin-top: 10px; border-top: 1px dashed #000; padding-top: 10px; }
      .receipt-footer { text-align: center; font-size: 0.8rem; margin-top: 30px; color: #555; }
    `);
    printWindow.document.write('</style></head><body>');
    printWindow.document.write(printContent);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
    setReceiptModal(null);
  };

  return (
    <div className="page-body animate-fade-in" style={{ padding: '1.5rem' }}>
      <div className="pos-layout">
        {/* Left: Menu & Categories */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Top Bar: Search & Categories */}
          <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="🔍 Search Pakistani Cuisine (e.g. Karahi, Biryani, Naan)..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
            
            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
              <button 
                onClick={() => setSelectedCat('all')}
                className={`btn ${selectedCat === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.45rem 1rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
              >
                All Items
              </button>
              {categories.map(cat => (
                <button 
                  key={cat.id} 
                  onClick={() => setSelectedCat(cat.id)}
                  className={`btn ${selectedCat === cat.id ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '0.45rem 1rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Item Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
            gap: '1rem', 
            overflowY: 'auto', 
            maxHeight: 'calc(100vh - 270px)',
            paddingRight: '0.5rem' 
          }}>
            {filteredItems.map((item, idx) => (
              <div 
                key={item.id} 
                className="glass-card item-card animate-scale-up" 
                onClick={() => addToCart(item)}
                style={{ 
                  cursor: 'pointer', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  overflow: 'hidden', 
                  position: 'relative',
                  border: '1px solid var(--border-color)',
                  animationDelay: `${idx * 20}ms`
                }}
              >
                <div style={{ height: '120px', background: '#1e293b', position: 'relative', overflow: 'hidden' }}>
                  <img 
                    src={item.image_url} 
                    alt={item.name} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }} 
                    onError={(e) => { e.target.src = 'https://placehold.co/300x200?text=Indus+Food'; }}
                  />
                  {item.variant && (
                    <span className="badge badge-info" style={{ position: 'absolute', bottom: '8px', right: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.6)' }}>
                      {item.variant}
                    </span>
                  )}
                </div>
                <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-primary)', lineHeight: 1.2 }}>{item.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>{item.category_name}</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.8rem', paddingTop: '0.6rem', borderTop: '1px solid var(--border-color)' }}>
                    <span style={{ fontWeight: '800', color: 'var(--accent-primary)', fontSize: '1.05rem' }}>
                      Rs. {Number(item.price).toLocaleString()}
                    </span>
                    <span style={{ fontSize: '1.2rem', color: '#10b981' }}>⊕</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Live Cart & Billing */}
        <div className="pos-cart">
          <div className="glass-header" style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem' }}>🛒 Current Order Cart</h3>
            <button onClick={clearCart} className="btn btn-secondary" style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', borderColor: 'var(--danger)', color: 'var(--danger)' }}>
              Clear
            </button>
          </div>

          <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {['dine_in', 'takeaway', 'delivery'].map(type => (
                <button 
                  key={type} 
                  onClick={() => { setOrderType(type); if(type !== 'dine_in') setTableNo(''); }}
                  className={`btn ${orderType === type ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, padding: '0.4rem', fontSize: '0.8rem', textTransform: 'capitalize' }}
                >
                  {type.replace('_', ' ')}
                </button>
              ))}
            </div>

            {orderType === 'dine_in' && (
              <div>
                <select
                  className="form-control"
                  value={tableNo}
                  onChange={(e) => setTableNo(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.8rem', fontSize: '0.9rem', background: 'var(--bg-input)' }}
                  required
                >
                  <option value="">-- Select Table --</option>
                  {tables.filter(t => t.isActive).map(t => (
                    <option key={t.id} value={t.name}>{t.name} (👤 {t.capacity})</option>
                  ))}
                </select>
              </div>
            )}

            {orderType === 'delivery' && (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select
                  className="form-control"
                  value={selectedRider}
                  onChange={(e) => setSelectedRider(e.target.value)}
                  style={{ flex: 1, padding: '0.55rem 0.8rem', fontSize: '0.9rem', background: 'var(--bg-input)' }}
                  required
                >
                  <option value="">-- Choose Rider --</option>
                  {riders.map(r => (
                    <option key={r.id} value={r.name}>{r.name} ({r.phone})</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowAddRiderModal(true)}
                  className="btn btn-secondary"
                  style={{ padding: '0.5rem', fontSize: '0.9rem' }}
                  title="Add New Rider"
                >
                  ➕
                </button>
              </div>
            )}
          </div>

          {/* Cart Items List */}
          <div className="pos-cart-items">
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', margin: 'auto' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🍽️</div>
                <p>Click on menu items to add to order</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.75rem', background: 'var(--bg-table-row)', borderRadius: 'var(--radius-sm)' }}>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-primary)' }}>{item.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--accent-primary)' }}>
                      {item.variant ? `${item.variant} • ` : ''}Rs. {Number(item.price).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button onClick={() => updateQty(item.id, -1)} className="btn btn-secondary" style={{ padding: '0.2rem 0.6rem', fontSize: '1rem', minWidth: '30px' }}>-</button>
                    <span style={{ fontWeight: '700', minWidth: '24px', textAlign: 'center' }}>{item.qty}</span>
                    <button onClick={() => updateQty(item.id, 1)} className="btn btn-secondary" style={{ padding: '0.2rem 0.6rem', fontSize: '1rem', minWidth: '30px' }}>+</button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Footer */}
          <div className="pos-cart-footer">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              <span>Subtotal:</span>
              <span>Rs. {totalAmount.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)' }}>
              <span>Total Payable:</span>
              <span className="gradient-text">Rs. {totalAmount.toLocaleString()}</span>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Payment Method</label>
              <select className="form-select" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} style={{ padding: '0.5rem' }}>
                <option value="Cash">💵 Cash on Counter</option>
                <option value="Card">💳 Credit / Debit Card</option>
                <option value="Online">📱 Online Transfer (JazzCash / EasyPaisa)</option>
              </select>
            </div>

            <button 
              onClick={handleCheckout} 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '0.9rem', fontSize: '1.05rem', fontWeight: '800', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
              disabled={loading || cart.length === 0}
            >
              {loading ? 'Processing Billing...' : `⚡ COMPLETE BILL & PRINT (Rs. ${totalAmount.toLocaleString()})`}
            </button>
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      <Modal 
        isOpen={!!receiptModal} 
        onClose={() => setReceiptModal(null)} 
        title="🎉 Order Billed Successfully!"
        footer={
          <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
            <button onClick={handlePrintReceipt} className="btn btn-primary" style={{ flex: 1, background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' }}>
              🖨️ Print Bill
            </button>
            <button onClick={() => setReceiptModal(null)} className="btn btn-secondary" style={{ flex: 1 }}>
              💾 Save Only
            </button>
          </div>
        }
      >
        {receiptModal && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🧾</div>
            
            <div id="pos-receipt-print-area">
              <div className="receipt-title">INDUS HOTEL</div>
              <div className="receipt-subtitle">Official POS Receipt • Order #{receiptModal.order_number}</div>
              
              <div className="receipt-grid">
                <div>Type: <b>{receiptModal.order_type.toUpperCase()}</b></div>
                <div>Date: <b>{receiptModal.business_date}</b></div>
                {receiptModal.table_no && <div style={{ gridColumn: 'span 2' }}>Table/Rider: <b>{receiptModal.table_no}</b></div>}
              </div>
              
              <div className="receipt-items">
                {receiptModal.items?.map((it, i) => (
                  <div key={i} className="receipt-item">
                    <span>{it.quantity}x {it.item_name} {it.variant ? `(${it.variant})` : ''}</span>
                    <span>Rs. {(Number(it.price_at_time) * it.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              
              <div className="receipt-total">
                <span>Total Paid:</span>
                <span>Rs. {receiptModal.total_amount?.toLocaleString()}</span>
              </div>
              
              <div className="receipt-footer">
                Thank you for dining with Indus Hotel!
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Quick Add Rider Modal */}
      <Modal
        isOpen={showAddRiderModal}
        onClose={() => setShowAddRiderModal(false)}
        title="➕ Register New Delivery Rider"
        footer={
          <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
            <button 
              onClick={() => {
                if (!newRiderName.trim() || !newRiderPhone.trim()) return alert('Name and phone are required!');
                const newRider = { id: Date.now(), name: newRiderName.trim(), phone: newRiderPhone.trim() };
                const updated = [...riders, newRider];
                localStorage.setItem('indus_riders', JSON.stringify(updated));
                setRiders(updated);
                setSelectedRider(newRider.name);
                setNewRiderName('');
                setNewRiderPhone('');
                setShowAddRiderModal(false);
              }} 
              className="btn btn-primary"
              style={{ flex: 1 }}
            >
              Add Rider
            </button>
            <button onClick={() => setShowAddRiderModal(false)} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem 0' }}>
          <div>
            <label className="form-label">Rider Name</label>
            <input 
              type="text" 
              className="form-control" 
              value={newRiderName} 
              onChange={(e) => setNewRiderName(e.target.value)} 
              placeholder="e.g. Sajid Khan" 
              required
            />
          </div>
          <div>
            <label className="form-label">Phone Number</label>
            <input 
              type="text" 
              className="form-control" 
              value={newRiderPhone} 
              onChange={(e) => setNewRiderPhone(e.target.value)} 
              placeholder="e.g. 0300-1234567" 
              required
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Pos;
