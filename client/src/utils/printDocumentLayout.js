/**
 * printDocumentLayout.js
 * Professional print document template generator for FAWES Clinic Management System.
 * Supports: INVOICE, SICK_LEAVE, FULL_REFERRAL, OUTSOURCED_TEST, OUTSOURCED_PRESCRIPTION
 */

export function printDocumentLayout(docType, patient, docData = {}) {
  // Open a clean browser print window
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow pop-ups for this website to enable document printing.');
    return;
  }

  // Helper function to safely format dates
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Build dynamic section HTML based on the document type schema
  let dynamicContent = '';

  switch (docType) {
    case 'INVOICE': {
      const invoice = docData.invoiceDetails || { items: [], totalAmount: 0 };
      const itemsHtml = invoice.items && invoice.items.length > 0
        ? invoice.items.map(item => `
            <tr>
              <td>${item.serviceName || 'General Clinical Service'}</td>
              <td style="text-align: right;">$${(item.amount || 0).toFixed(2)}</td>
            </tr>
          `).join('')
        : '<tr><td colspan="2" style="text-align: center; color: #64748b;">No service items recorded</td></tr>';

      dynamicContent = `
        <div class="section-title">Invoice & Payment Summary</div>
        <table>
          <thead>
            <tr>
              <th>Service Name</th>
              <th style="text-align: right;">Amount ($)</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        <div class="total-section">
          <span>Total Payable Amount:</span>
          <span class="total-amount">$${(invoice.totalAmount || 0).toFixed(2)}</span>
        </div>
        <div class="status-badge ${invoice.paymentStatus === 'PAID' ? 'status-paid' : 'status-pending'}">
          Payment Status: ${invoice.paymentStatus || 'PENDING'}
        </div>
      `;
      break;
    }

    case 'SICK_LEAVE': {
      const sick = docData.sickLeaveDetails || {};
      dynamicContent = `
        <div class="section-title">Medical Certificate (Sick Leave)</div>
        <div class="field-group">
          <p><strong>Organization / Employer:</strong> ${docData.organizationName || 'N/A'}</p>
          <p><strong>Reason for Examination:</strong> ${sick.reasonForExamination || 'Clinical Evaluation & Rest'}</p>
        </div>
        <div class="grid-2">
          <p><strong>First Check-in Date:</strong> ${formatDate(sick.firstCheckInDate)}</p>
          <p><strong>Total Duration:</strong> ${sick.numberOfDays || 'N/A'} Day(s)</p>
          <p><strong>Start Date:</strong> ${formatDate(sick.startDate)}</p>
          <p><strong>End Date:</strong> ${formatDate(sick.endDate)}</p>
        </div>
        <div class="clinical-block">
          <p><strong>Doctor Remarks & Instructions:</strong></p>
          <p>${sick.remarks || 'Patient is advised to rest and follow medical prescriptions.'}</p>
        </div>
      `;
      break;
    }

    case 'FULL_REFERRAL': {
      const ref = docData.fullReferralDetails || {};
      dynamicContent = `
        <div class="section-title">Hospital / Organization Full Referral</div>
        <div class="field-group">
          <p><strong>Referred To Facility:</strong> ${docData.organizationName || 'External Specialist Hospital'}</p>
          <p><strong>Reason for Referral:</strong> ${ref.reasonForReferral || 'Specialized clinical intervention required.'}</p>
        </div>
        <div class="clinical-block">
          <p><strong>Current Patient Condition:</strong></p>
          <p>${ref.currentCondition || 'Stable, requiring further diagnostic review.'}</p>
        </div>
        <div class="clinical-block">
          <p><strong>Clinical Findings:</strong></p>
          <p>${ref.clinicalFindings || 'None documented.'}</p>
        </div>
        <div class="clinical-block">
          <p><strong>Lab Results Summary:</strong></p>
          <p>${ref.labResultsSummary || 'Attached or pending.'}</p>
        </div>
      `;
      break;
    }

    case 'OUTSOURCED_TEST': {
      const test = docData.outsourcedTestDetails || {};
      const testsList = test.requiredTests && test.requiredTests.length > 0
        ? test.requiredTests.map(t => `<li>${t}</li>`).join('')
        : '<li>Standard Diagnostic / Ultrasound Scan</li>';

      dynamicContent = `
        <div class="section-title">Outsourced Test / Diagnostic Order Form</div>
        <div class="field-group">
          <p><strong>Destination Laboratory / Facility:</strong> ${docData.organizationName || 'External Diagnostic Center'}</p>
          <p><strong>Clinical Indication:</strong> ${test.clinicalIndication || 'Diagnostic verification'}</p>
        </div>
        <div class="clinical-block">
          <p><strong>Required Test(s):</strong></p>
          <ul class="test-list">
            ${testsList}
          </ul>
        </div>
      `;
      break;
    }

    case 'OUTSOURCED_PRESCRIPTION': {
      const rx = docData.outsourcedPrescriptionDetails || { medications: [] };
      const medsHtml = rx.medications && rx.medications.length > 0
        ? rx.medications.map(med => `
            <tr>
              <td><strong>${med.drugName || 'N/A'}</strong></td>
              <td>${med.dosage || 'N/A'}</td>
              <td>${med.frequency || 'N/A'}</td>
              <td>${med.duration || 'N/A'}</td>
              <td>${med.instructions || 'N/A'}</td>
            </tr>
          `).join('')
        : '<tr><td colspan="5" style="text-align: center; color: #64748b;">No medications prescribed</td></tr>';

      dynamicContent = `
        <div class="section-title">External Prescription Paper (Rx)</div>
        <table>
          <thead>
            <tr>
              <th>Medication Name</th>
              <th>Dosage</th>
              <th>Frequency</th>
              <th>Duration</th>
              <th>Instructions</th>
            </tr>
          </thead>
          <tbody>
            ${medsHtml}
          </tbody>
        </table>
      `;
      break;
    }

    default:
      dynamicContent = `<div class="section-title">General Medical Document</div><p>Standard clinical records.</p>`;
  }

  // Determine signature title: Receptionist for invoices, Doctor for clinical forms
  const isInvoice = docType === 'INVOICE';
  const signatureLabel = isInvoice ? 'Receptionist Signature & Stamp' : "Doctor's Signature & Stamp";

  // Write professional HTML & CSS template stream
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>FAWES Clinic - ${docType}</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            padding: 40px;
            color: #1e293b;
            line-height: 1.6;
            background-color: #ffffff;
            margin: 0;
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #2b9348;
            padding-bottom: 16px;
            margin-bottom: 24px;
          }
          .clinic-name {
            font-size: 24px;
            font-weight: 800;
            color: #166534;
            margin: 0;
            letter-spacing: 0.5px;
            text-transform: uppercase;
          }
          .clinic-sub {
            font-size: 13px;
            color: #64748b;
            margin-top: 6px;
          }
          .patient-box {
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            padding: 14px 18px;
            border-radius: 8px;
            margin-bottom: 24px;
            display: flex;
            justify-content: space-between;
            flex-wrap: wrap;
          }
          .patient-box p {
            margin: 4px 0;
            font-size: 13px;
          }
          .section-title {
            font-size: 14px;
            font-weight: 700;
            text-transform: uppercase;
            margin-bottom: 12px;
            color: #0f172a;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 6px;
            letter-spacing: 0.5px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            margin-bottom: 15px;
          }
          th, td {
            border: 1px solid #cbd5e1;
            padding: 10px 12px;
            font-size: 12px;
            text-align: left;
          }
          th {
            background: #f1f5f9;
            color: #334155;
            font-weight: 700;
          }
          .total-section {
            display: flex;
            justify-content: flex-end;
            gap: 24px;
            font-size: 15px;
            font-weight: bold;
            margin-top: 12px;
            margin-bottom: 12px;
            color: #0f172a;
          }
          .total-amount {
            color: #166534;
          }
          .status-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: bold;
            margin-top: 8px;
          }
          .status-paid {
            background-color: #dcfce7;
            color: #166534;
            border: 1px solid #bbf7d0;
          }
          .status-pending {
            background-color: #fef3c7;
            color: #d97706;
            border: 1px solid #fde68a;
          }
          .grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 16px;
            background: #fdfdfd;
            border: 1px solid #e2e8f0;
            padding: 12px;
            border-radius: 6px;
          }
          .grid-2 p, .field-group p {
            margin: 6px 0;
            font-size: 13px;
          }
          .clinical-block {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 12px;
            border-radius: 6px;
            margin-bottom: 14px;
            font-size: 13px;
          }
          .test-list {
            margin: 6px 0 0 20px;
            padding: 0;
            font-size: 13px;
          }
          .footer {
            margin-top: 60px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            font-size: 12px;
            border-top: 1px solid #e2e8f0;
            padding-top: 20px;
          }
          .signature-box {
            border-top: 1px solid #334155;
            width: 240px;
            text-align: center;
            padding-top: 8px;
            font-weight: 700;
            color: #334155;
          }
          .test-footer {
            text-align: center;
            font-size: 11px;
            color: #94a3b8;
            margin-top: 40px;
            border-top: 1px dashed #cbd5e1;
            padding-top: 10px;
          }
          @media print {
            body { padding: 10px; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="clinic-name">FAWES Clinic Management System</h1>
          <p class="clinic-sub">Official Clinical Documentation & Information Portal</p>
        </div>

        <div class="patient-box">
          <div>
            <p><strong>Patient Name:</strong> ${patient.fullName || 'N/A'}</p>
            <p><strong>Phone Number:</strong> ${patient.phone || 'N/A'}</p>
          </div>
          <div>
            <p><strong>Age / Gender:</strong> ${patient.age || 'N/A'} yrs / ${patient.gender || 'N/A'}</p>
            <p><strong>Date Issued:</strong> ${formatDate(new Date())}</p>
          </div>
        </div>

        ${dynamicContent}

        <div class="footer">
          <div>
            <p><strong>Document ID:</strong> ${docData._id ? docData._id.slice(-8).toUpperCase() : 'SYS-TEST-001'}</p>
            <p>Generated via FAWES Secure Clinical Gateway</p>
          </div>
          <div>
            <div class="signature-box">${signatureLabel}</div>
          </div>
        </div>

        <div class="test-footer">
          FAWES Clinic Headquarters • Email: support@fawesclinic-test.org • Phone: +1 (555) 019-2834 • 123 Health Ave, Suite 400
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}