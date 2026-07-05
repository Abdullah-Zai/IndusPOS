import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Navbar = ({ title }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const getRoleBadge = (role) => {
    switch(role) {
      case 'admin': return <span className="badge badge-danger">Admin</span>;
      case 'waiter': return <span className="badge badge-info">Waiter</span>;
      case 'kitchen': return <span className="badge badge-warning">Kitchen Staff</span>;
      default: return null;
    }
  };

  return (
    <header className="top-nav glass-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.4rem' }}>{title || 'Dashboard'}</h2>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button 
          onClick={toggleTheme} 
          className="btn btn-secondary" 
          style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          title={`Switch to ${theme === 'dark' ? 'Light Mode' : 'Dark Mode'}`}
        >
          {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </button>

        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{user.username}</div>
              <div style={{ marginTop: '-2px' }}>{getRoleBadge(user.role)}</div>
            </div>
          </div>
        )}
        <button 
          onClick={logout} 
          className="btn btn-secondary" 
          style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
        >
          Logout ➔
        </button>
      </div>
    </header>
  );
};

export default Navbar;
