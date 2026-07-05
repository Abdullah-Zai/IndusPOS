import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const Reports = () => {
  const { authFetch } = useAuth();
  const [summary, setSummary] = useState({ total_revenue: 0, total_orders: 0, average_order_value: 0 });
  const [topItems, setTopItems] = useState([]);
  const [recentBills, setRecentBills] = useState([]);
  const [loading, setLoading] = useState(true);

  // Date filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadReports = async () => {
    setLoading(true);
    try {
      let url = '/api/reports/summary?';
      if (startDate) url += `start_date=${startDate}&`;
      if (endDate) url += `end_date=${endDate}`;

      const [sumRes, topRes, recRes] = await Promise.all([
        authFetch(url),
        authFetch('/api/reports/top-items?limit=10'),
        authFetch('/api/reports/recent-bills?limit=20')
      ]);

      setSummary(await sumRes.json());
      setTopItems(await topRes.json());
      setRecentBills(await recRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [startDate, endDate]);

  return (
    <div className="page-body animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3>📈 Sales & Revenue Analytics</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Real-time financial summaries and item popularity metrics.</p>
        </div>

        {/* Date Filter Bar */}
        <div className="glass-card" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>📅 Filter Range:</span>
          <input type="date" className="form-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ padding: '0.35rem 0.6rem', width: 'auto', fontSize: '0.85rem' }} />
          <span>to</span>
          <input type="date" className="form-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ padding: '0.35rem 0.6rem', width: 'auto', fontSize: '0.85rem' }} />
          {(startDate || endDate) && (
            <button onClick={() => { setStartDate(''); setEndDate(''); }} className="btn btn-secondary" style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}>Reset</button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid-cols-3" style={{ marginBottom: '2.5rem' }}>
        <div className="glass-card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>Total Revenue</span>
          <div style={{ fontSize: '2.2rem', fontWeight: '800', color: '#10b981', margin: '0.5rem 0' }}>
            Rs. {summary.total_revenue?.toLocaleString()}
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>From {summary.total_orders} completed transactions</span>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0.05) 100%)', borderColor: 'rgba(99, 102, 241, 0.3)' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>Total Paid Orders</span>
          <div style={{ fontSize: '2.2rem', fontWeight: '800', color: '#818cf8', margin: '0.5rem 0' }}>
            {summary.total_orders}
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Successfully settled tables & takeaways</span>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.15) 0%, rgba(236, 72, 153, 0.05) 100%)', borderColor: 'rgba(236, 72, 153, 0.3)' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>Average Order Value</span>
          <div style={{ fontSize: '2.2rem', fontWeight: '800', color: '#f472b6', margin: '0.5rem 0' }}>
            Rs. {summary.average_order_value?.toLocaleString()}
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Average spend per customer bill</span>
        </div>
      </div>

      <div className="grid-cols-2" style={{ gap: '2rem' }}>
        {/* Top Selling Items Table */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h4 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>🔥 Top Selling Menu Items</h4>
          <div className="table-container" style={{ border: 'none' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Item Name</th>
                  <th>Qty Sold</th>
                  <th style={{ textAlign: 'right' }}>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topItems.length === 0 ? (
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No sales data yet.</td></tr>
                ) : (
                  topItems.map((it, idx) => (
                    <tr key={idx}>
                      <td><span className="badge" style={{ background: idx === 0 ? 'var(--accent-gradient)' : 'var(--bg-hover)', color: idx === 0 ? '#ffffff' : 'var(--text-primary)' }}>#{idx + 1}</span></td>
                      <td style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                        {it.name} {it.variant ? <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>{it.variant}</span> : ''}
                      </td>
                      <td style={{ fontWeight: '700' }}>{it.total_quantity_sold}x</td>
                      <td style={{ textAlign: 'right', fontWeight: '700', color: '#10b981' }}>Rs. {it.total_revenue.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Bills Table */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h4 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>🧾 Recent Paid Transactions</h4>
          <div className="table-container" style={{ border: 'none' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Bill #</th>
                  <th>Order #</th>
                  <th>Method</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentBills.length === 0 ? (
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No bills generated yet.</td></tr>
                ) : (
                  recentBills.map((b) => (
                    <tr key={b.id}>
                      <td style={{ fontWeight: '700', color: 'var(--accent-primary)' }}>{b.bill_number}</td>
                      <td>#{b.order_id}</td>
                      <td><span className="badge badge-secondary">{b.payment_method}</span></td>
                      <td style={{ textAlign: 'right', fontWeight: '700', color: '#10b981' }}>Rs. {b.total_amount.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
