import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const Settings = () => {
  const { authFetch } = useAuth();
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Initial states
  const [settings, setSettings] = useState({
    restaurantName: 'Indus Cuisine',
    address: 'Gulberg III, Lahore, Pakistan',
    phone: '+92 42 111 463 877',
    website: 'www.induscuisine.pk',
    currency: 'Rs.',
    taxRate: 13,
    serviceCharge: 5,
    receiptFooter: 'Thank you for dining with us at Indus Cuisine!',
    enableSoundEffects: true,
  });

  useEffect(() => {
    const saved = localStorage.getItem('indus_settings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      localStorage.setItem('indus_settings', JSON.stringify(settings));
      setSaving(false);
      setSuccessMsg('Settings saved successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    }, 800);
  };

  const handleResetData = async () => {
    if (!confirm('CAUTION: This will delete ALL order history, sales records, and custom expenses. Seed menu categories and items will remain. Do you want to proceed?')) return;
    try {
      const res = await authFetch('/api/reports/reset', { method: 'POST' });
      if (res.ok) {
        localStorage.removeItem('indus_expenses');
        localStorage.removeItem('indus_salaries');
        alert('Database cleared successfully! Operating costs and order histories have been reset.');
        window.location.reload();
      } else {
        alert('Failed to reset backend database.');
      }
    } catch (err) {
      alert('Error connecting to backend.');
    }
  };

  return (
    <div className="page-body animate-fade-in" style={{ display: 'flex', gap: '2rem' }}>
      {/* Settings Navigation Sidebar */}
      <div className="glass-card" style={{ width: '250px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', height: 'fit-content' }}>
        <button 
          onClick={() => setActiveTab('general')} 
          className="btn" 
          style={{
            width: '100%',
            textAlign: 'left',
            padding: '0.8rem 1rem',
            background: activeTab === 'general' ? 'var(--accent-gradient)' : 'transparent',
            color: activeTab === 'general' ? '#fff' : 'var(--text-primary)',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          🏨 General Settings
        </button>
        <button 
          onClick={() => setActiveTab('pos')} 
          className="btn" 
          style={{
            width: '100%',
            textAlign: 'left',
            padding: '0.8rem 1rem',
            background: activeTab === 'pos' ? 'var(--accent-gradient)' : 'transparent',
            color: activeTab === 'pos' ? '#fff' : 'var(--text-primary)',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          🧾 POS & Receipt Taxes
        </button>
        <button 
          onClick={() => setActiveTab('database')} 
          className="btn" 
          style={{
            width: '100%',
            textAlign: 'left',
            padding: '0.8rem 1rem',
            background: activeTab === 'database' ? 'var(--accent-gradient)' : 'transparent',
            color: activeTab === 'database' ? '#fff' : 'var(--text-primary)',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          ⚙️ Advanced / Database
        </button>
      </div>

      {/* Settings Form Container */}
      <div className="glass-card" style={{ flex: 1, padding: '2.5rem' }}>
        {successMsg && (
          <div style={{ background: 'var(--success-bg)', color: 'var(--success)', border: '1px solid var(--success)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontWeight: '600', animation: 'fadeIn 0.3s' }}>
            ✓ {successMsg}
          </div>
        )}

        <form onSubmit={handleSave}>
          {activeTab === 'general' && (
            <div>
              <h4 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>🏨 General Restaurant Properties</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>Configure basic restaurant details printed on receipts.</p>

              <div className="form-group">
                <label className="form-label">Restaurant Brand Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={settings.restaurantName} 
                  onChange={(e) => setSettings({ ...settings, restaurantName: e.target.value })} 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Address</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={settings.address} 
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })} 
                  required 
                />
              </div>

              <div className="grid-cols-2">
                <div className="form-group">
                  <label className="form-label">Contact Number</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={settings.phone} 
                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Website</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={settings.website} 
                    onChange={(e) => setSettings({ ...settings, website: e.target.value })} 
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'pos' && (
            <div>
              <h4 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>🧾 POS Calculations & Receipt Design</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>Manage default GST rates, currency symbols, and invoice footers.</p>

              <div className="grid-cols-3">
                <div className="form-group">
                  <label className="form-label">GST Tax Rate (%)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={settings.taxRate} 
                    onChange={(e) => setSettings({ ...settings, taxRate: parseFloat(e.target.value) || 0 })} 
                    required 
                    min="0"
                    step="0.1"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Service Charge (%)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={settings.serviceCharge} 
                    onChange={(e) => setSettings({ ...settings, serviceCharge: parseFloat(e.target.value) || 0 })} 
                    required 
                    min="0"
                    step="0.1"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Currency Symbol</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={settings.currency} 
                    onChange={(e) => setSettings({ ...settings, currency: e.target.value })} 
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Receipt Footer Custom Message</label>
                <textarea 
                  className="form-input" 
                  rows="3" 
                  value={settings.receiptFooter} 
                  onChange={(e) => setSettings({ ...settings, receiptFooter: e.target.value })}
                  style={{ resize: 'vertical' }}
                />
              </div>
            </div>
          )}

          {activeTab === 'database' && (
            <div>
              <h4 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>⚙️ System Control & Operations</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>Reset logs or restore seeding variables.</p>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={settings.enableSoundEffects} 
                    onChange={(e) => setSettings({ ...settings, enableSoundEffects: e.target.checked })} 
                    style={{ transform: 'scale(1.2)' }}
                  />
                  Enable POS Checkout Sound Effects
                </label>
              </div>

              <div style={{ marginTop: '2.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                <h5 style={{ color: 'var(--danger)', marginBottom: '0.5rem' }}>⚠️ Danger Zone</h5>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>Performing these operations is permanent and cannot be undone.</p>
                <button 
                  type="button" 
                  onClick={handleResetData} 
                  className="btn btn-danger"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  🗑️ Reset All Transactions & Sales History
                </button>
              </div>
            </div>
          )}

          {activeTab !== 'database' && (
            <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving changes...' : 'Save Settings'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Settings;
