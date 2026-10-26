// client/src/components/VisitDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../services/api';
import { printDocumentLayout } from '../utils/printDocumentLayout';

export default function VisitDashboard({ user, onLogout }) {
  const [intakeTab, setIntakeTab] = useState('new');
  const [isListCollapsed, setIsListCollapsed] = useState(true);
  
  const [patients, setPatients] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const patientsPerPage = 5;

  // Optimized Print Hub states (Collapsible & Compact)
  const [printSearchInput, setPrintSearchInput] = useState('');
  const [printSearchTerm, setPrintSearchTerm] = useState('');
  const [printSelectedPatientId, setPrintSelectedPatientId] = useState('');
  const [isPrintListCollapsed, setIsPrintListCollapsed] = useState(true);
  const [isDocTypeCollapsed, setIsDocTypeCollapsed] = useState(true);
  const [selectedDocType, setSelectedDocType] = useState('');

  const [patientData, setPatientData] = useState({
    fullName: '',
    age: '',
    gender: 'Male',
    phone: '',
    address: '',
    bloodGroup: 'Unknown'
  });

  const [registrationFee, setRegistrationFee] = useState(50);
  const [confirmPayment, setConfirmPayment] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [activeVisits, setActiveVisits] = useState([]);
  const [pendingBilling, setPendingBilling] = useState([]);

  const fetchPatients = useCallback(async () => {
    try {
      const res = await apiRequest('/patients', 'GET');
      const sorted = (res.data || []).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setPatients(sorted);
    } catch (err) {
      console.error('Failed to fetch patients:', err);
    }
  }, []);

  const fetchQueueAndBilling = useCallback(async () => {
    try {
      const visitRes = await apiRequest('/visits', 'GET');
      const visits = visitRes.data || [];
      setActiveVisits(visits);

      const postExamBilling = visits.filter(v => 
        v.status === 'PENDING_LAB_PAYMENT' || 
        v.status === 'PENDING_PRESCRIPTION_PAYMENT' ||
        v.status === 'READY_FOR_CHECKOUT' ||
        v.paymentStatus === 'AWAITING_POST_EXAM_PAYMENT'
      );
      setPendingBilling(postExamBilling);
    } catch (err) {
      console.error('Failed to fetch visits queue:', err);
    }
  }, []);

  useEffect(() => {
    fetchQueueAndBilling();
    fetchPatients();
  }, [fetchQueueAndBilling, fetchPatients]);

  const handleRegisterAndPay = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      let activePatientId = selectedPatientId;

      if (intakeTab === 'existing' && !activePatientId) {
        throw new Error('Please select an existing patient from the list.');
      }

      if (intakeTab === 'new') {
        const patientRes = await apiRequest('/patients', 'POST', {
          ...patientData,
          age: Number(patientData.age)
        });
        activePatientId = patientRes.data?._id || patientRes.data?.id || patientRes.data?.patient?._id;
      }

      if (!activePatientId) {
        throw new Error('Patient identification failed. Please select or register a patient.');
      }

      await apiRequest('/visits', 'POST', {
        patientId: activePatientId,
        chiefComplaint: patientData.chiefComplaint || 'Standard Reception Registration',
        department: 'General',
        status: 'PENDING_TRIAGE'
      });

      setMessage('Patient successfully registered and sent to doctor!');
      setPatientData({ fullName: '', age: '', gender: 'Male', phone: '', address: '', bloodGroup: 'Unknown' });
      setSelectedPatientId('');
      setSearchInput('');
      setSearchTerm('');
      fetchQueueAndBilling();
      fetchPatients();

    } catch (err) {
      setError(err.message || 'Server error creating visit. Please check input fields.');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayment = async (visit) => {
    try {
      await apiRequest(`/visits/${visit._id}/pay`, 'POST', { amountPaid: 100 });
      setMessage('Post-exam payment collected successfully!');
      fetchQueueAndBilling();
    } catch (err) {
      setError(err.message || 'Failed to process payment.');
    }
  };

  const handleExecutePrint = () => {
    if (!printSelectedPatientId) {
      alert('Please select a patient first.');
      return;
    }
    if (!selectedDocType) {
      alert('Please select a document type to print.');
      return;
    }
    const targetPatient = patients.find(p => p._id === printSelectedPatientId);
    
    // Mock document payload conforming to schema requirements for layout rendering
    const mockDocData = {
      _id: targetPatient._id,
      organizationName: 'External Partner Facility / Lab',
      invoiceDetails: {
        items: [{ serviceName: 'Consultation & Registration Fee', amount: 50 }],
        totalAmount: 50,
        paymentStatus: 'PAID'
      },
      sickLeaveDetails: {
        firstCheckInDate: new Date(),
        reasonForExamination: 'General Health Assessment',
        startDate: new Date(),
        endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        numberOfDays: 2,
        remarks: 'Rest prescribed.'
      },
      fullReferralDetails: {
        reasonForReferral: 'Specialized evaluation needed',
        currentCondition: 'Stable',
        clinicalFindings: 'Evaluated at primary desk',
        labResultsSummary: 'Pending/Normal'
      },
      outsourcedTestDetails: {
        clinicalIndication: 'Diagnostic Screening',
        requiredTests: ['Ultrasound Scan', 'Complete Blood Count']
      },
      outsourcedPrescriptionDetails: {
        medications: [
          { drugName: 'Paracetamol', dosage: '500mg', frequency: 'TID', duration: '3 days', instructions: 'After meals' }
        ]
      }
    };

    printDocumentLayout(selectedDocType, targetPatient, mockDocData);
  };

  const filteredPatients = patients.filter(p =>
    p.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.phone?.includes(searchTerm)
  );

  const filteredPrintPatients = patients.filter(p => {
    const query = printSearchTerm.toLowerCase();
    const nameMatch = p.fullName?.toLowerCase().includes(query);
    const phoneMatch = p.phone?.includes(query);
    const idMatch = p._id?.toLowerCase().includes(query);
    return nameMatch || phoneMatch || idMatch;
  });

  const indexOfLastPatient = currentPage * patientsPerPage;
  const indexOfFirstPatient = indexOfLastPatient - patientsPerPage;
  const currentPatients = filteredPatients.slice(indexOfFirstPatient, indexOfLastPatient);
  const totalPages = Math.ceil(filteredPatients.length / patientsPerPage) || 1;

  const selectedPatient = patients.find(p => p._id === selectedPatientId);
  const printSelectedPatient = patients.find(p => p._id === printSelectedPatientId);

  return (
    <div className="clinic-dashboard-container">
      
      {/* Header */}
      <header className="clinic-header">
        <div className="clinic-brand">
          <img src="/logo.png" alt="FAWES Clinic Logo" className="clinic-logo" />
          <h1 className="clinic-title">FAWES CLINIC</h1>
        </div>

        <div className="clinic-user-actions">
          <span className="clinic-role-badge">
            Role: Receptionist ({user?.username || 'Receptionist'})
          </span>
          <button onClick={onLogout} className="clinic-logout-btn">
            Logout
          </button>
        </div>
      </header>

      {/* Main Two-Column Layout Grid */}
      <div style={{ maxWidth: '1400px', margin: '24px auto', padding: '0 24px', display: 'grid', gridTemplateColumns: '4fr 8fr', gap: '24px', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: Patient Intake Desk */}
        <div className="clinic-card">
          <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📋</span> Patient Intake Desk
          </h3>

          <div style={{ display: 'flex', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '4px', marginBottom: '20px' }}>
            <button
              type="button"
              onClick={() => { setIntakeTab('new'); setSelectedPatientId(''); setIsListCollapsed(true); }}
              style={{ flex: 1, padding: '8px', fontSize: '13px', fontWeight: '600', borderRadius: '6px', border: 'none', cursor: 'pointer', backgroundColor: intakeTab === 'new' ? '#2b9348' : 'transparent', color: intakeTab === 'new' ? '#fff' : '#64748b' }}
            >
              New Patient
            </button>
            <button
              type="button"
              onClick={() => { setIntakeTab('existing'); setIsListCollapsed(true); }}
              style={{ flex: 1, padding: '8px', fontSize: '13px', fontWeight: '600', borderRadius: '6px', border: 'none', cursor: 'pointer', backgroundColor: intakeTab === 'existing' ? '#2b9348' : 'transparent', color: intakeTab === 'existing' ? '#fff' : '#64748b' }}
            >
              Existing Patient
            </button>
          </div>

          {error && <div style={{ color: '#dc2626', fontSize: '12px', fontWeight: 600, marginBottom: '12px', padding: '8px', backgroundColor: '#fef2f2', borderRadius: '6px' }}>{error}</div>}
          {message && <div style={{ color: '#16a34a', fontSize: '12px', fontWeight: 600, marginBottom: '12px', padding: '8px', backgroundColor: '#f0fdf4', borderRadius: '6px' }}>{message}</div>}

          {intakeTab === 'existing' && (
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                Select Existing Patient *
              </label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                <input
                  type="text"
                  placeholder="Search by name or phone..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  style={{ flex: 1, border: '1px solid #cbd5e1', borderRadius: '6px', padding: '8px 12px', fontSize: '13px', outline: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => { setSearchTerm(searchInput); setCurrentPage(1); }}
                  style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Search
                </button>
              </div>

              <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#f8fafc' }}>
                <div
                  onClick={() => setIsListCollapsed(!isListCollapsed)}
                  style={{ padding: '10px 14px', backgroundColor: '#f1f5f9', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: '600', color: '#334155', fontSize: '12px' }}
                >
                  <span>Select Existing Patient from List {isListCollapsed ? '▶' : '▼'}</span>
                  <span style={{ fontSize: '11px', color: '#0284c7' }}>
                    {selectedPatientId ? `Selected: ${selectedPatient?.fullName}` : 'Click to toggle'}
                  </span>
                </div>

                {!isListCollapsed && (
                  <div style={{ padding: '8px' }}>
                    <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#fff' }}>
                      <table className="clinic-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ position: 'sticky', top: 0, backgroundColor: '#f1f5f9', zIndex: 1 }}>
                            <th style={{ padding: '8px', textAlign: 'left' }}>Name</th>
                            <th style={{ padding: '8px', textAlign: 'left' }}>Phone</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredPatients.length === 0 ? (
                            <tr>
                              <td colSpan="2" style={{ padding: '12px', textAlign: 'center', color: '#64748b' }}>No patients found.</td>
                            </tr>
                          ) : (
                            filteredPatients.map((p) => (
                              <tr
                                key={p._id}
                                onClick={() => { setSelectedPatientId(p._id); setIsListCollapsed(true); }}
                                style={{
                                  cursor: 'pointer',
                                  backgroundColor: selectedPatientId === p._id ? '#e0f2fe' : '#fff',
                                  fontWeight: selectedPatientId === p._id ? 'bold' : 'normal'
                                }}
                              >
                                <td style={{ padding: '8px', color: '#1e293b' }}>{p.fullName}</td>
                                <td style={{ padding: '8px', color: '#475569' }}>{p.phone}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {totalPages > 1 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', padding: '0 4px', fontSize: '11px', color: '#475569' }}>
                        <button
                          type="button"
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          style={{ padding: '4px 8px', backgroundColor: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer', opacity: currentPage === 1 ? 0.5 : 1 }}
                        >
                          Prev
                        </button>
                        <span>Page {currentPage} of {totalPages}</span>
                        <button
                          type="button"
                          disabled={currentPage === totalPages}
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          style={{ padding: '4px 8px', backgroundColor: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer', opacity: currentPage === totalPages ? 0.5 : 1 }}
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleRegisterAndPay}>
            {intakeTab === 'new' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>Full Name *</label>
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={patientData.fullName}
                      onChange={(e) => setPatientData({ ...patientData, fullName: e.target.value })}
                      required
                      style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '8px 12px', fontSize: '13px', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>Phone Number *</label>
                    <input
                      type="text"
                      placeholder="0912345678"
                      value={patientData.phone}
                      onChange={(e) => setPatientData({ ...patientData, phone: e.target.value })}
                      required
                      style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '8px 12px', fontSize: '13px', outline: 'none' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>Age *</label>
                    <input
                      type="number"
                      placeholder="30"
                      value={patientData.age}
                      onChange={(e) => setPatientData({ ...patientData, age: e.target.value })}
                      required
                      style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '8px 12px', fontSize: '13px', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>Gender *</label>
                    <select
                      value={patientData.gender}
                      onChange={(e) => setPatientData({ ...patientData, gender: e.target.value })}
                      style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '8px 12px', fontSize: '13px', backgroundColor: '#fff', outline: 'none' }}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                Registration / Slip Cost ($) *
              </label>
              <input
                type="number"
                value={registrationFee}
                onChange={(e) => setRegistrationFee(e.target.value)}
                required
                style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '8px 12px', fontSize: '13px', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <input
                type="checkbox"
                id="confirmRegistrationPay"
                checked={confirmPayment}
                onChange={(e) => setConfirmPayment(e.target.checked)}
                style={{ accentColor: '#2b9348', width: '16px', height: '16px' }}
              />
              <label htmlFor="confirmRegistrationPay" style={{ fontSize: '12px', fontWeight: '500', color: '#334155' }}>
                Confirm Registration Payment Received
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', backgroundColor: '#2b9348', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
            >
              {loading ? 'Processing...' : 'Register & Send to Doctor'}
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: 3 Vertically Stacked Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* 1. OPTIMIZED COLLAPSIBLE DOCUMENT PRINTING HUB */}
          <div className="clinic-card" style={{ border: '1px solid #cbd5e1' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0284c7', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🖨️</span> Document Printing Hub
            </h3>

            {/* A. Collapsible Document Type Selector */}
            <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#f8fafc', marginBottom: '12px' }}>
              <div
                onClick={() => setIsDocTypeCollapsed(!isDocTypeCollapsed)}
                style={{ padding: '8px 12px', backgroundColor: '#f1f5f9', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: '600', color: '#334155', fontSize: '12px' }}
              >
                <span>Select Document to Print {isDocTypeCollapsed ? '▶' : '▼'}</span>
                <span style={{ fontSize: '11px', color: '#0284c7' }}>
                  {selectedDocType ? `Type: ${selectedDocType}` : 'Choose document'}
                </span>
              </div>

              {!isDocTypeCollapsed && (
                <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px', backgroundColor: '#fff' }}>
                  {['INVOICE', 'OUTSOURCED_PRESCRIPTION', 'SICK_LEAVE', 'FULL_REFERRAL', 'OUTSOURCED_TEST'].map((doc) => (
                    <div
                      key={doc}
                      onClick={() => { setSelectedDocType(doc); setIsDocTypeCollapsed(true); }}
                      style={{ padding: '8px 10px', borderRadius: '6px', cursor: 'pointer', backgroundColor: selectedDocType === doc ? '#e0f2fe' : '#f8fafc', fontSize: '12px', fontWeight: selectedDocType === doc ? 'bold' : 'normal', color: '#1e293b', border: '1px solid #e2e8f0' }}
                    >
                      📄 {doc.replace('_', ' ')}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* B. Patient Search & Collapsible Select Patient List */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                Select Patient *
              </label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="text"
                  placeholder="Search by name, phone, or ID..."
                  value={printSearchInput}
                  onChange={(e) => {
                    setPrintSearchInput(e.target.value);
                    setPrintSearchTerm(e.target.value);
                  }}
                  style={{ flex: 1, border: '1px solid #cbd5e1', borderRadius: '6px', padding: '6px 10px', fontSize: '12px', outline: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => setPrintSearchTerm(printSearchInput)}
                  style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Search
                </button>
              </div>

              <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#f8fafc' }}>
                <div
                  onClick={() => setIsPrintListCollapsed(!isPrintListCollapsed)}
                  style={{ padding: '8px 12px', backgroundColor: '#f1f5f9', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: '600', color: '#334155', fontSize: '12px' }}
                >
                  <span>Select Patient from List {isPrintListCollapsed ? '▶' : '▼'}</span>
                  <span style={{ fontSize: '11px', color: '#0284c7' }}>
                    {printSelectedPatientId ? `Selected: ${printSelectedPatient?.fullName}` : 'Click to toggle'}
                  </span>
                </div>

                {!isPrintListCollapsed && (
                  <div style={{ padding: '8px' }}>
                    <div style={{ maxHeight: '140px', overflowY: 'auto', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#fff' }}>
                      <table className="clinic-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <tbody>
                          {filteredPrintPatients.length === 0 ? (
                            <tr>
                              <td style={{ padding: '8px', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>No patients found.</td>
                            </tr>
                          ) : (
                            filteredPrintPatients.map((p) => (
                              <tr
                                key={p._id}
                                onClick={() => { setPrintSelectedPatientId(p._id); setIsPrintListCollapsed(true); }}
                                style={{
                                  cursor: 'pointer',
                                  backgroundColor: printSelectedPatientId === p._id ? '#e0f2fe' : '#fff',
                                  fontWeight: printSelectedPatientId === p._id ? 'bold' : 'normal'
                                }}
                              >
                                <td style={{ padding: '6px 8px', color: '#1e293b', fontSize: '12px' }}>{p.fullName}</td>
                                <td style={{ padding: '6px 8px', color: '#475569', fontSize: '12px' }}>{p.phone}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* C. Print Action Button */}
            <button
              type="button"
              onClick={handleExecutePrint}
              style={{ width: '100%', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
            >
              Print Selected Document
            </button>
          </div>

          {/* 2. Billing & Payments */}
          <div className="clinic-card">
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#d97706', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>💳</span> Billing & Payments (Post-Examination Queue)
            </h3>

            <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
              <table className="clinic-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Post-Exam Order</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingBilling.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                        No pending post-exam billing items. (Patients appear here after doctor examination).
                      </td>
                    </tr>
                  ) : (
                    pendingBilling.map((bill) => (
                      <tr key={bill._id}>
                        <td>{bill._id.slice(-6)}</td>
                        <td style={{ fontWeight: '600' }}>{bill.patient?.fullName || 'N/A'}</td>
                        <td>{bill.status === 'PENDING_LAB_PAYMENT' ? 'Lab Test Order' : 'Prescription / Treatment'}</td>
                        <td>
                          <button
                            type="button"
                            onClick={() => handleProcessPayment(bill)}
                            style={{ backgroundColor: '#16a34a', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
                          >
                            Collect & Process
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. Active Queue & Tracking */}
          <div className="clinic-card">
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#166534', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🔄</span> Active Queue & Tracking
            </h3>

            <div style={{ maxHeight: '240px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
              <table className="clinic-table">
                <thead>
                  <tr>
                    <th>Patient Name</th>
                    <th>Department</th>
                    <th>Chief Complaint</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {activeVisits.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                        No active patients in the system.
                      </td>
                    </tr>
                  ) : (
                    activeVisits.map((visit) => (
                      <tr key={visit._id}>
                        <td style={{ fontWeight: '600' }}>{visit.patient?.fullName || 'N/A'}</td>
                        <td>{visit.department || 'General'}</td>
                        <td>{visit.chiefComplaint || 'Not recorded'}</td>
                        <td>
                          <span style={{ backgroundColor: '#ecfdf5', color: '#047857', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600', border: '1px solid #a7f3d0' }}>
                            {visit.status}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}