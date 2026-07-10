import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/Modal';
import { printThermalReceipt } from '../../components/PrintReceipt';

const Pos = () => {
  const { authFetch, user } = useAuth();
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
        let area = 'Main Hall';
        let name = '';
        if (i <= 3) {
          area = 'Family Hall'; name = `FH ${i}`;
        } else if (i <= 6) {
          area = 'Rooftop'; name = `RF ${i - 3}`;
        } else if (i <= 8) {
          area = 'Mens Section'; name = `MS ${i - 6}`;
        } else {
          area = 'Main Hall'; name = `G ${i - 8}`;
        }
        defaults.push({ id: i, name, capacity: 4, area, status: 'available', isActive: true });
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

  // Size & Qty Modal State
  const [qtyModalItem, setQtyModalItem] = useState(null);
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [itemQty, setItemQty] = useState(1);
  const [qtyError, setQtyError] = useState('');

  const openQtyModal = (item) => {
    setQtyModalItem(item);
    setSelectedVariantId(item.id);
    setItemQty(1);
    setQtyError('');
  };

  const handleAddWithQty = () => {
    setQtyError('');
    const qty = parseInt(itemQty);
    if (isNaN(qty) || qty <= 0) {
      setQtyError('⚠️ Quantity must be at least 1.');
      return;
    }
    if (qty > 100) {
      setQtyError('⚠️ Quantity cannot exceed 100.');
      return;
    }
    const selectedItem = items.find(i => i.id === Number(selectedVariantId));
    if (!selectedItem) {
      setQtyError('⚠️ Please select a size/portion.');
      return;
    }

    setCart(prev => {
      const existingIdx = prev.findIndex(ci => ci.id === selectedItem.id);
      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx].qty += qty;
        return updated;
      } else {
        return [...prev, { ...selectedItem, qty: qty }];
      }
    });

    setQtyModalItem(null);
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
    printThermalReceipt({
      orderNumber: receiptModal.order_number,
      orderType: receiptModal.order_type,
      tableNo: receiptModal.table_no,
      paymentMethod: paymentMethod,
      items: receiptModal.items,
      subtotal: receiptModal.total_amount,
      discount: 0,
      tax: 0,
      totalAmount: receiptModal.total_amount,
      cashierName: user?.username || '',
      createdAt: receiptModal.created_at || new Date().toISOString(),
    });
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
                onClick={() => openQtyModal(item)}
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
                <div style={{ 
                  padding: '1rem', 
                  flex: 1, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between',
                  background: 'var(--bg-secondary)',
                  borderTop: '1px solid var(--border-color)'
                }}>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '1.02rem', color: 'var(--text-primary)', lineHeight: 1.2 }}>{item.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>{item.category_name}</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.8rem', paddingTop: '0.6rem', borderTop: '1px dashed var(--border-color)' }}>
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
        <div className="pos-cart" style={{
          background: 'var(--bg-secondary)',
          border: '2.5px solid var(--accent-primary)',
          boxShadow: '0 8px 30px rgba(16, 185, 129, 0.25)',
          borderRadius: 'var(--radius-lg)'
        }}>
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
            <button onClick={handlePrintReceipt} className="btn btn-primary" style={{ flex: 1, background: 'var(--accent-gradient)' }}>
              🖨️ Print Bill
            </button>
            <button onClick={() => setReceiptModal(null)} className="btn btn-secondary" style={{ flex: 1 }}>
              💾 Save Only
            </button>
          </div>
        }
      >
        {receiptModal && (
          <div style={{ fontFamily: 'Courier New, monospace', fontSize: '0.85rem', color: '#000', background: '#fff', padding: '1rem', maxWidth: '320px', margin: '0 auto', border: '1px solid #ddd', borderRadius: '8px' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '50%', border: '2px solid #000', fontSize: '18px', fontWeight: '900', marginBottom: '4px' }}>IL</div>
              <div style={{ fontSize: '16px', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase' }}>Indus Legacy</div>
              <div style={{ fontSize: '9px', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#555' }}>Hotel &amp; Restaurant</div>
            </div>

            <hr style={{ borderTop: '3px double #000', margin: '6px 0' }} />

            {/* Invoice Info */}
            {[
              ['Invoice #', `ORD-${String(receiptModal.order_number || 0).padStart(5,'0')}`],
              ['Date', new Date().toLocaleDateString('en-PK', { day:'2-digit', month:'short', year:'numeric' })],
              ['Time', new Date().toLocaleTimeString('en-PK', { hour:'2-digit', minute:'2-digit', hour12: true })],
              ['Order Type', receiptModal.order_type === 'dine_in' ? 'Dine-In' : receiptModal.order_type === 'delivery' ? 'Delivery' : 'Takeaway'],
              receiptModal.table_no ? [receiptModal.order_type === 'delivery' ? 'Rider' : 'Table', receiptModal.table_no] : null,
              user?.username ? ['Cashier', user.username] : null,
            ].filter(Boolean).map(([label, val], i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '1.5px 0', fontSize: '11px' }}>
                <span style={{ color: '#555' }}>{label}</span>
                <span style={{ fontWeight: '700' }}>{val}</span>
              </div>
            ))}

            <hr style={{ borderTop: '1px dashed #000', margin: '5px 0' }} />

            {/* Items */}
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #000', fontSize: '10px', textTransform: 'uppercase' }}>
                  <th style={{ textAlign: 'left', padding: '2px 0' }}>Item</th>
                  <th style={{ textAlign: 'center', padding: '2px 4px' }}>Qty</th>
                  <th style={{ textAlign: 'right', padding: '2px 0' }}>Price</th>
                  <th style={{ textAlign: 'right', padding: '2px 0' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {receiptModal.items?.map((it, i) => (
                  <tr key={i}>
                    <td style={{ padding: '2px 0', fontSize: '11px', wordBreak: 'break-word' }}>{it.item_name}{it.variant ? ` (${it.variant})` : ''}</td>
                    <td style={{ padding: '2px 4px', fontSize: '11px', textAlign: 'center' }}>{it.quantity}</td>
                    <td style={{ padding: '2px 0', fontSize: '11px', textAlign: 'right' }}>{Number(it.price_at_time).toLocaleString()}</td>
                    <td style={{ padding: '2px 0', fontSize: '11px', textAlign: 'right', fontWeight: '700' }}>{(Number(it.price_at_time) * it.quantity).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <hr style={{ borderTop: '1px dashed #000', margin: '5px 0' }} />

            <hr style={{ borderTop: '1px solid #000', margin: '5px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '900', padding: '2px 0' }}>
              <span>TOTAL PAYABLE:</span>
              <span>Rs. {receiptModal.total_amount?.toLocaleString()}</span>
            </div>

            <hr style={{ borderTop: '1px dashed #000', margin: '5px 0' }} />

            <div style={{ textAlign: 'center', margin: '4px 0' }}>
              <span style={{ border: '1.5px solid #000', padding: '2px 10px', fontSize: '10px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>PAID VIA: {paymentMethod}</span>
            </div>

            <hr style={{ borderTop: '3px double #000', margin: '6px 0' }} />

            {/* Footer */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: '700', fontSize: '11px' }}>*** Thank You! Come Again ***</div>
              <div style={{ fontSize: '10px', lineHeight: '1.7', color: '#333', marginTop: '4px' }}>
                Indus Legacy Hotel &amp; Restaurant<br />
                Karachi Bypass Road, Indus Town<br />
                Karachi, Pakistan
              </div>
              <div style={{ fontSize: '9px', color: '#888', marginTop: '4px' }}>Powered by Indus Legacy</div>
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

      {/* Size & Quantity Selection Modal with Validation */}
      <Modal
        isOpen={qtyModalItem !== null}
        onClose={() => setQtyModalItem(null)}
        title="🛒 Configure Item Portion & Qty"
        footer={
          <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
            <button 
              onClick={handleAddWithQty}
              className="btn btn-primary"
              style={{ flex: 1 }}
            >
              Add to Order
            </button>
            <button onClick={() => setQtyModalItem(null)} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        }
      >
        {qtyModalItem && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', padding: '1rem 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--bg-table-row)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
              <img 
                src={qtyModalItem.image_url} 
                alt={qtyModalItem.name} 
                style={{ width: '60px', height: '60px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }} 
                onError={(e) => { e.target.src = 'https://placehold.co/100x100?text=Food'; }}
              />
              <div>
                <h4 style={{ margin: 0, fontWeight: '700', fontSize: '1.1rem' }}>{qtyModalItem.name}</h4>
                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{qtyModalItem.category_name}</p>
              </div>
            </div>

            <div>
              <label className="form-label" style={{ fontWeight: '600' }}>Portion Size / Variant</label>
              <select 
                className="form-select"
                value={selectedVariantId}
                onChange={(e) => {
                  setSelectedVariantId(e.target.value);
                  setQtyError('');
                }}
                style={{ width: '100%', padding: '0.6rem 0.8rem', fontSize: '0.9rem', background: 'var(--bg-input)' }}
              >
                {items
                  .filter(i => i.name === qtyModalItem.name)
                  .map(variant => (
                    <option key={variant.id} value={variant.id}>
                      {variant.variant || 'Standard'} — Rs. {Number(variant.price).toLocaleString()}
                    </option>
                  ))
                }
              </select>
            </div>

            <div>
              <label className="form-label" style={{ fontWeight: '600' }}>Quantity</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button 
                  type="button" 
                  onClick={() => {
                    setItemQty(q => Math.max(1, parseInt(q || 1) - 1));
                    setQtyError('');
                  }} 
                  className="btn btn-secondary" 
                  style={{ width: '40px', height: '40px', padding: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  -
                </button>
                <input 
                  type="number" 
                  className="form-control" 
                  value={itemQty} 
                  onChange={(e) => {
                    setItemQty(e.target.value);
                    setQtyError('');
                  }} 
                  style={{ textAlign: 'center', width: '80px', height: '40px', fontSize: '1.1rem', fontWeight: '700' }}
                  min="1"
                  max="100"
                  required
                />
                <button 
                  type="button" 
                  onClick={() => {
                    setItemQty(q => Math.min(100, parseInt(q || 1) + 1));
                    setQtyError('');
                  }} 
                  className="btn btn-secondary" 
                  style={{ width: '40px', height: '40px', padding: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  +
                </button>
              </div>
            </div>

            {qtyError && (
              <div style={{ 
                background: 'rgba(239,68,68,0.1)', 
                border: '1px solid rgba(239,68,68,0.3)', 
                borderRadius: 'var(--radius-sm)', 
                padding: '0.6rem 0.75rem', 
                color: 'var(--danger)', 
                fontSize: '0.85rem', 
                fontWeight: '600' 
              }}>
                {qtyError}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Pos;
