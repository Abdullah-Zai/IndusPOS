import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import OrderCard from '../../components/OrderCard';
import Modal from '../../components/Modal';
import { ChefIcon, ClockIcon, AlertIcon, CheckIcon, TablesIcon } from '../../components/Icons';

const WaiterDashboard = ({ setActiveTab }) => {
  const { authFetch } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Floor Map states
  const [tables, setTables] = useState([]);
  const [areaFilter, setAreaFilter] = useState('all');
  const [inspectTable, setInspectTable] = useState(null); // table being viewed in modal

  // Active queue tab state
  const [queueTab, setQueueTab] = useState('all'); // all, cooking, ready, served

  const loadData = async () => {
    try {
      // 1. Load active orders from backend
      const res = await authFetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        const active = data.filter(o => o.status !== 'completed' && o.status !== 'cancelled');
        setOrders(active);
      }

      // 2. Load tables from localStorage
      const savedTables = localStorage.getItem('indus_tables');
      if (savedTables) {
        setTables(JSON.parse(savedTables));
      } else {
        // Fallback defaults matching NewOrder.jsx
        const defaults = [];
        for (let i = 1; i <= 10; i++) {
          let area = 'Main Hall';
          let name = '';
          if (i <= 3) { area = 'Family Hall'; name = `FH ${i}`; }
          else if (i <= 6) { area = 'Rooftop'; name = `RF ${i - 3}`; }
          else if (i <= 8) { area = 'Mens Section'; name = `MS ${i - 6}`; }
          else { area = 'Main Hall'; name = `G ${i - 8}`; }
          defaults.push({ id: i, name, capacity: 4, area, status: 'available', isActive: true });
        }
        localStorage.setItem('indus_tables', JSON.stringify(defaults));
        setTables(defaults);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Poll every 5s for live KDS changes
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const res = await authFetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        loadData();
        if (inspectTable) {
          setInspectTable(null); // close inspection modal
        }
      }
    } catch (err) {
      alert('Failed to update status');
    }
  };

  // Helper: Get active order for a specific table
  const getTableOrder = (tableName) => {
    return orders.find(o => o.table_no === tableName);
  };

  // Helper: Start new order for a table
  const startOrderForTable = (tableName) => {
    sessionStorage.setItem('waiter_preselected_table', tableName);
    setActiveTab('new_order');
  };

  // Filter orders for the KDS queue tab
  const filteredOrders = orders.filter(o => {
    if (queueTab === 'cooking') return o.status === 'pending' || o.status === 'preparing';
    if (queueTab === 'ready') return o.status === 'ready';
    if (queueTab === 'served') return o.status === 'served';
    return true;
  });

  return (
    <div className="page-body animate-fade-in" style={{ paddingBottom: '4rem' }}>
      
      {/* ── Welcome Banner ── */}
      <div className="glass-card" style={{ 
        padding: '1.5rem', 
        marginBottom: '2rem', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(245, 158, 11, 0.05) 100%)', 
        borderColor: 'var(--border-color)' 
      }}>
        <div>
          <h2 style={{ fontSize: '1.45rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🪑 Waiter Service Dashboard
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Monitor real-time table statuses, track dish preparation states, and serve ready meals.
          </p>
        </div>
        <button 
          onClick={() => {
            sessionStorage.removeItem('waiter_preselected_table');
            setActiveTab('new_order');
          }} 
          className="btn btn-primary" 
          style={{ padding: '0.75rem 1.4rem', fontSize: '0.95rem', background: 'var(--accent-gradient)' }}
        >
          📝 Take New Order ➔
        </button>
      </div>

      {/* ── Section 1: Live Seating Map ── */}
      <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.2rem' }}>
          <h3 style={{ fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            🗺️ Live Floor Seating Map
          </h3>
          
          {/* Seating Areas Tabs */}
          <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto' }}>
            {['all', 'Family Hall', 'Rooftop', 'Mens Section', 'Main Hall'].map(area => (
              <button
                key={area}
                onClick={() => setAreaFilter(area)}
                className={`btn ${areaFilter === area ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.35rem 0.8rem', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
              >
                {area === 'all' ? 'All Areas' : area.replace(' Section', '').replace(' Hall', '')}
              </button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }}></span> Available
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#3b82f6' }}></span> Cooking / In-Kitchen
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b', animation: 'pulse 1.5s infinite alternate' }}></span> 🛎️ Food Ready to Serve!
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }}></span> Reserved
          </span>
        </div>

        {/* Seating Map Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', 
          gap: '0.85rem' 
        }}>
          {tables
            .filter(t => t.isActive && (areaFilter === 'all' || t.area === areaFilter))
            .map(t => {
              const activeOrder = getTableOrder(t.name);
              
              let statusLabel = 'Available';
              let statusColor = 'var(--success)';
              let cardBg = 'rgba(16, 185, 129, 0.05)';
              let borderStyle = '1px solid rgba(16, 185, 129, 0.3)';
              let isPulse = false;

              if (activeOrder) {
                if (activeOrder.status === 'ready') {
                  statusLabel = '🛎️ Ready!';
                  statusColor = 'var(--warning)';
                  cardBg = 'rgba(245, 158, 11, 0.1)';
                  borderStyle = '1.5px solid var(--warning)';
                  isPulse = true;
                } else {
                  statusLabel = '⏳ Cooking';
                  statusColor = 'var(--info)';
                  cardBg = 'rgba(59, 130, 246, 0.08)';
                  borderStyle = '1px solid rgba(59, 130, 246, 0.4)';
                }
              } else if (t.status === 'reserved') {
                statusLabel = 'Reserved';
                statusColor = 'var(--danger)';
                cardBg = 'rgba(239, 68, 68, 0.05)';
                borderStyle = '1px solid rgba(239, 68, 68, 0.3)';
              }

              return (
                <div
                  key={t.id}
                  onClick={() => {
                    if (activeOrder) {
                      setInspectTable({ ...t, order: activeOrder });
                    } else if (t.status !== 'reserved') {
                      startOrderForTable(t.name);
                    }
                  }}
                  style={{
                    padding: '1rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: borderStyle,
                    background: cardBg,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    minHeight: '105px',
                    transition: 'all 0.2s ease',
                    boxShadow: activeOrder && activeOrder.status === 'ready' ? '0 0 15px rgba(245, 158, 11, 0.3)' : 'none',
                    animation: isPulse ? 'pulseScale 1.8s infinite ease-in-out' : 'none'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.borderColor = 'var(--accent-primary)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = borderStyle.split(' ')[2] || 'var(--border-color)';
                  }}
                >
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {t.area.replace(' Section', '').replace(' Hall', '')}
                  </span>
                  
                  <span style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)', margin: '4px 0' }}>
                    {t.name}
                  </span>

                  <span className="badge" style={{ 
                    background: statusColor === 'var(--success)' ? 'var(--success-bg)' : statusColor === 'var(--info)' ? 'var(--info-bg)' : statusColor === 'var(--warning)' ? 'var(--warning-bg)' : 'var(--danger-bg)',
                    color: statusColor,
                    fontSize: '0.68rem',
                    padding: '0.15rem 0.5rem'
                  }}>
                    {statusLabel}
                  </span>

                  {activeOrder && (
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px', fontWeight: '600' }}>
                      Rs. {Number(activeOrder.total_amount).toLocaleString()}
                    </span>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {/* ── Section 2: Active Orders Queue ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div>
          <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            🍳 Active Service Queue ({orders.length})
          </h3>
        </div>

        {/* Status Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.3rem', background: 'var(--bg-hover)', padding: '0.2rem', borderRadius: 'var(--radius-md)' }}>
          <button
            onClick={() => setQueueTab('all')}
            className={`btn ${queueTab === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.72rem', borderRadius: 'var(--radius-sm)' }}
          >
            All Active
          </button>
          <button
            onClick={() => setQueueTab('cooking')}
            className={`btn ${queueTab === 'cooking' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.72rem', borderRadius: 'var(--radius-sm)' }}
          >
            ⏳ Cooking
          </button>
          <button
            onClick={() => setQueueTab('ready')}
            className={`btn ${queueTab === 'ready' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.72rem', borderRadius: 'var(--radius-sm)' }}
          >
            🛎️ Ready ({orders.filter(o => o.status === 'ready').length})
          </button>
          <button
            onClick={() => setQueueTab('served')}
            className={`btn ${queueTab === 'served' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.72rem', borderRadius: 'var(--radius-sm)' }}
          >
            Served
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading active queue...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="glass-card" style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📋</div>
          <h3>No Orders Found</h3>
          <p style={{ marginTop: '0.4rem', fontSize: '0.88rem' }}>No orders matching the selected queue filters.</p>
        </div>
      ) : (
        <div className="grid-cols-3">
          {filteredOrders.map((order, index) => (
            <OrderCard 
              key={order.id} 
              order={order} 
              onUpdateStatus={handleUpdateStatus} 
              showActions={true} 
              staggerIndex={index} 
            />
          ))}
        </div>
      )}

      {/* ── Table Inspection / Quick Action Modal ── */}
      <Modal
        isOpen={inspectTable !== null}
        onClose={() => setInspectTable(null)}
        title={inspectTable ? `🔍 Inspect Table ${inspectTable.name}` : ''}
        footer={
          inspectTable && inspectTable.order && (
            <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
              {inspectTable.order.status === 'ready' && (
                <button
                  onClick={() => handleUpdateStatus(inspectTable.order.id, 'served')}
                  className="btn btn-primary"
                  style={{ flex: 1, background: 'var(--success)' }}
                >
                  🛎️ Mark Served & Clean Table
                </button>
              )}
              <button 
                onClick={() => setInspectTable(null)} 
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Close View
              </button>
            </div>
          )
        }
      >
        {inspectTable && inspectTable.order && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.5rem 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-table-row)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Order ID</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)' }}>#{inspectTable.order.order_number}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'right' }}>Status</div>
                <div style={{ 
                  fontWeight: '700', 
                  color: inspectTable.order.status === 'ready' ? 'var(--warning)' : 'var(--info)',
                  fontSize: '1rem' 
                }}>
                  {inspectTable.order.status === 'ready' ? '🛎️ Food is Ready!' : '🍳 Cooking in Kitchen'}
                </div>
              </div>
            </div>

            <div style={{ fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
              Items Summary ({inspectTable.order.items?.length || 0})
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHieght: '200px', overflowY: 'auto' }}>
              {inspectTable.order.items?.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.65rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
                  <div style={{ fontWeight: '600' }}>
                    <span style={{ color: 'var(--accent-primary)', marginRight: '6px' }}>{item.quantity}x</span> 
                    {item.item_name}
                    {item.variant && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginLeft: '20px' }}>({item.variant})</span>}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>Rs. {(Number(item.price_at_time) * item.quantity).toLocaleString()}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '0.8rem', marginTop: '0.5rem', fontSize: '1.1rem', fontWeight: '800' }}>
              <span>Total Estimated:</span>
              <span className="gradient-text">Rs. {Number(inspectTable.order.total_amount).toLocaleString()}</span>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
};

export default WaiterDashboard;
