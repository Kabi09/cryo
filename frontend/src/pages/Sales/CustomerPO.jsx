import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import StatusBadge from '../../components/Common/StatusBadge';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import EmptyState from '../../components/Common/EmptyState';
import ErrorMessage from '../../components/Common/ErrorMessage';

// MUI Icons
import FactCheckIcon from '@mui/icons-material/FactCheck';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';

export default function CustomerPO() {
  const [pos, setPos] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedQuoteId, setSelectedQuoteId] = useState('');
  const [poNumber, setPoNumber] = useState('');
  const [poDate, setPoDate] = useState('');
  const [poAmount, setPoAmount] = useState('');
  const [poFile, setPoFile] = useState(null);

  // Verification Screen State
  const [selectedPO, setSelectedPO] = useState(null);
  const [verificationData, setVerificationData] = useState(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [posRes, qRes] = await Promise.all([
        api.get('/customer-pos'),
        api.get('/quotations?status=ACCEPTED')
      ]);
      setPos(posRes.data.pos || []);
      setQuotations(qRes.data.quotations || []);
      if (qRes.data.quotations?.length > 0) {
        setSelectedQuoteId(qRes.data.quotations[0]._id);
        setPoAmount(qRes.data.quotations[0].grandTotal);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUploadPO = async (e) => {
    e.preventDefault();
    try {
      const quote = quotations.find(q => q._id === selectedQuoteId);
      if (!quote) throw new Error('Please select an accepted quotation');

      const formData = new FormData();
      formData.append('poNumber', poNumber);
      formData.append('poDate', poDate || new Date().toISOString());
      formData.append('customerId', quote.customerId._id || quote.customerId);
      formData.append('quotationId', quote._id);
      formData.append('totalAmount', Number(poAmount));
      formData.append('paymentTerms', quote.paymentTerms);
      formData.append('deliveryTerms', quote.deliveryTerms);
      formData.append('warrantyTerms', quote.warrantyTerms);
      formData.append('items', JSON.stringify(quote.items));
      if (poFile) formData.append('poDocument', poFile);

      await api.post('/customer-pos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setShowUploadModal(false);
      setPoNumber('');
      setPoAmount('');
      setPoFile(null);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRunVerification = async (poId) => {
    try {
      const res = await api.post(`/customer-pos/${poId}/actions/verify`);
      const poDetail = await api.get(`/customer-pos/${poId}`);
      setSelectedPO(poDetail.data.po);
      setVerificationData(res.data.verification);
      setShowVerifyModal(true);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleConfirmSO = async () => {
    if (!selectedPO) return;
    try {
      await api.post(`/customer-pos/${selectedPO._id}/actions/confirm-so`, {
        managerOverrideReason: overrideReason
      });
      alert('Sales Order generated and confirmed successfully!');
      setShowVerifyModal(false);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f3f4f6' }}>
            Customer Purchase Orders & 4-Way Verification
          </h1>
          <p style={{ fontSize: '0.825rem', color: '#9ca3af' }}>
            Dedicated contract comparison engine between Quotation, Revision, Proforma, and Official Customer PO
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setShowUploadModal(true)}>
          + Upload Customer PO
        </button>
      </div>

      {error && <ErrorMessage message={error} onRetry={fetchData} />}

      {loading ? (
        <LoadingSpinner message="Loading customer purchase orders..." />
      ) : pos.length === 0 ? (
        <EmptyState
          title="No customer POs recorded"
          description="Upload an official customer PO to trigger the 4-way contract verification engine."
          actionLabel="+ Record Customer PO"
          onAction={() => setShowUploadModal(true)}
        />
      ) : (
        <div className="erp-table-container">
          <table className="erp-table">
            <thead>
              <tr>
                <th>PO Number</th>
                <th>Client Account</th>
                <th>Reference Quote</th>
                <th>PO Value</th>
                <th>Status</th>
                <th>PO Date</th>
                <th>Verification Actions</th>
              </tr>
            </thead>
            <tbody>
              {pos.map((po) => (
                <tr key={po._id}>
                  <td style={{ fontWeight: 700, color: '#38bdf8' }}>{po.poNumber}</td>
                  <td style={{ fontWeight: 600 }}>{po.customerId?.companyName}</td>
                  <td>{po.quotationId?.quotationNumber || 'QT-REFERENCE'}</td>
                  <td style={{ fontWeight: 700, color: '#10b981' }}>₹{po.totalAmount?.toLocaleString('en-IN')}</td>
                  <td><StatusBadge status={po.status} /></td>
                  <td>{new Date(po.poDate).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleRunVerification(po._id)}
                    >
                      <FactCheckIcon style={{ fontSize: '16px' }} />
                      4-Way Verification →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Upload PO Modal */}
      {showUploadModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Upload & Record Client Purchase Order</h3>
              <button className="close-btn" onClick={() => setShowUploadModal(false)}>✕</button>
            </div>
            <form onSubmit={handleUploadPO}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Select Accepted Quotation Reference *</label>
                  <select
                    value={selectedQuoteId}
                    onChange={(e) => {
                      setSelectedQuoteId(e.target.value);
                      const q = quotations.find(item => item._id === e.target.value);
                      if (q) setPoAmount(q.grandTotal);
                    }}
                    required
                  >
                    {quotations.map((q) => (
                      <option key={q._id} value={q._id}>
                        {q.quotationNumber} - {q.customerId?.companyName} (₹{q.grandTotal?.toLocaleString('en-IN')})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Official Customer PO Number *</label>
                    <input
                      required
                      value={poNumber}
                      onChange={(e) => setPoNumber(e.target.value)}
                      placeholder="e.g. PO-APOLLO-2026-88"
                    />
                  </div>
                  <div className="form-group">
                    <label>PO Date</label>
                    <input
                      type="date"
                      value={poDate}
                      onChange={(e) => setPoDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>PO Stated Total Value (₹) *</label>
                  <input
                    type="number"
                    required
                    value={poAmount}
                    onChange={(e) => setPoAmount(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Attach Official Signed PO Document (PDF / Scan)</label>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => setPoFile(e.target.files[0])}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowUploadModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Customer PO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4-Way Comparison Screen Modal */}
      {showVerifyModal && verificationData && selectedPO && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '850px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <FactCheckIcon style={{ color: '#38bdf8' }} />
                <h3>4-Way Contract Comparison Engine: {selectedPO.poNumber}</h3>
              </div>
              <button className="close-btn" onClick={() => setShowVerifyModal(false)}>✕</button>
            </div>

            <div className="modal-body">
              {/* Overall Status Banner */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderRadius: '8px',
                backgroundColor: verificationData.overallStatus === 'MATCH'
                  ? 'rgba(16, 185, 129, 0.15)'
                  : 'rgba(239, 68, 68, 0.15)',
                border: `1px solid ${verificationData.overallStatus === 'MATCH' ? '#10b981' : '#ef4444'}`,
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {verificationData.overallStatus === 'MATCH' ? (
                    <CheckCircleIcon style={{ color: '#10b981', fontSize: '28px' }} />
                  ) : (
                    <WarningAmberIcon style={{ color: '#ef4444', fontSize: '28px' }} />
                  )}
                  <div>
                    <h4 style={{ fontWeight: 800, color: '#f3f4f6' }}>
                      Verification Verdict: {verificationData.overallStatus}
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                      {verificationData.overallStatus === 'MATCH'
                        ? 'All products, quantities, tax rates, total commercials, and terms match agreed quotation.'
                        : `Contract Discrepancy Identified: ${verificationData.mismatchSummary?.join(' | ')}`}
                    </p>
                  </div>
                </div>
                <StatusBadge status={verificationData.overallStatus} />
              </div>

              {/* Line Items Comparison Table */}
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f3f4f6', marginBottom: '8px' }}>
                1. Line Items & Commercial Comparison
              </h4>
              <div className="erp-table-container" style={{ marginBottom: '20px' }}>
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th>Product SKU</th>
                      <th>Quote Qty</th>
                      <th>PO Qty</th>
                      <th>Quote Rate</th>
                      <th>PO Rate</th>
                      <th>Comparison</th>
                    </tr>
                  </thead>
                  <tbody>
                    {verificationData.itemComparisons?.map((item, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600 }}>{item.sku || item.name}</td>
                        <td>{item.quotationQty}</td>
                        <td>{item.poQty}</td>
                        <td>₹{item.quotationUnitPrice?.toLocaleString('en-IN')}</td>
                        <td>₹{item.poUnitPrice?.toLocaleString('en-IN')}</td>
                        <td><StatusBadge status={item.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Commercial Terms Comparison Table */}
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f3f4f6', marginBottom: '8px' }}>
                2. Legal & Commercial Terms Comparison
              </h4>
              <div className="erp-table-container" style={{ marginBottom: '20px' }}>
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th>Term Category</th>
                      <th>Agreed Quotation Term</th>
                      <th>Customer PO Term</th>
                      <th>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {verificationData.termComparisons?.map((term, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600 }}>{term.termType?.replace(/_/g, ' ')}</td>
                        <td style={{ fontSize: '0.75rem', maxWidth: '250px' }}>{term.quotationTerm}</td>
                        <td style={{ fontSize: '0.75rem', maxWidth: '250px' }}>{term.poTerm}</td>
                        <td><StatusBadge status={term.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {verificationData.overallStatus !== 'MATCH' && (
                <div className="form-group" style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', padding: '16px', borderRadius: '8px' }}>
                  <label style={{ color: '#f87171' }}>Management Override Justification (Required if confirming with mismatch):</label>
                  <textarea
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    placeholder="Enter executive commercial justification to proceed with order..."
                  />
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowVerifyModal(false)}>
                Close
              </button>

              <button
                type="button"
                className="btn btn-success"
                onClick={handleConfirmSO}
                disabled={verificationData.overallStatus !== 'MATCH' && !overrideReason.trim()}
              >
                <ShoppingCartIcon style={{ fontSize: '18px' }} />
                Confirm & Generate Sales Order →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
