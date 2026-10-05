import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import StatusBadge from '../../components/Common/StatusBadge';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import EmptyState from '../../components/Common/EmptyState';
import ErrorMessage from '../../components/Common/ErrorMessage';

// MUI Icons
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import UpdateIcon from '@mui/icons-material/Update';
import CloseIcon from '@mui/icons-material/Close';

export default function Deliveries() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // POD Modal
  const [showPodModal, setShowPodModal] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [receivedBy, setReceivedBy] = useState('');
  const [podRemarks, setPodRemarks] = useState('');

  const fetchDeliveries = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/logistics/deliveries');
      setDeliveries(res.data.deliveries || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const handleSignPod = async (e) => {
    e.preventDefault();
    if (!selectedDelivery) return;

    try {
      await api.post(`/logistics/deliveries/${selectedDelivery._id}/actions/deliver`, {
        receivedBy,
        remarks: podRemarks,
        podDocumentUrl: `POD-SIG-${Date.now()}.pdf`
      });
      alert('Proof of Delivery (POD) confirmed and recorded! Ready for Site Installation.');
      setShowPodModal(false);
      setReceivedBy('');
      setPodRemarks('');
      fetchDeliveries();
    } catch (err) {
      alert('Failed to confirm POD: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleFailDelivery = async (deliveryId) => {
    const reason = prompt('Enter reason for delivery failure / site gate refusal:');
    if (!reason) return;

    try {
      await api.post(`/logistics/deliveries/${deliveryId}/actions/fail`, {
        remarks: reason
      });
      alert('Delivery recorded as FAILED. Reschedule or return process triggered.');
      fetchDeliveries();
    } catch (err) {
      alert('Failed to record delivery failure: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="erp-page-container">
      <div className="erp-page-header">
        <div>
          <h2>Delivery & Proof of Delivery (POD)</h2>
          <p>Consignee site arrival, offloading inspection, digital signature capture, and installation handover</p>
        </div>
      </div>

      {loading && <LoadingSpinner message="Loading Delivery Logs..." />}
      {error && <ErrorMessage message={error} onRetry={fetchDeliveries} />}

      {!loading && !error && deliveries.length === 0 && (
        <EmptyState
          title="No Active Deliveries"
          message="Deliveries are tracked when dispatches depart factory gate."
        />
      )}

      {!loading && !error && deliveries.length > 0 && (
        <div className="erp-table-card">
          <table className="erp-data-table">
            <thead>
              <tr>
                <th>Delivery Number</th>
                <th>Dispatch Ref</th>
                <th>Destination Site</th>
                <th>Received By</th>
                <th>Delivery Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {deliveries.map(del => (
                <tr key={del._id}>
                  <td><strong>{del.deliveryNumber}</strong></td>
                  <td>{del.dispatchId?.dispatchNumber || 'DSP-Ref'}</td>
                  <td>{del.deliveryAddress || del.customerId?.address || 'Site Delivery Location'}</td>
                  <td>
                    {del.receivedBy ? (
                      <div>
                        <strong>{del.receivedBy}</strong>
                        <div style={{ fontSize: '0.8rem', color: '#10b981' }}>✓ POD Verified</div>
                      </div>
                    ) : (
                      <span style={{ color: '#94a3b8' }}>Pending Consignee</span>
                    )}
                  </td>
                  <td>{del.deliveredAt ? new Date(del.deliveredAt).toLocaleString() : 'In-Transit'}</td>
                  <td><StatusBadge status={del.status} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {del.status !== 'DELIVERED' && (
                        <>
                          <button
                            className="erp-btn-sm erp-btn-success"
                            onClick={() => {
                              setSelectedDelivery(del);
                              setShowPodModal(true);
                            }}
                          >
                            <TaskAltIcon fontSize="inherit" /> Confirm POD
                          </button>
                          <button
                            className="erp-btn-sm erp-btn-danger"
                            onClick={() => handleFailDelivery(del._id)}
                          >
                            <ErrorOutlineIcon fontSize="inherit" /> Flag Failed
                          </button>
                        </>
                      )}
                      {del.status === 'DELIVERED' && (
                        <span className="badge badge-success">Delivered & Verified</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* POD Modal */}
      {showPodModal && selectedDelivery && (
        <div className="erp-modal-overlay">
          <div className="erp-modal-content">
            <div className="erp-modal-header">
              <h3>Confirm Proof of Delivery (POD) - {selectedDelivery.deliveryNumber}</h3>
              <button className="erp-btn-icon" onClick={() => setShowPodModal(false)}>
                <CloseIcon />
              </button>
            </div>
            <form onSubmit={handleSignPod}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Consignee / Site Receiver Full Name *</label>
                <input
                  type="text"
                  required
                  value={receivedBy}
                  onChange={(e) => setReceivedBy(e.target.value)}
                  className="erp-form-control"
                  placeholder="e.g. Dr. Rajesh Kumar, Head of Cryo Lab"
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label>Receiver Acceptance Notes</label>
                <textarea
                  rows="3"
                  value={podRemarks}
                  onChange={(e) => setPodRemarks(e.target.value)}
                  className="erp-form-control"
                  placeholder="Crate received intact, shock indicators intact, nitrogen pressure normal..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" className="erp-btn-secondary" onClick={() => setShowPodModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="erp-btn-success">
                  Confirm POD & Accept
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
