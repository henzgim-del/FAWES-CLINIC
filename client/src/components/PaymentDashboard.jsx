import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';

export default function PaymentDashboard() {
  const [visits, setVisits] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVisitId, setSelectedVisitId] = useState('');
  const [isListCollapsed, setIsListCollapsed] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPendingVisits();
  }, []);

  const fetchPendingVisits = async () => {
    try {
      const res = await apiRequest('/visits', 'GET');
      const sorted = (res.data || []).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setVisits(sorted);
    } catch (err) {
      console.error('Failed to fetch visits:', err);
    }
  };

  const handleSearchClick = () => {
    setSearchTerm(searchInput);
  };

  const handleProcessPayment = async () => {
    if (!selectedVisitId) {
      setError('Please select a visit/patient from the list.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      await apiRequest(`/visits/${selectedVisitId}/pay`, 'PATCH', {
        status: 'PENDING_TRIAGE'
      });
      setMessage('Payment processed successfully! Visit moved to active queue.');
      setSelectedVisitId('');
      fetchPendingVisits();
    } catch (err) {
      setError(err.message || 'Failed to process payment.');
    } finally {
      setLoading(false);
    }
  };

  const filteredVisits = visits.filter(v =>
    v.patient?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.patient?.phone?.includes(searchTerm)
  );

  const selectedVisit = visits.find(v => v._id === selectedVisitId);

  return (
    <div className="card" style={{ maxWidth: '850px', margin: '0 auto', padding: '20px' }}>
      <h2>Billing & Invoice Payment Management</h2>
      <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '16px' }}>
        Search patient visits or select from the scrollable table to process invoice payments.
      </p>

      {error && <div style={{ color: '#dc2626', marginBottom: '12px', fontWeight: 600 }}>{error}</div>}
      {message && <div style={{ color: '#16a34a', marginBottom: '12px', fontWeight: 600 }}>{message}</div>}

      {/* Separated Search Input with Search Button */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>Search Visit by Patient Name or Phone:</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
          />
          <button
            type="button"
            onClick={handleSearchClick}
            style={{ padding: '10px 20px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
          >
            Search
          </button>
        </div>
      </div>

      {/* Collapsible Table Section */}
      <div style={{ marginBottom: '20px', border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#f8fafc' }}>
        <div 
          onClick={() => setIsListCollapsed(!isListCollapsed)}
          style={{ padding: '12px 15px', background: '#e2e8f0', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}
        >
          <span>Select Visit from Existing List {isListCollapsed ? '▶' : '▼'}</span>
          <span style={{ fontSize: '12px', color: '#64748b' }}>{selectedVisitId ? 'Visit Selected ✓' : 'Click to toggle'}</span>
        </div>

        {!isListCollapsed && (
          <div style={{ padding: '10px' }}>
            <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#fff' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f1f5f9', zIndex: 1 }}>
                  <tr style={{ borderBottom: '2px solid #cbd5e1' }}>
                    <th style={{ padding: '8px' }}>Patient Name</th>
                    <th style={{ padding: '8px' }}>Phone</th>
                    <th style={{ padding: '8px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVisits.length === 0 ? (
                    <tr><td colSpan="3" style={{ padding: '12px', textAlign: 'center', color: '#64748b' }}>No visits found.</td></tr>
                  ) : (
                    filteredVisits.map(v => (
                      <tr
                        key={v._id}
                        onClick={() => setSelectedVisitId(v._id)}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          cursor: 'pointer',
                          background: selectedVisitId === v._id ? '#e0f2fe' : '#fff'
                        }}
                      >
                        <td style={{ padding: '8px', fontWeight: 600 }}>{v.patient?.fullName || 'Unknown Patient'}</td>
                        <td style={{ padding: '8px' }}>{v.patient?.phone || 'N/A'}</td>
                        <td style={{ padding: '8px', color: '#0284c7', fontWeight: 600 }}>{v.status}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {selectedVisit && (
        <div style={{ padding: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '20px' }}>
          <h4>Selected Visit Summary</h4>
          <p><strong>Patient:</strong> {selectedVisit.patient?.fullName}</p>
          <p><strong>Phone:</strong> {selectedVisit.patient?.phone}</p>
          <p><strong>Current Status:</strong> {selectedVisit.status}</p>
        </div>
      )}

      <button
        type="button"
        onClick={handleProcessPayment}
        disabled={loading || !selectedVisitId}
        style={{ width: '100%', padding: '12px', background: selectedVisitId ? '#16a34a' : '#94a3b8', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: selectedVisitId ? 'pointer' : 'not-allowed' }}
      >
        {loading ? 'Processing...' : 'Process Payment & Complete Registration'}
      </button>
    </div>
  );
}