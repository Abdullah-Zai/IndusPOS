import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import OrderCard from '../../components/OrderCard';
import Modal from '../../components/Modal';
import { printThermalReceipt } from '../../components/PrintReceipt';
import { ClockIcon, CheckIcon, AlertIcon } from '../../components/Icons';

const getActiveShift = () => {
  const saved = localStorage.getItem('indus_cashier_shifts');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return parsed.find(s => s.status === 'open');
    } catch (err) {}
  }
  return null;
};

const Billing = () => {
  const { authFetch, user } = useAuth();
  const [activeTab, setActiveTab] = useState('settle'); // 'settle' | 'history'
  const [activeShift, setActiveShift] = useState(getActiveShift());
  const [cashReceived, setCashReceived] = useState('');

  // Recheck shift status
  useEffect(() => {
    setActiveShift(getActiveShift());
  }, [activeTab]);

  // ── Settle Orders ──
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [billingLoading, setBillingLoading] = useState(false);
  const [receipt, setReceipt] = useState(null);

  // ── Bill History ──
  const [billHistory, setBillHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFilter, setHistoryFilter] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [viewBill, setViewBill] = useState(null); // bill selected to view/reprint

  const loadOpenOrders = useCallback(async () => {
    try {
      const res = await authFetch('/api/orders');
      const data = await res.json();
      const open = data.filter(o => o.status !== 'completed' && o.status !== 'cancelled' && !o.has_bill);
      setOrders(open);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  const loadBillHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const url = historyFilter ? `/api/bills?business_date=${historyFilter}` : '/api/bills';
      const res = await authFetch(url);
      const data = await res.json();
      setBillHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  }, [authFetch, historyFilter]);

  useEffect(() => {
    loadOpenOrders();
  }, [loadOpenOrders]);

  useEffect(() => {
    if (activeTab === 'history') loadBillHistory();
  }, [activeTab, loadBillHistory]);

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
    setCashReceived('');
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
    
    // Safety check for cash payment mode
    if (paymentMethod === 'Cash') {
      if (!cashReceived || Number(cashReceived) < getGrandTotal()) {
        alert('⚠️ Cannot settle bill: Cash received is less than the total payable amount!');
        return;
      }
    }
    
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
        items: editingItems,
        cash_received: paymentMethod === 'Cash' ? Number(cashReceived) : finalAmount,
        change_due: paymentMethod === 'Cash' ? Math.max(0, Number(cashReceived) - finalAmount) : 0
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
    printThermalReceipt({
      billNumber: receipt.bill_number,
      orderNumber: receipt.order_number,
      orderType: receipt.order_type,
      tableNo: receipt.table_no,
      paymentMethod: receipt.payment_method,
      items: receipt.items,
      subtotal: receipt.subtotal,
      discount: receipt.discount,
      tax: receipt.tax,
      totalAmount: receipt.total_amount,
      cashierName: user?.username || '',
      createdAt: receipt.created_at,
    });
    setReceipt(null);
  };

  // Filtered history based on search
  const filteredHistory = billHistory.filter(b => {
    if (!historySearch) return true;
    const q = historySearch.toLowerCase();
    return (
      String(b.bill_number).includes(q) ||
      (b.table_no || '').toLowerCase().includes(q) ||
      (b.order_type || '').toLowerCase().includes(q) ||
      (b.payment_method || '').toLowerCase().includes(q) ||
      String(b.total_amount).includes(q)
    );
  });

  if (user?.role === 'cashier' && !activeShift) {
    return (
      <div className="page-body animate-fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="glass-card" style={{ maxWidth: '480px', width: '100%', padding: '2.5rem', textAlign: 'center', borderColor: 'rgba(239, 68, 68, 0.4)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1.25rem', filter: 'drop-shadow(0 0 10px rgba(239, 68, 68, 0.3))' }}>🔒</div>
          <h3 style={{ fontSize: '1.4rem', color: 'var(--text-primary)', marginBottom: '0.65rem', fontWeight: '800' }}>Billing Register Locked</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '1.25rem' }}>
            Open your shift register on the <b>Dashboard</b> tab first. Recording your starting float is required before you can settle and print customer bills — this keeps the daily cash reconciliation accurate.
          </p>
          <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px dashed rgba(239, 68, 68, 0.3)', padding: '0.6rem 0.9rem', borderRadius: 'var(--radius-md)', fontSize: '0.83rem', color: 'var(--danger)', fontWeight: '600' }}>
            ⚠️ Bill settlement is disabled until shift is open.
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
            Note: The Takeaway POS terminal is still accessible.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-body animate-fade-in">
      {/* ── Page Header + Tabs ── */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '0.25rem' }}>🧾 Billing Management</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
          Settle open table orders and view complete billing history.
        </p>
        {/* Tab Bar */}
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '0' }}>
          {[
            { id: 'settle', label: '🪑 Settle Orders', badge: orders.length || null },
            { id: 'history', label: '📋 Bill History' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '0.55rem 1.25rem',
                fontSize: '0.9rem',
                fontWeight: activeTab === tab.id ? '700' : '500',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.id ? '3px solid var(--accent-primary)' : '3px solid transparent',
                color: activeTab === tab.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                marginBottom: '-2px',
                transition: 'color 0.2s',
              }}
            >
              {tab.label}
              {tab.badge > 0 && (
                <span style={{ background: 'var(--danger)', color: '#fff', fontSize: '0.7rem', padding: '1px 6px', borderRadius: '999px', fontWeight: '700' }}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
          {/* Refresh button aligned right */}
          <button
            onClick={activeTab === 'history' ? loadBillHistory : loadOpenOrders}
            className="btn btn-secondary"
            style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem', marginLeft: 'auto', marginBottom: '4px' }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* ── TAB: Settle Orders ── */}
      {activeTab === 'settle' && (
        <>
          {loading ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading open tables...</div>
          ) : orders.length === 0 ? (
            <div className="glass-card" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
              <h3>All Tables Settled &amp; Paid</h3>
              <p style={{ marginTop: '0.5rem' }}>There are currently no unpaid or pending table orders.</p>
            </div>
          ) : (
            <div className="grid-cols-3">
              {orders.map((order, index) => (
                <OrderCard key={order.id} order={order} onBillOrder={handleBillOrder} staggerIndex={index} />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── TAB: Bill History ── */}
      {activeTab === 'history' && (
        <div>
          {/* Filters Row */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="date"
              value={historyFilter}
              onChange={e => setHistoryFilter(e.target.value)}
              className="form-control"
              style={{ width: '165px', padding: '0.45rem 0.6rem', fontSize: '0.85rem', background: 'var(--bg-input)' }}
              title="Filter by business date"
            />
            {historyFilter && (
              <button onClick={() => setHistoryFilter('')} className="btn btn-secondary" style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}>
                ✕ Clear Date
              </button>
            )}
            <input
              type="text"
              value={historySearch}
              onChange={e => setHistorySearch(e.target.value)}
              placeholder="🔍 Search bill#, table, payment..."
              className="form-control"
              style={{ flex: 1, minWidth: '200px', padding: '0.45rem 0.75rem', fontSize: '0.85rem', background: 'var(--bg-input)' }}
            />
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
              {filteredHistory.length} bill{filteredHistory.length !== 1 ? 's' : ''}
            </div>
          </div>

          {historyLoading ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading bill history...</div>
          ) : filteredHistory.length === 0 ? (
            <div className="glass-card" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🧾</div>
              <h3>No Bills Found</h3>
              <p style={{ marginTop: '0.5rem' }}>No billing records match your filters.</p>
            </div>
          ) : (
            <div className="table-container glass-card">
              <table className="custom-table" style={{ fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Type</th>
                    <th>Table / Info</th>
                    <th>Items</th>
                    <th>Payment</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map(bill => (
                    <tr key={bill.id}>
                      <td>
                        <span style={{ fontWeight: '800', color: 'var(--accent-primary)', fontFamily: 'monospace', fontSize: '0.9rem' }}>
                          INV-{String(bill.bill_number).padStart(5, '0')}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{bill.business_date}</td>
                      <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap', fontSize: '0.78rem' }}>
                        {new Date(bill.created_at).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true })}
                      </td>
                      <td>
                        <span className={`badge ${bill.order_type === 'dine_in' ? 'badge-info' : bill.order_type === 'delivery' ? 'badge-warning' : 'badge-success'}`}>
                          {bill.order_type === 'dine_in' ? '🪑 Dine-In' : bill.order_type === 'delivery' ? '🚗 Delivery' : '🛍️ Takeaway'}
                        </span>
                      </td>
                      <td style={{ fontWeight: '600' }}>{bill.table_no || '—'}</td>
                      <td style={{ color: 'var(--text-secondary)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                          title={bill.items?.map(it => `${it.quantity}x ${it.item_name}`).join(', ')}>
                        {bill.items?.length || 0} item{bill.items?.length !== 1 ? 's' : ''}
                      </td>
                      <td>
                        <span style={{ fontSize: '0.78rem', padding: '2px 8px', background: 'var(--bg-table-row)', border: '1px solid var(--border-color)', borderRadius: '999px', fontWeight: '600' }}>
                          {bill.payment_method}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: '800', color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                        Rs. {Number(bill.total_amount).toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                          <button
                            onClick={() => setViewBill(bill)}
                            className="btn btn-secondary"
                            style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                            title="View bill details"
                          >
                            👁 View
                          </button>
                          <button
                            onClick={() => printThermalReceipt({
                              billNumber: bill.bill_number,
                              orderNumber: bill.order_number,
                              orderType: bill.order_type,
                              tableNo: bill.table_no,
                              paymentMethod: bill.payment_method,
                              items: bill.items,
                              subtotal: bill.total_amount,
                              discount: 0,
                              tax: 0,
                              totalAmount: bill.total_amount,
                              cashierName: user?.username || '',
                              createdAt: bill.created_at,
                            })}
                            className="btn btn-primary"
                            style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', background: 'var(--accent-gradient)' }}
                            title="Reprint receipt"
                          >
                            🖨️ Reprint
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── View Bill Modal ── */}
      <Modal
        isOpen={!!viewBill}
        onClose={() => setViewBill(null)}
        title={`Invoice INV-${viewBill ? String(viewBill.bill_number).padStart(5,'0') : ''}`}
        footer={
          <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
            <button
              onClick={() => {
                printThermalReceipt({
                  billNumber: viewBill.bill_number,
                  orderNumber: viewBill.order_number,
                  orderType: viewBill.order_type,
                  tableNo: viewBill.table_no,
                  paymentMethod: viewBill.payment_method,
                  items: viewBill.items,
                  subtotal: viewBill.total_amount,
                  discount: 0, tax: 0,
                  totalAmount: viewBill.total_amount,
                  cashierName: user?.username || '',
                  createdAt: viewBill.created_at,
                });
              }}
              className="btn btn-primary"
              style={{ flex: 1, background: 'var(--accent-gradient)' }}
            >
              🖨️ Reprint Bill
            </button>
            <button onClick={() => setViewBill(null)} className="btn btn-secondary" style={{ flex: 1 }}>Close</button>
          </div>
        }
      >
        {viewBill && (
          <div style={{ fontFamily: 'Courier New, monospace', fontSize: '0.85rem', color: '#000', background: '#fff', padding: '1rem', maxWidth: '320px', margin: '0 auto', border: '1px solid #ddd', borderRadius: '8px' }}>
            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '46px', height: '46px', borderRadius: '50%', border: '2px solid #000', fontSize: '16px', fontWeight: '900', marginBottom: '4px' }}>IL</div>
              <div style={{ fontSize: '15px', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase' }}>Indus Legacy</div>
              <div style={{ fontSize: '9px', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#555' }}>Hotel &amp; Restaurant</div>
            </div>
            <hr style={{ borderTop: '3px double #000', margin: '6px 0' }} />
            {[
              ['Invoice #', `INV-${String(viewBill.bill_number).padStart(5,'0')}`],
              ['Date', viewBill.business_date],
              ['Time', new Date(viewBill.created_at).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true })],
              ['Order Type', viewBill.order_type === 'dine_in' ? 'Dine-In' : viewBill.order_type === 'delivery' ? 'Delivery' : 'Takeaway'],
              viewBill.table_no ? [viewBill.order_type === 'delivery' ? 'Rider' : 'Table', viewBill.table_no] : null,
            ].filter(Boolean).map(([label, val], i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '1.5px 0', fontSize: '11px' }}>
                <span style={{ color: '#555' }}>{label}</span>
                <span style={{ fontWeight: '700' }}>{val}</span>
              </div>
            ))}
            <hr style={{ borderTop: '1px dashed #000', margin: '5px 0' }} />
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #000', fontSize: '10px', textTransform: 'uppercase' }}>
                  <th style={{ textAlign: 'left', padding: '2px 0' }}>Item</th>
                  <th style={{ textAlign: 'center', padding: '2px 4px' }}>Qty</th>
                  <th style={{ textAlign: 'right', padding: '2px 0' }}>Price</th>
                  <th style={{ textAlign: 'right', padding: '2px 0' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {viewBill.items?.map((it, i) => (
                  <tr key={i}>
                    <td style={{ padding: '2px 0', fontSize: '11px', wordBreak: 'break-word' }}>{it.item_name}{it.variant ? ` (${it.variant})` : ''}</td>
                    <td style={{ padding: '2px 4px', fontSize: '11px', textAlign: 'center' }}>{it.quantity}</td>
                    <td style={{ padding: '2px 0', fontSize: '11px', textAlign: 'right' }}>{Number(it.price_at_time).toLocaleString()}</td>
                    <td style={{ padding: '2px 0', fontSize: '11px', textAlign: 'right', fontWeight: '700' }}>{(Number(it.price_at_time) * it.quantity).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <hr style={{ borderTop: '1px solid #000', margin: '5px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '900', padding: '2px 0' }}>
              <span>TOTAL PAYABLE:</span>
              <span>Rs. {Number(viewBill.total_amount).toLocaleString()}</span>
            </div>
            <hr style={{ borderTop: '1px dashed #000', margin: '5px 0' }} />
            <div style={{ textAlign: 'center', margin: '4px 0' }}>
              <span style={{ border: '1.5px solid #000', padding: '2px 10px', fontSize: '10px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>PAID VIA: {viewBill.payment_method}</span>
            </div>
            <hr style={{ borderTop: '3px double #000', margin: '6px 0' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: '700', fontSize: '11px' }}>*** Thank You! Come Again ***</div>
              <div style={{ fontSize: '10px', lineHeight: '1.7', color: '#333', marginTop: '4px' }}>
                Indus Legacy Hotel &amp; Restaurant<br />
                Karachi Bypass Road, Indus Town<br />
                Karachi, Pakistan
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirm Billing Modal */}
      <Modal 
        isOpen={!!selectedOrder} 
        onClose={() => setSelectedOrder(null)} 
        title={`Settle Bill for Order #${selectedOrder?.order_number}`}
        footer={
          <>
            <button onClick={() => setSelectedOrder(null)} className="btn btn-secondary">Cancel</button>
            <button 
              onClick={confirmBilling} 
              className="btn btn-primary" 
              style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }} 
              disabled={billingLoading || (paymentMethod === 'Cash' && (!cashReceived || Number(cashReceived) < getGrandTotal()))}
            >
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
                    onChange={(e) => {
                      let val = Math.max(0, parseFloat(e.target.value) || 0);
                      if (discountType === 'percent') {
                        if (val > 100) val = 100;
                      } else {
                        const sub = getSubtotal();
                        if (val > sub) val = sub;
                      }
                      setDiscount(val);
                    }}
                    className="form-control" 
                    placeholder="0"
                    style={{ flex: 1, padding: '0.35rem 0.5rem', fontSize: '0.85rem', background: 'var(--bg-input)' }} 
                  />
                  <select 
                    value={discountType} 
                    onChange={(e) => {
                      const newType = e.target.value;
                      setDiscountType(newType);
                      if (newType === 'percent' && discount > 100) {
                        setDiscount(100);
                      } else if (newType === 'flat') {
                        const sub = getSubtotal();
                        if (discount > sub) setDiscount(sub);
                      }
                    }} 
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

            {paymentMethod === 'Cash' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Cash Received (PKR)</label>
                  <input 
                    type="number"
                    className="form-input"
                    placeholder="Enter cash received..."
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    style={{ background: 'var(--bg-input)' }}
                    min="0"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Change Due (PKR)</label>
                  <div style={{ 
                    padding: '0.75rem 1rem', 
                    background: 'var(--bg-hover)', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: 'var(--radius-md)',
                    fontSize: '1rem',
                    fontWeight: '800',
                    color: Number(cashReceived) >= getGrandTotal() ? 'var(--success)' : 'var(--danger)',
                    display: 'flex',
                    alignItems: 'center',
                    height: '43px'
                  }}>
                    Rs. {Number(cashReceived) >= getGrandTotal() ? (Number(cashReceived) - getGrandTotal()).toLocaleString() : '0'}
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'Cash' && cashReceived && Number(cashReceived) < getGrandTotal() && (
              <div style={{ color: 'var(--danger)', fontSize: '0.82rem', fontWeight: '700', marginTop: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239, 68, 68, 0.25)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                ⚠️ Cash received is short by Rs. {(getGrandTotal() - Number(cashReceived)).toLocaleString()}
              </div>
            )}
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
            <button onClick={handlePrintReceipt} className="btn btn-primary" style={{ flex: 1, background: 'var(--accent-gradient)' }}>
              🖨️ Print Bill
            </button>
            <button onClick={() => setReceipt(null)} className="btn btn-secondary" style={{ flex: 1 }}>
              💾 Save Only
            </button>
          </div>
        }
      >
        {receipt && (
          <div style={{ fontFamily: 'Courier New, monospace', fontSize: '0.85rem', color: '#000', background: '#fff', padding: '1rem', maxWidth: '320px', margin: '0 auto', border: '1px solid #ddd', borderRadius: '8px' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '50%', border: '2px solid #000', fontSize: '18px', fontWeight: '900', marginBottom: '4px' }}>IL</div>
              <div style={{ fontSize: '16px', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase' }}>Indus Legacy</div>
              <div style={{ fontSize: '9px', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#555' }}>Hotel &amp; Restaurant</div>
            </div>

            <hr style={{ borderTop: '3px double #000', margin: '6px 0' }} />

            {/* Invoice Info */}
            {[
              ['Invoice #', `INV-${String(receipt.bill_number).padStart(5,'0')}`],
              ['Date', new Date(receipt.created_at).toLocaleDateString('en-PK', { day:'2-digit', month:'short', year:'numeric' })],
              ['Time', new Date(receipt.created_at).toLocaleTimeString('en-PK', { hour:'2-digit', minute:'2-digit', hour12: true })],
              ['Order Type', receipt.order_type === 'dine_in' ? 'Dine-In' : receipt.order_type === 'delivery' ? 'Delivery' : 'Takeaway'],
              receipt.table_no ? [receipt.order_type === 'delivery' ? 'Rider' : 'Table', receipt.table_no] : null,
              user?.username ? ['Cashier', user.username] : null,
            ].filter(Boolean).map(([label, val], i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '1.5px 0', fontSize: '11px' }}>
                <span style={{ color: '#555' }}>{label}</span>
                <span style={{ fontWeight: '700' }}>{val}</span>
              </div>
            ))}

            <hr style={{ borderTop: '1px dashed #000', margin: '5px 0' }} />

            {/* Items */}
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #000', fontSize: '10px', textTransform: 'uppercase' }}>
                  <th style={{ textAlign: 'left', padding: '2px 0' }}>Item</th>
                  <th style={{ textAlign: 'center', padding: '2px 4px' }}>Qty</th>
                  <th style={{ textAlign: 'right', padding: '2px 0' }}>Price</th>
                  <th style={{ textAlign: 'right', padding: '2px 0' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {receipt.items?.map((it, i) => (
                  <tr key={i}>
                    <td style={{ padding: '2px 0', fontSize: '11px', wordBreak: 'break-word' }}>{it.item_name}{it.variant ? ` (${it.variant})` : ''}</td>
                    <td style={{ padding: '2px 4px', fontSize: '11px', textAlign: 'center' }}>{it.quantity}</td>
                    <td style={{ padding: '2px 0', fontSize: '11px', textAlign: 'right' }}>{Number(it.price_at_time).toLocaleString()}</td>
                    <td style={{ padding: '2px 0', fontSize: '11px', textAlign: 'right', fontWeight: '700' }}>{(Number(it.price_at_time) * it.quantity).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <hr style={{ borderTop: '1px dashed #000', margin: '5px 0' }} />

            {/* Totals */}
            {[['Subtotal', `Rs. ${receipt.subtotal?.toLocaleString()}`, '#000'],
              receipt.discount > 0 ? ['Discount', `- Rs. ${receipt.discount?.toLocaleString()}`, '#c0392b'] : null,
              receipt.tax > 0 ? ['GST Tax', `+ Rs. ${receipt.tax?.toLocaleString()}`, '#555'] : null,
            ].filter(Boolean).map(([label, val, color], i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color, padding: '1.5px 0' }}>
                <span>{label}</span><span>{val}</span>
              </div>
            ))}

            <hr style={{ borderTop: '1px solid #000', margin: '5px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '900', padding: '2px 0' }}>
              <span>TOTAL PAYABLE:</span>
              <span>Rs. {receipt.total_amount?.toLocaleString()}</span>
            </div>

            <hr style={{ borderTop: '1px dashed #000', margin: '5px 0' }} />

            <div style={{ textAlign: 'center', margin: '4px 0' }}>
              <span style={{ border: '1.5px solid #000', padding: '2px 10px', fontSize: '10px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>PAID VIA: {receipt.payment_method}</span>
            </div>

            <hr style={{ borderTop: '3px double #000', margin: '6px 0' }} />

            {/* Footer */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: '700', fontSize: '11px' }}>*** Thank You! Come Again ***</div>
              <div style={{ fontSize: '10px', lineHeight: '1.7', color: '#333', marginTop: '4px' }}>
                Indus Legacy Hotel &amp; Restaurant<br />
                Karachi Bypass Road, Indus Town<br />
                Karachi, Pakistan
              </div>
              <div style={{ fontSize: '9px', color: '#888', marginTop: '4px' }}>Powered by Indus Legacy</div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Billing;
