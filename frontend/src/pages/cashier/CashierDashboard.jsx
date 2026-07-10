import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { printThermalReceipt } from '../../components/PrintReceipt';
import Modal from '../../components/Modal';
import { 
  FinancialIcon, 
  TrendingUpIcon, 
  PosIcon, 
  BillingIcon, 
  TablesIcon,
  MenuIcon,
  InventoryIcon,
  ClockIcon,
  PrintIcon
} from '../../components/Icons';

const CashierDashboard = ({ setActiveTab }) => {
  const { authFetch, user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);

  // Shift & Cash Register States
  const [shifts, setShifts] = useState([]);
  const [startingFloat, setStartingFloat] = useState('');
  const [endingFloat, setEndingFloat] = useState('');
  const [shiftNotes, setShiftNotes] = useState('');
  const [activeShift, setActiveShift] = useState(null);
  const [dashboardTab, setDashboardTab] = useState('queue');
  const [openShiftModal, setOpenShiftModal] = useState(false);
  const [closeShiftModal, setCloseShiftModal] = useState(false);

  const loadData = async () => {
    try {
      const [ordRes, billsRes] = await Promise.all([
        authFetch('/api/orders'),
        authFetch('/api/bills')
      ]);
      const ordData = await ordRes.json();
      const billsData = await billsRes.json();
      setBills(Array.isArray(billsData) ? billsData : []);
      const openUnbilled = ordData.filter(o => o.status !== 'completed' && o.status !== 'cancelled' && !o.has_bill);
      setOrders(openUnbilled);
    } catch (err) {
      console.error('Cashier dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadShifts = () => {
    const saved = localStorage.getItem('indus_cashier_shifts');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setShifts(parsed);
        const open = parsed.find(s => s.status === 'open');
        if (open) setActiveShift(open);
      } catch (err) {}
    }
  };

  useEffect(() => {
    loadData();
    loadShifts();
    const interval = setInterval(loadData, 8000);
    return () => clearInterval(interval);
  }, []);

  // Shift-based sales calculations (only bills after shift start)
  const getShiftSales = () => {
    if (!activeShift) return { cashSales: 0, cardSales: 0, onlineSales: 0 };
    const shiftStartTime = new Date(activeShift.startTime).getTime();
    const shiftBills = bills.filter(b => new Date(b.created_at).getTime() >= shiftStartTime);
    const cashSales = shiftBills.filter(b => b.payment_method === 'Cash').reduce((s, b) => s + Number(b.total_amount), 0);
    const cardSales = shiftBills.filter(b => b.payment_method === 'Card').reduce((s, b) => s + Number(b.total_amount), 0);
    const onlineSales = shiftBills.filter(b => b.payment_method === 'Online').reduce((s, b) => s + Number(b.total_amount), 0);
    return { cashSales, cardSales, onlineSales };
  };

  const { cashSales, cardSales, onlineSales } = getShiftSales();
  const expectedCash = activeShift ? (activeShift.startingFloat + cashSales) : 0;
  const currentVariance = endingFloat ? (parseFloat(endingFloat) - expectedCash) : 0;

  const handleStartShift = (e) => {
    e.preventDefault();
    if (!startingFloat) return alert('⚠️ Please enter a starting float amount!');
    const newShift = {
      id: Date.now(),
      cashier: user.username,
      date: new Date().toLocaleDateString(),
      startTime: new Date().toISOString(),
      endTime: '',
      startingFloat: parseFloat(startingFloat),
      endingFloat: 0,
      expectedCash: parseFloat(startingFloat),
      variance: 0,
      status: 'open',
      notes: shiftNotes.trim()
    };
    const updated = [newShift, ...shifts];
    localStorage.setItem('indus_cashier_shifts', JSON.stringify(updated));
    setShifts(updated);
    setActiveShift(newShift);
    setStartingFloat('');
    setShiftNotes('');
    setOpenShiftModal(false);
  };

  const handleEndShift = (e) => {
    e.preventDefault();
    if (!endingFloat) return alert('⚠️ Please enter ending cash drawer amount!');
    const finalVariance = parseFloat(endingFloat) - expectedCash;
    if (finalVariance !== 0) {
      const ok = window.confirm(
        `⚠️ Cash Discrepancy!\nExpected: Rs. ${expectedCash.toLocaleString()}\nEntered: Rs. ${parseFloat(endingFloat).toLocaleString()}\nVariance: Rs. ${finalVariance.toLocaleString()}\n\nSettle and log this variance?`
      );
      if (!ok) return;
    }
    const updated = shifts.map(s => s.id === activeShift.id ? {
      ...s,
      endTime: new Date().toISOString(),
      endingFloat: parseFloat(endingFloat),
      expectedCash,
      variance: finalVariance,
      status: 'closed',
      notes: (s.notes || '') + (shiftNotes ? ` | End: ${shiftNotes.trim()}` : '') + (finalVariance !== 0 ? ` | DISCREPANCY: Rs.${finalVariance}` : '')
    } : s);
    localStorage.setItem('indus_cashier_shifts', JSON.stringify(updated));
    setShifts(updated);
    setActiveShift(null);
    setEndingFloat('');
    setShiftNotes('');
    setCloseShiftModal(false);
    alert('🔴 Shift register closed.');
  };

  // Quick-action button definitions
  const quickActions = [
    { id: 'pos',       label: 'Takeaway Legacy',    icon: '🖥️',  desc: 'New order terminal',    color: '#059669', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.35)' },
    { id: 'billing',   label: 'Settle Bills',    icon: '🧾',  desc: 'Settle table payments',  color: '#d97706', bg: 'rgba(245, 158, 11, 0.12)',  border: 'rgba(245, 158, 11, 0.35)'  },
    { id: 'tables',    label: 'Tables Status',   icon: '🪑',  desc: 'View live table map',    color: '#2563eb', bg: 'rgba(59, 130, 246, 0.12)',  border: 'rgba(59, 130, 246, 0.35)'  },
    { id: 'menu',      label: 'Menu List',       icon: '🍽️', desc: 'Browse menu & prices',   color: '#0891b2', bg: 'rgba(8, 145, 178, 0.12)',   border: 'rgba(8, 145, 178, 0.35)'   },
    { id: 'inventory', label: 'Inventory',       icon: '📦',  desc: 'Stock room items',       color: '#db2777', bg: 'rgba(219, 39, 119, 0.12)',  border: 'rgba(219, 39, 119, 0.35)'  },
    { id: 'financials',label: 'Sales Reports',   icon: '📊',  desc: 'Revenue & analytics',    color: '#7c3aed', bg: 'rgba(124, 58, 237, 0.12)',  border: 'rgba(124, 58, 237, 0.35)'  },
  ];

  return (
    <div className="page-body animate-fade-in" style={{ padding: '1.75rem', paddingBottom: '4rem' }}>

      {/* ── REGISTER DRAWER CONTROLLER BAR ── */}
      <div className="glass-card" style={{
        padding: '1.25rem 1.75rem',
        marginBottom: '2rem',
        background: activeShift 
          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0.03) 100%)'
          : 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(245, 158, 11, 0.02) 100%)',
        borderColor: activeShift ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        boxShadow: activeShift ? '0 0 15px rgba(16, 185, 129, 0.05)' : 'none'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            background: activeShift ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.12)',
            border: activeShift ? '1.5px solid rgba(16, 185, 129, 0.4)' : '1.5px solid rgba(245, 158, 11, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            boxShadow: activeShift ? '0 0 12px rgba(16, 185, 129, 0.2)' : 'none'
          }}>
            {activeShift ? '🟢' : '🔒'}
          </div>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '900', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', letterSpacing: '-0.01em' }}>
              Cash Drawer Register {activeShift ? '— Open & Active' : '— Locked & Inactive'}
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, marginTop: '2px' }}>
              {activeShift 
                ? `Active Cashier: ${activeShift.cashier} · Opened at ${new Date(activeShift.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` 
                : 'Declaring the starting float is required to unlock bill settlement features on this terminal.'
              }
            </p>
          </div>
        </div>
        
        {activeShift ? (
          <button 
            onClick={() => setCloseShiftModal(true)} 
            className="btn btn-danger" 
            style={{ 
              padding: '0.65rem 1.25rem', 
              fontSize: '0.88rem', 
              fontWeight: '700', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.4rem', 
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)' 
            }}
          >
            🔒 Close Register &amp; Shift
          </button>
        ) : (
          <button 
            onClick={() => setOpenShiftModal(true)} 
            className="btn btn-warning" 
            style={{ 
              padding: '0.65rem 1.25rem', 
              fontSize: '0.88rem', 
              fontWeight: '800', 
              color: '#fff',
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.4rem', 
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              boxShadow: '0 4px 15px rgba(245, 158, 11, 0.35)',
              border: 'none'
            }}
          >
            🔓 Unlock Drawer &amp; Start Shift
          </button>
        )}
      </div>

      {/* ── QUICK ACTION BUTTONS ── */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.35rem', fontWeight: '800', marginBottom: '1rem' }}>Terminal Quick Actions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '1rem' }}>
          {quickActions.map(action => (
            <button
              key={action.id}
              onClick={() => setActiveTab(action.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.6rem',
                padding: '1.25rem 0.75rem',
                background: action.bg,
                border: `1.5px solid ${action.border}`,
                borderRadius: 'var(--radius-lg)',
                cursor: 'pointer',
                transition: 'all 0.22s cubic-bezier(0.25, 1, 0.5, 1)',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${action.border}`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <span style={{ fontSize: '2rem', lineHeight: 1 }}>{action.icon}</span>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: '800', color: action.color, letterSpacing: '-0.01em' }}>{action.label}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>{action.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── ACTIVE SHIFT STATS ROW ── */}
      {activeShift && (
        <div style={{ marginBottom: '2rem' }}>
          <div className="grid-cols-4" style={{ gap: '1.25rem' }}>
            {[
              { label: 'Opening Float', value: `Rs. ${activeShift.startingFloat.toLocaleString()}`, color: 'var(--accent-primary)', bg: 'rgba(16,185,129,0.06)', border: 'rgba(16,185,129,0.2)', icon: <FinancialIcon width="22" height="22" /> },
              { label: 'Cash Collected', value: `Rs. ${cashSales.toLocaleString()}`, color: 'var(--success)', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', icon: <TrendingUpIcon width="22" height="22" /> },
              { label: 'Card / Online', value: `Rs. ${(cardSales + onlineSales).toLocaleString()}`, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', icon: <BillingIcon width="22" height="22" /> },
              { label: 'Expected in Drawer', value: `Rs. ${expectedCash.toLocaleString()}`, color: 'var(--success)', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.4)', icon: <FinancialIcon width="22" height="22" /> },
            ].map((card, i) => (
              <div key={i} className="glass-card" style={{ padding: '1.2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: card.bg, color: card.color, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${card.border}`, flexShrink: 0 }}>
                  {card.icon}
                </div>
                <div>
                  <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.04em', marginBottom: '2px' }}>{card.label}</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)', fontFamily: 'monospace' }}>{card.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TWO-COLUMN: SETTLE QUEUE + SHIFT LEDGER (ALWAYS VISIBLE!) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>

        {/* Left Column: Settle Queue / Invoice History */}
        <div className="glass-card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', minHeight: '450px' }}>
          
          {/* Tab selector */}
          <div style={{ display: 'flex', gap: '0', borderBottom: '2px solid var(--border-color)', marginBottom: '1.25rem' }}>
            {[
              { id: 'queue',   label: '🪑 Live Settle Queue',  count: orders.length },
              { id: 'recent',  label: '🧾 Recent Invoices',    count: null           },
            ].map(t => (
              <button key={t.id} onClick={() => setDashboardTab(t.id)} style={{
                padding: '0.6rem 1.1rem',
                fontSize: '0.9rem',
                fontWeight: '800',
                background: 'transparent',
                border: 'none',
                borderBottom: dashboardTab === t.id ? '3px solid var(--accent-primary)' : '3px solid transparent',
                color: dashboardTab === t.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                marginBottom: '-2px',
                transition: 'all 0.15s',
              }}>
                {t.label}
                {t.count !== null && t.count > 0 && (
                  <span style={{ background: 'var(--danger)', color: '#fff', fontSize: '0.68rem', padding: '1px 6.5px', borderRadius: '999px', fontWeight: '800' }}>
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* TAB: Settle Queue */}
          {dashboardTab === 'queue' && (
            loading ? (
              <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading live queue…</div>
            ) : orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '5rem 2rem', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎉</div>
                <div style={{ fontWeight: '800', color: 'var(--text-primary)', fontSize: '1.15rem' }}>All dining tables settled</div>
                <div style={{ fontSize: '0.85rem', marginTop: '6px' }}>There are currently no active orders waiting for checkout.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '420px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                {orders.map(order => (
                  <div key={order.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg-table-row)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: '800', fontSize: '1rem' }}>#{order.order_number}</span>
                        <span className={`badge ${order.order_type === 'dine_in' ? 'badge-info' : order.order_type === 'delivery' ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: '0.68rem' }}>
                          {order.order_type === 'dine_in' ? 'Dine-In' : order.order_type === 'delivery' ? 'Delivery' : 'Takeaway'}
                        </span>
                        {order.table_no && (
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '700' }}>Table {order.table_no}</span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <ClockIcon width="12" height="12" />
                        {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                      <div style={{ fontWeight: '800', fontFamily: 'monospace', fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                        Rs. {Number(order.total_amount).toLocaleString()}
                      </div>
                      <button onClick={() => setActiveTab('billing')} className="btn btn-primary" style={{ padding: '0.45rem 1rem', fontSize: '0.85rem', fontWeight: '800', borderRadius: 'var(--radius-md)' }}>
                        Settle Bills →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* TAB: Recent Invoices */}
          {dashboardTab === 'recent' && (
            bills.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '5rem 2rem', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🧾</div>
                <div style={{ fontWeight: '800', color: 'var(--text-primary)', fontSize: '1.15rem' }}>No invoices printed</div>
                <div style={{ fontSize: '0.85rem', marginTop: '6px' }}>Invoice settlement records will appear here as orders are paid.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '420px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                {bills.slice(0, 10).map(bill => (
                  <div key={bill.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg-table-row)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: '800', fontFamily: 'monospace', color: 'var(--accent-primary)', fontSize: '0.92rem' }}>
                          INV-{String(bill.bill_number).padStart(5, '0')}
                        </span>
                        <span className="badge badge-secondary" style={{ fontSize: '0.68rem' }}>{bill.payment_method}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        {new Date(bill.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ fontWeight: '800', fontFamily: 'monospace', fontSize: '1rem' }}>Rs. {Number(bill.total_amount).toLocaleString()}</div>
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
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.3rem', borderRadius: 'var(--radius-md)' }}
                      >
                        <PrintIcon width="12" height="12" /> Reprint
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

        </div>

        {/* Right Column: Shift Ledger (Past Log History) */}
        <div className="glass-card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', minHeight: '450px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: '900', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', letterSpacing: '-0.01em' }}>
            📋 Past Cashier Shift Ledger
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', maxHeight: '380px', overflowY: 'auto', paddingRight: '0.25rem' }}>
            {shifts.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '5rem 2rem', fontSize: '0.88rem' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>💼</div>
                <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>No shift history logged</div>
                <div style={{ fontSize: '0.82rem', marginTop: '4px' }}>Shift registration log records will be created when cashier unlocks drawer.</div>
              </div>
            ) : (
              shifts.map(s => (
                <div key={s.id} style={{ padding: '0.9rem', background: 'var(--bg-table-row)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', fontSize: '0.88rem', marginBottom: '6px' }}>
                    <span>{s.date}</span>
                    <span style={{ color: s.status === 'open' ? 'var(--success)' : 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {s.status === 'open' ? '🟢 Active Shift' : '⚫ Closed Shift'}
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 1rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    <div>Cashier: <b style={{ color: 'var(--text-primary)' }}>{s.cashier}</b></div>
                    <div style={{ textAlign: 'right' }}>Opened: {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    <div>Starting Float: Rs. {s.startingFloat.toLocaleString()}</div>
                    {s.status === 'closed' && <div style={{ textAlign: 'right' }}>Ending Float: Rs. {s.endingFloat.toLocaleString()}</div>}
                  </div>
                  {s.status === 'closed' && (
                    <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed var(--border-color)', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: '800' }}>
                      <span>Reconciled Cash Variance:</span>
                      <span style={{ color: s.variance === 0 ? 'var(--success)' : 'var(--danger)' }}>
                        Rs. {s.variance >= 0 ? `+${s.variance.toLocaleString()}` : s.variance.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {s.notes && (
                    <div style={{ marginTop: '6px', fontSize: '0.78rem', color: 'var(--text-muted)', background: 'var(--bg-hover)', padding: '0.35rem 0.6rem', borderRadius: 'var(--radius-sm)', fontStyle: 'italic' }}>
                      {s.notes}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* ── OPEN SHIFT MODAL ── */}
      <Modal 
        isOpen={openShiftModal} 
        onClose={() => setOpenShiftModal(false)}
        title="🔓 Open Cash Drawer Register"
      >
        <div style={{ padding: '0.5rem 0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(245, 158, 11, 0.06)', border: '1px solid rgba(245, 158, 11, 0.25)', padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '1.75rem' }}>💰</div>
              <div style={{ fontSize: '0.83rem', lineHeight: '1.4', color: 'var(--warning)', fontWeight: '600' }}>
                Please declare the starting float cash currently inside the register drawer. Declaring starting cash unlocks full billing checkout features.
              </div>
            </div>

            <form onSubmit={handleStartShift} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: '700', fontSize: '0.82rem' }}>Opening Float Cash (PKR)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', fontWeight: '700', color: 'var(--text-muted)' }}>Rs.</span>
                  <input
                    type="number" min="0"
                    className="form-input"
                    placeholder="e.g. 15,000"
                    value={startingFloat}
                    onChange={e => setStartingFloat(e.target.value)}
                    required
                    style={{ paddingLeft: '3rem', background: 'var(--bg-input)', fontSize: '1.05rem', fontWeight: '700' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: '700', fontSize: '0.82rem' }}>Opening Shift Notes (Optional)</label>
                <textarea
                  className="form-input"
                  placeholder="Count notes, shift handover reports, specific denominations..."
                  value={shiftNotes}
                  onChange={e => setShiftNotes(e.target.value)}
                  style={{ minHeight: '80px', background: 'var(--bg-input)', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem' }}>
                <button type="button" onClick={() => setOpenShiftModal(false)} className="btn btn-secondary" style={{ flex: 1, padding: '0.75rem', fontWeight: '700' }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-success" style={{ flex: 2, padding: '0.75rem', fontWeight: '800', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.25)' }}>
                  Start Shift &amp; Unlock Register
                </button>
              </div>
            </form>
          </div>
        </div>
      </Modal>

      {/* ── CLOSE SHIFT MODAL ── */}
      <Modal 
        isOpen={closeShiftModal} 
        onClose={() => setCloseShiftModal(false)}
        title="🔒 Close Drawer &amp; End Shift"
      >
        {activeShift && (
          <div style={{ padding: '0.5rem 0' }}>
            <div style={{ background: 'var(--bg-table-row)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1.25rem', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Opening Float Cash:</span>
                <span style={{ fontWeight: '700' }}>Rs. {activeShift.startingFloat.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>+ Cash Sales Revenue:</span>
                <span style={{ fontWeight: '700', color: 'var(--success)' }}>Rs. {cashSales.toLocaleString()}</span>
              </div>
              <hr style={{ border: 'none', borderTop: '1px dashed var(--border-color)', margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', fontSize: '0.92rem' }}>
                <span>Expected Drawer Total:</span>
                <span>Rs. {expectedCash.toLocaleString()}</span>
              </div>
            </div>

            <form onSubmit={handleEndShift} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: '700', fontSize: '0.82rem' }}>Actual Physical Cash Count (PKR)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', fontWeight: '700', color: 'var(--text-muted)' }}>Rs.</span>
                  <input
                    type="number" min="0"
                    className="form-input"
                    placeholder="Count physically..."
                    value={endingFloat}
                    onChange={e => setEndingFloat(e.target.value)}
                    required
                    style={{ paddingLeft: '3rem', background: 'var(--bg-input)', fontSize: '1.05rem', fontWeight: '700' }}
                  />
                </div>
              </div>

              {endingFloat && (
                <div style={{
                  padding: '0.75rem 1rem',
                  background: currentVariance === 0 ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                  border: `1px solid ${currentVariance === 0 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.88rem',
                  fontWeight: '700',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <span>Cash Variance:</span>
                  <span style={{ color: currentVariance === 0 ? 'var(--success)' : 'var(--danger)' }}>
                    Rs. {currentVariance >= 0 ? `+${currentVariance.toLocaleString()}` : currentVariance.toLocaleString()}
                  </span>
                </div>
              )}

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: '700', fontSize: '0.82rem' }}>Discrepancy Notes / Discrepancy Explanation</label>
                <textarea
                  className="form-input"
                  placeholder="Provide reason if there is shortages or overages..."
                  value={shiftNotes}
                  onChange={e => setShiftNotes(e.target.value)}
                  style={{ minHeight: '65px', background: 'var(--bg-input)', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem' }}>
                <button type="button" onClick={() => setCloseShiftModal(false)} className="btn btn-secondary" style={{ flex: 1, padding: '0.75rem', fontWeight: '700' }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-danger" style={{ flex: 2, padding: '0.75rem', fontWeight: '800' }}>
                  End Shift &amp; Close Register
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>

    </div>
  );
};

export default CashierDashboard;
