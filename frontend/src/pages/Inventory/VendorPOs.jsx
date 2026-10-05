import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import StatusBadge from '../../components/Common/StatusBadge';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import EmptyState from '../../components/Common/EmptyState';
import ErrorMessage from '../../components/Common/ErrorMessage';

// MUI Icons
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SendIcon from '@mui/icons-material/Send';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';

export default function VendorPOs() {
  const [pos, setPos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPo, setSelectedPo] = useState(null);

  const fetchPOs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/procurement/vendor-pos');
      setPos(res.data.pos || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPOs();
  }, []);

  const handleAction = async (poId, action, remarks = '') => {
    try {
      await api.post(`/procurement/vendor-pos/${poId}/actions/${action}`, { remarks });
      alert(`Vendor PO ${action}ed successfully!`);
      if (selectedPo && selectedPo._id === poId) {
        setSelectedPo(null);
      }
      fetchPOs();
    } catch (err) {
      alert(`Failed to execute ${action}: ` + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="erp-page-container">
      <div className="erp-page-header">
        <div>
          <h2>Vendor Purchase Orders</h2>
          <p>Official procurement contracts sent to suppliers for raw materials and cryo components</p>
        </div>
      </div>

      {loading && <LoadingSpinner message="Loading Vendor POs..." />}
      {error && <ErrorMessage message={error} onRetry={fetchPOs} />}

      {!loading && !error && pos.length === 0 && (
        <EmptyState
          title="No Vendor POs Found"
          message="Vendor POs will be generated once an RFQ is awarded to a supplier."
        />
      )}

      {!loading && !error && pos.length > 0 && (
        <div className="erp-table-card">
          <table className="erp-data-table">
            <thead>
              <tr>
                <th>PO Number</th>
                <th>Supplier / Vendor</th>
                <th>Items Count</th>
                <th>Total Value</th>
                <th>Expected Delivery</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pos.map(po => (
                <tr key={po._id}>
                  <td><strong>{po.poNumber}</strong></td>
                  <td>
                    <strong>{po.vendorId?.name || 'Supplier'}</strong>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{po.vendorId?.vendorCode}</div>
                  </td>
                  <td>{po.lineItems?.length || 0} line(s)</td>
                  <td><strong>₹{(po.totalAmount || 0).toLocaleString()}</strong></td>
                  <td>{po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate).toLocaleDateString() : 'N/A'}</td>
                  <td><StatusBadge status={po.status} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="erp-btn-sm erp-btn-secondary"
                        onClick={() => setSelectedPo(po)}
                      >
                        <VisibilityIcon fontSize="inherit" /> View Details
                      </button>

                      {po.status === 'DRAFT' && (
                        <button
                          className="erp-btn-sm erp-btn-primary"
                          onClick={() => handleAction(po._id, 'approve', 'Approved by Purchase Head')}
                        >
                          <CheckCircleIcon fontSize="inherit" /> Approve
                        </button>
                      )}

                      {po.status === 'APPROVED' && (
                        <button
                          className="erp-btn-sm erp-btn-success"
                          onClick={() => handleAction(po._id, 'send', 'Transmitted via EDI/Email')}
                        >
                          <SendIcon fontSize="inherit" /> Send to Vendor
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* PO Detail Modal */}
      {selectedPo && (
        <div className="erp-modal-overlay">
          <div className="erp-modal-content" style={{ maxWidth: '850px' }}>
            <div className="erp-modal-header">
              <div>
                <h3>Vendor Purchase Order: {selectedPo.poNumber}</h3>
                <StatusBadge status={selectedPo.status} />
              </div>
              <button className="erp-btn-icon" onClick={() => setSelectedPo(null)}>
                <CloseIcon />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Supplier Name:</span>
                <div><strong>{selectedPo.vendorId?.name}</strong></div>
                <div style={{ fontSize: '0.85rem' }}>{selectedPo.vendorId?.email}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Payment Terms:</span>
                <div>{selectedPo.paymentTerms || 'Net 30'}</div>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Delivery Terms:</span>
                <div>{selectedPo.deliveryTerms || 'FOR Destination'}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Total PO Value:</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#10b981' }}>
                  ₹{(selectedPo.totalAmount || 0).toLocaleString()}
                </div>
              </div>
            </div>

            <h4 style={{ marginBottom: '0.75rem' }}>Ordered Line Items</h4>
            <table className="erp-data-table" style={{ marginBottom: '1.5rem' }}>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Tax %</th>
                  <th>Line Total</th>
                </tr>
              </thead>
              <tbody>
                {selectedPo.lineItems?.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.description || item.itemCode}</td>
                    <td>{item.quantity} {item.uom || 'Nos'}</td>
                    <td>₹{(item.unitPrice || 0).toLocaleString()}</td>
                    <td>{item.taxRate || 18}%</td>
                    <td>₹{(item.totalPrice || (item.quantity * item.unitPrice * (1 + (item.taxRate || 18)/100))).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              {selectedPo.status === 'DRAFT' && (
                <button
                  className="erp-btn-primary"
                  onClick={() => handleAction(selectedPo._id, 'approve', 'Approved by Purchase Head')}
                >
                  Approve PO
                </button>
              )}
              {selectedPo.status === 'APPROVED' && (
                <button
                  className="erp-btn-success"
                  onClick={() => handleAction(selectedPo._id, 'send', 'Transmitted to Vendor')}
                >
                  Send to Vendor
                </button>
              )}
              <button className="erp-btn-secondary" onClick={() => setSelectedPo(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
