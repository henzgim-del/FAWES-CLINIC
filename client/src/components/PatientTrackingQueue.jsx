import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';

export default function PatientTrackingQueue() {
  const [currentVisits, setCurrentVisits] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchActiveVisits();
  }, []);

  const fetchActiveVisits = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/visits', 'GET');
      const sorted = (res.data || []).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setCurrentVisits(sorted);
    } catch (err) {
      setError('Failed to fetch patient tracking queue.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (visitId, newStatus) => {
    try {
      await apiRequest(`/visits/${visitId}/status`, 'PATCH', { status: newStatus });
      fetchActiveVisits();
    } catch (err) {
      alert('Failed to update visit status.');
    }
  };

  const filteredVisits = currentVisits.filter(visit => {
    if (statusFilter === 'ALL') return true;
    return visit.status === statusFilter;
  });

  return (
    <div className="card" style={{ maxWidth: '950px', margin: '0 auto', padding: '20px' }}>
      <h2>Active Patient Tracking Queue</h2>
      <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '16px' }}>
        Track patient visits, filter by status, and update queue progression.
      </p>

      {error && <div style={{ color: '#dc2626', marginBottom: '12px', fontWeight: 600 }}>{error}</div>}

      {/* Status Filter Dropdown */}
      <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <label style={{ fontWeight: 600 }}>Filter Status:</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', minWidth: '180px' }}
        >
          <option value="ALL">All Visits</option>
          <option value="WAITING">Waiting</option>
          <option value="PENDING_TRIAGE">Pending Triage</option>
          <option value="WAITING_DOCTOR">Waiting Doctor</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      {/* Scrollable Table Container restricted to ~4-5 visible rows (~260px) */}
      <div style={{ maxHeight: '260px', overflowY: 'auto', border: '1px solid #cbd5e1', borderRadius: '8px', background: '#fff' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f1f5f9', zIndex: 1 }}>
            <tr style={{ borderBottom: '2px solid #cbd5e1' }}>
              <th style={{ padding: '12px' }}>Patient Name</th>
              <th style={{ padding: '12px' }}>Department</th>
              <th style={{ padding: '12px' }}>Chief Complaint</th>
              <th style={{ padding: '12px' }}>Status</th>
              <th style={{ padding: '12px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredVisits.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                  {loading ? 'Loading active queue...' : 'No active visits found for this status.'}
                </td>
              </tr>
            ) : (
              filteredVisits.map((visit) => (
                <tr key={visit._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px', fontWeight: 600 }}>{visit.patient?.fullName || 'Unknown Patient'}</td>
                  <td style={{ padding: '12px' }}>{visit.department || 'GENERAL'}</td>
                  <td style={{ padding: '12px', color: '#475569' }}>{visit.chiefComplaint || 'N/A'}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600, background: '#e0f2fe', color: '#0369a1' }}>
                      {visit.status || 'WAITING'}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <select
                      value={visit.status || 'WAITING'}
                      onChange={(e) => handleUpdateStatus(visit._id, e.target.value)}
                      style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                    >
                      <option value="WAITING">Waiting</option>
                      <option value="PENDING_TRIAGE">Pending Triage</option>
                      <option value="WAITING_DOCTOR">Waiting Doctor</option>
                      <option value="COMPLETED">Completed</option>
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}