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
import Reports from './pages/admin/Reports';
import UsersManager from './pages/admin/UsersManager';

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

  useEffect(() => {
    if (user) {
      setActiveTab('dashboard');
    }
  }, [user]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem', animation: 'float 2s infinite ease-in-out' }}>⚡</div>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '1.4rem' }}>INDUS HOTEL POS</h2>
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
      case 'pos': return user.role === 'cashier' ? '🖥️ Takeaway POS Terminal' : '🖥️ Admin Point of Sale Terminal';
      case 'billing': return '🧾 Open Table Billing & Settlement';
      case 'menu': return '🍽️ Pakistani Cuisine Menu Manager';
      case 'reports': return '📈 Sales & Revenue Reports';
      case 'users': return '👥 Staff Users & Role Permissions';
      case 'new_order': return '📝 Take New Table Order';
      default: return 'Indus Hotel POS';
    }
  };

  const renderContent = () => {
    if (user.role === 'admin') {
      switch(activeTab) {
        case 'dashboard': return <AdminDashboard setActiveTab={setActiveTab} />;
        case 'pos': return <Pos />;
        case 'billing': return <Billing />;
        case 'menu': return <MenuManager />;
        case 'reports': return <Reports />;
        case 'users': return <UsersManager />;
        default: return <AdminDashboard setActiveTab={setActiveTab} />;
      }
    } else if (user.role === 'waiter') {
      switch(activeTab) {
        case 'dashboard': return <WaiterDashboard setActiveTab={setActiveTab} />;
        case 'new_order': return <NewOrder setActiveTab={setActiveTab} />;
        default: return <WaiterDashboard setActiveTab={setActiveTab} />;
      }
    } else if (user.role === 'kitchen') {
      return <KitchenDashboard />;
    } else if (user.role === 'cashier') {
      switch(activeTab) {
        case 'dashboard': return <CashierDashboard setActiveTab={setActiveTab} />;
        case 'pos': return <Pos />;
        case 'billing': return <Billing />;
        default: return <CashierDashboard setActiveTab={setActiveTab} />;
      }
    }
    return null;
  };

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="main-content">
        <Navbar title={getPageTitle()} />
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
