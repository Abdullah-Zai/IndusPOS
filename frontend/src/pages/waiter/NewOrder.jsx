import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/Modal';

const NewOrder = ({ setActiveTab }) => {
  const { authFetch } = useAuth();
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedCat, setSelectedCat] = useState('all');
  const [search, setSearch] = useState('');
  
  // Order State
  const [cart, setCart] = useState([]);
  const [tableNo, setTableNo] = useState('');
  const [loading, setLoading] = useState(false);
  const [successModal, setSuccessModal] = useState(null);
  const [tables, setTables] = useState([]);
  const [orderAreaFilter, setOrderAreaFilter] = useState('all');

  useEffect(() => {
    // Load active tables
    const saved = localStorage.getItem('indus_tables');
    if (saved) {
      setTables(JSON.parse(saved));
    } else {
      const defaults = [];
      for (let i = 1; i <= 10; i++) {
        let area = 'Main Hall';
        let name = '';
        if (i <= 3) {
          area = 'Family Hall';
          name = `FH ${i}`;
        } else if (i <= 6) {
          area = 'Rooftop';
          name = `RF ${i - 3}`;
        } else if (i <= 8) {
          area = 'Mens Section';
          name = `MS ${i - 6}`;
        } else {
          area = 'Main Hall';
          name = `G ${i - 8}`;
        }
        defaults.push({ id: i, name: name, capacity: 4, area: area, status: 'available', isActive: true });
      }
      localStorage.setItem('indus_tables', JSON.stringify(defaults));
      setTables(defaults);
    }

    const savedPreselected = sessionStorage.getItem('waiter_preselected_table');
    if (savedPreselected) {
      setTableNo(savedPreselected);
      sessionStorage.removeItem('waiter_preselected_table');
    }

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

  const totalAmount = cart.reduce((sum, item) => sum + (Number(item.price) * item.qty), 0);

  const handleSubmitOrder = async () => {
    if (!tableNo.trim()) return alert('⚠️ Please select a table before placing the order!');
    if (cart.length === 0) return alert('⚠️ Cart is empty! Please add at least one item to the order.');
    if (totalAmount <= 0) return alert('⚠️ Order total must be greater than Rs. 0!');

    setLoading(true);
    try {
      const payload = {
        table_no: tableNo,
        order_type: 'dine_in',
        items: cart.map(ci => ({
          item_id: ci.id,
          quantity: ci.qty,
          price: Number(ci.price)
        }))
      };

      const res = await authFetch('/api/orders', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Order failed');

      setSuccessModal(data);
      setCart([]);
      setTableNo('');
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-body animate-fade-in" style={{ padding: '1.5rem' }}>
      <div className="pos-layout">
        {/* Left: Menu Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem' }}>📝 Select Menu Items</h3>
              <button onClick={() => setActiveTab('dashboard')} className="btn btn-secondary" style={{ padding: '0.35rem 0.8rem', fontSize: '0.8rem' }}>
                ⬅ Back to Tables
              </button>
            </div>
            <input type="text" className="form-input" placeholder="🔍 Search Pakistani Menu..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
              <button onClick={() => setSelectedCat('all')} className={`btn ${selectedCat === 'all' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>All</button>
              {categories.map(cat => (
                <button key={cat.id} onClick={() => setSelectedCat(cat.id)} className={`btn ${selectedCat === cat.id ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{cat.name}</button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.85rem', overflowY: 'auto', maxHeight: 'calc(100vh - 250px)', paddingRight: '0.5rem' }}>
            {filteredItems.map(item => (
              <div key={item.id} className="glass-card" onClick={() => openQtyModal(item)} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ height: '100px', background: '#1e293b', position: 'relative' }}>
                  <img src={item.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.src = 'https://placehold.co/300x200?text=Food'; }} />
                  {item.variant && <span className="badge badge-info" style={{ position: 'absolute', bottom: '6px', right: '6px', fontSize: '0.65rem' }}>{item.variant}</span>}
                </div>
                <div style={{ 
                  padding: '0.75rem', 
                  flex: 1, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between',
                  background: 'var(--bg-secondary)',
                  borderTop: '1px solid var(--border-color)'
                }}>
                  <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-primary)' }}>{item.name}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', paddingTop: '0.4rem', borderTop: '1px dashed var(--border-color)' }}>
                    <span style={{ fontWeight: '800', color: 'var(--accent-primary)', fontSize: '0.95rem' }}>Rs. {Number(item.price).toLocaleString()}</span>
                    <span style={{ fontSize: '1.1rem', color: '#10b981' }}>⊕</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Table Cart Panel */}
        <div className="pos-cart" style={{
          background: 'var(--bg-secondary)',
          border: '2.5px solid var(--accent-primary)',
          boxShadow: '0 8px 30px rgba(16, 185, 129, 0.25)',
          borderRadius: 'var(--radius-lg)'
        }}>
          <div className="glass-header" style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem' }}>🪑 Table Order Cart</h3>
            <button onClick={() => setCart([])} className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', borderColor: 'var(--danger)', color: 'var(--danger)' }}>Clear</button>
          </div>

          <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', background: 'rgba(99, 102, 241, 0.04)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label" style={{ color: 'var(--text-primary)', fontSize: '0.85rem', margin: 0 }}>🪑 Table Selection</label>
              {tableNo && <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>Selected: {tableNo}</span>}
            </div>

            {/* Area Filter Tabs */}
            <div style={{ display: 'flex', gap: '0.25rem', overflowX: 'auto', paddingBottom: '0.2rem' }}>
              <button 
                type="button"
                onClick={() => setOrderAreaFilter('all')} 
                className={`btn ${orderAreaFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.25rem 0.6rem', fontSize: '0.7rem', minWidth: 'unset', whiteSpace: 'nowrap' }}
              >
                All
              </button>
              {['Family Hall', 'Rooftop', 'Mens Section', 'Main Hall'].map(area => (
                <button 
                  type="button"
                  key={area}
                  onClick={() => setOrderAreaFilter(area)} 
                  className={`btn ${orderAreaFilter === area ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '0.25rem 0.6rem', fontSize: '0.7rem', minWidth: 'unset', whiteSpace: 'nowrap' }}
                >
                  {area.replace(' Section', '').replace(' Hall', '')}
                </button>
              ))}
            </div>

            {/* Compact Tables Grid */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', 
              gap: '0.4rem', 
              maxHeight: '130px', 
              overflowY: 'auto', 
              padding: '0.25rem', 
              background: 'rgba(0,0,0,0.2)', 
              borderRadius: 'var(--radius-sm)' 
            }}>
              {tables
                .filter(t => t.isActive && (orderAreaFilter === 'all' || t.area === orderAreaFilter))
                .map(t => {
                  const isSelected = tableNo === t.name;
                  const isOccupied = t.status === 'occupied';
                  const isReserved = t.status === 'reserved';
                  
                  let cardBorder = '1px solid var(--border-color)';
                  let cardBg = 'rgba(255, 255, 255, 0.02)';
                  let statusColor = 'var(--text-muted)';
                  
                  if (isSelected) {
                    cardBorder = '2px solid var(--info)';
                    cardBg = 'rgba(59, 130, 246, 0.18)';
                    statusColor = 'var(--info)';
                  } else if (isOccupied) {
                    cardBorder = '1.5px solid var(--danger)';
                    cardBg = 'rgba(239, 68, 68, 0.12)';
                    statusColor = 'var(--danger)';
                  } else if (isReserved) {
                    cardBorder = '1.5px solid var(--warning)';
                    cardBg = 'rgba(245, 158, 11, 0.12)';
                    statusColor = 'var(--warning)';
                  } else {
                    cardBorder = '1.5px solid var(--success)';
                    cardBg = 'rgba(16, 185, 129, 0.12)';
                    statusColor = 'var(--success)';
                  }

                  return (
                    <div 
                      key={t.id}
                      onClick={() => setTableNo(t.name)}
                      style={{
                        padding: '0.4rem 0.25rem',
                        textAlign: 'center',
                        borderRadius: 'var(--radius-xs)',
                        border: cardBorder,
                        background: cardBg,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: isSelected ? '0 0 10px rgba(59, 130, 246, 0.45)' : 'none'
                      }}
                      title={`${t.name} - ${t.area} (Capacity: ${t.capacity} guests) [${t.status}]`}
                    >
                      <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{t.name}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: '600' }}>
                        👤 <span style={{ color: isSelected ? 'var(--info)' : 'var(--text-primary)' }}>{t.capacity}</span>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Fallback Selector */}
            <select 
              className="form-control" 
              value={tableNo} 
              onChange={(e) => setTableNo(e.target.value)} 
              required
              style={{ width: '100%', fontSize: '0.9rem', padding: '0.35rem 0.5rem', background: 'var(--bg-input)' }}
            >
              <option value="">-- Or Select Dropdown --</option>
              {tables.filter(t => t.isActive).map(t => (
                <option key={t.id} value={t.name}>{t.name} - {t.area} (👤 {t.capacity})</option>
              ))}
            </select>
          </div>

          <div className="pos-cart-items">
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', margin: 'auto' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📝</div>
                <p>Tap dishes to add to table order</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.75rem', background: 'var(--bg-table-row)', borderRadius: 'var(--radius-sm)' }}>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-primary)' }}>{item.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--accent-primary)' }}>{item.variant ? `${item.variant} • ` : ''}Rs. {Number(item.price).toLocaleString()}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <button onClick={() => updateQty(item.id, -1)} className="btn btn-secondary" style={{ padding: '0.15rem 0.5rem', fontSize: '0.9rem' }}>-</button>
                    <span style={{ fontWeight: '700', minWidth: '20px', textAlign: 'center' }}>{item.qty}</span>
                    <button onClick={() => updateQty(item.id, 1)} className="btn btn-secondary" style={{ padding: '0.15rem 0.5rem', fontSize: '0.9rem' }}>+</button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pos-cart-footer">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-primary)' }}>
              <span>Order Estimated:</span>
              <span className="gradient-text">Rs. {totalAmount.toLocaleString()}</span>
            </div>
            <button 
              onClick={handleSubmitOrder} 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '0.9rem', fontSize: '1.05rem', fontWeight: '800' }}
              disabled={loading || cart.length === 0}
            >
              {loading ? 'Sending to Kitchen...' : `🍳 SEND ORDER TO KITCHEN ➔`}
            </button>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <Modal 
        isOpen={!!successModal} 
        onClose={() => { setSuccessModal(null); setActiveTab('dashboard'); }} 
        title="🎉 Order Sent to Kitchen!"
        footer={
          <button onClick={() => { setSuccessModal(null); setActiveTab('dashboard'); }} className="btn btn-primary">
            View Table Status Queue
          </button>
        }
      >
        {successModal && (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '0.5rem' }}>🍳</div>
            <h2 style={{ fontSize: '1.8rem', color: 'var(--text-primary)' }}>Order #{successModal.order_number} Placed!</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
              Table <b>{successModal.table_no}</b> order has appeared on the Kitchen Display System (KDS).
            </p>
          </div>
        )}
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

export default NewOrder;
