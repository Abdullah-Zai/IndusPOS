import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import OrderCard from '../../components/OrderCard';
import Modal from '../../components/Modal';

const Billing = () => {
  const { authFetch } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [billingLoading, setBillingLoading] = useState(false);
  const [receipt, setReceipt] = useState(null);

  const loadOpenOrders = async () => {
    try {
      const res = await authFetch('/api/orders');
      const data = await res.json();
      // Show open orders that are not completed and do not have a bill
      const open = data.filter(o => o.status !== 'completed' && o.status !== 'cancelled' && !o.has_bill);
      setOrders(open);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOpenOrders();
  }, []);

  const handleBillOrder = (order) => {
    setSelectedOrder(order);
    setPaymentMethod('Cash');
  };

  const confirmBilling = async () => {
    if (!selectedOrder) return;
    setBillingLoading(true);
    try {
      const res = await authFetch(`/api/orders/${selectedOrder.id}/bill`, {
        method: 'POST',
        body: JSON.stringify({
          order_id: selectedOrder.id,
          total_amount: selectedOrder.total_amount,
          payment_method: paymentMethod
        })
      });

      if (!res.ok) throw new Error('Failed to create bill');
      const billData = await res.json();
      
      setReceipt({ ...selectedOrder, bill_number: billData.bill_number, payment_method: paymentMethod });
      setSelectedOrder(null);
      loadOpenOrders();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setBillingLoading(false);
    }
  };

  return (
    <div className="page-body animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h3>🧾 Open Table Billing & Settle Orders</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Settle open table orders served by waiters or dining customers.</p>
        </div>
        <button onClick={loadOpenOrders} className="btn btn-secondary" style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}>
          🔄 Refresh Table List
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading open tables...</div>
      ) : orders.length === 0 ? (
        <div className="glass-card" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
          <h3>All Tables Settle & Paid</h3>
          <p style={{ marginTop: '0.5rem' }}>There are currently no unpaid or pending table orders.</p>
        </div>
      ) : (
        <div className="grid-cols-3">
          {orders.map((order, index) => (
            <OrderCard key={order.id} order={order} onBillOrder={handleBillOrder} staggerIndex={index} />
          ))}
        </div>
      )}

      {/* Confirm Billing Modal */}
      <Modal 
        isOpen={!!selectedOrder} 
        onClose={() => setSelectedOrder(null)} 
        title={`Settle Bill for Order #${selectedOrder?.order_number}`}
        footer={
          <>
            <button onClick={() => setSelectedOrder(null)} className="btn btn-secondary">Cancel</button>
            <button onClick={confirmBilling} className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }} disabled={billingLoading}>
              {billingLoading ? 'Processing...' : `Confirm & Settle (Rs. ${selectedOrder?.total_amount?.toLocaleString()})`}
            </button>
          </>
        }
      >
        {selectedOrder && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', padding: '1rem', background: 'var(--bg-table-row)', borderRadius: 'var(--radius-md)' }}>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Table Number</div>
                <div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-primary)' }}>{selectedOrder.table_no || selectedOrder.order_type.toUpperCase()}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Amount</div>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#10b981' }}>Rs. {selectedOrder.total_amount?.toLocaleString()}</div>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '1.5rem' }}>
              <label className="form-label">Payment Method</label>
              <select className="form-select" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <option value="Cash">💵 Cash</option>
                <option value="Card">💳 Credit / Debit Card</option>
                <option value="Online">📱 Online Transfer</option>
              </select>
            </div>
          </div>
        )}
      </Modal>

      {/* Receipt Modal */}
      <Modal 
        isOpen={!!receipt} 
        onClose={() => setReceipt(null)} 
        title="🎉 Table Bill Settled!"
        footer={
          <button onClick={() => setReceipt(null)} className="btn btn-primary">Done</button>
        }
      >
        {receipt && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🧾</div>
            <h2 style={{ fontSize: '1.6rem', color: 'var(--text-primary)' }}>INDUS HOTEL</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Bill Settled • Order #{receipt.order_number}</p>
            
            <div style={{ margin: '1.5rem 0', padding: '1rem', background: 'var(--bg-table-row)', borderRadius: 'var(--radius-md)', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span>Bill Number:</span>
                <b>{receipt.bill_number}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginTop: '0.4rem' }}>
                <span>Payment Method:</span>
                <b>{receipt.payment_method}</b>
              </div>
              <hr style={{ borderColor: 'var(--border-color)', margin: '0.75rem 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: '800', color: '#10b981' }}>
                <span>Paid Amount:</span>
                <span>Rs. {receipt.total_amount?.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Billing;
