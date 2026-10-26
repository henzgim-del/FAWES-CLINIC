import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';

export default function DocumentPrintingHub() {
  const [visits, setVisits] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVisitId, setSelectedVisitId] = useState('');
  const [documentType, setDocumentType] = useState('INVOICE'); // Document selection option
  const [isListCollapsed, setIsListCollapsed] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchVisits();
  }, []);

  const fetchVisits = async () => {
    try {
      const res = await apiRequest('/visits', 'GET');
      const sorted = (res.data || []).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setVisits(sorted);
    } catch (err) {
      console.error('Failed to fetch visits for printing:', err);
    }
  };

  const handleSearchClick = () => {
    setSearchTerm(searchInput);
  };

  const filteredVisits = visits.filter(v =>
    v.patient?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.patient?.phone?.includes(searchTerm)
  );

  const selectedVisit = visits.find(v => v._id === selectedVisitId);

  const handlePrintDocument = () => {
    if (!selectedVisit) return;
    window.print();
  };

  return (
    <div className="card" style={{ maxWidth: '850px', margin: '0 auto', padding: '20px' }}>
      <h2>Reception Document Printing Hub</h2>
      <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '16px' }}>
        Search visits, select document type, and print official records.
      </p>

      {error && <div style={{ color: '#dc2626', marginBottom: '12px', fontWeight: 600 }}>{error}</div>}

      {/* Document Type Selection */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>Select Document Type to Print:</label>
        <select
          value={documentType}
          onChange={(e) => setDocumentType(e.target.value)}
          style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '15px' }}
        >
          <option value="INVOICE">Official Invoice & Receipt</option>
          <option value="PRESCRIPTION">Prescription Summary</option>
          <option value="LAB_REPORT">Laboratory Report</option>
          <option value="MEDICAL_CERTIFICATE">Medical Certificate</option>
        </select>
      </div>

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
        <div id="printable-document" style={{ padding: '24px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #0f172a', paddingBottom: '12px', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, color: '#0f172a' }}>FAWES Clinic Management</h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Official Document: {documentType}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: '13px' }}><strong>Date:</strong> {new Date(selectedVisit.createdAt).toLocaleDateString()}</p>
              <p style={{ margin: 0, fontSize: '13px' }}><strong>Visit ID:</strong> {selectedVisit._id}</p>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <p><strong>Patient Name:</strong> {selectedVisit.patient?.fullName}</p>
            <p><strong>Phone:</strong> {selectedVisit.patient?.phone}</p>
            <p><strong>Age / Gender:</strong> {selectedVisit.patient?.age} / {selectedVisit.patient?.gender}</p>
            <p><strong>Department:</strong> {selectedVisit.department}</p>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={handlePrintDocument}
        disabled={!selectedVisitId}
        style={{ width: '100%', padding: '12px', background: selectedVisitId ? '#0284c7' : '#94a3b8', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: selectedVisitId ? 'pointer' : 'not-allowed' }}
      >
        Print Selected {documentType}
      </button>
    </div>
  );
}