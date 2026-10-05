import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import StatusBadge from '../../components/Common/StatusBadge';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import EmptyState from '../../components/Common/EmptyState';
import ErrorMessage from '../../components/Common/ErrorMessage';

// MUI Icons
import BuildCircleIcon from '@mui/icons-material/BuildCircle';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AddBoxIcon from '@mui/icons-material/AddBox';
import CloseIcon from '@mui/icons-material/Close';

export default function Installations() {
  const [installations, setInstallations] = useState([]);
  const [serials, setSerials] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New Installation Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [serialId, setSerialId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [engineerName, setEngineerName] = useState('Senior Cryo Field Engineer');
  const [siteAddress, setSiteAddress] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');

  const fetchInstallations = async () => {
    setLoading(true);
    setError(null);
    try {
      const [iRes, sRes, cRes] = await Promise.all([
        api.get('/service/installations'),
        api.get('/serials'),
        api.get('/sales/customers')
      ]);
      setInstallations(iRes.data.installations || []);
      setSerials(sRes.data.serials || []);
      setCustomers(cRes.data.customers || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstallations();
  }, []);

  const handleCreateInstallation = async (e) => {
    e.preventDefault();
    if (!serialId || !customerId) return;

    try {
      await api.post('/service/installations', {
        serialNumberId: serialId,
        customerId,
        leadEngineer: engineerName,
        siteAddress: siteAddress || 'Main Research Facility',
        scheduledDate: scheduledDate || new Date().toISOString()
      });
      alert('Installation job scheduled successfully!');
      setShowCreateModal(false);
      fetchInstallations();
    } catch (err) {
      alert('Failed to schedule installation: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleAction = async (id, action) => {
    try {
      await api.post(`/service/installations/${id}/actions/${action}`, {
        remarks: `Installation ${action}ed by field engineering team`
      });
      alert(`Installation marked as ${action.toUpperCase()}!`);
      fetchInstallations();
    } catch (err) {
      alert(`Failed to execute ${action}: ` + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="erp-page-container">
      <div className="erp-page-header">
        <div>
          <h2>Site Installations & Rigging</h2>
          <p>On-site placement, cryogenic foundation anchoring, piping tie-ins, and safety perimeter setup</p>
        </div>
        <button className="erp-btn-primary" onClick={() => setShowCreateModal(true)}>
          <AddBoxIcon fontSize="inherit" /> Schedule Installation
        </button>
      </div>

      {loading && <LoadingSpinner message="Loading Site Installation Tasks..." />}
      {error && <ErrorMessage message={error} onRetry={fetchInstallations} />}

      {!loading && !error && installations.length === 0 && (
        <EmptyState
          title="No Installation Jobs"
          message="Schedule an installation once equipment delivery is acknowledged by the customer."
        />
      )}

      {!loading && !error && installations.length > 0 && (
        <div className="erp-table-card">
          <table className="erp-data-table">
            <thead>
              <tr>
                <th>Job Number</th>
                <th>Serial Number</th>
                <th>Customer / Site</th>
                <th>Lead Engineer</th>
                <th>Scheduled Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {installations.map(inst => (
                <tr key={inst._id}>
                  <td><strong>{inst.installationNumber}</strong></td>
                  <td>{inst.serialNumberId?.serialNumber || 'SN-Ref'}</td>
                  <td>
                    <strong>{inst.customerId?.name || 'Customer'}</strong>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{inst.siteAddress}</div>
                  </td>
                  <td>{inst.leadEngineer || 'Field Engineer'}</td>
                  <td>{inst.scheduledDate ? new Date(inst.scheduledDate).toLocaleDateString() : 'Immediate'}</td>
                  <td><StatusBadge status={inst.status} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {inst.status === 'SCHEDULED' && (
                        <button
                          className="erp-btn-sm erp-btn-primary"
                          onClick={() => handleAction(inst._id, 'start')}
                        >
                          <BuildCircleIcon fontSize="inherit" /> Start Rigging
                        </button>
                      )}
                      {inst.status === 'IN_PROGRESS' && (
                        <button
                          className="erp-btn-sm erp-btn-success"
                          onClick={() => handleAction(inst._id, 'complete')}
                        >
                          <CheckCircleIcon fontSize="inherit" /> Complete & Handover
                        </button>
                      )}
                      {inst.status === 'COMPLETED' && (
                        <span className="badge badge-success">Ready for Commissioning</span>
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
              <h3>Schedule Site Installation</h3>
              <button className="erp-btn-icon" onClick={() => setShowCreateModal(false)}>
                <CloseIcon />
              </button>
            </div>
            <form onSubmit={handleCreateInstallation}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Select Delivered Serial Number *</label>
                <select
                  required
                  value={serialId}
                  onChange={(e) => setSerialId(e.target.value)}
                  className="erp-form-control"
                >
                  <option value="">-- Choose Serial --</option>
                  {serials.map(s => (
                    <option key={s._id} value={s._id}>
                      {s.serialNumber} - ({s.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Customer *</label>
                <select
                  required
                  value={customerId}
                  onChange={(e) => {
                    setCustomerId(e.target.value);
                    const c = customers.find(cust => cust._id === e.target.value);
                    if (c) setSiteAddress(c.address || '');
                  }}
                  className="erp-form-control"
                >
                  <option value="">-- Choose Customer --</option>
                  {customers.map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label>Field Service Engineer</label>
                  <input
                    type="text"
                    value={engineerName}
                    onChange={(e) => setEngineerName(e.target.value)}
                    className="erp-form-control"
                  />
                </div>
                <div className="form-group">
                  <label>Scheduled Date</label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="erp-form-control"
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label>Site Address & Bay Location</label>
                <textarea
                  rows="2"
                  value={siteAddress}
                  onChange={(e) => setSiteAddress(e.target.value)}
                  className="erp-form-control"
                  placeholder="Facility wing, cryogenic gas storage pad..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" className="erp-btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="erp-btn-primary">
                  Confirm Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
