import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import StatusBadge from '../../components/Common/StatusBadge';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import ErrorMessage from '../../components/Common/ErrorMessage';

// MUI Icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import SendIcon from '@mui/icons-material/Send';
import HandshakeIcon from '@mui/icons-material/Handshake';
import HistoryIcon from '@mui/icons-material/History';

export default function QuotationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [quotation, setQuotation] = useState(null);
  const [revisions, setRevisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('items'); // 'items' | 'revisions' | 'negotiation'

  // Modal states
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionReason, setRevisionReason] = useState('');
  const [revisionDiscount, setRevisionDiscount] = useState(5);

  const [showNegotiationModal, setShowNegotiationModal] = useState(false);
  const [negotiationNotes, setNegotiationNotes] = useState('');
  const [requestedDiscount, setRequestedDiscount] = useState(5);

  const fetchQuotation = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/quotations/${id}`);
      setQuotation(res.data.quotation);
      setRevisions(res.data.revisions || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotation();
  }, [id]);

  const handleAction = async (action, payload = {}) => {
    try {
      await api.post(`/quotations/${id}/actions/${action}`, payload);
      alert(`Action '${action}' executed successfully.`);
      fetchQuotation();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateRevision = async (e) => {
    e.preventDefault();
    try {
      const newItems = quotation.items.map(item => ({
        ...item,
        productId: item.productId?._id || item.productId,
        discountPercent: Number(revisionDiscount),
        total: (item.quantity * item.unitPrice * (1 - revisionDiscount / 100)) * 1.18
      }));

      await api.post(`/quotations/${id}/actions/revise`, {
        changeReason: revisionReason,
        items: newItems
      });

      setShowRevisionModal(false);
      setRevisionReason('');
      fetchQuotation();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleLogNegotiation = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/quotations/${id}/actions/negotiate`, {
        requestedDiscount: Number(requestedDiscount),
        clientNotes: negotiationNotes
      });
      setShowNegotiationModal(false);
      setNegotiationNotes('');
      fetchQuotation();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <LoadingSpinner message="Loading quotation details..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchQuotation} />;
  if (!quotation) return null;

  return (
    <div>
      {/* Top Breadcrumb & Actions Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => navigate('/sales/quotations')}
        >
          <ArrowBackIcon style={{ fontSize: '18px' }} />
          Back to Quotations
        </button>

        {/* Dynamic Action Buttons based on Status */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {quotation.status === 'DRAFT' && (
            <button
              className="btn btn-primary"
              onClick={() => handleAction('submit')}
            >
              Submit for Manager Review →
            </button>
          )}

          {quotation.status === 'PENDING_APPROVAL' && (
            <>
              <button
                className="btn btn-success"
                onClick={() => handleAction('approve', { remarks: 'Commercial rate verified.' })}
              >
                <CheckCircleIcon style={{ fontSize: '18px' }} />
                Approve Quotation
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleAction('reject', { remarks: 'Pricing deviation.' })}
              >
                <CancelIcon style={{ fontSize: '18px' }} />
                Reject
              </button>
            </>
          )}

          {quotation.status === 'APPROVED' && (
            <button
              className="btn btn-primary"
              onClick={() => handleAction('send')}
            >
              <SendIcon style={{ fontSize: '18px' }} />
              Dispatch to Customer
            </button>
          )}

          {(quotation.status === 'SENT' || quotation.status === 'NEGOTIATION') && (
            <>
              <button
                className="btn btn-success"
                onClick={() => handleAction('accept')}
              >
                <CheckCircleIcon style={{ fontSize: '18px' }} />
                Customer Accepts (Generate PI)
              </button>

              <button
                className="btn btn-secondary"
                onClick={() => setShowNegotiationModal(true)}
              >
                <HandshakeIcon style={{ fontSize: '18px' }} />
                Log Counter-Offer
              </button>

              <button
                className="btn btn-primary"
                onClick={() => setShowRevisionModal(true)}
              >
                <HistoryIcon style={{ fontSize: '18px' }} />
                Create New Revision
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Details Card */}
      <div style={{
        backgroundColor: '#162032',
        border: '1px solid #223249',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #223249', paddingBottom: '18px', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f3f4f6' }}>
                {quotation.quotationNumber}
              </h2>
              <span style={{
                padding: '3px 10px',
                borderRadius: '6px',
                backgroundColor: 'rgba(2, 132, 199, 0.2)',
                color: '#38bdf8',
                fontWeight: 700,
                fontSize: '0.8rem'
              }}>
                Revision {quotation.currentRevisionNumber || 0}
              </span>
              <StatusBadge status={quotation.status} />
            </div>
            <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginTop: '4px' }}>
              Client Account: <strong style={{ color: '#f3f4f6' }}>{quotation.customerId?.companyName}</strong> ({quotation.customerId?.customerCode})
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Grand Total (Inclusive of GST)</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981' }}>
              ₹{quotation.grandTotal?.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* Commercial breakdown stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          marginBottom: '20px'
        }}>
          <div style={{ padding: '12px', backgroundColor: '#111827', borderRadius: '8px', border: '1px solid #1a273a' }}>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Taxable Subtotal</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f3f4f6' }}>₹{quotation.subtotal?.toLocaleString('en-IN')}</div>
          </div>
          <div style={{ padding: '12px', backgroundColor: '#111827', borderRadius: '8px', border: '1px solid #1a273a' }}>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Commercial Discount</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f59e0b' }}>₹{quotation.discountAmount?.toLocaleString('en-IN') || 0}</div>
          </div>
          <div style={{ padding: '12px', backgroundColor: '#111827', borderRadius: '8px', border: '1px solid #1a273a' }}>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>GST Taxes (18%)</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#38bdf8' }}>₹{quotation.taxAmount?.toLocaleString('en-IN')}</div>
          </div>
          <div style={{ padding: '12px', backgroundColor: '#111827', borderRadius: '8px', border: '1px solid #1a273a' }}>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Validity Window</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f3f4f6' }}>{quotation.validityDays || 30} Days</div>
          </div>
        </div>

        {/* Terms */}
        <div style={{ fontSize: '0.825rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div><strong>Payment Terms:</strong> {quotation.paymentTerms}</div>
          <div><strong>Delivery Terms:</strong> {quotation.deliveryTerms}</div>
          <div><strong>Warranty Terms:</strong> {quotation.warrantyTerms}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid #223249', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('items')}
          style={{
            padding: '10px 16px',
            fontWeight: 600,
            fontSize: '0.875rem',
            color: activeTab === 'items' ? '#38bdf8' : '#9ca3af',
            borderBottom: activeTab === 'items' ? '2px solid #38bdf8' : '2px solid transparent'
          }}
        >
          Quotation Line Items ({quotation.items?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('revisions')}
          style={{
            padding: '10px 16px',
            fontWeight: 600,
            fontSize: '0.875rem',
            color: activeTab === 'revisions' ? '#38bdf8' : '#9ca3af',
            borderBottom: activeTab === 'revisions' ? '2px solid #38bdf8' : '2px solid transparent'
          }}
        >
          Revision History ({revisions.length})
        </button>

        <button
          onClick={() => setActiveTab('negotiation')}
          style={{
            padding: '10px 16px',
            fontWeight: 600,
            fontSize: '0.875rem',
            color: activeTab === 'negotiation' ? '#38bdf8' : '#9ca3af',
            borderBottom: activeTab === 'negotiation' ? '2px solid #38bdf8' : '2px solid transparent'
          }}
        >
          Negotiation Log ({quotation.negotiationHistory?.length || 0})
        </button>
      </div>

      {/* Tab: Items */}
      {activeTab === 'items' && (
        <div className="erp-table-container">
          <table className="erp-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Product Description</th>
                <th>Quantity</th>
                <th>Unit Rate</th>
                <th>Discount %</th>
                <th>Taxes (18%)</th>
                <th>Total Value</th>
              </tr>
            </thead>
            <tbody>
              {quotation.items?.map((item, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600, color: '#38bdf8' }}>{item.sku}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{item.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{item.description}</div>
                  </td>
                  <td>{item.quantity}</td>
                  <td>₹{item.unitPrice?.toLocaleString('en-IN')}</td>
                  <td>{item.discountPercent || 0}%</td>
                  <td>₹{Math.round((item.quantity * item.unitPrice * (1 - (item.discountPercent || 0)/100) * 0.18)).toLocaleString('en-IN')}</td>
                  <td style={{ fontWeight: 700, color: '#10b981' }}>₹{item.total?.toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Revisions */}
      {activeTab === 'revisions' && (
        <div className="erp-table-container">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Revision Code</th>
                <th>Revision #</th>
                <th>Reason for Change</th>
                <th>Previous Total</th>
                <th>Revised Total</th>
                <th>Status</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {revisions.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#9ca3af' }}>
                    No previous revisions. This is the original version.
                  </td>
                </tr>
              ) : (
                revisions.map((rev) => (
                  <tr key={rev._id}>
                    <td style={{ fontWeight: 700, color: '#38bdf8' }}>{rev.revisionCode}</td>
                    <td>Rev {rev.revisionNumber}</td>
                    <td>{rev.changeReason}</td>
                    <td>₹{rev.oldTotal?.toLocaleString('en-IN')}</td>
                    <td style={{ fontWeight: 700, color: '#10b981' }}>₹{rev.newTotal?.toLocaleString('en-IN')}</td>
                    <td><StatusBadge status={rev.status} /></td>
                    <td>{new Date(rev.createdAt).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Negotiation Log */}
      {activeTab === 'negotiation' && (
        <div style={{ backgroundColor: '#162032', border: '1px solid #223249', borderRadius: '12px', padding: '20px' }}>
          {quotation.negotiationHistory?.length === 0 ? (
            <p style={{ color: '#9ca3af', textAlign: 'center', padding: '16px' }}>No counter-offers logged for this quotation.</p>
          ) : (
            quotation.negotiationHistory.map((nh, idx) => (
              <div key={idx} style={{ padding: '12px', borderBottom: '1px solid #1a273a' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 700, color: '#f59e0b' }}>Requested Discount: {nh.requestedDiscount}%</span>
                  <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{new Date(nh.date).toLocaleString()}</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>{nh.clientNotes || 'No notes entered.'}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal: Create Revision */}
      {showRevisionModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Create Quotation Revision</h3>
              <button className="close-btn" onClick={() => setShowRevisionModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateRevision}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Reason for Revision *</label>
                  <textarea
                    required
                    value={revisionReason}
                    onChange={(e) => setRevisionReason(e.target.value)}
                    placeholder="Specify client negotiation terms or technical specification adjustments..."
                  />
                </div>

                <div className="form-group">
                  <label>Adjust Line Item Discount (%):</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={revisionDiscount}
                    onChange={(e) => setRevisionDiscount(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowRevisionModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Generate Revision R{(quotation.currentRevisionNumber || 0) + 1}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Log Negotiation */}
      {showNegotiationModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Log Client Negotiation & Counter-Offer</h3>
              <button className="close-btn" onClick={() => setShowNegotiationModal(false)}>✕</button>
            </div>
            <form onSubmit={handleLogNegotiation}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Requested Discount Percentage (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={requestedDiscount}
                    onChange={(e) => setRequestedDiscount(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Client Discussion Notes / Counter-Proposal</label>
                  <textarea
                    required
                    value={negotiationNotes}
                    onChange={(e) => setNegotiationNotes(e.target.value)}
                    placeholder="Enter meeting notes, discount justification or payment concession requests..."
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowNegotiationModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Negotiation Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
