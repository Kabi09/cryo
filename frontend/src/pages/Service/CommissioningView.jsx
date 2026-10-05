import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import StatusBadge from '../../components/Common/StatusBadge';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import EmptyState from '../../components/Common/EmptyState';
import ErrorMessage from '../../components/Common/ErrorMessage';

// MUI Icons
import VerifiedIcon from '@mui/icons-material/Verified';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import AddBoxIcon from '@mui/icons-material/AddBox';
import CloseIcon from '@mui/icons-material/Close';

export default function CommissioningView() {
  const [commissionings, setCommissionings] = useState([]);
  const [installations, setInstallations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New Commissioning Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [installationId, setInstallationId] = useState('');
  const [remarks, setRemarks] = useState('');

  const fetchCommissionings = async () => {
    setLoading(true);
    setError(null);
    try {
      const [cRes, iRes] = await Promise.all([
        api.get('/service/commissioning'),
        api.get('/service/installations')
      ]);
      setCommissionings(cRes.data.commissionings || []);
      setInstallations(iRes.data.installations || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommissionings();
  }, []);

  const handleCreateCommissioning = async (e) => {
    e.preventDefault();
    if (!installationId) return;

    try {
      await api.post('/service/commissioning', {
        installationId,
        tests: [
          { testName: 'Cryogenic Pull-down to -196°C', standard: '< -190°C', result: 'PASS' },
          { testName: 'Outer Jacket Static Vacuum', standard: '< 1x10⁻⁴ mbar', result: 'PASS' },
          { testName: 'Dual Safety Relief Valve Pop-Off', standard: '16.5 bar ± 0.5', result: 'PASS' },
          { testName: 'Digital Level Transmitter Calibration', standard: '4-20 mA linear', result: 'PASS' }
        ],
        remarks
      });
      alert('Commissioning test suite initialized!');
      setShowCreateModal(false);
      fetchCommissionings();
    } catch (err) {
      alert('Failed to initialize commissioning: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleAction = async (id, action) => {
    try {
      const res = await api.post(`/service/commissioning/${id}/actions/${action}`, {
        remarks: action === 'pass' 
          ? 'Thermal stability verified, zero boil-off rate confirmed, customer acceptance received'
          : 'Boil-off rate exceeded threshold, re-evacuation needed'
      });
      alert(`Commissioning marked as ${action.toUpperCase()}! ${action === 'pass' ? 'Warranty is now ACTIVE.' : ''}`);
      fetchCommissionings();
    } catch (err) {
      alert(`Failed to execute ${action}: ` + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="erp-page-container">
      <div className="erp-page-header">
        <div>
          <h2>Site Commissioning & Pull-Down Validation</h2>
          <p>Liquid nitrogen cold-fill, boil-off rate monitoring, relief valve validation, and warranty activation</p>
        </div>
        <button className="erp-btn-primary" onClick={() => setShowCreateModal(true)}>
          <AddBoxIcon fontSize="inherit" /> Initiate Commissioning
        </button>
      </div>

      {loading && <LoadingSpinner message="Loading Site Commissioning Trials..." />}
      {error && <ErrorMessage message={error} onRetry={fetchCommissionings} />}

      {!loading && !error && commissionings.length === 0 && (
        <EmptyState
          title="No Commissioning Records"
          message="Initialize commissioning after mechanical installation is completed."
        />
      )}

      {!loading && !error && commissionings.length > 0 && (
        <div className="erp-table-card">
          <table className="erp-data-table">
            <thead>
              <tr>
                <th>Commissioning #</th>
                <th>Serial / Product</th>
                <th>Installation Ref</th>
                <th>Tests Evaluated</th>
                <th>Customer Sign-off</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {commissionings.map(comm => (
                <tr key={comm._id}>
                  <td><strong>{comm.commissioningNumber}</strong></td>
                  <td>
                    <strong>{comm.serialNumberId?.serialNumber || 'SN-Ref'}</strong>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {comm.serialNumberId?.productId?.name || 'Cryogenic Vessel'}
                    </div>
                  </td>
                  <td>{comm.installationId?.installationNumber || 'INST-Ref'}</td>
                  <td>
                    <span className="badge badge-info">{comm.tests?.length || 4} Parameters</span>
                  </td>
                  <td>
                    {comm.status === 'PASSED' ? (
                      <span style={{ color: '#10b981', fontWeight: 600 }}>✓ Signed & Accepted</span>
                    ) : (
                      <span style={{ color: '#94a3b8' }}>Pending Trials</span>
                    )}
                  </td>
                  <td><StatusBadge status={comm.status} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {comm.status === 'PENDING' && (
                        <>
                          <button
                            className="erp-btn-sm erp-btn-success"
                            onClick={() => handleAction(comm._id, 'pass')}
                          >
                            <VerifiedIcon fontSize="inherit" /> Pass & Activate Warranty
                          </button>
                          <button
                            className="erp-btn-sm erp-btn-danger"
                            onClick={() => handleAction(comm._id, 'fail')}
                          >
                            <HighlightOffIcon fontSize="inherit" /> Fail
                          </button>
                        </>
                      )}
                      {comm.status === 'PASSED' && (
                        <span className="badge badge-success">Warranty Active</span>
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
              <h3>Initiate Site Commissioning</h3>
              <button className="erp-btn-icon" onClick={() => setShowCreateModal(false)}>
                <CloseIcon />
              </button>
            </div>
            <form onSubmit={handleCreateCommissioning}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Select Completed Installation *</label>
                <select
                  required
                  value={installationId}
                  onChange={(e) => setInstallationId(e.target.value)}
                  className="erp-form-control"
                >
                  <option value="">-- Choose Completed Installation --</option>
                  {installations.map(inst => (
                    <option key={inst._id} value={inst._id}>
                      {inst.installationNumber} - {inst.customerId?.name} ({inst.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label>Commissioning Scope & Observations</label>
                <textarea
                  rows="3"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="erp-form-control"
                  placeholder="LN2 filling station ready, ambient temp 28C, vacuum gauge verified..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" className="erp-btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="erp-btn-primary">
                  Begin Commissioning Tests
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
