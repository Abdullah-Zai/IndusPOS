import React from 'react';

const OrderCard = ({ order, onUpdateStatus, onBillOrder, showActions = true }) => {
  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending': return <span className="badge badge-warning">⏳ Pending</span>;
      case 'preparing': return <span className="badge badge-info">🍳 Preparing</span>;
      case 'ready': return <span className="badge badge-success">🔔 Ready to Serve</span>;
      case 'served': return <span className="badge badge-success">🍽️ Served</span>;
      case 'completed': return <span className="badge badge-secondary">✅ Paid & Completed</span>;
      default: return <span className="badge badge-secondary">{status}</span>;
    }
  };

  return (
    <div className="glass-card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div className="glass-header" style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-primary)' }}>#{order.order_number}</span>
            {order.table_no ? (
              <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.4)' }}>
                Table {order.table_no}
              </span>
            ) : (
              <span className="badge" style={{ background: 'rgba(236, 72, 153, 0.2)', color: '#f472b6' }}>
                {order.order_type.toUpperCase()}
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Date: {order.business_date}
          </div>
        </div>
        <div>
          {getStatusBadge(order.status)}
        </div>
      </div>

      <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
          Ordered Items ({order.items?.length || 0})
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '220px', overflowY: 'auto', paddingRight: '0.25rem' }}>
          {order.items?.map((item, idx) => (
            <div key={idx} style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '0.6rem 0.75rem', 
              background: 'var(--bg-table-row)', 
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ 
                  background: 'var(--accent-primary)', 
                  color: '#ffffff', 
                  fontWeight: '700', 
                  fontSize: '0.8rem',
                  width: '24px', 
                  height: '24px', 
                  borderRadius: '6px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  {item.quantity}x
                </span>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '0.95rem', color: 'var(--text-primary)' }}>{item.item_name}</div>
                  {item.variant && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--accent-primary)' }}>Variant: {item.variant}</div>
                  )}
                </div>
              </div>
              <div style={{ fontWeight: '600', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Rs. {(Number(item.price_at_time) * item.quantity).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showActions && (
        <div style={{ padding: '1rem 1.25rem', background: 'var(--bg-modal-footer)', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '0.75rem' }}>
          {order.status === 'pending' && onUpdateStatus && (
            <>
              <button 
                onClick={() => onUpdateStatus(order.id, 'preparing')} 
                className="btn btn-primary" 
                style={{ flex: 2, padding: '0.6rem' }}
              >
                🍳 Start Cooking
              </button>
              <button 
                onClick={() => { if(confirm('Cancel this order?')) onUpdateStatus(order.id, 'cancelled'); }} 
                className="btn btn-danger" 
                style={{ flex: 1, padding: '0.6rem', border: '1px solid var(--danger)', background: 'transparent', color: 'var(--danger)' }}
              >
                ✕ Cancel
              </button>
            </>
          )}
          {order.status === 'preparing' && onUpdateStatus && (
            <button 
              onClick={() => onUpdateStatus(order.id, 'ready')} 
              className="btn btn-success" 
              style={{ flex: 1, padding: '0.6rem' }}
            >
              🔔 Mark Ready
            </button>
          )}
          {order.status === 'ready' && onUpdateStatus && (
            <button 
              onClick={() => onUpdateStatus(order.id, 'served')} 
              className="btn btn-secondary" 
              style={{ flex: 1, padding: '0.6rem', borderColor: 'var(--success)', color: 'var(--success)' }}
            >
              🍽️ Mark Served
            </button>
          )}
          {onBillOrder && order.status !== 'completed' && (
            <button 
              onClick={() => onBillOrder(order)} 
              className="btn btn-primary" 
              style={{ flex: 1, padding: '0.6rem', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
            >
              🧾 Create Bill (Rs. {order.total_amount?.toLocaleString()})
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default OrderCard;
