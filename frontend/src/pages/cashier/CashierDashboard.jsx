import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import OrderCard from '../../components/OrderCard';

const CashierDashboard = ({ setActiveTab }) => {
  const { authFetch } = useAuth();
  const [summary, setSummary] = useState({ total_revenue: 0, total_orders: 0, average_order_value: 0 });
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [sumRes, ordRes] = await Promise.all([
        authFetch('/api/reports/summary'),
        authFetch('/api/orders')
      ]);
      const sumData = await sumRes.json();
      const ordData = await ordRes.json();
      setSummary(sumData);
      // Cashier only sees open table orders that have not been billed (no has_bill)
      const openUnbilled = ordData.filter(o => o.status !== 'completed' && o.status !== 'cancelled' && !o.has_bill);
      setOrders(openUnbilled);
    } catch (err) {
      console.error('Failed to load cashier dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await authFetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      loadData();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  return (
    <div className="page-body animate-fade-in" style={{ padding: '1.5rem' }}>
      {/* Stats Cards */}
      <div className="grid-cols-3" style={{ marginBottom: '2.5rem' }}>
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '14px', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
            💵
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Billed Revenue Today</span>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-primary)' }}>Rs. {summary.total_revenue.toLocaleString()}</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '14px', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', border: '1px solid rgba(99, 102, 241, 0.4)' }}>
            🧾
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Total Paid Invoices</span>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-primary)' }}>{summary.total_orders}</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '14px', background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', border: '1px solid rgba(245, 158, 11, 0.4)' }}>
            ⏳
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Unbilled Table Orders</span>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-primary)' }}>{orders.length}</div>
          </div>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="glass-card" style={{ padding: '1.25rem 1.5rem', marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(99, 102, 241, 0.1)', borderColor: 'rgba(99, 102, 241, 0.3)' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>⚡ Quick Cashier Operations</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Launch billing terminal or take direct counter takeaway/delivery orders.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => setActiveTab('pos')} className="btn btn-primary">
            🖥️ Takeaway POS Terminal
          </button>
          <button onClick={() => setActiveTab('billing')} className="btn btn-secondary">
            🧾 Settle Open Bills
          </button>
        </div>
      </div>

      {/* Active Orders Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h3 style={{ fontSize: '1.3rem' }}>Tables Awaiting Settlement ({orders.length})</h3>
        <button onClick={loadData} className="btn btn-secondary" style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}>
          🔄 Refresh Queue
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading unbilled orders...</div>
      ) : orders.length === 0 ? (
        <div className="glass-card" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
          <h3>All Tables Settle & Billed</h3>
          <p style={{ marginTop: '0.5rem' }}>No open tables require cashier settlement currently.</p>
        </div>
      ) : (
        <div className="grid-cols-3">
          {orders.map((order, index) => (
            <OrderCard key={order.id} order={order} onUpdateStatus={handleUpdateStatus} onBillOrder={() => setActiveTab('billing')} staggerIndex={index} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CashierDashboard;
