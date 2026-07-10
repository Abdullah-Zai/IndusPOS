import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LightbulbIcon, LogoutIcon, MenuIcon, UserIcon } from './Icons';

/* Inline back-chevron icon — no extra file needed */
const BackIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round"
    style={{ display: 'inline-block', verticalAlign: 'middle' }} {...props}>
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const Navbar = ({ title, setSidebarOpen, goBack, canGoBack }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const getRoleBadge = (role) => {
    switch(role) {
      case 'admin':   return <span className="badge badge-danger">Admin</span>;
      case 'waiter':  return <span className="badge badge-info">Waiter</span>;
      case 'kitchen': return <span className="badge badge-warning">Kitchen Staff</span>;
      case 'cashier': return <span className="badge badge-success">Cashier</span>;
      default: return null;
    }
  };

  return (
    <header className="top-nav glass-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Brand Logo & Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: '0.25rem' }}>
          <img 
            src="/logo.png" 
            alt="Indus Legacy" 
            style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '50%',
              border: '1.5px solid var(--border-glow)',
              boxShadow: '0 0 8px var(--accent-glow)',
              objectFit: 'cover'
            }} 
          />
          <h1 style={{ fontSize: '1.05rem', fontWeight: '800', margin: 0, whiteSpace: 'nowrap' }}>
            INDUS <span className="gradient-text">LEGACY</span>
          </h1>
        </div>

        <span style={{ color: 'var(--border-color)', fontSize: '1.1rem', userSelect: 'none' }}>|</span>

        {/* Mobile hamburger */}
        <button
          onClick={() => setSidebarOpen(prev => !prev)}
          className="nav-icon-btn mobile-menu-btn"
          style={{ display: 'none', background: 'var(--bg-hover)' }}
          title="Open Menu"
        >
          <MenuIcon width="20" height="20" />
        </button>

        {/* Back button — shown whenever there is history */}
        {canGoBack && (
          <button
            onClick={goBack}
            title="Go Back"
            style={{
              background: 'rgba(16, 185, 129, 0.05)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.45rem 0.85rem',
              fontSize: '0.82rem',
              fontWeight: '700',
              color: 'var(--text-secondary)',
              border: '1.5px solid rgba(16, 185, 129, 0.25)',
              cursor: 'pointer',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.borderColor = 'var(--accent-primary)';
              e.currentTarget.style.background = 'var(--accent-gradient)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.35)';
              const svg = e.currentTarget.querySelector('svg');
              if (svg) svg.style.transform = 'translateX(-3px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.25)';
              e.currentTarget.style.background = 'rgba(16, 185, 129, 0.05)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
              const svg = e.currentTarget.querySelector('svg');
              if (svg) svg.style.transform = 'translateX(0)';
            }}
          >
            <BackIcon width="16" height="16" style={{ transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)', color: 'var(--accent-primary)' }} />
            Back
          </button>
        )}

        <h2 className="nav-title" style={{ fontSize: '1.15rem', margin: 0, fontWeight: '600' }}>{title || 'Dashboard'}</h2>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Animated Lightbulb Mode Toggle */}
        <button
          onClick={toggleTheme}
          className={`nav-icon-btn ${theme === 'dark' ? 'lightbulb-off' : 'lightbulb-on'}`}
          title={`Turn ${theme === 'dark' ? 'On Lights (Light Mode)' : 'Off Lights (Dark Mode)'}`}
        >
          <LightbulbIcon width="20" height="20" />
        </button>

        {/* User profile avatar popover */}
        {user && (
          <div className="nav-profile-container" tabIndex={0}>
            <div className="nav-profile-avatar-btn">
              {user.username.charAt(0)}
            </div>
            <div className="profile-hover-card glass-card">
              <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <UserIcon width="16" height="16" /> {user.username}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px', textTransform: 'capitalize' }}>
                Role: <b>{user.role}</b>
              </div>
              {getRoleBadge(user.role) && (
                <div style={{ marginTop: '6px' }}>{getRoleBadge(user.role)}</div>
              )}
            </div>
          </div>
        )}

        {/* Slide-out Logout Door Icon */}
        <button
          onClick={logout}
          className="nav-icon-btn nav-logout-btn"
          title="Sign Out / Logout"
        >
          <LogoutIcon width="20" height="20" />
        </button>
      </div>
    </header>
  );
};

export default Navbar;
