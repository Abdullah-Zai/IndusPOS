import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import OrderCard from '../../components/OrderCard';
import Modal from '../../components/Modal';

const Billing = () => {
  const { authFetch, user } = useAuth();
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

  const getSavedTaxRate = () => {
    const saved = localStorage.getItem('indus_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.taxRate !== undefined) return parsed.taxRate;
      } catch (err) {}
    }
    return 13;
  };

  const [editingItems, setEditingItems] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState('percent'); // percent, flat
  const [taxRate, setTaxRate] = useState(getSavedTaxRate);

  const handleBillOrder = (order) => {
    setSelectedOrder(order);
    setPaymentMethod('Cash');
    setEditingItems(order.items ? order.items.map(it => ({ ...it })) : []);
    setDiscount(0);
    setDiscountType('percent');
    setTaxRate(getSavedTaxRate());
  };

  const getSubtotal = () => {
    return editingItems.reduce((acc, it) => acc + (Number(it.price_at_time) * it.quantity), 0);
  };

  const getDiscountAmount = () => {
    const sub = getSubtotal();
    if (discountType === 'percent') {
      return (sub * Number(discount)) / 100;
    } else {
      return Number(discount);
    }
  };

  const getTaxAmount = () => {
    const sub = getSubtotal();
    const disc = getDiscountAmount();
    const taxable = Math.max(0, sub - disc);
    return (taxable * Number(taxRate)) / 100;
  };

  const getGrandTotal = () => {
    const sub = getSubtotal();
    const disc = getDiscountAmount();
    const tax = getTaxAmount();
    return Math.max(0, sub - disc + tax);
  };

  const confirmBilling = async () => {
    if (!selectedOrder) return;
    setBillingLoading(true);
    const finalAmount = getGrandTotal();
    try {
      const res = await authFetch(`/api/orders/${selectedOrder.id}/bill`, {
        method: 'POST',
        body: JSON.stringify({
          order_id: selectedOrder.id,
          total_amount: finalAmount,
          payment_method: paymentMethod
        })
      });

      if (!res.ok) throw new Error('Failed to create bill');
      const billData = await res.json();
      
      setReceipt({ 
        ...selectedOrder, 
        bill_number: billData.bill_number, 
        payment_method: paymentMethod,
        subtotal: getSubtotal(),
        discount: getDiscountAmount(),
        tax: getTaxAmount(),
        total_amount: finalAmount,
        items: editingItems
      });
      setSelectedOrder(null);
      loadOpenOrders();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setBillingLoading(false);
    }
  };

  const handlePrintReceipt = () => {
    const printContent = document.getElementById('billing-receipt-print-area').innerHTML;
    const printWindow = window.open('', '', 'width=600,height=800');
    printWindow.document.write('<html><head><title>Print Invoice</title>');
    printWindow.document.write('<style>');
    printWindow.document.write(`
      body { font-family: monospace; padding: 20px; color: #000; background: #fff; }
      .receipt-title { font-size: 1.5rem; font-weight: bold; text-align: center; margin-bottom: 5px; text-transform: uppercase; }
      .receipt-subtitle { font-size: 0.85rem; text-align: center; color: #555; margin-bottom: 20px; }
      .receipt-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; font-size: 0.85rem; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 15px; }
      .receipt-items { display: flex; flex-direction: column; gap: 5px; font-size: 0.9rem; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 15px; }
      .receipt-item { display: flex; justify-content: space-between; }
      .receipt-breakdown { display: flex; flex-direction: column; gap: 5px; font-size: 0.85rem; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 15px; }
      .receipt-total { display: flex; justify-content: space-between; font-size: 1.25rem; font-weight: bold; margin-top: 10px; color: #000; }
      .receipt-footer { text-align: center; font-size: 0.8rem; margin-top: 30px; color: #555; }
    `);
    printWindow.document.write('</style></head><body>');
    printWindow.document.write(printContent);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
    setReceipt(null);
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
              {billingLoading ? 'Processing...' : `Confirm & Settle (Rs. ${getGrandTotal().toLocaleString()})`}
            </button>
          </>
        }
      >
        {selectedOrder && (
          <div>
            {/* Table / Order Info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', padding: '0.85rem 1rem', background: 'var(--bg-table-row)', borderRadius: 'var(--radius-md)' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Order Type</div>
                <div style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                  {selectedOrder.order_type === 'dine_in' ? '🪑 Dine-In' : selectedOrder.order_type === 'delivery' ? '🚗 Delivery' : '🛍️ Takeaway'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Table / Destination</div>
                <div style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                  {selectedOrder.table_no || '—'}
                </div>
              </div>
            </div>

            {/* Editable Order Items List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto', paddingRight: '0.25rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.75rem', marginBottom: '1rem', background: 'rgba(255, 255, 255, 0.02)' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.35rem', marginBottom: '0.25rem' }}>
                {user?.role === 'cashier' ? '📋 Invoice Items' : '🖊️ Edit Item Quantities'}
              </div>
              {editingItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No items in order</div>
              ) : (
                editingItems.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', padding: '0.15rem 0' }}>
                    <div style={{ flex: 1, paddingRight: '0.5rem' }}>{item.item_name} {item.variant ? `(${item.variant})` : ''}</div>
                    {user?.role === 'cashier' ? (
                      <span style={{ fontWeight: 'bold', color: 'var(--text-secondary)' }}>Qty: {item.quantity}</span>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <button 
                          type="button" 
                          onClick={() => {
                            const updated = editingItems.map((it, i) => i === idx ? { ...it, quantity: Math.max(1, it.quantity - 1) } : it);
                            setEditingItems(updated);
                          }} 
                          className="btn btn-secondary" 
                          style={{ padding: '0.1rem 0.4rem', fontSize: '0.75rem', minWidth: 'unset', height: '24px' }}
                        >
                          -
                        </button>
                        <span style={{ fontWeight: 'bold', minWidth: '15px', textAlign: 'center' }}>{item.quantity}</span>
                        <button 
                          type="button" 
                          onClick={() => {
                            const updated = editingItems.map((it, i) => i === idx ? { ...it, quantity: it.quantity + 1 } : it);
                            setEditingItems(updated);
                          }} 
                          className="btn btn-secondary" 
                          style={{ padding: '0.1rem 0.4rem', fontSize: '0.75rem', minWidth: 'unset', height: '24px' }}
                        >
                          +
                        </button>
                        <button 
                          type="button" 
                          onClick={() => {
                            const updated = editingItems.filter((_, i) => i !== idx);
                            setEditingItems(updated);
                          }} 
                          className="btn btn-secondary" 
                          style={{ padding: '0.15rem 0.4rem', fontSize: '0.75rem', minWidth: 'unset', color: 'var(--danger)', height: '24px' }}
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Discounts & Tax Controls */}
            <div className="billing-controls-grid" style={{ background: 'var(--bg-table-row)', borderRadius: 'var(--radius-md)', padding: '0.75rem', marginBottom: '1rem' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>Discount</label>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  <input 
                    type="number" 
                    value={discount || ''} 
                    onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="form-control" 
                    placeholder="0"
                    style={{ flex: 1, padding: '0.35rem 0.5rem', fontSize: '0.85rem', background: 'var(--bg-input)' }} 
                  />
                  <select 
                    value={discountType} 
                    onChange={(e) => setDiscountType(e.target.value)} 
                    className="form-control" 
                    style={{ width: '60px', padding: '0.35rem 0.25rem', fontSize: '0.85rem', background: 'var(--bg-input)' }}
                  >
                    <option value="percent">%</option>
                    <option value="flat">PKR</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>GST Tax Rate (%)</label>
                <input 
                  type="number" 
                  value={taxRate} 
                  onChange={(e) => setTaxRate(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="form-control" 
                  style={{ width: '100%', padding: '0.35rem 0.5rem', fontSize: '0.85rem', background: 'var(--bg-input)' }} 
                />
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Subtotal:</span>
                <span>Rs. {getSubtotal().toLocaleString()}</span>
              </div>
              {getDiscountAmount() > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--danger)' }}>
                  <span>Discount:</span>
                  <span>- Rs. {getDiscountAmount().toLocaleString()}</span>
                </div>
              )}
              {getTaxAmount() > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                  <span>GST Tax ({taxRate}%):</span>
                  <span>+ Rs. {getTaxAmount().toLocaleString()}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: '800', borderTop: '1px dashed var(--border-color)', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
                <span>Final Payable:</span>
                <span className="gradient-text">Rs. {getGrandTotal().toLocaleString()}</span>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label className="form-label">Payment Mode</label>
              <select className="form-select" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} style={{ background: 'var(--bg-input)' }}>
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
        title="🎉 Invoice Settled Successfully!"
        footer={
          <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
            <button onClick={handlePrintReceipt} className="btn btn-primary" style={{ flex: 1, background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' }}>
              🖨️ Print Bill
            </button>
            <button onClick={() => setReceipt(null)} className="btn btn-secondary" style={{ flex: 1 }}>
              💾 Save Only
            </button>
          </div>
        }
      >
        {receipt && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🧾</div>
            
            <div id="billing-receipt-print-area">
              <div className="receipt-title">INDUS HOTEL</div>
              <div className="receipt-subtitle">Tax Invoice • Invoice #{receipt.bill_number}</div>
              
              <div className="receipt-grid">
                <div>Type: <b>{receipt.order_type.toUpperCase().replace('_', ' ')}</b></div>
                <div>Method: <b>{receipt.payment_method}</b></div>
                <div>{receipt.order_type === 'delivery' ? 'Rider: ' : 'Table: '}<b>{receipt.table_no || '—'}</b></div>
                <div>Time: <b>{new Date(receipt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</b></div>
              </div>
              
              <div className="receipt-items">
                {receipt.items?.map((it, i) => (
                  <div key={i} className="receipt-item">
                    <span>{it.quantity}x {it.item_name} {it.variant ? `(${it.variant})` : ''}</span>
                    <span>Rs. {(Number(it.price_at_time) * it.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              
              <div className="receipt-breakdown">
                <div style={{ display: 'flex', justifycontent: 'space-between' }}>
                  <span>Subtotal:</span>
                  <span>Rs. {receipt.subtotal?.toLocaleString()}</span>
                </div>
                {receipt.discount > 0 && (
                  <div style={{ display: 'flex', justifycontent: 'space-between', color: '#ff3b30' }}>
                    <span>Discount:</span>
                    <span>- Rs. {receipt.discount?.toLocaleString()}</span>
                  </div>
                )}
                {receipt.tax > 0 && (
                  <div style={{ display: 'flex', justifycontent: 'space-between' }}>
                    <span>GST Tax:</span>
                    <span>+ Rs. {receipt.tax?.toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="receipt-total">
                <span>Grand Total:</span>
                <span>Rs. {receipt.total_amount?.toLocaleString()}</span>
              </div>
              
              <div className="receipt-footer">
                Thank you for dining with Indus Hotel!
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Billing;
