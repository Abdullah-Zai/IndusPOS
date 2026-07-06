import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const ExpensesManager = () => {
  const { authFetch } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState('expenses'); // expenses, salaries

  // State lists
  const [expenses, setExpenses] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);

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

  // Default Categories
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

  // Load from local storage and backend users list
  useEffect(() => {
    // 1. Load Expenses
    const savedExp = localStorage.getItem('indus_expenses');
    if (savedExp) setExpenses(JSON.parse(savedExp));

    // 2. Load Salaries
    const savedSal = localStorage.getItem('indus_salaries');
    if (savedSal) setSalaries(JSON.parse(savedSal));

    // 3. Load Custom Categories
    const savedCat = localStorage.getItem('indus_expense_categories');
    if (savedCat) {
      setCategories(JSON.parse(savedCat));
    } else {
      localStorage.setItem('indus_expense_categories', JSON.stringify(defaultCategories));
      setCategories(defaultCategories);
    }

    // 4. Fetch Users for Salaries dropdown
    const fetchUsers = async () => {
      try {
        const res = await authFetch('/api/users');
        if (res.ok) {
          const data = await res.json();
          setUsers(data);
        }
      } catch (err) {
        console.error('Failed to load user accounts', err);
      }
    };
    fetchUsers();
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
    setExpCategory(catId);
    setCustomCatName('');
    setShowCustomCatInput(false);
  };

  // Log Expense
  const handleAddExpense = (e) => {
    e.preventDefault();
    if (!expCategory || !expAmount) return;

    const matchedCat = categories.find(c => c.id === expCategory);

    const newExpense = {
      id: Date.now(),
      category_id: expCategory,
      category_name: matchedCat ? matchedCat.name : expCategory,
      amount: parseFloat(expAmount),
      description: expDesc.trim(),
      date: expDate
    };

    saveExpenses([newExpense, ...expenses]);
    setExpAmount('');
    setExpDesc('');
  };

  // Log Salary Payment
  const handleAddSalary = (e) => {
    e.preventDefault();
    if (!selUser || !salAmount || !salPeriod) return;

    const matchedUser = users.find(u => u.id === parseInt(selUser));

    const newSalary = {
      id: Date.now(),
      user_id: parseInt(selUser),
      username: matchedUser ? matchedUser.username : 'Unknown Staff',
      role: matchedUser ? matchedUser.role : 'Staff',
      amount: parseFloat(salAmount),
      period: salPeriod.trim(),
      payment_date: salDate
    };

    saveSalaries([newSalary, ...salaries]);
    setSalAmount('');
    setSelUser('');
  };

  // Deletions
  const handleDeleteExpense = (id) => {
    if (window.confirm('Delete this expense entry?')) {
      saveExpenses(expenses.filter(e => e.id !== id));
    }
  };

  const handleDeleteSalary = (id) => {
    if (window.confirm('Delete this payroll entry?')) {
      saveSalaries(salaries.filter(s => s.id !== id));
    }
  };

  // Calculations
  const totalExpAmount = expenses.reduce((acc, e) => acc + e.amount, 0);
  const totalSalAmount = salaries.reduce((acc, s) => acc + s.amount, 0);

  const utilityExpenses = expenses
    .filter(e => e.category_id.startsWith('utility_'))
    .reduce((acc, e) => acc + e.amount, 0);

  const supplyExpenses = expenses
    .filter(e => e.category_id.startsWith('supplies_'))
    .reduce((acc, e) => acc + e.amount, 0);

  const otherExpenses = expenses
    .filter(e => !e.category_id.startsWith('utility_') && !e.category_id.startsWith('supplies_'))
    .reduce((acc, e) => acc + e.amount, 0);

  return (
    <div className="page-body animate-fade-in" style={{ paddingBottom: '3rem' }}>
      
      {/* Overview Cards */}
      <div className="grid-cols-4" style={{ marginBottom: '2rem' }}>
        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Operating Expenses</span>
          <span style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--danger)' }}>PKR {totalExpAmount.toLocaleString()}</span>
        </div>
        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Utility Costs (Power/Gas)</span>
          <span style={{ fontSize: '1.75rem', fontWeight: '700' }}>PKR {utilityExpenses.toLocaleString()}</span>
        </div>
        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Kitchen & Supply Stock</span>
          <span style={{ fontSize: '1.75rem', fontWeight: '700' }}>PKR {supplyExpenses.toLocaleString()}</span>
        </div>
        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Staff Salaries Paid</span>
          <span style={{ fontSize: '1.75rem', fontWeight: '700', color: '#818cf8' }}>PKR {totalSalAmount.toLocaleString()}</span>
        </div>
      </div>

      {/* Tab Selectors */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem', paddingBottom: '0.5rem' }}>
        <button 
          onClick={() => setActiveSubTab('expenses')}
          className={`btn ${activeSubTab === 'expenses' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '0.5rem 1.25rem' }}
        >
          🧾 Restaurant Operating Expenses
        </button>
        <button 
          onClick={() => setActiveSubTab('salaries')}
          className={`btn ${activeSubTab === 'salaries' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '0.5rem 1.25rem' }}
        >
          👥 Staff Salary Payroll
        </button>
      </div>

      {activeSubTab === 'expenses' ? (
        /* Expenses Section */
        <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '1.5rem' }}>
          
          {/* Left Form */}
          <div>
            <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', margin: 0 }}>➕ Log Operational Expense</h3>
              
              <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>Expense Category</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <select
                      value={expCategory}
                      onChange={(e) => setExpCategory(e.target.value)}
                      className="form-control"
                      style={{ flex: 1 }}
                      required
                    >
                      <option value="">-- Select Category --</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowCustomCatInput(!showCustomCatInput)}
                      className="btn btn-secondary"
                      style={{ padding: '0.5rem', fontSize: '0.95rem' }}
                      title="Add Custom Category"
                    >
                      ⚙️
                    </button>
                  </div>
                </div>

                {showCustomCatInput && (
                  <div className="glass-card" style={{ padding: '0.75rem', border: '1px dashed var(--border-color)', marginTop: '-0.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', color: 'var(--text-secondary)' }}>New Custom Category Name</label>
                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                      <input
                        type="text"
                        value={customCatName}
                        onChange={(e) => setCustomCatName(e.target.value)}
                        placeholder="e.g. Generator Fuel"
                        className="form-control"
                        style={{ padding: '0.35rem 0.5rem', fontSize: '0.85rem', flex: 1 }}
                      />
                      <button 
                        type="button" 
                        onClick={handleAddCustomCategory} 
                        className="btn btn-primary"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>Amount (PKR)</label>
                  <input
                    type="number"
                    value={expAmount}
                    onChange={(e) => setExpAmount(e.target.value)}
                    placeholder="Enter cost in PKR"
                    className="form-control"
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>Description / Invoice details</label>
                  <textarea
                    value={expDesc}
                    onChange={(e) => setExpDesc(e.target.value)}
                    placeholder="e.g. Paid K-Electric Bill or Purchased 50kg Chicken"
                    className="form-control"
                    style={{ height: '80px', resize: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>Transaction Date</label>
                  <input
                    type="date"
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    className="form-control"
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
                  💾 Save Expense Entry
                </button>
              </form>
            </div>
          </div>

          {/* Right Table */}
          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Log History</h3>

            {expenses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                <span style={{ fontSize: '2.5rem' }}>📄</span>
                <p style={{ marginTop: '0.75rem' }}>No operating expenses logged yet.</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Category</th>
                      <th>Description</th>
                      <th>Amount (PKR)</th>
                      <th style={{ textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((exp, index) => {
                      const staggerClass = `stagger-${(index % 5) + 1}`;
                      return (
                        <tr key={exp.id} className={`animate-fade-in ${staggerClass}`}>
                          <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{exp.date}</td>
                          <td style={{ fontWeight: '600' }}>{exp.category_name}</td>
                          <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{exp.description || '—'}</td>
                          <td style={{ fontWeight: '700', color: 'var(--danger)' }}>PKR {exp.amount.toLocaleString()}</td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              onClick={() => handleDeleteExpense(exp.id)}
                              className="btn btn-secondary"
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: 'var(--danger)' }}
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Salaries Section */
        <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '1.5rem' }}>
          
          {/* Left Form */}
          <div>
            <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', margin: 0 }}>➕ Log Salary Payment</h3>
              
              <form onSubmit={handleAddSalary} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>Select Staff Member</label>
                  <select
                    value={selUser}
                    onChange={(e) => setSelUser(e.target.value)}
                    className="form-control"
                    required
                  >
                    <option value="">-- Select Employee --</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.username} ({u.role.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>Amount Paid (PKR)</label>
                  <input
                    type="number"
                    value={salAmount}
                    onChange={(e) => setSalAmount(e.target.value)}
                    placeholder="Enter salary payout"
                    className="form-control"
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>Salary Period / Month</label>
                  <input
                    type="text"
                    value={salPeriod}
                    onChange={(e) => setSalPeriod(e.target.value)}
                    placeholder="e.g. July 2026"
                    className="form-control"
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>Payment Date</label>
                  <input
                    type="date"
                    value={salDate}
                    onChange={(e) => setSalDate(e.target.value)}
                    className="form-control"
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
                  💾 Log Salary Payout
                </button>
              </form>
            </div>
          </div>

          {/* Right Table */}
          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Payroll Payments history</h3>

            {salaries.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                <span style={{ fontSize: '2.5rem' }}>💵</span>
                <p style={{ marginTop: '0.75rem' }}>No payroll disbursements logged yet.</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Pay Date</th>
                      <th>Employee</th>
                      <th>Role</th>
                      <th>Period</th>
                      <th>Salary Paid</th>
                      <th style={{ textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salaries.map((sal, index) => {
                      const staggerClass = `stagger-${(index % 5) + 1}`;
                      return (
                        <tr key={sal.id} className={`animate-fade-in ${staggerClass}`}>
                          <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{sal.payment_date}</td>
                          <td style={{ fontWeight: '600' }}>👤 {sal.username}</td>
                          <td>
                            <span 
                              className={`badge ${
                                sal.role === 'admin' 
                                  ? 'badge-danger' 
                                  : sal.role === 'waiter' 
                                  ? 'badge-info' 
                                  : sal.role === 'kitchen' 
                                  ? 'badge-warning' 
                                  : 'badge-success'
                              }`}
                              style={{ fontSize: '0.65rem' }}
                            >
                              {sal.role}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{sal.period}</td>
                          <td style={{ fontWeight: '700', color: '#818cf8' }}>PKR {sal.amount.toLocaleString()}</td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              onClick={() => handleDeleteSalary(sal.id)}
                              className="btn btn-secondary"
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: 'var(--danger)' }}
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesManager;
