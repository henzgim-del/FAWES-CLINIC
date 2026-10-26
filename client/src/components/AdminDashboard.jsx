import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    role: 'RECEPTIONIST'
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Pagination for user list
  const [page, setPage] = useState(1);
  const usersPerPage = 5;

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await apiRequest('/auth/users', 'GET');
      setUsers(res.data || []);
    } catch (err) {
      // Endpoint optional for now; keep array empty gracefully
      setUsers([]);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await apiRequest('/auth/register', 'POST', formData);
      setMessage(`Successfully created ${formData.role} account for ${formData.fullName}!`);
      setFormData({
        fullName: '',
        username: '',
        email: '',
        phone: '',
        password: '',
        role: 'RECEPTIONIST'
      });
      fetchUsers();
    } catch (err) {
      setError(err.message || 'Failed to create user account.');
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(users.length / usersPerPage) || 1;
  const currentUsersSlice = users.slice((page - 1) * usersPerPage, page * usersPerPage);

  return (
    <div className="card" style={{ marginTop: '24px' }}>
      <h2>Admin Control Panel - Staff User Management</h2>
      <p style={{ color: '#475569', fontSize: '14px', marginBottom: '20px' }}>
        Create and manage staff accounts (Receptionists, Doctors, Nurses, Lab Technicians) to allow secure role-based login.
      </p>

      {/* Create User Form */}
      <form onSubmit={handleCreateUser} style={{ padding: '20px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '24px' }}>
        <h3 style={{ marginTop: 0, color: '#0f172a' }}>➕ Create New Staff Account</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <div className="form-group">
            <label>Full Name:</label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
          </div>
          <div className="form-group">
            <label>Username:</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
          </div>
          <div className="form-group">
            <label>Email Address:</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
          </div>
          <div className="form-group">
            <label>Phone Number:</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
          </div>
          <div className="form-group">
            <label>Temporary Password:</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
          </div>
          <div className="form-group">
            <label>System Role:</label>
            <select
  value={formData.role}
  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
>
  <option value="RECEPTION">Receptionist</option>
  <option value="DOCTOR">Doctor</option>
  <option value="NURSE">Nurse</option>
  <option value="LAB">Lab Technician</option>
  <option value="ADMIN">Administrator</option>
</select>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{ backgroundColor: '#0284c7', color: '#fff', padding: '10px 20px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
        >
          {loading ? 'Creating Account...' : 'Create Staff Account'}
        </button>
      </form>

      {error && <div style={{ color: '#dc2626', marginBottom: '12px' }}>{error}</div>}
      {message && <div style={{ color: '#16a34a', marginBottom: '12px', fontWeight: 600 }}>{message}</div>}

      {/* Existing Staff Directory */}
      <h3>Registered Clinic Staff Directory</h3>
      {users.length === 0 ? (
        <p style={{ color: '#64748b' }}>No additional staff listed or directory endpoint not configured yet. New accounts created above are immediately active for login.</p>
      ) : (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginTop: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #cbd5e1', backgroundColor: '#f8fafc' }}>
                <th style={{ padding: '10px' }}>Name</th>
                <th style={{ padding: '10px' }}>Username</th>
                <th style={{ padding: '10px' }}>Role</th>
              </tr>
            </thead>
            <tbody>
              {currentUsersSlice.map((u) => (
                <tr key={u._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '10px', fontWeight: 600 }}>{u.fullName}</td>
                  <td style={{ padding: '10px' }}>{u.username}</td>
                  <td style={{ padding: '10px' }}>
                    <span style={{ padding: '4px 8px', backgroundColor: '#e0f2fe', color: '#0369a1', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>
                      {u.role}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}