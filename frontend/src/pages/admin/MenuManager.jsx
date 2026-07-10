import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/Modal';

const MenuManager = ({ readOnly = false }) => {
  const { authFetch, user } = useAuth();
  const canEdit = !readOnly && user?.role !== 'cashier';
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState('all');

  // Modal states
  const [itemModal, setItemModal] = useState(false);
  const [catModal, setCatModal] = useState(false);
  const [editItem, setEditItem] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    variant: '',
    price: '',
    image_url: '',
    is_available: true
  });
  const [validationError, setValidationError] = useState('');
  const [catName, setCatName] = useState('');
  const [uploading, setUploading] = useState(false);

  const loadMenu = async () => {
    try {
      const [catRes, itemRes] = await Promise.all([
        authFetch('/api/menu/categories'),
        authFetch('/api/menu/items')
      ]);
      const cats = await catRes.json();
      const its = await itemRes.json();
      setCategories(cats);
      setItems(its);
      if (cats.length > 0 && !formData.category_id) {
        setFormData(prev => ({ ...prev, category_id: cats[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenu();
  }, []);

  const openAddItem = () => {
    setEditItem(null);
    setValidationError('');
    setFormData({
      name: '',
      category_id: categories[0]?.id || '',
      variant: '',
      price: '',
      image_url: '',
      is_available: true
    });
    setItemModal(true);
  };

  const openEditItem = (item) => {
    setEditItem(item);
    setValidationError('');
    setFormData({
      name: item.name,
      category_id: item.category_id,
      variant: item.variant || '',
      price: item.price,
      image_url: item.image_url || '',
      is_available: item.is_available
    });
    setItemModal(true);
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    setValidationError('');
    
    // Validation
    if (!formData.name.trim()) {
      setValidationError('⚠️ Item name is required!');
      return;
    }
    if (formData.name.trim().length < 2) {
      setValidationError('⚠️ Item name must be at least 2 characters!');
      return;
    }
    if (!formData.category_id) {
      setValidationError('⚠️ Please select a category!');
      return;
    }
    if (!formData.price || Number(formData.price) <= 0) {
      setValidationError('⚠️ Price must be greater than Rs. 0!');
      return;
    }
    if (Number(formData.price) > 99999) {
      setValidationError('⚠️ Price seems unrealistically high (max Rs. 99,999)!');
      return;
    }

    try {
      const url = editItem ? `/api/menu/items/${editItem.id}` : '/api/menu/items';
      const method = editItem ? 'PUT' : 'POST';
      
      const payload = { ...formData, price: Number(formData.price), category_id: Number(formData.category_id) };
      if (!payload.variant) payload.variant = null;

      const res = await authFetch(url, {
        method,
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to save item');
      setItemModal(false);
      loadMenu();
    } catch (err) {
      setValidationError(`Error: ${err.message}`);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const body = new FormData();
    body.append('file', file);

    try {
      const res = await authFetch('/api/menu/upload-image', {
        method: 'POST',
        body
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Failed to upload image');
      }
      const data = await res.json();
      setFormData(prev => ({ ...prev, image_url: data.image_url }));
    } catch (err) {
      alert(`Upload error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteItem = async (id) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;
    try {
      await authFetch(`/api/menu/items/${id}`, { method: 'DELETE' });
      loadMenu();
    } catch (err) {
      alert('Failed to delete item');
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!catName.trim()) return;
    try {
      const res = await authFetch('/api/menu/categories', {
        method: 'POST',
        body: JSON.stringify({ name: catName, sort_order: categories.length + 1 })
      });
      if (!res.ok) throw new Error('Failed to create category');
      setCatName('');
      setCatModal(false);
      loadMenu();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!confirm('Delete this category and all its menu items?')) return;
    try {
      await authFetch(`/api/menu/categories/${id}`, { method: 'DELETE' });
      loadMenu();
    } catch (err) {
      alert('Failed to delete category');
    }
  };

  const filteredItems = selectedCat === 'all' ? items : items.filter(it => it.category_id === selectedCat);

  return (
    <div className="page-body animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h3>🍽️ Pakistani Cuisine Menu Manager</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Manage food items, categories, variants, and pricing.</p>
        </div>
        {canEdit && (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={() => setCatModal(true)} className="btn btn-secondary">
              📁 Manage Categories
            </button>
            <button onClick={openAddItem} className="btn btn-primary">
              ➕ Add Menu Item
            </button>
          </div>
        )}
      </div>

      {!canEdit && (
        <div style={{ background: 'var(--warning-bg)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: 'var(--radius-md)', padding: '0.65rem 1rem', marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          👁️ <strong>View Only</strong> — Cashiers can browse the menu but cannot add, edit, or delete items.
        </div>
      )}

      {/* Category Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', marginBottom: '1.5rem', paddingBottom: '0.5rem' }}>
        <button 
          onClick={() => setSelectedCat('all')}
          className={`btn ${selectedCat === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
        >
          All Items ({items.length})
        </button>
        {categories.map(cat => (
          <button 
            key={cat.id} 
            onClick={() => setSelectedCat(cat.id)}
            className={`btn ${selectedCat === cat.id ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
          >
            {cat.name} ({items.filter(i => i.category_id === cat.id).length})
          </button>
        ))}
      </div>

      {/* Items Table */}
      <div className="table-container glass-card">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Category</th>
              <th>Variant</th>
              <th>Price</th>
              <th>Status</th>
              {canEdit && <th style={{ textAlign: 'right' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '3rem' }}>Loading menu...</td></tr>
            ) : filteredItems.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No items found in this category.</td></tr>
            ) : (
              filteredItems.map(item => (
                <tr key={item.id}>
                  <td style={{ width: '70px' }}>
                    <img src={item.image_url} alt="" style={{ width: '50px', height: '40px', borderRadius: '6px', objectFit: 'cover' }} onError={(e) => { e.target.src = 'https://placehold.co/300x200?text=Food'; }} />
                  </td>
                  <td style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{item.name}</td>
                  <td><span className="badge badge-info">{item.category_name}</span></td>
                  <td>{item.variant ? <span className="badge badge-warning">{item.variant}</span> : <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                  <td style={{ fontWeight: '700', color: '#10b981' }}>Rs. {Number(item.price).toLocaleString()}</td>
                  <td>
                    {item.is_available ? (
                      <span className="badge badge-success">Available</span>
                    ) : (
                      <span className="badge badge-danger">Out of Stock</span>
                    )}
                  </td>
                  {canEdit && (
                    <td style={{ textAlign: 'right' }}>
                      <button onClick={() => openEditItem(item)} className="btn btn-secondary" style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem', marginRight: '0.5rem' }}>✏️ Edit</button>
                      <button onClick={() => handleDeleteItem(item.id)} className="btn btn-danger" style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem' }}>🗑️ Delete</button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Item Modal */}
      <Modal 
        isOpen={itemModal} 
        onClose={() => setItemModal(false)} 
        title={editItem ? 'Edit Menu Item' : 'Add New Menu Item'}
        footer={
          <>
            <button type="button" onClick={() => setItemModal(false)} className="btn btn-secondary">Cancel</button>
            <button type="button" onClick={handleSaveItem} className="btn btn-primary">Save Item</button>
          </>
        }
      >
        <form onSubmit={handleSaveItem}>
          <div className="form-group">
            <label className="form-label">Item Name</label>
            <input type="text" className="form-input" placeholder="e.g. Chicken Karahi" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
          </div>

          <div className="grid-cols-2">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={formData.category_id} onChange={(e) => setFormData({...formData, category_id: e.target.value})} required>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Variant / Portion Size (Optional)</label>
              <input type="text" className="form-input" placeholder="e.g. Half, Full, 4 pcs" value={formData.variant} onChange={(e) => setFormData({...formData, variant: e.target.value})} />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.35rem' }}>
                {['Full', 'Half', 'Single', 'Double', 'Small', 'Medium', 'Large', 'Regular'].map(sz => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setFormData({ ...formData, variant: sz })}
                    style={{
                      padding: '0.15rem 0.35rem',
                      fontSize: '0.7rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      background: formData.variant === sz ? 'var(--accent-gradient)' : 'var(--bg-hover)',
                      color: formData.variant === sz ? '#fff' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.1s ease'
                    }}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid-cols-2">
            <div className="form-group">
              <label className="form-label">Price (Rs.)</label>
              <input type="number" className="form-input" placeholder="e.g. 1200" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} required min="1" step="0.01" />
            </div>
            <div className="form-group">
              <label className="form-label">Availability</label>
              <select className="form-select" value={formData.is_available ? 'true' : 'false'} onChange={(e) => setFormData({...formData, is_available: e.target.value === 'true'})}>
                <option value="true">Available in Kitchen</option>
                <option value="false">Out of Stock</option>
              </select>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '0.5rem' }}>
            <label className="form-label">Dish Image</label>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.5rem' }}>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageUpload} 
                className="form-input" 
                style={{ padding: '0.35rem 0.5rem' }} 
              />
              {uploading && <span style={{ fontSize: '0.85rem', color: '#10b981' }}>Uploading...</span>}
            </div>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Or paste an image URL directly: https://..." 
              value={formData.image_url} 
              onChange={(e) => setFormData({...formData, image_url: e.target.value})} 
            />
          </div>

          {validationError && (
            <div style={{ 
              background: 'rgba(239,68,68,0.1)', 
              border: '1px solid rgba(239,68,68,0.3)', 
              borderRadius: 'var(--radius-sm)', 
              padding: '0.6rem 0.75rem', 
              color: 'var(--danger)', 
              fontSize: '0.85rem', 
              fontWeight: '600',
              marginTop: '1rem' 
            }}>
              {validationError}
            </div>
          )}
        </form>
      </Modal>

      {/* Category Modal */}
      <Modal 
        isOpen={catModal} 
        onClose={() => setCatModal(false)} 
        title="Manage Categories"
        footer={<button onClick={() => setCatModal(false)} className="btn btn-secondary">Close</button>}
      >
        <form onSubmit={handleCreateCategory} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <input type="text" className="form-input" placeholder="New category name..." value={catName} onChange={(e) => setCatName(e.target.value)} required />
          <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>Add Category</button>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
          {categories.map(c => (
            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 1rem', background: 'var(--bg-table-row)', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontWeight: '600' }}>{c.name}</span>
              <button onClick={() => handleDeleteCategory(c.id)} className="btn btn-danger" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>Delete</button>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};

export default MenuManager;
