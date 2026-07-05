import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import OrderCard from '../../components/OrderCard';

const KitchenDashboard = () => {
  const { authFetch } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadKitchenOrders = async () => {
    try {
      const res = await authFetch('/api/orders/kitchen');
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error('Failed to load KDS:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKitchenOrders();
    const interval = setInterval(loadKitchenOrders, 5000); // 5s auto refresh for kitchen!
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await authFetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      loadKitchenOrders();
    } catch (err) {
      alert('Failed to update kitchen status');
    }
  };

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const preparingOrders = orders.filter(o => o.status === 'preparing');

  return (
    <div className="page-body animate-fade-in" style={{ padding: '1.5rem' }}>
      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.05) 100%)', borderColor: 'rgba(245, 158, 11, 0.4)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '2rem' }}>🍳</span>
            <h2 style={{ fontSize: '1.8rem', color: 'var(--text-primary)', margin: 0 }}>Kitchen Display System (KDS)</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Live incoming restaurant orders. Tap buttons to notify waiters instantly.</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pending Tickets</div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#f59e0b' }}>{pendingOrders.length}</div>
          </div>
          <div style={{ width: '1px', height: '40px', background: 'var(--border-color)' }} />
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>In Preparation</div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#3b82f6' }}>{preparingOrders.length}</div>
          </div>
          <button onClick={loadKitchenOrders} className="btn btn-secondary" style={{ padding: '0.6rem 1rem' }}>
            🔄 Refresh KDS
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading Kitchen Display System...</div>
      ) : orders.length === 0 ? (
        <div className="glass-card" style={{ padding: '5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✨</div>
          <h2 style={{ fontSize: '1.8rem', color: 'var(--text-primary)' }}>Kitchen Queue is Clear!</h2>
          <p style={{ marginTop: '0.5rem', fontSize: '1.05rem' }}>All food orders have been cooked and marked ready for waiters.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          {/* Pending Section */}
          {pendingOrders.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(245, 158, 11, 0.3)' }}>
                <span className="badge badge-warning" style={{ fontSize: '0.85rem', padding: '0.35rem 0.8rem' }}>⏳ NEW / PENDING ({pendingOrders.length})</span>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Please start preparation immediately</span>
              </div>
              <div className="grid-cols-4">
                {pendingOrders.map(order => (
                  <OrderCard key={order.id} order={order} onUpdateStatus={handleUpdateStatus} showActions={true} />
                ))}
              </div>
            </div>
          )}

          {/* Preparing Section */}
          {preparingOrders.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(59, 130, 246, 0.3)' }}>
                <span className="badge badge-info" style={{ fontSize: '0.85rem', padding: '0.35rem 0.8rem' }}>🍳 COOKING IN PROGRESS ({preparingOrders.length})</span>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Click "Mark Ready" when plated</span>
              </div>
              <div className="grid-cols-4">
                {preparingOrders.map(order => (
                  <OrderCard key={order.id} order={order} onUpdateStatus={handleUpdateStatus} showActions={true} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default KitchenDashboard;
