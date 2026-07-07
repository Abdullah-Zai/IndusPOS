import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Login = () => {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(username, password);
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (user, pass) => {
    setUsername(user);
    setPassword(pass);
    setError(null);
    setLoading(true);
    try {
      await login(user, pass);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '2rem',
      position: 'relative'
    }}>
      <button 
        onClick={toggleTheme} 
        className={`nav-icon-btn ${theme === 'dark' ? 'lightbulb-off' : 'lightbulb-on'}`}
        style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', zIndex: 10 }}
        title={`Turn ${theme === 'dark' ? 'On Lights (Light Mode)' : 'Off Lights (Dark Mode)'}`}
      >
        💡
      </button>
      <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '460px', overflow: 'hidden' }}>
        <div style={{ padding: '2.5rem 2rem 1.5rem', textAlign: 'center', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-table-header)' }}>
          <img 
            src="/logo.png" 
            alt="Indus Cuisine" 
            style={{ 
              width: '65px', 
              height: '65px', 
              borderRadius: '50%',
              border: '2px solid var(--border-glow)',
              boxShadow: '0 0 20px var(--accent-glow)',
              objectFit: 'cover',
              marginBottom: '1.25rem'
            }} 
          />
          <h1 style={{ fontSize: '1.8rem', marginBottom: '0.4rem', fontWeight: '800' }}>
            INDUS <span className="gradient-text">CUISINE</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Fine Dining POS & Restaurant Management</p>
        </div>

        <div style={{ padding: '2rem' }}>
          {error && (
            <div className="badge badge-danger" style={{ width: '100%', padding: '0.75rem 1rem', marginBottom: '1.5rem', borderRadius: 'var(--radius-md)', display: 'block', textTransform: 'none', fontSize: '0.9rem' }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Enter your username" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)}
                required 
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.75rem' }}>
              <label className="form-label">Password</label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="Enter your password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '0.85rem', fontSize: '1rem' }}
              disabled={loading}
            >
              {loading ? 'Authenticating...' : 'Sign In to POS ➔'}
            </button>
          </form>

          <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>
              Instant Demo Access
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem', marginTop: '0.75rem' }}>
              <button 
                type="button" 
                onClick={() => handleDemoLogin('admin', 'admin123')}
                className="btn btn-secondary" 
                style={{ padding: '0.5rem 0.2rem', fontSize: '0.75rem', flexDirection: 'column', gap: '0.2rem', borderColor: 'rgba(239, 68, 68, 0.4)' }}
              >
                <span>👑 Admin</span>
              </button>
              <button 
                type="button" 
                onClick={() => handleDemoLogin('waiter', 'waiter123')}
                className="btn btn-secondary" 
                style={{ padding: '0.5rem 0.2rem', fontSize: '0.75rem', flexDirection: 'column', gap: '0.2rem', borderColor: 'rgba(59, 130, 246, 0.4)' }}
              >
                <span>🪑 Waiter</span>
              </button>
              <button 
                type="button" 
                onClick={() => handleDemoLogin('kitchen', 'kitchen123')}
                className="btn btn-secondary" 
                style={{ padding: '0.5rem 0.2rem', fontSize: '0.75rem', flexDirection: 'column', gap: '0.2rem', borderColor: 'rgba(245, 158, 11, 0.4)' }}
              >
                <span>🍳 Kitchen</span>
              </button>
              <button 
                type="button" 
                onClick={() => handleDemoLogin('cashier', 'cashier123')}
                className="btn btn-secondary" 
                style={{ padding: '0.5rem 0.2rem', fontSize: '0.75rem', flexDirection: 'column', gap: '0.2rem', borderColor: 'rgba(16, 185, 129, 0.4)' }}
              >
                <span>💵 Cashier</span>
              </button>
            </div>
          </div>
        </div>

        <div style={{ padding: '1rem', background: 'var(--bg-modal-footer)', borderTop: '1px solid var(--border-color)', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Powered by Python FastAPI & React Vite
        </div>
      </div>
    </div>
  );
};

export default Login;
