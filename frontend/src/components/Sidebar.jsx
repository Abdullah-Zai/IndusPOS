import React from 'react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ activeTab, setActiveTab, sidebarOpen, setSidebarOpen }) => {
  const { user } = useAuth();

  if (!user) return null;

  const adminLinks = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'pos', label: 'Admin POS', icon: '🖥️' },
    { id: 'billing', label: 'Open Billing', icon: '🧾' },
    { id: 'menu', label: 'Menu Manager', icon: '🍽️' },
    { id: 'tables', label: 'Manage Tables', icon: '🪑' },
    { id: 'inventory', label: 'Inventory Stash', icon: '📦' },
    { id: 'financials', label: 'Financial Hub', icon: '💰' },
    { id: 'users', label: 'Staff Users', icon: '👥' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  const waiterLinks = [
    { id: 'dashboard', label: 'Tables Status', icon: '🪑' },
    { id: 'new_order', label: 'Take Order', icon: '📝' },
  ];

  const kitchenLinks = [
    { id: 'dashboard', label: 'Kitchen Display (KDS)', icon: '🍳' },
  ];

  const cashierLinks = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'pos', label: 'Takeaway POS', icon: '🖥️' },
    { id: 'billing', label: 'Settle Bills', icon: '🧾' },
    { id: 'menu', label: 'Menu List', icon: '🍽️' },
    { id: 'tables', label: 'Tables Status', icon: '🪑' },
    { id: 'inventory', label: 'Inventory Stash', icon: '📦' },
    { id: 'financials', label: 'Sales & Ledger', icon: '💰' },
  ];

  let links = [];
  if (user.role === 'admin') links = adminLinks;
  else if (user.role === 'waiter') links = waiterLinks;
  else if (user.role === 'kitchen') links = kitchenLinks;
  else if (user.role === 'cashier') links = cashierLinks;

  return (
    <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <img 
          src="/logo.png" 
          alt="Indus Cuisine" 
          style={{ 
            width: '45px', 
            height: '45px', 
            borderRadius: '50%',
            border: '2px solid var(--border-glow)',
            boxShadow: '0 0 15px var(--accent-glow)',
            objectFit: 'cover'
          }} 
        />
        <div>
          <h1 style={{ fontSize: '1.1rem', lineHeight: '1.2', fontWeight: '800' }}>
            INDUS <span className="gradient-text">CUISINE</span>
          </h1>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Fine Dining POS</span>
        </div>
      </div>

      <nav style={{ padding: '1.25rem 0.75rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '0 0.75rem 0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>
          Menu Navigation
        </div>
        {links.map((link) => {
          const isActive = activeTab === link.id;
          return (
            <button
              key={link.id}
              onClick={() => {
                setActiveTab(link.id);
                if (setSidebarOpen) setSidebarOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                padding: '0.8rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: isActive ? 'var(--accent-gradient)' : 'transparent',
                color: isActive ? '#fff' : 'var(--text-secondary)',
                border: 'none',
                fontFamily: 'inherit',
                fontSize: '0.95rem',
                fontWeight: isActive ? '600' : '500',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease',
                boxShadow: isActive ? '0 4px 15px rgba(99, 102, 241, 0.35)' : 'none'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'var(--bg-hover)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              <span style={{ fontSize: '1.2rem' }}>{link.icon}</span>
              {link.label}
            </button>
          );
        })}
      </nav>

      <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
        Indus Hotel POS v2.0.0
      </div>
    </aside>
  );
};

export default Sidebar;
