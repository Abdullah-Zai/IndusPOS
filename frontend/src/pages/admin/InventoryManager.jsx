import React, { useState, useEffect } from 'react';

const InventoryManager = () => {
  const [inventory, setInventory] = useState([]);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Dry Ingredients');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('kg');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  
  // Edit state
  const [editingItem, setEditingItem] = useState(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editQuantity, setEditQuantity] = useState('');
  const [editUnit, setEditUnit] = useState('kg');
  const [editPurchasePrice, setEditPurchasePrice] = useState('');
  const [editPurchaseDate, setEditPurchaseDate] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Filtering
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterMonth, setFilterMonth] = useState(''); // YYYY-MM

  const categories = [
    'Dry Ingredients',
    'Meat & Poultry',
    'Fresh Produce',
    'Dairy & Eggs',
    'Beverage Stock',
    'Utilities & Cleaning',
    'Other Supplies'
  ];

  const units = ['kg', 'liters', 'grams', 'packets', 'boxes', 'pieces', 'bags', 'dozens'];

  useEffect(() => {
    const saved = localStorage.getItem('indus_inventory');
    if (saved) {
      setInventory(JSON.parse(saved));
    }
  }, []);

  const saveInventory = (updated) => {
    localStorage.setItem('indus_inventory', JSON.stringify(updated));
    setInventory(updated);
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!name.trim() || !quantity || !purchasePrice) {
      alert('⚠️ Name, quantity, and purchase price are required!');
      return;
    }

    const newItem = {
      id: Date.now(),
      name: name.trim(),
      category,
      quantity: parseFloat(quantity),
      unit,
      purchasePrice: parseFloat(purchasePrice),
      purchaseDate,
      description: description.trim()
    };

    saveInventory([...inventory, newItem]);
    
    // Reset Form
    setName('');
    setQuantity('');
    setPurchasePrice('');
    setDescription('');
    alert('✅ Stock item logged into store room!');
  };

  const startEdit = (item) => {
    setEditingItem(item);
    setEditName(item.name);
    setEditCategory(item.category);
    setEditQuantity(item.quantity);
    setEditUnit(item.unit);
    setEditPurchasePrice(item.purchasePrice);
    setEditPurchaseDate(item.purchaseDate);
    setEditDescription(item.description || '');
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editName.trim() || !editQuantity || !editPurchasePrice) {
      alert('⚠️ Name, quantity, and purchase price are required!');
      return;
    }

    const updated = inventory.map(item => {
      if (item.id === editingItem.id) {
        return {
          ...item,
          name: editName.trim(),
          category: editCategory,
          quantity: parseFloat(editQuantity),
          unit: editUnit,
          purchasePrice: parseFloat(editPurchasePrice),
          purchaseDate: editPurchaseDate,
          description: editDescription.trim()
        };
      }
      return item;
    });

    saveInventory(updated);
    setEditingItem(null);
    alert('✅ Inventory details updated!');
  };

  const handleDeleteItem = (id) => {
    if (window.confirm('🗑️ Delete this inventory purchase record? This affects monthly P&L calculations.')) {
      saveInventory(inventory.filter(item => item.id !== id));
    }
  };

  // Calculations
  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                          (item.description && item.description.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    const matchesMonth = !filterMonth || (item.purchaseDate && item.purchaseDate.substring(0, 7) === filterMonth);
    return matchesSearch && matchesCategory && matchesMonth;
  });

  const totalExpense = filteredInventory.reduce((acc, item) => acc + item.purchasePrice, 0);
  const totalItemTypes = new Set(inventory.map(item => item.name.toLowerCase())).size;
  const storeRoomStockSum = inventory.length;

  return (
    <div className="page-body animate-fade-in" style={{ paddingBottom: '3rem' }}>
      {/* Stats Cards */}
      <div className="grid-cols-3" style={{ marginBottom: '2rem' }}>
        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
            📦
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '600' }}>Store Room Purchases</span>
            <div style={{ fontSize: '1.6rem', fontWeight: '800' }}>{storeRoomStockSum} Batches</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', border: '1px solid rgba(99, 102, 241, 0.4)' }}>
            🏷️
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '600' }}>Unique Stored Items</span>
            <div style={{ fontSize: '1.6rem', fontWeight: '800' }}>{totalItemTypes} Products</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', border: '1px solid rgba(245, 158, 11, 0.4)' }}>
            💰
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '600' }}>Filtered Cost Outflow</span>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--warning)' }}>Rs. {totalExpense.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div className="tables-manager-grid">
        {/* Left Form Panel */}
        <div>
          <div className="glass-card" style={{ padding: '1.5rem', position: 'sticky', top: '2rem' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem' }}>
              {editingItem ? '📝 Edit Inventory Record' : '➕ Log Purchased Stock'}
            </h3>

            {editingItem ? (
              <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Item / Ingredient Name</label>
                  <input type="text" className="form-input" value={editName} onChange={(e) => setEditName(e.target.value)} required />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-select" value={editCategory} onChange={(e) => setEditCategory(e.target.value)}>
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <div className="form-group" style={{ flex: 2 }}>
                    <label className="form-label">Quantity</label>
                    <input type="number" step="0.01" className="form-input" value={editQuantity} onChange={(e) => setEditQuantity(e.target.value)} required min="0.01" />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Unit</label>
                    <select className="form-select" value={editUnit} onChange={(e) => setEditUnit(e.target.value)}>
                      {units.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Purchase Cost (Rs.)</label>
                  <input type="number" step="0.01" className="form-input" value={editPurchasePrice} onChange={(e) => setEditPurchasePrice(e.target.value)} required min="0" />
                </div>

                <div className="form-group">
                  <label className="form-label">Purchase Date</label>
                  <input type="date" className="form-input" value={editPurchaseDate} onChange={(e) => setEditPurchaseDate(e.target.value)} required />
                </div>

                <div className="form-group">
                  <label className="form-label">Notes / Storage Room</label>
                  <textarea className="form-input" style={{ minHeight: '60px', resize: 'vertical' }} value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="e.g. Rack A, Shelf 2" />
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Changes</button>
                  <button type="button" onClick={() => setEditingItem(null)} className="btn btn-secondary">Cancel</button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleAddItem} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Item / Ingredient Name</label>
                  <input type="text" className="form-input" placeholder="e.g. Basmati Rice" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <div className="form-group" style={{ flex: 2 }}>
                    <label className="form-label">Quantity</label>
                    <input type="number" step="0.01" className="form-input" placeholder="e.g. 50" value={quantity} onChange={(e) => setQuantity(e.target.value)} required min="0.01" />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Unit</label>
                    <select className="form-select" value={unit} onChange={(e) => setUnit(e.target.value)}>
                      {units.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Purchase Cost (Rs.)</label>
                  <input type="number" step="0.01" className="form-input" placeholder="e.g. 8500" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} required min="0" />
                </div>

                <div className="form-group">
                  <label className="form-label">Purchase Date</label>
                  <input type="date" className="form-input" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} required />
                </div>

                <div className="form-group">
                  <label className="form-label">Notes / Storage Room</label>
                  <textarea className="form-input" style={{ minHeight: '60px', resize: 'vertical' }} placeholder="Storage location, supplier name, etc." value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>

                <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>➕ Log Purchase</button>
              </form>
            )}
          </div>
        </div>

        {/* Right Inventory Table & Filters Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Filters card */}
          <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="🔍 Search store room..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              style={{ flex: 2, minWidth: '180px', padding: '0.55rem 0.8rem', fontSize: '0.9rem' }} 
            />
            
            <select 
              className="form-select" 
              value={filterCategory} 
              onChange={(e) => setFilterCategory(e.target.value)} 
              style={{ flex: 1, minWidth: '140px', padding: '0.55rem 0.8rem', fontSize: '0.9rem' }}
            >
              <option value="all">All Categories</option>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Month:</span>
              <input 
                type="month" 
                className="form-input" 
                value={filterMonth} 
                onChange={(e) => setFilterMonth(e.target.value)} 
                style={{ width: '130px', padding: '0.55rem 0.5rem', fontSize: '0.9rem' }} 
              />
            </div>
            
            {(search || filterCategory !== 'all' || filterMonth) && (
              <button 
                onClick={() => { setSearch(''); setFilterCategory('all'); setFilterMonth(''); }} 
                className="btn btn-secondary" 
                style={{ padding: '0.5rem 0.85rem', fontSize: '0.85rem' }}
              >
                Clear
              </button>
            )}
          </div>

          {/* Table list */}
          <div className="table-container glass-card">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Quantity</th>
                  <th>Price Paid</th>
                  <th>Date Purchased</th>
                  <th>Notes</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      No inventory purchase logs found.
                    </td>
                  </tr>
                ) : (
                  filteredInventory.map(item => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{item.name}</td>
                      <td>
                        <span className="badge badge-info" style={{ textTransform: 'capitalize' }}>
                          {item.category.replace(' Stock', '').replace(' Supplies', '')}
                        </span>
                      </td>
                      <td style={{ fontWeight: '600' }}>
                        {item.quantity} {item.unit}
                      </td>
                      <td style={{ fontWeight: '700', color: 'var(--warning)' }}>
                        Rs. {item.purchasePrice.toLocaleString()}
                      </td>
                      <td>{item.purchaseDate}</td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.description}>
                        {item.description || '—'}
                      </td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button onClick={() => startEdit(item)} className="btn btn-secondary" style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem', marginRight: '0.4rem' }}>
                          ✏️ Edit
                        </button>
                        <button onClick={() => handleDeleteItem(item.id)} className="btn btn-danger" style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}>
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryManager;
