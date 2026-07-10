import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import Pos from './pages/admin/Pos';
import Billing from './pages/admin/Billing';
import MenuManager from './pages/admin/MenuManager';
import FinancialHub from './pages/admin/FinancialHub';
import TablesManager from './pages/admin/TablesManager';
import InventoryManager from './pages/admin/InventoryManager';
import UsersManager from './pages/admin/UsersManager';
import Settings from './pages/admin/Settings';

// Waiter Pages
import WaiterDashboard from './pages/waiter/WaiterDashboard';
import NewOrder from './pages/waiter/NewOrder';

// Kitchen Pages
import KitchenDashboard from './pages/kitchen/KitchenDashboard';

// Cashier Pages
import CashierDashboard from './pages/cashier/CashierDashboard';

const App = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [navHistory, setNavHistory] = useState([]); // history stack
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Navigate to a new tab — pushes current tab onto history stack
  const navigate = (tab) => {
    if (tab === activeTab) return; // no-op if same tab
    setNavHistory(prev => [...prev, activeTab]);
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  // Go back one step in history
  const goBack = () => {
    if (navHistory.length === 0) return;
    const prev = navHistory[navHistory.length - 1];
    setNavHistory(h => h.slice(0, -1));
    setActiveTab(prev);
  };

  const canGoBack = navHistory.length > 0;

  useEffect(() => {
    if (user) {
      setActiveTab('dashboard');
      setNavHistory([]);
      setSidebarOpen(false);
    }
  }, [user]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem', animation: 'float 2s infinite ease-in-out' }}>⚡</div>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '1.4rem' }}>INDUS LEGACY</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>Loading React SPA & FastAPI Backend...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const getPageTitle = () => {
    switch(activeTab) {
      case 'dashboard': return user.role === 'admin' ? '📊 Admin Dashboard & Live Analytics' : user.role === 'waiter' ? '🪑 Tables Overview & Queue' : user.role === 'cashier' ? '📊 Cashier Dashboard & Bill Settlement' : '🍳 Kitchen Display System (KDS)';
      case 'pos': return user.role === 'cashier' ? '🖥️ Takeaway Indus Legacy' : '🖥️ Admin Indus Legacy';
      case 'billing': return '🧾 Open Table Billing & Settlement';
      case 'menu': return '🍽️ Pakistani Cuisine Menu Manager';
      case 'tables': return '🪑 Restaurant Tables Configuration';
      case 'inventory': return '📦 Store Room Inventory & Price Management';
      case 'financials': return '💰 Financial Hub & Operating Expenses';
      case 'users': return '👥 Staff Users & Role Permissions';
      case 'settings': return '⚙️ System Configuration & Indus Legacy Settings';
      case 'new_order': return '📝 Take New Table Order';
      default: return 'Indus Legacy';
    }
  };

  const renderContent = () => {
    if (user.role === 'admin') {
      switch(activeTab) {
        case 'dashboard': return <AdminDashboard setActiveTab={navigate} />;
        case 'pos': return <Pos />;
        case 'billing': return <Billing />;
        case 'menu': return <MenuManager />;
        case 'tables': return <TablesManager />;
        case 'inventory': return <InventoryManager />;
        case 'financials': return <FinancialHub />;
        case 'users': return <UsersManager />;
        case 'settings': return <Settings />;
        default: return <AdminDashboard setActiveTab={navigate} />;
      }
    } else if (user.role === 'waiter') {
      switch(activeTab) {
        case 'dashboard': return <WaiterDashboard setActiveTab={navigate} />;
        case 'new_order': return <NewOrder setActiveTab={navigate} />;
        default: return <WaiterDashboard setActiveTab={navigate} />;
      }
    } else if (user.role === 'kitchen') {
      return <KitchenDashboard />;
    } else if (user.role === 'cashier') {
      // Cashier has broad access with specific restrictions:
      // - MenuManager: read-only (no add/edit/delete)
      // - TablesManager: read-only (no add/edit/delete)
      // - InventoryManager: can add stock, cannot edit/delete
      // - FinancialHub: cashierMode hides Payroll & Operating Costs tabs
      // - NO access to: UsersManager, Settings
      switch(activeTab) {
        case 'dashboard': return <CashierDashboard setActiveTab={navigate} />;
        case 'pos': return <Pos />;
        case 'billing': return <Billing />;
        case 'menu': return <MenuManager readOnly={true} />;
        case 'tables': return <TablesManager readOnly={true} />;
        case 'inventory': return <InventoryManager cashierMode={true} />;
        case 'financials': return <FinancialHub cashierMode={true} />;
        default: return <CashierDashboard setActiveTab={navigate} />;
      }
    }
    return null;
  };

  const cashierLinks = [
    { id: 'dashboard', label: '📊 Dashboard' },
    { id: 'pos', label: '🖥️ Takeaway Indus Legacy' },
    { id: 'billing', label: '🧾 Settle Bills' },
    { id: 'tables', label: '🪑 Tables Status' },
    { id: 'menu', label: '🍽️ Menu List' },
    { id: 'inventory', label: '📦 Inventory Stash' },
    { id: 'financials', label: '💰 Sales Reports' },
  ];

  return (
    <div className="app-container">
      {user.role !== 'cashier' && (
        <Sidebar activeTab={activeTab} setActiveTab={navigate} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      )}
      {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)}></div>}
      <main className="main-content" style={{ marginLeft: user.role === 'cashier' ? '0' : undefined }}>
        <Navbar title={getPageTitle()} setSidebarOpen={setSidebarOpen} goBack={goBack} canGoBack={canGoBack} />
        
        {user.role === 'cashier' && (
          <div style={{
            background: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border-color)',
            padding: '0.65rem 2.0rem',
            display: 'flex',
            gap: '0.65rem',
            overflowX: 'auto',
            alignItems: 'center',
            position: 'sticky',
            top: '70px',
            zIndex: 35
          }}>
            {/* Nav Links */}
            {cashierLinks.map(link => {
              const isActive = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => navigate(link.id)}
                  style={{
                    padding: '0.5rem 1.1rem',
                    borderRadius: 'var(--radius-md)',
                    background: isActive ? 'var(--accent-gradient)' : 'transparent',
                    color: isActive ? '#fff' : 'var(--text-secondary)',
                    border: 'none',
                    fontSize: '0.88rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s ease',
                    boxShadow: isActive ? '0 4px 10px rgba(16, 185, 129, 0.25)' : 'none'
                  }}
                >
                  {link.label}
                </button>
              );
            })}
          </div>
        )}


        {renderContent()}
      </main>
    </div>
  );
};

export default App;
