import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import OrderCard from '../../components/OrderCard';

const WaiterDashboard = ({ setActiveTab }) => {
  const { authFetch } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = async () => {
    try {
      const res = await authFetch('/api/orders');
      const data = await res.json();
      // Waiter sees active table orders
      const active = data.filter(o => o.status !== 'completed' && o.status !== 'cancelled');
      setOrders(active);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await authFetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      loadOrders();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  return (
    <div className="page-body animate-fade-in">
      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.05) 100%)', borderColor: 'rgba(59, 130, 246, 0.3)' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--text-primary)' }}>🪑 Restaurant Tables Overview</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Track kitchen food status and serve ready orders to dining tables.</p>
        </div>
        <button onClick={() => setActiveTab('new_order')} className="btn btn-primary" style={{ padding: '0.8rem 1.5rem', fontSize: '1.05rem', boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)' }}>
          📝 Take New Table Order ➔
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h3>Active Table Orders ({orders.length})</h3>
        <button onClick={loadOrders} className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
          🔄 Refresh Status
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading tables...</div>
      ) : orders.length === 0 ? (
        <div className="glass-card" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🍽️</div>
          <h3>No Active Table Orders</h3>
          <p style={{ marginTop: '0.5rem' }}>Click "Take New Table Order" when guests arrive!</p>
        </div>
      ) : (
        <div className="grid-cols-3">
          {orders.map(order => (
            <OrderCard key={order.id} order={order} onUpdateStatus={handleUpdateStatus} showActions={true} />
          ))}
        </div>
      )}
    </div>
  );
};

export default WaiterDashboard;
