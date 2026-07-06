import React, { useState, useEffect } from 'react';

const TablesManager = () => {
  const [tables, setTables] = useState([]);
  const [newTableName, setNewTableName] = useState('');
  const [newCapacity, setNewCapacity] = useState(4);
  const [editingTable, setEditingTable] = useState(null);
  const [editName, setEditName] = useState('');
  const [editCapacity, setEditCapacity] = useState(4);

  // Initialize tables list from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('indus_tables');
    if (saved) {
      setTables(JSON.parse(saved));
    } else {
      // Default Tables 1 to 10
      const defaults = [];
      for (let i = 1; i <= 10; i++) {
        defaults.push({
          id: i,
          name: `Table ${i}`,
          capacity: 4,
          status: 'available', // available, occupied, reserved
          isActive: true
        });
      }
      localStorage.setItem('indus_tables', JSON.stringify(defaults));
      setTables(defaults);
    }
  }, []);

  const saveTables = (updated) => {
    localStorage.setItem('indus_tables', JSON.stringify(updated));
    setTables(updated);
  };

  const handleAddTable = (e) => {
    e.preventDefault();
    if (!newTableName.trim()) return;
    const exists = tables.some(t => t.name.toLowerCase() === newTableName.trim().toLowerCase());
    if (exists) {
      alert('Table name already exists!');
      return;
    }

    const newTable = {
      id: Date.now(),
      name: newTableName.trim(),
      capacity: parseInt(newCapacity) || 4,
      status: 'available',
      isActive: true
    };

    saveTables([...tables, newTable]);
    setNewTableName('');
    setNewCapacity(4);
  };

  const handleToggleActive = (id) => {
    const updated = tables.map(t => t.id === id ? { ...t, isActive: !t.isActive } : t);
    saveTables(updated);
  };

  const handleUpdateStatus = (id, status) => {
    const updated = tables.map(t => t.id === id ? { ...t, status } : t);
    saveTables(updated);
  };

  const handleDeleteTable = (id) => {
    if (window.confirm('Are you sure you want to delete this table?')) {
      const updated = tables.filter(t => t.id !== id);
      saveTables(updated);
    }
  };

  const startEdit = (table) => {
    setEditingTable(table);
    setEditName(table.name);
    setEditCapacity(table.capacity);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editName.trim()) return;

    const exists = tables.some(t => t.id !== editingTable.id && t.name.toLowerCase() === editName.trim().toLowerCase());
    if (exists) {
      alert('Table name already exists!');
      return;
    }

    const updated = tables.map(t => t.id === editingTable.id ? { ...t, name: editName.trim(), capacity: parseInt(editCapacity) || 4 } : t);
    saveTables(updated);
    setEditingTable(null);
  };

  // Stats
  const totalTables = tables.length;
  const activeTables = tables.filter(t => t.isActive).length;
  const occupiedTables = tables.filter(t => t.isActive && t.status === 'occupied').length;
  const totalCapacity = tables.filter(t => t.isActive).reduce((acc, t) => acc + t.capacity, 0);

  return (
    <div className="page-body animate-fade-in" style={{ paddingBottom: '3rem' }}>
      {/* Stats Summary */}
      <div className="grid-cols-4" style={{ marginBottom: '2rem' }}>
        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dining Capacity</span>
          <span style={{ fontSize: '1.75rem', fontWeight: '700' }}>👤 {totalCapacity} Guests</span>
        </div>
        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Tables</span>
          <span style={{ fontSize: '1.75rem', fontWeight: '700' }}>🪑 {totalTables} Tables</span>
        </div>
        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Tables</span>
          <span style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--success)' }}>🟢 {activeTables} Active</span>
        </div>
        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Occupied Now</span>
          <span style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--warning)' }}>🔴 {occupiedTables} / {activeTables}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '1.5rem' }}>
        {/* Left: Add / Edit Form */}
        <div>
          <div className="glass-card" style={{ padding: '1.5rem', position: 'sticky', top: '2rem' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem' }}>
              {editingTable ? '📝 Edit Table Details' : '➕ Add Dining Table'}
            </h3>
            
            {editingTable ? (
              <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>Table Name/No.</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="form-control"
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>Seating Capacity (Guests)</label>
                  <input
                    type="number"
                    value={editCapacity}
                    onChange={(e) => setEditCapacity(e.target.value)}
                    min="1"
                    max="30"
                    className="form-control"
                    required
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Changes</button>
                  <button type="button" onClick={() => setEditingTable(null)} className="btn btn-secondary">Cancel</button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleAddTable} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>Table Name/No. (e.g. Table 11)</label>
                  <input
                    type="text"
                    value={newTableName}
                    onChange={(e) => setNewTableName(e.target.value)}
                    placeholder="Enter table designation"
                    className="form-control"
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>Seating Capacity</label>
                  <input
                    type="number"
                    value={newCapacity}
                    onChange={(e) => setNewCapacity(e.target.value)}
                    min="1"
                    max="30"
                    className="form-control"
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>➕ Add Table</button>
              </form>
            )}
          </div>
        </div>

        {/* Right: Tables Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.2rem' }}>Dining Layout Control</h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Changes sync instantly to the waiter POS terminal</span>
          </div>

          <div className="grid-cols-3">
            {tables.map((table, index) => {
              const staggerClass = `stagger-${(index % 5) + 1}`;
              return (
                <div 
                  key={table.id}
                  className={`glass-card animate-fade-in ${staggerClass}`}
                  style={{ 
                    padding: '1.25rem', 
                    opacity: table.isActive ? 1 : 0.6,
                    border: table.isActive ? '1px solid var(--border-color)' : '1px dashed var(--text-muted)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <h4 style={{ fontSize: '1.1rem', margin: 0 }}>{table.name}</h4>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>👤 Up to {table.capacity} guests</span>
                    </div>
                    <span 
                      className={`badge ${
                        table.status === 'occupied' 
                          ? 'badge-danger' 
                          : table.status === 'reserved' 
                          ? 'badge-warning' 
                          : 'badge-success'
                      }`}
                      style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem' }}
                    >
                      {table.status === 'occupied' ? '🔴 Occupied' : table.status === 'reserved' ? '🟡 Reserved' : '🟢 Available'}
                    </span>
                  </div>

                  {table.isActive && (
                    <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.75rem' }}>
                      <button 
                        onClick={() => handleUpdateStatus(table.id, 'available')}
                        className="btn btn-secondary"
                        style={{ flex: 1, padding: '0.35rem', fontSize: '0.7rem', background: table.status === 'available' ? 'var(--success-bg)' : 'transparent', color: table.status === 'available' ? 'var(--success)' : 'inherit', borderColor: table.status === 'available' ? 'var(--success)' : 'var(--border-color)' }}
                      >
                        Free
                      </button>
                      <button 
                        onClick={() => handleUpdateStatus(table.id, 'occupied')}
                        className="btn btn-secondary"
                        style={{ flex: 1, padding: '0.35rem', fontSize: '0.7rem', background: table.status === 'occupied' ? 'var(--danger-bg)' : 'transparent', color: table.status === 'occupied' ? 'var(--danger)' : 'inherit', borderColor: table.status === 'occupied' ? 'var(--danger)' : 'var(--border-color)' }}
                      >
                        Occupy
                      </button>
                      <button 
                        onClick={() => handleUpdateStatus(table.id, 'reserved')}
                        className="btn btn-secondary"
                        style={{ flex: 1, padding: '0.35rem', fontSize: '0.7rem', background: table.status === 'reserved' ? 'var(--warning-bg)' : 'transparent', color: table.status === 'reserved' ? 'var(--warning)' : 'inherit', borderColor: table.status === 'reserved' ? 'var(--warning)' : 'var(--border-color)' }}
                      >
                        Reserve
                      </button>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Status:</span>
                      <button 
                        onClick={() => handleToggleActive(table.id)}
                        className={`btn ${table.isActive ? 'btn-success' : 'btn-secondary'}`}
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', height: 'auto', background: table.isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: table.isActive ? 'var(--success)' : 'var(--danger)', border: 'none' }}
                      >
                        {table.isActive ? 'Active' : 'Disabled'}
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button 
                        onClick={() => startEdit(table)}
                        className="btn btn-secondary" 
                        style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem', minWidth: 'unset' }}
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => handleDeleteTable(table.id)}
                        className="btn btn-secondary" 
                        style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem', minWidth: 'unset', color: 'var(--danger)' }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TablesManager;
