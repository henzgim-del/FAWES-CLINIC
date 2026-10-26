// client/src/App.jsx
import React, { useState } from 'react';
import { apiRequest } from './services/api';
import VisitDashboard from './components/VisitDashboard'; // adjust path if needed
// ... import other dashboards as needed

export default function App() {
  const [user, setUser] = useState(null);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('visit');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await apiRequest('/auth/login', 'POST', loginData);
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user || res.data);
      setActiveTab('visit');
    } catch (err) {
      setError(err.message || 'Login failed');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  // If not logged in, show clean login card
  if (!user) {
    return (
      <div style={{ maxWidth: '400px', margin: '80px auto', padding: '24px', border: '1px solid #cbd5e1', borderRadius: '12px', backgroundColor: '#fff', fontFamily: 'sans-serif', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        <h2 style={{ marginBottom: '8px', color: '#166534', fontWeight: 'bold' }}>FAWES Clinic System</h2>
        <p style={{ color: '#475569', fontSize: '14px', marginBottom: '20px' }}>Please login with your staff credentials.</p>
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontWeight: 600, fontSize: '13px', color: '#334155' }}>Username:</label>
            <input
              type="text"
              value={loginData.username}
              onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
              required
              style={{ width: '100%', padding: '10px', marginTop: '4px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontWeight: 600, fontSize: '13px', color: '#334155' }}>Password:</label>
            <input
              type="password"
              value={loginData.password}
              onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
              required
              style={{ width: '100%', padding: '10px', marginTop: '4px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
            />
          </div>
          {error && <p style={{ color: '#dc2626', fontSize: '13px', marginBottom: '12px', fontWeight: 600 }}>{error}</p>}
          <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#2b9348', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>
            Login
          </button>
        </form>
      </div>
    );
  }

  // When logged in as Receptionist, render VisitDashboard directly as the complete view
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <VisitDashboard user={user} onLogout={handleLogout} />
    </div>
  );
}