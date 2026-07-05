import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/Modal';

const UsersManager = () => {
  const { authFetch, user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '', role: 'waiter' });

  const loadUsers = async () => {
    try {
      const res = await authFetch('/api/users');
      setUsers(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const res = await authFetch('/api/users', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to create user');
      }
      setModalOpen(false);
      setFormData({ username: '', password: '', role: 'waiter' });
      loadUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return;
    try {
      const res = await authFetch(`/api/users/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Delete failed');
      }
      loadUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const getRoleBadge = (role) => {
    switch(role) {
      case 'admin': return <span className="badge badge-danger">👑 Admin</span>;
      case 'waiter': return <span className="badge badge-info">🪑 Waiter</span>;
      case 'kitchen': return <span className="badge badge-warning">🍳 Kitchen Staff</span>;
      default: return null;
    }
  };

  return (
    <div className="page-body animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h3>👥 Restaurant Staff & Role Management</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Create accounts and assign role permissions for POS terminal access.</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn btn-primary">
          ➕ Add Staff Account
        </button>
      </div>

      <div className="table-container glass-card">
        <table className="custom-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Role</th>
              <th>Created Date</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '3rem' }}>Loading users...</td></tr>
            ) : (
              users.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: '700', color: 'var(--text-muted)' }}>#{u.id}</td>
                  <td style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '1.05rem' }}>
                    {u.username}
                    {u.id === currentUser?.id && <span className="badge badge-success" style={{ marginLeft: '0.5rem', fontSize: '0.65rem' }}>You</span>}
                  </td>
                  <td>{getRoleBadge(u.role)}</td>
                  <td>{new Date(u.created_at).toLocaleDateString()}</td>
                  <td style={{ textAlign: 'right' }}>
                    {u.id !== currentUser?.id && (
                      <button onClick={() => handleDeleteUser(u.id)} className="btn btn-danger" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
                        🗑️ Remove Account
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      <Modal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        title="Create New Staff User"
        footer={
          <>
            <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary">Cancel</button>
            <button type="button" onClick={handleCreateUser} className="btn btn-primary">Create User</button>
          </>
        }
      >
        <form onSubmit={handleCreateUser}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. ali_waiter" 
              value={formData.username} 
              onChange={(e) => setFormData({...formData, username: e.target.value})} 
              required 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="form-input" 
              placeholder="Enter secure password..." 
              value={formData.password} 
              onChange={(e) => setFormData({...formData, password: e.target.value})} 
              required 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Assign Role Permission</label>
            <select className="form-select" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})}>
              <option value="waiter">🪑 Waiter (Table Orders & Status)</option>
              <option value="kitchen">🍳 Kitchen Staff (KDS Display Only)</option>
              <option value="admin">👑 Admin (Full Terminal & Analytics Access)</option>
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UsersManager;
