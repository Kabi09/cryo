import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import StatusBadge from '../../components/Common/StatusBadge';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import EmptyState from '../../components/Common/EmptyState';
import ErrorMessage from '../../components/Common/ErrorMessage';

// MUI Icons
import ReplayIcon from '@mui/icons-material/Replay';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HandymanIcon from '@mui/icons-material/Handyman';
import AddBoxIcon from '@mui/icons-material/AddBox';
import CloseIcon from '@mui/icons-material/Close';

export default function RMAView() {
  const [rmas, setRmas] = useState([]);
  const [serials, setSerials] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New RMA Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [serialId, setSerialId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [reason, setReason] = useState('');

  // Decision Modal
  const [decisionModal, setDecisionModal] = useState(false);
  const [selectedRma, setSelectedRma] = useState(null);
  const [decisionType, setDecisionType] = useState('REPAIR');
  const [decisionNotes, setDecisionNotes] = useState('');

  const fetchRMAs = async () => {
    setLoading(true);
    setError(null);
    try {
      const [rRes, sRes, cRes] = await Promise.all([
        api.get('/service/rmas'),
        api.get('/serials'),
        api.get('/sales/customers')
      ]);
      setRmas(rRes.data.rmas || []);
      setSerials(sRes.data.serials || []);
      setCustomers(cRes.data.customers || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRMAs();
  }, []);

  const handleCreateRMA = async (e) => {
    e.preventDefault();
    if (!serialId || !customerId || !reason) return;

    try {
      await api.post('/service/rmas', {
        serialNumberId: serialId,
        customerId,
        reason
      });
      alert('RMA Request raised successfully!');
      setShowCreateModal(false);
      setReason('');
      fetchRMAs();
    } catch (err) {
      alert('Failed to create RMA: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleAction = async (rmaId, action, extra = {}) => {
    try {
      await api.post(`/service/rmas/${rmaId}/actions/${action}`, {
        remarks: `Action ${action} executed by Plant Quality Head`,
        ...extra
      });
      alert(`RMA marked as ${action.toUpperCase()}!`);
      if (decisionModal) setDecisionModal(false);
      fetchRMAs();
    } catch (err) {
      alert(`Failed to execute ${action}: ` + (err.response?.data?.message || err.message));
    }
  };

  const handleDecisionSubmit = (e) => {
    e.preventDefault();
    if (!selectedRma) return;
    handleAction(selectedRma._id, 'decide', {
      decision: decisionType,
      decisionNotes
    });
  };

  return (
    <div className="erp-page-container">
      <div className="erp-page-header">
        <div>
          <h2>Return Material Authorization (RMA)</h2>
          <p>Factory return authorizations, dock receipts, failure teardown inspection, and replacement/credit note resolution</p>
        </div>
        <button className="erp-btn-primary" onClick={() => setShowCreateModal(true)}>
          <AddBoxIcon fontSize="inherit" /> Initiate RMA Request
        </button>
      </div>

      {loading && <LoadingSpinner message="Loading RMA Returns..." />}
      {error && <ErrorMessage message={error} onRetry={fetchRMAs} />}

      {!loading && !error && rmas.length === 0 && (
        <EmptyState
          title="No Active RMA Cases"
          message="Create an RMA when equipment requires factory return, major overhaul, or warranty replacement."
        />
      )}

      {!loading && !error && rmas.length > 0 && (
        <div className="erp-table-card">
          <table className="erp-data-table">
            <thead>
              <tr>
                <th>RMA Number</th>
                <th>Serial Number</th>
                <th>Customer</th>
                <th>Reason</th>
                <th>Decision</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rmas.map(rma => (
                <tr key={rma._id}>
                  <td><strong>{rma.rmaNumber}</strong></td>
                  <td>
                    <strong>{rma.serialNumberId?.serialNumber || 'SN-Ref'}</strong>
                  </td>
                  <td>{rma.customerId?.name || 'Customer'}</td>
                  <td>{rma.reason}</td>
                  <td>
                    {rma.decision ? (
                      <span className="badge badge-info">{rma.decision}</span>
                    ) : (
                      <span style={{ color: '#94a3b8' }}>Pending Inspection</span>
                    )}
                  </td>
                  <td><StatusBadge status={rma.status} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {rma.status === 'REQUESTED' && (
                        <button
                          className="erp-btn-sm erp-btn-primary"
                          onClick={() => handleAction(rma._id, 'approve')}
                        >
                          <CheckCircleIcon fontSize="inherit" /> Authorize Return
                        </button>
                      )}

                      {rma.status === 'APPROVED' && (
                        <button
                          className="erp-btn-sm erp-btn-secondary"
                          onClick={() => handleAction(rma._id, 'receive')}
                        >
                          <ReplayIcon fontSize="inherit" /> Dock Intake
                        </button>
                      )}

                      {rma.status === 'RECEIVED' && (
                        <button
                          className="erp-btn-sm erp-btn-primary"
                          onClick={() => handleAction(rma._id, 'inspect')}
                        >
                          <HandymanIcon fontSize="inherit" /> Inspect Unit
                        </button>
                      )}

                      {rma.status === 'INSPECTED' && (
                        <button
                          className="erp-btn-sm erp-btn-success"
                          onClick={() => {
                            setSelectedRma(rma);
                            setDecisionModal(true);
                          }}
                        >
                          Make Decision
                        </button>
                      )}

                      {rma.status === 'DECIDED' && (
                        <button
                          className="erp-btn-sm erp-btn-secondary"
                          onClick={() => handleAction(rma._id, 'close')}
                        >
                          Close RMA
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

      {/* Create Modal */}
      {showCreateModal && (
        <div className="erp-modal-overlay">
          <div className="erp-modal-content">
            <div className="erp-modal-header">
              <h3>Initiate Return Material Authorization (RMA)</h3>
              <button className="erp-btn-icon" onClick={() => setShowCreateModal(false)}>
                <CloseIcon />
              </button>
            </div>
            <form onSubmit={handleCreateRMA}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Select Unit Serial Number *</label>
                <select
                  required
                  value={serialId}
                  onChange={(e) => setSerialId(e.target.value)}
                  className="erp-form-control"
                >
                  <option value="">-- Select Serial --</option>
                  {serials.map(s => (
                    <option key={s._id} value={s._id}>{s.serialNumber} ({s.status})</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Customer Organization *</label>
                <select
                  required
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="erp-form-control"
                >
                  <option value="">-- Choose Customer --</option>
                  {customers.map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label>Reason for Factory Return *</label>
                <textarea
                  rows="3"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="erp-form-control"
                  placeholder="Vacuum degradation, inner vessel weld hairline fracture, replacement request..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" className="erp-btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="erp-btn-primary">
                  Submit RMA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Decision Modal */}
      {decisionModal && selectedRma && (
        <div className="erp-modal-overlay">
          <div className="erp-modal-content">
            <div className="erp-modal-header">
              <h3>RMA Resolution Decision - {selectedRma.rmaNumber}</h3>
              <button className="erp-btn-icon" onClick={() => setDecisionModal(false)}>
                <CloseIcon />
              </button>
            </div>
            <form onSubmit={handleDecisionSubmit}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Official Resolution Action *</label>
                <select
                  value={decisionType}
                  onChange={(e) => setDecisionType(e.target.value)}
                  className="erp-form-control"
                >
                  <option value="REPAIR">Factory Repair & Retest</option>
                  <option value="REPLACEMENT">Brand New Replacement Serial</option>
                  <option value="CREDIT_NOTE">Issue Commercial Credit Note</option>
                  <option value="REFUND">Bank Refund</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label>Engineering Justification & Teardown Notes *</label>
                <textarea
                  rows="3"
                  required
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                  className="erp-form-control"
                  placeholder="Root cause analysis, weld metallography, decision rationale..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" className="erp-btn-secondary" onClick={() => setDecisionModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="erp-btn-primary">
                  Confirm Decision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
