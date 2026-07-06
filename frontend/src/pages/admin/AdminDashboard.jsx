import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import OrderCard from '../../components/OrderCard';

const AdminDashboard = ({ setActiveTab }) => {
  const { authFetch } = useAuth();
  const [summary, setSummary] = useState({ total_revenue: 0, total_orders: 0, average_order_value: 0 });
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalSalaries, setTotalSalaries] = useState(0);

  const loadData = async () => {
    try {
      const [sumRes, ordRes] = await Promise.all([
        authFetch('/api/reports/summary'),
        authFetch('/api/orders?status=pending,preparing,ready')
      ]);
      const sumData = await sumRes.json();
      const ordData = await ordRes.json();
      setSummary(sumData);
      setOrders(ordData);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // 10s auto refresh
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const savedExp = localStorage.getItem('indus_expenses');
    if (savedExp) {
      const list = JSON.parse(savedExp);
      setTotalExpenses(list.reduce((acc, e) => acc + e.amount, 0));
    }
    const savedSal = localStorage.getItem('indus_salaries');
    if (savedSal) {
      const list = JSON.parse(savedSal);
      setTotalSalaries(list.reduce((acc, s) => acc + s.amount, 0));
    }
  }, []);

  const netProfit = (summary.total_revenue || 0) - totalExpenses - totalSalaries;

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
    <div className="page-body animate-fade-in">
      {/* Stats Cards */}
      <div className="grid-cols-4" style={{ marginBottom: '2.5rem' }}>
        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
            💰
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Gross Sales</span>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)' }}>Rs. {summary.total_revenue.toLocaleString()}</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: netProfit >= 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: netProfit >= 0 ? '#10b981' : 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', border: netProfit >= 0 ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)' }}>
            📈
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Net Profit</span>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: netProfit >= 0 ? '#10b981' : 'var(--danger)' }}>Rs. {netProfit.toLocaleString()}</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', border: '1px solid rgba(99, 102, 241, 0.4)' }}>
            🛒
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Paid Bills</span>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)' }}>{summary.total_orders}</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', border: '1px solid rgba(245, 158, 11, 0.4)' }}>
            🍳
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Kitchen Queue</span>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)' }}>{orders.length}</div>
          </div>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="glass-card" style={{ padding: '1.25rem 1.5rem', marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(99, 102, 241, 0.1)', borderColor: 'rgba(99, 102, 241, 0.3)' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>⚡ Quick POS & Operations</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Launch terminal or check reports without leaving the dashboard.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => setActiveTab('pos')} className="btn btn-primary">
            🖥️ Open POS Terminal
          </button>
          <button onClick={() => setActiveTab('billing')} className="btn btn-secondary">
            🧾 Open Table Billing
          </button>
        </div>
      </div>

      {/* Active Orders Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h3 style={{ fontSize: '1.3rem' }}>Live Active Orders Queue ({orders.length})</h3>
        <button onClick={loadData} className="btn btn-secondary" style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}>
          🔄 Refresh Queue
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading live queue...</div>
      ) : orders.length === 0 ? (
        <div className="glass-card" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
          <h3>No Active Orders in Queue</h3>
          <p style={{ marginTop: '0.5rem' }}>All orders have been prepared and served!</p>
        </div>
      ) : (
        <div className="grid-cols-3">
          {orders.map((order, index) => (
            <OrderCard key={order.id} order={order} onUpdateStatus={handleUpdateStatus} staggerIndex={index} />
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
