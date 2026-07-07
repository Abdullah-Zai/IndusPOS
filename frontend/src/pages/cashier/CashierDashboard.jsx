import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import OrderCard from '../../components/OrderCard';

const CashierDashboard = ({ setActiveTab }) => {
  const { authFetch, user } = useAuth();
  const [summary, setSummary] = useState({ total_revenue: 0, total_orders: 0, average_order_value: 0 });
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Shift & Cash Register States
  const [shifts, setShifts] = useState([]);
  const [shiftType, setShiftType] = useState('Morning');
  const [startingFloat, setStartingFloat] = useState('');
  const [endingFloat, setEndingFloat] = useState('');
  const [shiftNotes, setShiftNotes] = useState('');
  const [activeShift, setActiveShift] = useState(null);
  const [showShiftModal, setShowShiftModal] = useState(false);

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

  const loadShifts = () => {
    const saved = localStorage.getItem('indus_cashier_shifts');
    if (saved) {
      const parsed = JSON.parse(saved);
      setShifts(parsed);
      // Check if there is an active/open shift
      const open = parsed.find(s => s.status === 'open');
      if (open) setActiveShift(open);
    }
  };

  useEffect(() => {
    loadData();
    loadShifts();
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

  // Shift Actions
  const handleStartShift = (e) => {
    e.preventDefault();
    if (!startingFloat) return alert('⚠️ Please enter a starting float amount!');

    const newShift = {
      id: Date.now(),
      cashier: user.username,
      date: new Date().toLocaleDateString(),
      startTime: new Date().toLocaleTimeString(),
      endTime: '',
      shiftType,
      startingFloat: parseFloat(startingFloat),
      endingFloat: 0,
      status: 'open',
      notes: shiftNotes.trim()
    };

    const updated = [newShift, ...shifts];
    localStorage.setItem('indus_cashier_shifts', JSON.stringify(updated));
    setShifts(updated);
    setActiveShift(newShift);
    setStartingFloat('');
    setShiftNotes('');
    setShowShiftModal(false);
    alert('🟢 Shift register opened successfully!');
  };

  const handleEndShift = (e) => {
    e.preventDefault();
    if (!endingFloat) return alert('⚠️ Please enter ending cash drawer amount!');

    const updated = shifts.map(s => {
      if (s.id === activeShift.id) {
        return {
          ...s,
          endTime: new Date().toLocaleTimeString(),
          endingFloat: parseFloat(endingFloat),
          status: 'closed',
          notes: s.notes + (shiftNotes ? ` | End Note: ${shiftNotes.trim()}` : '')
        };
      }
      return s;
    });

    localStorage.setItem('indus_cashier_shifts', JSON.stringify(updated));
    setShifts(updated);
    setActiveShift(null);
    setEndingFloat('');
    setShiftNotes('');
    alert('🔴 Shift register closed and locked.');
  };

  const handleDeleteShift = (id) => {
    if (user.role !== 'admin') {
      return alert('🚫 Unauthorized: Only admins can delete shift register logs!');
    }
    if (window.confirm('🗑️ Delete this shift log record?')) {
      const updated = shifts.filter(s => s.id !== id);
      localStorage.setItem('indus_cashier_shifts', JSON.stringify(updated));
      setShifts(updated);
      if (activeShift && activeShift.id === id) setActiveShift(null);
    }
  };

  return (
    <div className="page-body animate-fade-in" style={{ padding: '1.5rem', paddingBottom: '4rem' }}>
      {/* Stats Cards */}
      <div className="grid-cols-3" style={{ marginBottom: '2rem' }}>
        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ width: '55px', height: '55px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
            💵
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Billed Revenue Today</span>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-primary)' }}>Rs. {(summary?.total_revenue || 0).toLocaleString()}</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ width: '55px', height: '55px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', border: '1px solid rgba(99, 102, 241, 0.4)' }}>
            🧾
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Total Paid Invoices</span>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-primary)' }}>{summary.total_orders}</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ width: '55px', height: '55px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', border: '1px solid rgba(245, 158, 11, 0.4)' }}>
            ⏳
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Unbilled Table Orders</span>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-primary)' }}>{orders.length}</div>
          </div>
        </div>
      </div>

      {/* Cash Register Shift Status Bar */}
      <div className="glass-card" style={{ padding: '1.25rem 1.5rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: activeShift ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)', borderColor: activeShift ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
            <span>💼</span> Shift Status: {activeShift ? <span className="badge badge-success">ACTIVE REGISTER ({activeShift.shiftType})</span> : <span className="badge badge-danger">CLOSED / UNLOCKED</span>}
          </h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {activeShift 
              ? `Cashier: ${activeShift.cashier} | Started: ${activeShift.startTime} | Float: Rs. ${(activeShift.startingFloat || 0).toLocaleString()}`
              : 'Open the shift drawer cash register float to start receiving cashier table checkout balances.'
            }
          </p>
        </div>
        <div>
          {activeShift ? (
            <form onSubmit={handleEndShift} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input 
                type="number" 
                placeholder="End Cash Float (PKR)" 
                value={endingFloat} 
                onChange={(e) => setEndingFloat(e.target.value)} 
                className="form-input" 
                style={{ padding: '0.45rem 0.75rem', width: '170px', fontSize: '0.85rem' }} 
                required 
              />
              <button type="submit" className="btn btn-danger" style={{ padding: '0.55rem 1rem', fontSize: '0.85rem' }}>
                🔒 Close Shift
              </button>
            </form>
          ) : (
            <button onClick={() => setShowShiftModal(true)} className="btn btn-primary" style={{ padding: '0.55rem 1.25rem', fontSize: '0.85rem' }}>
              🔑 Open Cashier Shift
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Active Orders vs Shifts Register Logs */}
      <div className="tables-manager-grid">
        {/* Left Column: Tables Awaiting Settlement */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.2rem' }}>🪑 Unbilled Tables Settle Queue ({orders.length})</h3>
            <button onClick={loadData} className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
              🔄 Refresh
            </button>
          </div>

          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
          ) : orders.length === 0 ? (
            <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎉</div>
              <h4>All tables billed!</h4>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {orders.map((order, index) => (
                <OrderCard 
                  key={order.id} 
                  order={order} 
                  onUpdateStatus={handleUpdateStatus} 
                  onBillOrder={() => setActiveTab('billing')} 
                  staggerIndex={index} 
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Shift Cashier Logs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem' }}>📜 Cash Register Shifts Log</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Shift reports logged locally in the POS system.</p>
          </div>

          <div className="table-container glass-card">
            <table className="custom-table" style={{ fontSize: '0.85rem' }}>
              <thead>
                <tr>
                  <th>Shift Details</th>
                  <th>Starting Float</th>
                  <th>Closing Total</th>
                  <th>Date / Hours</th>
                  <th>Notes</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {shifts.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No shift records logged.
                    </td>
                  </tr>
                ) : (
                  shifts.map(s => (
                    <tr key={s.id}>
                      <td>
                        <div style={{ fontWeight: '700' }}>{s.cashier}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.shiftType}</div>
                      </td>
                      <td style={{ color: 'var(--text-primary)' }}>Rs. {(s?.startingFloat || 0).toLocaleString()}</td>
                      <td style={{ color: s.status === 'open' ? 'var(--success)' : 'var(--text-primary)', fontWeight: '700' }}>
                        {s.status === 'open' ? '🟢 Open Now' : `Rs. ${(s?.endingFloat || 0).toLocaleString()}`}
                      </td>
                      <td>
                        <div>{s.date}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {s.startTime} - {s.endTime || 'Present'}
                        </div>
                      </td>
                      <td style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={s.notes}>
                        {s.notes || '—'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {user.role === 'admin' ? (
                          <button onClick={() => handleDeleteShift(s.id)} className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                            🗑️ Delete
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Restricted</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Start Shift Modal */}
      {showShiftModal && (
        <div className="modal-overlay" onClick={() => setShowShiftModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="glass-header" style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem' }}>🔑 Open Cash Float Register</h3>
              <button onClick={() => setShowShiftModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.3rem', cursor: 'pointer' }}>&times;</button>
            </div>
            
            <form onSubmit={handleStartShift} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Shift Duration</label>
                <select className="form-select" value={shiftType} onChange={(e) => setShiftType(e.target.value)}>
                  <option value="Morning">Morning Shift (08:00 AM - 04:00 PM)</option>
                  <option value="Evening">Evening Shift (04:00 PM - 12:00 AM)</option>
                  <option value="Night">Night Shift (12:00 AM - 08:00 AM)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Opening Float Cash (PKR)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  placeholder="e.g. 15000" 
                  value={startingFloat} 
                  onChange={(e) => setStartingFloat(e.target.value)} 
                  required 
                  min="0" 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Register Notes</label>
                <textarea 
                  className="form-input" 
                  style={{ minHeight: '50px' }} 
                  placeholder="Notes about cash counts, register drawer status..." 
                  value={shiftNotes} 
                  onChange={(e) => setShiftNotes(e.target.value)} 
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
                🟢 Open Register & Start
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashierDashboard;
