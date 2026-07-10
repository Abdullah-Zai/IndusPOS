import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const TablesManager = ({ readOnly = false }) => {
  const { user } = useAuth();
  const canEdit = !readOnly && user?.role !== 'cashier';
  const [tables, setTables] = useState([]);
  const [newTableName, setNewTableName] = useState('');
  const [newCapacity, setNewCapacity] = useState(4);
  const [newArea, setNewArea] = useState('Family Hall');
  
  // Edit State
  const [editingTable, setEditingTable] = useState(null);
  const [editName, setEditName] = useState('');
  const [editCapacity, setEditCapacity] = useState(4);
  const [editArea, setEditArea] = useState('Family Hall');

  // Filter State
  const [filterArea, setFilterArea] = useState('all');

  const areas = ['Family Hall', 'Rooftop', 'Mens Section', 'Main Hall'];

  // Initialize tables list from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('indus_tables');
    if (saved) {
      // Ensure all loaded tables have an area property and short codes for names if they have legacy "Table X" names
      const parsed = JSON.parse(saved).map((t, idx) => {
        let area = t.area;
        if (!area) {
          area = 'Main Hall';
          if (idx < 3) area = 'Family Hall';
          else if (idx < 6) area = 'Rooftop';
          else if (idx < 8) area = 'Mens Section';
        }
        
        let name = t.name;
        if (name.startsWith('Table ')) {
          const num = parseInt(name.replace('Table ', '')) || (idx + 1);
          if (area === 'Family Hall') {
            name = `FH ${num <= 3 ? num : idx + 1}`;
          } else if (area === 'Rooftop') {
            name = `RF ${num > 3 && num <= 6 ? num - 3 : idx + 1}`;
          } else if (area === 'Mens Section') {
            name = `MS ${num > 6 && num <= 8 ? num - 6 : idx + 1}`;
          } else {
            name = `G ${num > 8 ? num - 8 : idx + 1}`;
          }
        }
        return { ...t, name, area };
      });
      setTables(parsed);
      localStorage.setItem('indus_tables', JSON.stringify(parsed));
    } else {
      // Default Tables 1 to 10 with short codes
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
        
        defaults.push({
          id: i,
          name: name,
          capacity: 4,
          area: area,
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
    const trimmedName = newTableName.trim();
    if (!trimmedName) return alert('⚠️ Table name is required!');
    if (trimmedName.length < 2) return alert('⚠️ Table name must be at least 2 characters!');

    const cap = parseInt(newCapacity);
    if (isNaN(cap) || cap < 1 || cap > 50) return alert('⚠️ Capacity must be between 1 and 50 guests!');

    const exists = tables.some(t => t.name.toLowerCase() === trimmedName.toLowerCase());
    if (exists) {
      alert('⚠️ A table with this name already exists!');
      return;
    }

    const newTable = {
      id: Date.now(),
      name: trimmedName,
      capacity: cap,
      area: newArea,
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
    setEditArea(table.area || 'Family Hall');
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    const trimmedName = editName.trim();
    if (!trimmedName) return alert('⚠️ Table name is required!');
    if (trimmedName.length < 2) return alert('⚠️ Table name must be at least 2 characters!');

    const cap = parseInt(editCapacity);
    if (isNaN(cap) || cap < 1 || cap > 50) return alert('⚠️ Capacity must be between 1 and 50 guests!');

    const exists = tables.some(t => t.id !== editingTable.id && t.name.toLowerCase() === trimmedName.toLowerCase());
    if (exists) {
      alert('⚠️ A table with this name already exists!');
      return;
    }

    const updated = tables.map(t => t.id === editingTable.id 
      ? { ...t, name: trimmedName, capacity: cap, area: editArea } 
      : t
    );
    saveTables(updated);
    setEditingTable(null);
  };

  // Stats
  const totalTables = tables.length;
  const activeTables = tables.filter(t => t.isActive).length;
  const occupiedTables = tables.filter(t => t.isActive && t.status === 'occupied').length;
  const totalCapacity = tables.filter(t => t.isActive).reduce((acc, t) => acc + t.capacity, 0);

  // Filtered list
  const filteredTables = tables.filter(t => filterArea === 'all' || t.area === filterArea);

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

      <div className="tables-manager-grid" style={{ gridTemplateColumns: !canEdit ? '1fr' : undefined }}>
        {/* Left: Add / Edit Form */}
        {!canEdit && (
          <div style={{ background: 'var(--warning-bg)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: 'var(--radius-md)', padding: '0.65rem 1rem', marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', gridColumn: '1 / -1' }}>
            👁️ <strong>View Only</strong> — Cashiers can view table status but cannot add, edit, or delete tables.
          </div>
        )}
        {canEdit && (
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
                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>Seating Area</label>
                    <select
                      className="form-select"
                      value={editArea}
                      onChange={(e) => setEditArea(e.target.value)}
                    >
                      {areas.map(area => (
                        <option key={area} value={area}>{area}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>Seating Capacity (Guests)</label>
                    <input
                      type="number"
                      value={editCapacity}
                      onChange={(e) => setEditCapacity(e.target.value)}
                      min="1"
                      max="50"
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
                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>Seating Area</label>
                    <select
                      className="form-select"
                      value={newArea}
                      onChange={(e) => setNewArea(e.target.value)}
                    >
                      {areas.map(area => (
                        <option key={area} value={area}>{area}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>Seating Capacity</label>
                    <input
                      type="number"
                      value={newCapacity}
                      onChange={(e) => setNewCapacity(e.target.value)}
                      min="1"
                      max="50"
                      className="form-control"
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>➕ Add Table</button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Right: Tables Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem' }}>Dining Layout Control</h3>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Changes sync instantly to the waiter POS terminal</span>
            </div>
            {/* Area Filter Tabs */}
            <div style={{ display: 'flex', gap: '0.4rem', background: 'rgba(255,255,255,0.03)', padding: '0.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <button 
                onClick={() => setFilterArea('all')} 
                className={`btn ${filterArea === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', minWidth: 'unset' }}
              >
                All
              </button>
              {areas.map(area => (
                <button 
                  key={area}
                  onClick={() => setFilterArea(area)} 
                  className={`btn ${filterArea === area ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', minWidth: 'unset', whiteSpace: 'nowrap' }}
                >
                  {area.replace(' Section', '').replace(' Hall', '')}
                </button>
              ))}
            </div>
          </div>

          <div className="grid-cols-3">
            {filteredTables.length === 0 ? (
              <div className="glass-card" style={{ gridColumn: 'span 3', padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No tables registered in this area.
              </div>
            ) : (
              filteredTables.map((table, index) => {
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div>
                        <h4 style={{ fontSize: '1.1rem', margin: 0 }}>{table.name}</h4>
                        <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 'bold' }}>📍 {table.area}</span>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>👤 Up to {table.capacity} guests</div>
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
                          disabled={user?.role === 'cashier'}
                        >
                          {table.isActive ? 'Active' : 'Disabled'}
                        </button>
                      </div>
                      {user?.role !== 'cashier' && (
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
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TablesManager;
