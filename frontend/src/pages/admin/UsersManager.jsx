import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/Modal';

const ROLES = [
  { value: 'admin',   label: '👑 Admin',         desc: 'Full system access — parent of all users' },
  { value: 'cashier', label: '💳 Cashier',        desc: 'Billing, POS, reports — read-only restrictions' },
  { value: 'waiter',  label: '🪑 Waiter',         desc: 'Table orders & status only' },
  { value: 'kitchen', label: '🍳 Kitchen Staff',  desc: 'KDS display only' },
];

const getRoleBadge = (role) => {
  const map = {
    admin:   <span className="badge badge-danger">👑 Admin</span>,
    cashier: <span className="badge badge-success">💳 Cashier</span>,
    waiter:  <span className="badge badge-info">🪑 Waiter</span>,
    kitchen: <span className="badge badge-warning">🍳 Kitchen</span>,
  };
  return map[role] || <span className="badge">{role}</span>;
};

const ROLE_PERMISSIONS = {
  admin: [
    '✅ Full dashboard & live analytics',
    '✅ Menu create / edit / delete',
    '✅ Table create / edit / disable',
    '✅ Inventory add / edit / delete',
    '✅ Billing & invoice settlement',
    '✅ Financial Hub + Payroll & Costs',
    '✅ User create / edit / delete',
    '✅ System Settings',
    '✅ POS terminal (all order types)',
  ],
  cashier: [
    '✅ Cashier Dashboard & shift register',
    '✅ Takeaway POS terminal',
    '✅ Settle & print bills (all orders)',
    '✅ View menu list',
    '✅ View tables status',
    '✅ Add inventory stock (no edit/delete)',
    '✅ Sales & Ledger reports',
    '🚫 Cannot edit / delete menu items',
    '🚫 Cannot modify tables',
    '🚫 Cannot view Payroll / Operating Costs',
    '🚫 Cannot manage users or settings',
  ],
  waiter: [
    '✅ Tables status overview',
    '✅ Take new dine-in orders',
    '✅ View own order status',
    '🚫 No billing access',
    '🚫 No financial access',
    '🚫 No admin panels',
  ],
  kitchen: [
    '✅ Kitchen Display System (KDS)',
    '✅ Mark orders In-Progress / Ready',
    '🚫 No billing, menu, financial access',
    '🚫 No admin panels',
  ],
};

const UsersManager = () => {
  const { authFetch, user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null); // { type: 'success'|'error', msg: string }

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ username: '', password: '', role: 'waiter' });

  // Edit modal
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({ username: '', role: '' });

  // ── NEW: Quick Change-Password modal ──────────────────────────────────
  const [pwdTarget, setPwdTarget] = useState(null);   // user object
  const [newPwd, setNewPwd]       = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError]   = useState('');
  // ──────────────────────────────────────────────────────────────────────

  // Permission info modal
  const [infoRole, setInfoRole] = useState(null);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const loadUsers = async () => {
    try {
      const res = await authFetch('/api/users');
      if (!res.ok) throw new Error('Failed to load users');
      setUsers(await res.json());
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  // ── Create ──
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!createForm.username.trim() || !createForm.password.trim()) {
      return showToast('error', '⚠️ Username and password are required.');
    }
    try {
      const res = await authFetch('/api/users', {
        method: 'POST',
        body: JSON.stringify(createForm)
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to create user');
      }
      setCreateOpen(false);
      setCreateForm({ username: '', password: '', role: 'waiter' });
      showToast('success', '✅ Staff account created successfully!');
      loadUsers();
    } catch (err) {
      showToast('error', `❌ ${err.message}`);
    }
  };

  // ── Open Edit Modal ──
  const openEdit = (u) => {
    setEditTarget(u);
    setEditForm({ username: u.username, role: u.role });
  };

  // ── Open Change-Password Modal ──
  const openChangePwd = (u) => {
    setPwdTarget(u);
    setNewPwd('');
    setPwdError('');
  };

  // ── Save Edit ──
  const handleSaveEdit = async () => {
    if (!editForm.username.trim()) return showToast('error', '⚠️ Username cannot be empty.');
    const payload = {
      username: editForm.username.trim(),
      role: editForm.role,
    };
    try {
      const res = await authFetch(`/api/users/${editTarget.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Update failed');
      }
      setEditTarget(null);
      showToast('success', '✅ User updated successfully!');
      loadUsers();
    } catch (err) {
      showToast('error', `❌ ${err.message}`);
    }
  };

  // ── Change Password (one-button direct action) ──
  const handleChangePassword = async () => {
    setPwdError('');
    if (!newPwd.trim()) return setPwdError('Password cannot be empty.');
    if (newPwd.length < 4) return setPwdError('Password must be at least 4 characters.');
    setPwdLoading(true);
    try {
      const res = await authFetch(`/api/users/${pwdTarget.id}`, {
        method: 'PUT',
        body: JSON.stringify({ password: newPwd.trim() })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to change password');
      }
      setPwdTarget(null);
      showToast('success', `✅ Password for "${pwdTarget.username}" changed successfully!`);
    } catch (err) {
      setPwdError(err.message);
    } finally {
      setPwdLoading(false);
    }
  };

  // ── Delete ──
  const handleDeleteUser = async (id, username) => {
    if (!window.confirm(`🗑️ Remove staff account "${username}"? This cannot be undone.`)) return;
    try {
      const res = await authFetch(`/api/users/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Delete failed');
      }
      showToast('success', `🗑️ Account "${username}" removed.`);
      loadUsers();
    } catch (err) {
      showToast('error', `❌ ${err.message}`);
    }
  };

  return (
    <div className="page-body animate-fade-in">

      {/* ── Toast Notification ── */}
      {toast && (
        <div style={{
          position: 'fixed', top: '80px', right: '24px', zIndex: 9999,
          background: toast.type === 'success' ? 'var(--success)' : 'var(--danger)',
          color: '#fff', padding: '0.75rem 1.25rem',
          borderRadius: 'var(--radius-md)', fontWeight: '600',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          animation: 'animate-fade-in 0.3s ease',
          maxWidth: '360px', fontSize: '0.9rem'
        }}>
          {toast.msg}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3>👥 Staff Users &amp; Role Hierarchy</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Admin is the parent of all users. Create, edit roles, and reset passwords for all staff accounts.
          </p>
        </div>
        <button onClick={() => setCreateOpen(true)} className="btn btn-primary">
          ➕ Add Staff Account
        </button>
      </div>

      {/* ── Role Hierarchy Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '2rem' }}>
        {ROLES.map(r => (
          <div
            key={r.value}
            className="glass-card"
            style={{ padding: '1rem', cursor: 'pointer', border: '1px solid var(--border-color)', transition: 'border-color 0.2s' }}
            onClick={() => setInfoRole(r.value)}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              {getRoleBadge(r.value)}
              <span style={{ fontSize: '0.7rem', color: 'var(--accent-primary)', fontWeight: '600' }}>
                {users.filter(u => u.role === r.value).length} user{users.filter(u => u.role === r.value).length !== 1 ? 's' : ''}
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{r.desc}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--accent-primary)', marginTop: '0.5rem' }}>Click to view permissions →</div>
          </div>
        ))}
      </div>

      {/* ── Users Table ── */}
      <div className="table-container glass-card">
        <table className="custom-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Username</th>
              <th>Role</th>
              <th>Joined</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading staff accounts...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No users found.</td></tr>
            ) : (
              users.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: '700', color: 'var(--text-muted)', fontFamily: 'monospace' }}>#{u.id}</td>
                  <td>
                    <div style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '1rem' }}>
                      {u.username}
                      {u.id === currentUser?.id && (
                        <span className="badge badge-success" style={{ marginLeft: '0.5rem', fontSize: '0.65rem' }}>You</span>
                      )}
                    </div>
                  </td>
                  <td>{getRoleBadge(u.role)}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    {new Date(u.created_at).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => openEdit(u)}
                        className="btn btn-secondary"
                        style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
                        title="Edit username or role"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => openChangePwd(u)}
                        className="btn btn-primary"
                        style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem', background: 'var(--accent-gradient)' }}
                        title="Change password directly"
                      >
                        🔑 Password
                      </button>
                      {u.id !== currentUser?.id && (
                        <button
                          onClick={() => handleDeleteUser(u.id, u.username)}
                          className="btn btn-danger"
                          style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
                        >
                          🗑️ Remove
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Create User Modal ── */}
      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="➕ Create New Staff Account"
        footer={
          <>
            <button onClick={() => setCreateOpen(false)} className="btn btn-secondary">Cancel</button>
            <button onClick={handleCreateUser} className="btn btn-primary">Create Account</button>
          </>
        }
      >
        <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. ali_waiter"
              value={createForm.username}
              onChange={e => setCreateForm({ ...createForm, username: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="Enter secure password (min 4 chars)"
              value={createForm.password}
              onChange={e => setCreateForm({ ...createForm, password: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Assign Role</label>
            <select
              className="form-select"
              value={createForm.role}
              onChange={e => setCreateForm({ ...createForm, role: e.target.value })}
            >
              {ROLES.map(r => (
                <option key={r.value} value={r.value}>{r.label} — {r.desc}</option>
              ))}
            </select>
          </div>
          {/* Permission preview */}
          <div style={{ background: 'var(--bg-table-row)', borderRadius: 'var(--radius-md)', padding: '0.75rem', fontSize: '0.8rem' }}>
            <div style={{ fontWeight: '700', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>Permissions Preview:</div>
            {(ROLE_PERMISSIONS[createForm.role] || []).slice(0, 5).map((p, i) => (
              <div key={i} style={{ color: p.startsWith('🚫') ? 'var(--danger)' : 'var(--success)', padding: '1px 0', fontSize: '0.78rem' }}>{p}</div>
            ))}
            {(ROLE_PERMISSIONS[createForm.role] || []).length > 5 && (
              <div style={{ color: 'var(--text-muted)', marginTop: '2px', fontSize: '0.75rem' }}>
                +{(ROLE_PERMISSIONS[createForm.role] || []).length - 5} more...
              </div>
            )}
          </div>
        </form>
      </Modal>

      {/* ── Edit User Modal (role + username only) ── */}
      <Modal
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        title={`✏️ Edit Staff: ${editTarget?.username}`}
        footer={
          <>
            <button onClick={() => setEditTarget(null)} className="btn btn-secondary">Cancel</button>
            <button onClick={handleSaveEdit} className="btn btn-primary">Save Changes</button>
          </>
        }
      >
        {editTarget && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                type="text"
                className="form-input"
                value={editForm.username}
                onChange={e => setEditForm({ ...editForm, username: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Role</label>
              {editTarget.id === currentUser?.id ? (
                <div style={{ padding: '0.6rem', background: 'var(--bg-table-row)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  ⚠️ You cannot change your own role.
                </div>
              ) : (
                <select
                  className="form-select"
                  value={editForm.role}
                  onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                >
                  {ROLES.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Permission Preview for selected role */}
            <div style={{ background: 'var(--bg-table-row)', borderRadius: 'var(--radius-md)', padding: '0.75rem', fontSize: '0.8rem' }}>
              <div style={{ fontWeight: '700', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                Access for <strong>{editForm.role}</strong>:
              </div>
              {(ROLE_PERMISSIONS[editForm.role] || []).map((p, i) => (
                <div key={i} style={{ color: p.startsWith('🚫') ? 'var(--danger)' : 'var(--success)', padding: '1px 0' }}>{p}</div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* ── 🔑 Quick Change Password Modal ── */}
      <Modal
        isOpen={!!pwdTarget}
        onClose={() => { setPwdTarget(null); setPwdError(''); }}
        title={`🔑 Change Password — ${pwdTarget?.username}`}
        footer={
          <>
            <button onClick={() => { setPwdTarget(null); setPwdError(''); }} className="btn btn-secondary" disabled={pwdLoading}>
              Cancel
            </button>
            <button
              onClick={handleChangePassword}
              className="btn btn-primary"
              disabled={pwdLoading}
              style={{ background: 'var(--accent-gradient)', minWidth: '150px' }}
            >
              {pwdLoading ? '⏳ Saving...' : '🔑 Set New Password'}
            </button>
          </>
        }
      >
        {pwdTarget && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: 'var(--warning-bg)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: 'var(--radius-md)', padding: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Setting a new password for <strong style={{ color: 'var(--text-primary)' }}>{pwdTarget.username}</strong>. The old password will be replaced immediately.
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Enter new password (min 4 characters)"
                value={newPwd}
                onChange={e => { setNewPwd(e.target.value); setPwdError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleChangePassword()}
                autoFocus
              />
            </div>
            {pwdError && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-sm)', padding: '0.6rem 0.75rem', color: 'var(--danger)', fontSize: '0.85rem', fontWeight: '600' }}>
                ⚠️ {pwdError}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ── Role Info Modal ── */}
      <Modal
        isOpen={!!infoRole}
        onClose={() => setInfoRole(null)}
        title={`${ROLES.find(r => r.value === infoRole)?.label || ''} Permissions`}
        footer={<button onClick={() => setInfoRole(null)} className="btn btn-secondary">Close</button>}
      >
        {infoRole && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
              {ROLES.find(r => r.value === infoRole)?.desc}
            </p>
            {(ROLE_PERMISSIONS[infoRole] || []).map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.5rem', borderRadius: 'var(--radius-sm)', background: p.startsWith('🚫') ? 'rgba(239,68,68,0.06)' : 'rgba(16,185,129,0.06)', fontSize: '0.85rem', color: p.startsWith('🚫') ? 'var(--danger)' : 'var(--success)' }}>
                {p}
              </div>
            ))}
          </div>
        )}
      </Modal>

    </div>
  );
};

export default UsersManager;
