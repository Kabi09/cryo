import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import StatusBadge from '../../components/Common/StatusBadge';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import EmptyState from '../../components/Common/EmptyState';
import ErrorMessage from '../../components/Common/ErrorMessage';

// MUI Icons
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import FindInPageIcon from '@mui/icons-material/FindInPage';
import BuildIcon from '@mui/icons-material/Build';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CloseIcon from '@mui/icons-material/Close';

export default function ServiceTickets() {
  const [tickets, setTickets] = useState([]);
  const [serials, setSerials] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New Ticket Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [serialId, setSerialId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [complaint, setComplaint] = useState('');
  const [priority, setPriority] = useState('MEDIUM');

  // Action Dialog Modal
  const [activeTicket, setActiveTicket] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [actionNotes, setActionNotes] = useState('');

  const fetchTickets = async () => {
    setLoading(true);
    setError(null);
    try {
      const [tRes, sRes, cRes] = await Promise.all([
        api.get('/service/tickets'),
        api.get('/serials'),
        api.get('/sales/customers')
      ]);
      setTickets(tRes.data.tickets || []);
      setSerials(sRes.data.serials || []);
      setCustomers(cRes.data.customers || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!serialId || !customerId || !complaint) return;

    try {
      await api.post('/service/tickets', {
        serialNumberId: serialId,
        customerId,
        complaint,
        priority
      });
      alert('Service Ticket created and queued for warranty evaluation!');
      setShowCreateModal(false);
      setComplaint('');
      fetchTickets();
    } catch (err) {
      alert('Failed to log service ticket: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleExecuteAction = async (e) => {
    e.preventDefault();
    if (!activeTicket || !actionType) return;

    try {
      await api.post(`/service/tickets/${activeTicket._id}/actions/${actionType}`, {
        remarks: actionNotes,
        diagnosisDetails: actionType === 'diagnose' ? actionNotes : undefined,
        assignedEngineer: actionType === 'assign' ? 'Lead Service Engineer' : undefined
      });
      alert(`Service action ${actionType} recorded successfully!`);
      setActiveTicket(null);
      setActionType(null);
      setActionNotes('');
      fetchTickets();
    } catch (err) {
      alert(`Failed to execute ${actionType}: ` + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="erp-page-container">
      <div className="erp-page-header">
        <div>
          <h2>Field Service Tickets & RMA Management</h2>
          <p>End-to-end incident ticketing, warranty verification, spare parts requisition, and customer sign-off</p>
        </div>
        <button className="erp-btn-primary" onClick={() => setShowCreateModal(true)}>
          <ConfirmationNumberIcon fontSize="inherit" /> Raise Service Ticket
        </button>
      </div>

      {loading && <LoadingSpinner message="Loading Service Incident Tickets..." />}
      {error && <ErrorMessage message={error} onRetry={fetchTickets} />}

      {!loading && !error && tickets.length === 0 && (
        <EmptyState
          title="No Active Service Tickets"
          message="Raise a ticket when customer logs a field malfunction or maintenance request."
        />
      )}

      {!loading && !error && tickets.length > 0 && (
        <div className="erp-table-card">
          <table className="erp-data-table">
            <thead>
              <tr>
                <th>Ticket #</th>
                <th>Serial / Product</th>
                <th>Customer</th>
                <th>Complaint</th>
                <th>Warranty Status</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map(t => (
                <tr key={t._id}>
                  <td><strong>{t.ticketNumber}</strong></td>
                  <td>
                    <strong>{t.serialNumberId?.serialNumber || 'SN-Ref'}</strong>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {t.serialNumberId?.productId?.name}
                    </div>
                  </td>
                  <td>{t.customerId?.name || 'Customer'}</td>
                  <td>
                    <div style={{ maxWidth: '280px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {t.complaint}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${t.warrantyStatus === 'UNDER_WARRANTY' || t.warrantyStatus === 'ACTIVE' ? 'badge-success' : 'badge-warning'}`}>
                      {t.warrantyStatus || 'WARRANTY VALID'}
                    </span>
                  </td>
                  <td><StatusBadge status={t.status} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {t.status === 'OPEN' && (
                        <button
                          className="erp-btn-sm erp-btn-primary"
                          onClick={() => {
                            setActiveTicket(t);
                            setActionType('assign');
                            setActionNotes('Assigned to regional cryogenic technician');
                          }}
                        >
                          <PersonAddIcon fontSize="inherit" /> Assign
                        </button>
                      )}

                      {t.status === 'ASSIGNED' && (
                        <button
                          className="erp-btn-sm erp-btn-secondary"
                          onClick={() => {
                            setActiveTicket(t);
                            setActionType('diagnose');
                            setActionNotes('Inspected dual relief valve seat; micro-leak detected on auxiliary seal');
                          }}
                        >
                          <FindInPageIcon fontSize="inherit" /> Diagnose
                        </button>
                      )}

                      {t.status === 'DIAGNOSED' && (
                        <button
                          className="erp-btn-sm erp-btn-primary"
                          onClick={() => {
                            setActiveTicket(t);
                            setActionType('repair');
                            setActionNotes('Replaced PTFE valve gland packing and re-torqued flange bolts');
                          }}
                        >
                          <BuildIcon fontSize="inherit" /> Execute Repair
                        </button>
                      )}

                      {t.status === 'REPAIRED' && (
                        <button
                          className="erp-btn-sm erp-btn-success"
                          onClick={() => {
                            setActiveTicket(t);
                            setActionType('signoff');
                            setActionNotes('Customer technical representative verified zero-leak at nominal working pressure');
                          }}
                        >
                          <CheckCircleOutlineIcon fontSize="inherit" /> Customer Sign-Off
                        </button>
                      )}

                      {t.status === 'SIGNED_OFF' && (
                        <button
                          className="erp-btn-sm erp-btn-secondary"
                          onClick={() => {
                            setActiveTicket(t);
                            setActionType('close');
                            setActionNotes('Ticket completed and archived to digital product passport');
                          }}
                        >
                          Close Ticket
                        </button>
                      )}

                      {t.status === 'CLOSED' && (
                        <span className="badge badge-success">Closed</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="erp-modal-overlay">
          <div className="erp-modal-content">
            <div className="erp-modal-header">
              <h3>Log Field Service Incident</h3>
              <button className="erp-btn-icon" onClick={() => setShowCreateModal(false)}>
                <CloseIcon />
              </button>
            </div>
            <form onSubmit={handleCreateTicket}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Affected Equipment Serial Number *</label>
                <select
                  required
                  value={serialId}
                  onChange={(e) => setSerialId(e.target.value)}
                  className="erp-form-control"
                >
                  <option value="">-- Choose Installed Serial --</option>
                  {serials.map(s => (
                    <option key={s._id} value={s._id}>
                      {s.serialNumber} - {s.status}
                    </option>
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

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Urgency Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="erp-form-control"
                >
                  <option value="LOW">Low - Routine Inspection</option>
                  <option value="MEDIUM">Medium - Normal Maintenance</option>
                  <option value="HIGH">High - Operational Degradation</option>
                  <option value="CRITICAL">Critical - Vacuum Loss / Cryo Boil-off Threat</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label>Customer Complaint Description *</label>
                <textarea
                  rows="3"
                  required
                  value={complaint}
                  onChange={(e) => setComplaint(e.target.value)}
                  className="erp-form-control"
                  placeholder="Describe reported symptoms, error codes, temperature rises..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" className="erp-btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="erp-btn-primary">
                  Submit Service Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Action Dialog Modal */}
      {activeTicket && actionType && (
        <div className="erp-modal-overlay">
          <div className="erp-modal-content">
            <div className="erp-modal-header">
              <h3>Action: {actionType.toUpperCase()} - Ticket #{activeTicket.ticketNumber}</h3>
              <button className="erp-btn-icon" onClick={() => { setActiveTicket(null); setActionType(null); }}>
                <CloseIcon />
              </button>
            </div>
            <form onSubmit={handleExecuteAction}>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label>Technical Findings / Action Details *</label>
                <textarea
                  rows="4"
                  required
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  className="erp-form-control"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" className="erp-btn-secondary" onClick={() => { setActiveTicket(null); setActionType(null); }}>
                  Cancel
                </button>
                <button type="submit" className="erp-btn-primary">
                  Confirm {actionType}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
