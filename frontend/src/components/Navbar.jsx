import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Navbar = ({ title, setSidebarOpen }) => {
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button 
          onClick={() => setSidebarOpen(prev => !prev)} 
          className="nav-icon-btn mobile-menu-btn"
          style={{ display: 'none', fontSize: '1.3rem', background: 'var(--bg-hover)' }}
          title="Open Menu"
        >
          ☰
        </button>
        <h2 className="nav-title" style={{ fontSize: '1.4rem' }}>{title || 'Dashboard'}</h2>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Animated Lightbulb Mode Toggle */}
        <button 
          onClick={toggleTheme} 
          className={`nav-icon-btn ${theme === 'dark' ? 'lightbulb-off' : 'lightbulb-on'}`}
          title={`Turn ${theme === 'dark' ? 'On Lights (Light Mode)' : 'Off Lights (Dark Mode)'}`}
        >
          💡
        </button>

        {/* User profile avatar popover */}
        {user && (
          <div className="nav-profile-container" tabIndex={0}>
            <div className="nav-profile-avatar-btn">
              {user.username.charAt(0)}
            </div>
            <div className="profile-hover-card glass-card">
              <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-primary)' }}>👤 {user.username}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px', textTransform: 'capitalize' }}>
                Role: <b>{user.role}</b>
              </div>
            </div>
          </div>
        )}

        {/* Slide-out Logout Door Icon */}
        <button 
          onClick={logout} 
          className="nav-icon-btn nav-logout-btn"
          title="Sign Out / Logout"
        >
          🚪
        </button>
      </div>
    </header>
  );
};

export default Navbar;
