import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const FinancialHub = () => {
  const { authFetch, user } = useAuth();
  const isCashier = user?.role === 'cashier';
  const [activeTab, setActiveTab] = useState('sales'); // sales, expenses, profit_loss
  const [activeSubTab, setActiveSubTab] = useState('exp_list'); // exp_list, sal_list, exp_form, sal_form, cat_form

  // Sales State
  const [summary, setSummary] = useState({ total_revenue: 0, total_orders: 0, average_order_value: 0 });
  const [topItems, setTopItems] = useState([]);
  const [recentBills, setRecentBills] = useState([]);
  const [monthlySales, setMonthlySales] = useState([]);
  const [loadingSales, setLoadingSales] = useState(true);

  // Date filters for Sales
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Expenses & Salaries State
  const [expenses, setExpenses] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [inventory, setInventory] = useState([]);

  // Form states - Expense
  const [expCategory, setExpCategory] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expDesc, setExpDesc] = useState('');
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);
  const [customCatName, setCustomCatName] = useState('');
  const [showCustomCatInput, setShowCustomCatInput] = useState(false);

  // Form states - Salary
  const [selUser, setSelUser] = useState('');
  const [salAmount, setSalAmount] = useState('');
  const [salPeriod, setSalPeriod] = useState(new Date().toLocaleString('default', { month: 'long', year: 'numeric' }));
  const [salDate, setSalDate] = useState(new Date().toISOString().split('T')[0]);

  const defaultCategories = [
    { id: 'utility_electricity', name: '⚡ Electricity Bill' },
    { id: 'utility_gas', name: '🔥 Gas Bill' },
    { id: 'utility_water', name: '💧 Water & Sewage' },
    { id: 'supplies_poultry', name: '🍗 Chicken & Meat Supplies' },
    { id: 'supplies_groceries', name: '🍳 Cooking Oil & Groceries' },
    { id: 'supplies_vegetables', name: '🥬 Fresh Vegetables' },
    { id: 'supplies_dairy', name: '🥛 Dairy & Milk' },
    { id: 'maintenance', name: '🛠️ Kitchen Equipment Repair' },
    { id: 'rent', name: '🏢 Restaurant Rent' },
    { id: 'marketing', name: '📢 Marketing & Advertisements' },
    { id: 'other', name: '📦 Other Operational Costs' }
  ];

  // 1. Load Sales Data
  const loadSalesData = async () => {
    setLoadingSales(true);
    try {
      let url = '/api/reports/summary?';
      if (startDate) url += `start_date=${startDate}&`;
      if (endDate) url += `end_date=${endDate}`;

      const [sumRes, topRes, recRes, monRes] = await Promise.all([
        authFetch(url),
        authFetch('/api/reports/top-items?limit=10'),
        authFetch('/api/reports/recent-bills?limit=20'),
        authFetch('/api/reports/monthly')
      ]);

      if (sumRes.ok) setSummary(await sumRes.json());
      if (topRes.ok) setTopItems(await topRes.json());
      if (recRes.ok) setRecentBills(await recRes.json());
      if (monRes.ok) setMonthlySales(await monRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSales(false);
    }
  };

  useEffect(() => {
    loadSalesData();
  }, [startDate, endDate]);

  // 2. Load Expenses, Salaries, Categories & Staff Users
  const loadLocalData = async () => {
    const savedExp = localStorage.getItem('indus_expenses');
    if (savedExp) setExpenses(JSON.parse(savedExp));

    const savedSal = localStorage.getItem('indus_salaries');
    if (savedSal) setSalaries(JSON.parse(savedSal));

    const savedInv = localStorage.getItem('indus_inventory');
    if (savedInv) setInventory(JSON.parse(savedInv));

    const savedCat = localStorage.getItem('indus_expense_categories');
    if (savedCat) {
      setCategories(JSON.parse(savedCat));
    } else {
      localStorage.setItem('indus_expense_categories', JSON.stringify(defaultCategories));
      setCategories(defaultCategories);
    }

    try {
      const res = await authFetch('/api/users');
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadLocalData();
  }, []);

  const saveExpenses = (updated) => {
    localStorage.setItem('indus_expenses', JSON.stringify(updated));
    setExpenses(updated);
  };

  const saveSalaries = (updated) => {
    localStorage.setItem('indus_salaries', JSON.stringify(updated));
    setSalaries(updated);
  };

  // Custom Category Add
  const handleAddCustomCategory = (e) => {
    e.preventDefault();
    if (!customCatName.trim()) return;
    
    const catId = `custom_${Date.now()}`;
    const newCat = {
      id: catId,
      name: `🏷️ ${customCatName.trim()}`
    };

    const updated = [...categories, newCat];
    localStorage.setItem('indus_expense_categories', JSON.stringify(updated));
    setCategories(updated);
    setCustomCatName('');
    alert(`Success: Category "${newCat.name}" added!`);
  };

  // Add Expense
  const handleAddExpense = (e) => {
    e.preventDefault();
    if (!expCategory || !expAmount) return alert('Category and Amount are required!');

    const newExp = {
      id: Date.now(),
      category: expCategory,
      amount: parseFloat(expAmount),
      description: expDesc,
      date: expDate
    };

    const updated = [...expenses, newExp];
    saveExpenses(updated);
    
    // Reset Form
    setExpCategory('');
    setExpAmount('');
    setExpDesc('');
    alert('✅ Operational expense logged successfully!');
    setActiveSubTab('exp_list');
  };

  // Add Salary
  const handleAddSalary = (e) => {
    e.preventDefault();
    if (!selUser || !salAmount) return alert('Staff member and Amount are required!');

    const newSal = {
      id: Date.now(),
      staff_username: selUser,
      amount: parseFloat(salAmount),
      period: salPeriod,
      date: salDate
    };

    const updated = [...salaries, newSal];
    saveSalaries(updated);

    // Reset Form
    setSelUser('');
    setSalAmount('');
    alert('✅ Salary disbursement recorded!');
    setActiveSubTab('sal_list');
  };

  const deleteExpense = (id) => {
    if (window.confirm('Are you sure you want to delete this expense record?')) {
      saveExpenses(expenses.filter(e => e.id !== id));
    }
  };

  const deleteSalary = (id) => {
    if (window.confirm('Are you sure you want to delete this payroll disbursement?')) {
      saveSalaries(salaries.filter(s => s.id !== id));
    }
  };

  // Calculations for summary totals
  const totalExpensesSum = expenses.reduce((acc, e) => acc + e.amount, 0) + inventory.reduce((acc, item) => acc + item.purchasePrice, 0);
  const totalSalariesSum = salaries.reduce((acc, s) => acc + s.amount, 0);
  const totalOutflow = totalExpensesSum + totalSalariesSum;
  const grossSales = summary.total_revenue || 0;
  const netProfit = grossSales - totalOutflow;

  // Monthly Profit & Loss Breakdown
  const getMonthlyBreakdown = () => {
    const breakdown = {};

    // Load monthly sales
    monthlySales.forEach(item => {
      breakdown[item.month] = {
        month: item.month,
        sales: item.revenue,
        operating: 0,
        payroll: 0
      };
    });

    // Load operating expenses
    expenses.forEach(e => {
      if (e.date) {
        const m = e.date.substring(0, 7); // "2026-07"
        if (!breakdown[m]) {
          breakdown[m] = { month: m, sales: 0, operating: 0, payroll: 0 };
        }
        breakdown[m].operating += Number(e.amount);
      }
    });

    // Load inventory purchases as operating expenses
    inventory.forEach(item => {
      if (item.purchaseDate) {
        const m = item.purchaseDate.substring(0, 7); // "2026-07"
        if (!breakdown[m]) {
          breakdown[m] = { month: m, sales: 0, operating: 0, payroll: 0 };
        }
        breakdown[m].operating += Number(item.purchasePrice);
      }
    });

    // Load payroll
    salaries.forEach(s => {
      if (s.date) {
        const m = s.date.substring(0, 7); // "2026-07"
        if (!breakdown[m]) {
          breakdown[m] = { month: m, sales: 0, operating: 0, payroll: 0 };
        }
        breakdown[m].payroll += Number(s.amount);
      }
    });

    return Object.values(breakdown).sort((a, b) => b.month.localeCompare(a.month));
  };

  const monthlyBreakdownList = getMonthlyBreakdown();

  return (
    <div className="page-body animate-fade-in">
      {/* Upper Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '2rem' }}>
        <button 
          onClick={() => setActiveTab('sales')} 
          className={`btn ${activeTab === 'sales' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '0.6rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          📈 Sales Analytics
        </button>
        {!isCashier && (
          <button 
            onClick={() => setActiveTab('expenses')} 
            className={`btn ${activeTab === 'expenses' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.6rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            💸 Operating Costs &amp; Payroll
          </button>
        )}
        <button 
          onClick={() => setActiveTab('profit_loss')} 
          className={`btn ${activeTab === 'profit_loss' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '0.6rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          📅 Monthly Profit &amp; Loss
        </button>
      </div>

      {/* Main Stats Header */}
      <div className="grid-cols-4" style={{ marginBottom: '2rem' }}>
        <div className="glass-card" style={{ padding: '1.25rem', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>Gross Sales (Revenue)</span>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#10b981', margin: '0.4rem 0' }}>
            Rs. {grossSales.toLocaleString()}
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{summary.total_orders} settled bills</span>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem', background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.05) 100%)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>Operating Costs</span>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--danger)', margin: '0.4rem 0' }}>
            Rs. {totalExpensesSum.toLocaleString()}
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Gas, Elec, Stock supplies</span>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0.05) 100%)', borderColor: 'rgba(99, 102, 241, 0.3)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>Paid Payroll</span>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#818cf8', margin: '0.4rem 0' }}>
            Rs. {totalSalariesSum.toLocaleString()}
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Staff salary payouts</span>
        </div>

        <div 
          className="glass-card" 
          style={{ 
            padding: '1.25rem', 
            background: netProfit >= 0 
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(16, 185, 129, 0.08) 100%)'
              : 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(239, 68, 68, 0.08) 100%)',
            borderColor: netProfit >= 0 ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'
          }}
        >
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>Net Profit</span>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: netProfit >= 0 ? '#10b981' : 'var(--danger)', margin: '0.4rem 0' }}>
            Rs. {netProfit.toLocaleString()}
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Revenue less total cost outflow</span>
        </div>
      </div>

      {/* RENDER ACTIVE TAB */}

      {activeTab === 'sales' && (
        <div className="animate-fade-in">
          {/* Sales Report view */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h4 style={{ fontSize: '1.25rem' }}>📈 Sales & Revenue Analytics</h4>
            
            {/* Date Filters */}
            <div className="glass-card" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>📅 Date Filter:</span>
              <input type="date" className="form-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ padding: '0.35rem 0.6rem', width: 'auto', fontSize: '0.85rem' }} />
              <span>to</span>
              <input type="date" className="form-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ padding: '0.35rem 0.6rem', width: 'auto', fontSize: '0.85rem' }} />
              {(startDate || endDate) && (
                <button onClick={() => { setStartDate(''); setEndDate(''); }} className="btn btn-secondary" style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}>Reset</button>
              )}
            </div>
          </div>

          <div className="grid-cols-2" style={{ gap: '2rem' }}>
            {/* Top Items */}
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h4 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>🔥 Top Selling Items</h4>
              <div className="table-container" style={{ border: 'none' }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Item</th>
                      <th>Qty</th>
                      <th style={{ textAlign: 'right' }}>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topItems.length === 0 ? (
                      <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No sales recorded.</td></tr>
                    ) : (
                      topItems.map((it, i) => (
                        <tr key={i}>
                          <td><span className="badge" style={{ background: i === 0 ? 'var(--accent-gradient)' : 'var(--bg-hover)', color: i === 0 ? '#fff' : 'var(--text-primary)' }}>#{i+1}</span></td>
                          <td style={{ fontWeight: '700' }}>{it.name} {it.variant && `(${it.variant})`}</td>
                          <td>{it.total_quantity_sold}x</td>
                          <td style={{ textAlign: 'right', color: '#10b981', fontWeight: '700' }}>Rs. {it.total_revenue.toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h4 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>🧾 Recent Paid Bills</h4>
              <div className="table-container" style={{ border: 'none' }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Bill #</th>
                      <th>Method</th>
                      <th>Date</th>
                      <th style={{ textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentBills.length === 0 ? (
                      <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No transactions found.</td></tr>
                    ) : (
                      recentBills.map((b, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: '700' }}>{b.bill_number}</td>
                          <td>{b.payment_method}</td>
                          <td>{b.created_at.split(' ')[0]}</td>
                          <td style={{ textAlign: 'right', color: '#10b981', fontWeight: '700' }}>Rs. {b.total_amount.toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'expenses' && (
        <div className="animate-fade-in">
          {/* Sub menu controls */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <button onClick={() => setActiveSubTab('exp_list')} className={`btn ${activeSubTab === 'exp_list' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}>
              📋 Logged Expenses ({expenses.length})
            </button>
            <button onClick={() => setActiveSubTab('sal_list')} className={`btn ${activeSubTab === 'sal_list' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}>
              📋 Salary Records ({salaries.length})
            </button>
            <button onClick={() => setActiveSubTab('exp_form')} className={`btn ${activeSubTab === 'exp_form' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}>
              ➕ Log Expense
            </button>
            <button onClick={() => setActiveSubTab('sal_form')} className={`btn ${activeSubTab === 'sal_form' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}>
              ➕ Disburse Salary
            </button>
            <button onClick={() => setActiveSubTab('cat_form')} className={`btn ${activeSubTab === 'cat_form' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}>
              ⚙️ Manage Categories
            </button>
          </div>

          {activeSubTab === 'exp_list' && (
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h4 style={{ marginBottom: '1rem' }}>📋 Operating Expenses Log</h4>
              <div className="table-container" style={{ border: 'none' }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Category</th>
                      <th>Description</th>
                      <th>Amount</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.length === 0 ? (
                      <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No operational expenses logged.</td></tr>
                    ) : (
                      expenses.map(e => {
                        const catObj = categories.find(c => c.id === e.category) || defaultCategories.find(c => c.id === e.category);
                        return (
                          <tr key={e.id}>
                            <td>{e.date}</td>
                            <td style={{ fontWeight: '700' }}>{catObj ? catObj.name : e.category}</td>
                            <td>{e.description || '—'}</td>
                            <td style={{ fontWeight: '700', color: 'var(--danger)' }}>Rs. {e.amount.toLocaleString()}</td>
                            <td style={{ textAlign: 'right' }}>
                              <button onClick={() => deleteExpense(e.id)} className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', borderColor: 'var(--danger)', color: 'var(--danger)' }}>Delete</button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSubTab === 'sal_list' && (
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h4 style={{ marginBottom: '1rem' }}>📋 Staff Salary Log</h4>
              <div className="table-container" style={{ border: 'none' }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Disbursement Date</th>
                      <th>Employee</th>
                      <th>Salary Period</th>
                      <th>Amount Paid</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salaries.length === 0 ? (
                      <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No payroll payouts logged.</td></tr>
                    ) : (
                      salaries.map(s => (
                        <tr key={s.id}>
                          <td>{s.date}</td>
                          <td style={{ fontWeight: '700', textTransform: 'capitalize' }}>👤 {s.staff_username}</td>
                          <td>{s.period}</td>
                          <td style={{ fontWeight: '700', color: 'var(--danger)' }}>Rs. {s.amount.toLocaleString()}</td>
                          <td style={{ textAlign: 'right' }}>
                            <button onClick={() => deleteSalary(s.id)} className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', borderColor: 'var(--danger)', color: 'var(--danger)' }}>Delete</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSubTab === 'exp_form' && (
            <div className="glass-card" style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
              <h4 style={{ marginBottom: '1.5rem' }}>➕ Log Operational Expense</h4>
              <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Expense Category</label>
                  <select className="form-select" value={expCategory} onChange={(e) => setExpCategory(e.target.value)} required>
                    <option value="">-- Choose Category --</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Expense Amount (PKR)</label>
                  <input type="number" className="form-control" value={expAmount} onChange={(e) => setExpAmount(e.target.value)} placeholder="e.g. 15000" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Description / Remarks</label>
                  <input type="text" className="form-control" value={expDesc} onChange={(e) => setExpDesc(e.target.value)} placeholder="e.g. Bought 20kg Chicken from market" />
                </div>
                <div className="form-group">
                  <label className="form-label">Expense Date</label>
                  <input type="date" className="form-control" value={expDate} onChange={(e) => setExpDate(e.target.value)} required />
                </div>
                <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', width: '100%', padding: '0.75rem' }}>
                  Log Operational Expense
                </button>
              </form>
            </div>
          )}

          {activeSubTab === 'sal_form' && (
            <div className="glass-card" style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
              <h4 style={{ marginBottom: '1.5rem' }}>➕ Disburse Staff Salary</h4>
              <form onSubmit={handleAddSalary} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Select Employee</label>
                  <select className="form-select" value={selUser} onChange={(e) => setSelUser(e.target.value)} required>
                    <option value="">-- Choose Employee --</option>
                    {users.map(u => (
                      <option key={u.id} value={u.username}>{u.username} ({u.role})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Salary Amount Paid (PKR)</label>
                  <input type="number" className="form-control" value={salAmount} onChange={(e) => setSalAmount(e.target.value)} placeholder="e.g. 25000" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Salary Month / Period</label>
                  <input type="text" className="form-control" value={salPeriod} onChange={(e) => setSalPeriod(e.target.value)} placeholder="e.g. July 2026" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Payout Date</label>
                  <input type="date" className="form-control" value={salDate} onChange={(e) => setSalDate(e.target.value)} required />
                </div>
                <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', width: '100%', padding: '0.75rem' }}>
                  Disburse & Log Payroll Payout
                </button>
              </form>
            </div>
          )}

          {activeSubTab === 'cat_form' && (
            <div className="glass-card" style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
              <h4 style={{ marginBottom: '1.5rem' }}>⚙️ Custom Expense Categories</h4>
              <form onSubmit={handleAddCustomCategory} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <input type="text" className="form-control" placeholder="e.g. Poultry Supplier, Rice Agent" value={customCatName} onChange={(e) => setCustomCatName(e.target.value)} required />
                <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1rem', whiteSpace: 'nowrap' }}>Add Category</button>
              </form>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '200px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 'bold', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem', marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>Categories list</div>
                {categories.map(c => (
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-table-row)', padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                    <span>{c.name}</span>
                    {!defaultCategories.find(dc => dc.id === c.id) && (
                      <button 
                        type="button" 
                        onClick={() => {
                          const updated = categories.filter(cat => cat.id !== c.id);
                          localStorage.setItem('indus_expense_categories', JSON.stringify(updated));
                          setCategories(updated);
                        }} 
                        className="btn btn-secondary" 
                        style={{ padding: '0.1rem 0.4rem', fontSize: '0.7rem', color: 'var(--danger)', borderColor: 'var(--danger)', minWidth: 'unset' }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'profit_loss' && (
        <div className="animate-fade-in glass-card" style={{ padding: '1.5rem' }}>
          <h4 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}>📅 Monthly Profit & Loss Ledger</h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Monthly sales consolidated from the SQL database matched with local storage operating costs and staff salaries.</p>
          
          <div className="table-container" style={{ border: 'none' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th style={{ textAlign: 'right' }}>Gross Sales (Revenue)</th>
                  <th style={{ textAlign: 'right' }}>Operating Costs</th>
                  <th style={{ textAlign: 'right' }}>Staff Salaries</th>
                  <th style={{ textAlign: 'right' }}>Total Expense Outflow</th>
                  <th style={{ textAlign: 'right' }}>Net Profit / Loss</th>
                  <th style={{ textAlign: 'right' }}>Profit Margin</th>
                </tr>
              </thead>
              <tbody>
                {monthlyBreakdownList.length === 0 ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No monthly consolidated statements available.</td></tr>
                ) : (
                  monthlyBreakdownList.map((mb, idx) => {
                    const totalExpenses = mb.operating + mb.payroll;
                    const profit = mb.sales - totalExpenses;
                    const margin = mb.sales > 0 ? (profit / mb.sales) * 100 : 0;
                    
                    // Format year-month, e.g. "2026-07" to "July 2026"
                    const dateObj = new Date(mb.month + '-02'); // Add safe day
                    const formattedMonth = isNaN(dateObj.getTime()) ? mb.month : dateObj.toLocaleDateString('default', { month: 'long', year: 'numeric' });

                    return (
                      <tr key={idx} style={{ background: idx === 0 ? 'rgba(99, 102, 241, 0.05)' : 'none' }}>
                        <td style={{ fontWeight: '700' }}>
                          📅 {formattedMonth} {idx === 0 && <span className="badge badge-info" style={{ fontSize: '0.7rem', marginLeft: '0.5rem' }}>Active Month</span>}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: '700', color: '#10b981' }}>
                          Rs. {mb.sales.toLocaleString()}
                        </td>
                        <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                          Rs. {mb.operating.toLocaleString()}
                        </td>
                        <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                          Rs. {mb.payroll.toLocaleString()}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: '700', color: 'var(--danger)' }}>
                          Rs. {totalExpenses.toLocaleString()}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: '800', color: profit >= 0 ? '#10b981' : 'var(--danger)' }}>
                          Rs. {profit.toLocaleString()}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: '700' }}>
                          <span className="badge" style={{ background: profit >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: profit >= 0 ? '#10b981' : 'var(--danger)' }}>
                            {margin.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialHub;
