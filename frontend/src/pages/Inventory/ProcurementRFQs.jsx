import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import StatusBadge from '../../components/Common/StatusBadge';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import EmptyState from '../../components/Common/EmptyState';
import ErrorMessage from '../../components/Common/ErrorMessage';

// MUI Icons
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CloseIcon from '@mui/icons-material/Close';

export default function ProcurementRFQs() {
  const [rfqs, setRfqs] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Quote Submission Modal
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [selectedRfq, setSelectedRfq] = useState(null);
  const [quoteVendorId, setQuoteVendorId] = useState('');
  const [quoteUnitPrice, setQuoteUnitPrice] = useState('');
  const [quoteDeliveryLeadDays, setQuoteDeliveryLeadDays] = useState(7);
  const [quotePaymentTerms, setQuotePaymentTerms] = useState('Net 30 Days');
  const [quoteWarranty, setQuoteWarranty] = useState('12 Months standard');
  const [quoteRemarks, setQuoteRemarks] = useState('');

  // Comparison Modal
  const [showCompareModal, setShowCompareModal] = useState(false);

  const fetchRFQs = async () => {
    setLoading(true);
    setError(null);
    try {
      const [rRes, vRes] = await Promise.all([
        api.get('/procurement/rfqs'),
        api.get('/masters/vendors')
      ]);
      setRfqs(rRes.data.rfqs || []);
      setVendors(vRes.data.vendors || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRFQs();
  }, []);

  const handleAddQuote = async (e) => {
    e.preventDefault();
    if (!selectedRfq || !quoteVendorId) return;
    try {
      await api.post(`/procurement/rfqs/${selectedRfq._id}/quotes`, {
        vendorId: quoteVendorId,
        unitPrice: Number(quoteUnitPrice),
        deliveryLeadDays: Number(quoteDeliveryLeadDays),
        paymentTerms: quotePaymentTerms,
        warrantyTerms: quoteWarranty,
        remarks: quoteRemarks
      });
      alert('Vendor quotation recorded successfully!');
      setShowQuoteModal(false);
      fetchRFQs();
    } catch (err) {
      alert('Failed to add vendor quote: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleSelectVendor = async (rfqId, vendorId) => {
    if (!window.confirm('Confirm selecting this vendor for Purchase Order generation?')) return;
    try {
      await api.post(`/procurement/rfqs/${rfqId}/select-vendor`, { vendorId });
      alert('Vendor selected and Vendor PO generated successfully!');
      setShowCompareModal(false);
      fetchRFQs();
    } catch (err) {
      alert('Failed to select vendor: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="erp-page-container">
      <div className="erp-page-header">
        <div>
          <h2>Procurement RFQs & Quotations</h2>
          <p>Request for Quotation management, vendor quotes comparison, and award</p>
        </div>
      </div>

      {loading && <LoadingSpinner message="Loading RFQs and Vendor Bids..." />}
      {error && <ErrorMessage message={error} onRetry={fetchRFQs} />}

      {!loading && !error && rfqs.length === 0 && (
        <EmptyState
          title="No Procurement RFQs"
          message="RFQs will appear here when material shortages or manual requests are initiated."
        />
      )}

      {!loading && !error && rfqs.length > 0 && (
        <div className="erp-table-card">
          <table className="erp-data-table">
            <thead>
              <tr>
                <th>RFQ Number</th>
                <th>Item / Description</th>
                <th>Required Qty</th>
                <th>Target Date</th>
                <th>Quotes Received</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rfqs.map(rfq => (
                <tr key={rfq._id}>
                  <td><strong>{rfq.rfqNumber}</strong></td>
                  <td>{rfq.lineItems?.[0]?.description || rfq.lineItems?.[0]?.itemCode || 'Cryogenic Spares/Raw Material'}</td>
                  <td>{rfq.lineItems?.[0]?.requiredQuantity || 1} {rfq.lineItems?.[0]?.uom || 'Nos'}</td>
                  <td>{rfq.targetDeliveryDate ? new Date(rfq.targetDeliveryDate).toLocaleDateString() : 'Immediate'}</td>
                  <td>
                    <span className="badge badge-info">{rfq.vendorQuotations?.length || 0} Bid(s)</span>
                  </td>
                  <td><StatusBadge status={rfq.status} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="erp-btn-sm erp-btn-secondary"
                        onClick={() => {
                          setSelectedRfq(rfq);
                          setShowQuoteModal(true);
                        }}
                      >
                        <AddCircleOutlineIcon fontSize="inherit" /> Add Quote
                      </button>
                      <button
                        className="erp-btn-sm erp-btn-primary"
                        onClick={() => {
                          setSelectedRfq(rfq);
                          setShowCompareModal(true);
                        }}
                      >
                        <CompareArrowsIcon fontSize="inherit" /> Compare & Select
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Quote Modal */}
      {showQuoteModal && selectedRfq && (
        <div className="erp-modal-overlay">
          <div className="erp-modal-content">
            <div className="erp-modal-header">
              <h3>Record Vendor Quotation - {selectedRfq.rfqNumber}</h3>
              <button className="erp-btn-icon" onClick={() => setShowQuoteModal(false)}>
                <CloseIcon />
              </button>
            </div>
            <form onSubmit={handleAddQuote}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Select Vendor *</label>
                <select
                  required
                  value={quoteVendorId}
                  onChange={(e) => setQuoteVendorId(e.target.value)}
                  className="erp-form-control"
                >
                  <option value="">-- Choose Vendor --</option>
                  {vendors.map(v => (
                    <option key={v._id} value={v._id}>{v.name} ({v.vendorCode})</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label>Quoted Unit Price (INR) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={quoteUnitPrice}
                    onChange={(e) => setQuoteUnitPrice(e.target.value)}
                    className="erp-form-control"
                    placeholder="e.g. 15000"
                  />
                </div>
                <div className="form-group">
                  <label>Delivery Lead Time (Days)</label>
                  <input
                    type="number"
                    value={quoteDeliveryLeadDays}
                    onChange={(e) => setQuoteDeliveryLeadDays(e.target.value)}
                    className="erp-form-control"
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label>Payment Terms</label>
                  <input
                    type="text"
                    value={quotePaymentTerms}
                    onChange={(e) => setQuotePaymentTerms(e.target.value)}
                    className="erp-form-control"
                  />
                </div>
                <div className="form-group">
                  <label>Warranty Terms</label>
                  <input
                    type="text"
                    value={quoteWarranty}
                    onChange={(e) => setQuoteWarranty(e.target.value)}
                    className="erp-form-control"
                  />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label>Commercial Remarks</label>
                <textarea
                  rows="2"
                  value={quoteRemarks}
                  onChange={(e) => setQuoteRemarks(e.target.value)}
                  className="erp-form-control"
                  placeholder="Compliance with specs, price validity..."
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" className="erp-btn-secondary" onClick={() => setShowQuoteModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="erp-btn-primary">
                  Submit Bid
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Compare Quotes & Select Modal */}
      {showCompareModal && selectedRfq && (
        <div className="erp-modal-overlay">
          <div className="erp-modal-content" style={{ maxWidth: '900px' }}>
            <div className="erp-modal-header">
              <h3>Vendor Bid Comparison Matrix - {selectedRfq.rfqNumber}</h3>
              <button className="erp-btn-icon" onClick={() => setShowCompareModal(false)}>
                <CloseIcon />
              </button>
            </div>
            
            {(!selectedRfq.vendorQuotations || selectedRfq.vendorQuotations.length === 0) ? (
              <EmptyState
                title="No Vendor Quotations Yet"
                message="Please add quotes received from suppliers before selecting."
              />
            ) : (
              <div>
                <table className="erp-data-table" style={{ marginBottom: '1.5rem' }}>
                  <thead>
                    <tr>
                      <th>Vendor</th>
                      <th>Unit Price</th>
                      <th>Total Value</th>
                      <th>Lead Time</th>
                      <th>Payment Terms</th>
                      <th>Warranty</th>
                      <th>Rating</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedRfq.vendorQuotations.map((q, idx) => {
                      const vObj = vendors.find(v => v._id === (q.vendorId?._id || q.vendorId)) || q.vendorId;
                      const qty = selectedRfq.lineItems?.[0]?.requiredQuantity || 1;
                      const totalVal = (q.unitPrice || 0) * qty;
                      const isSelected = selectedRfq.selectedVendorId === (vObj?._id || q.vendorId);
                      return (
                        <tr key={idx} style={{ background: isSelected ? 'rgba(16, 185, 129, 0.08)' : 'transparent' }}>
                          <td>
                            <strong>{vObj?.name || 'Vendor'}</strong>
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{vObj?.vendorCode}</div>
                          </td>
                          <td><strong>₹{(q.unitPrice || 0).toLocaleString()}</strong></td>
                          <td>₹{totalVal.toLocaleString()}</td>
                          <td>{q.deliveryLeadDays || 7} Days</td>
                          <td>{q.paymentTerms || 'Net 30'}</td>
                          <td>{q.warrantyTerms || '12 Months'}</td>
                          <td>⭐ {vObj?.rating || 4.5}/5</td>
                          <td>
                            {isSelected ? (
                              <span className="badge badge-success">Selected</span>
                            ) : (
                              <button
                                className="erp-btn-sm erp-btn-success"
                                disabled={selectedRfq.status === 'AWARDED'}
                                onClick={() => handleSelectVendor(selectedRfq._id, vObj?._id || q.vendorId)}
                              >
                                <CheckCircleOutlineIcon fontSize="inherit" /> Award PO
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="erp-btn-secondary" onClick={() => setShowCompareModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
