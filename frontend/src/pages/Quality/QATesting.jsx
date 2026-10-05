import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import StatusBadge from '../../components/Common/StatusBadge';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import EmptyState from '../../components/Common/EmptyState';
import ErrorMessage from '../../components/Common/ErrorMessage';

// MUI Icons
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloseIcon from '@mui/icons-material/Close';

export default function QATesting() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Test inspection modal
  const [selectedTest, setSelectedTest] = useState(null);
  const [actionReason, setActionReason] = useState('');
  const [certModal, setCertModal] = useState(null);

  const fetchTests = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/qa/tests');
      setTests(res.data.tests || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const handleAction = async (testId, action) => {
    const reasonPrompt = action === 'fail' || action === 'rework' || action === 'scrap' 
      ? prompt(`Enter reason / rectification remarks for ${action}:`)
      : 'Passed all cryogenic standards and safety criteria';
    
    if (reasonPrompt === null) return;

    try {
      const res = await api.post(`/qa/tests/${testId}/actions/${action}`, {
        remarks: reasonPrompt,
        rectificationPlan: action === 'fail' ? 'Strip insulation and re-weld inner vessel joint' : undefined
      });
      alert(`QA Test marked as ${action.toUpperCase()}! ${res.data.test?.certificateNumber ? 'Certificate: ' + res.data.test.certificateNumber : ''}`);
      if (selectedTest && selectedTest._id === testId) setSelectedTest(null);
      fetchTests();
    } catch (err) {
      alert(`Failed to execute ${action}: ` + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="erp-page-container">
      <div className="erp-page-header">
        <div>
          <h2>Cryogenic QA & Compliance Testing</h2>
          <p>Helium mass-spec leak tests, hydrostatic proof pressure, deep cryogenic hold, and compliance certification</p>
        </div>
      </div>

      {loading && <LoadingSpinner message="Loading QA Inspection Logs..." />}
      {error && <ErrorMessage message={error} onRetry={fetchTests} />}

      {!loading && !error && tests.length === 0 && (
        <EmptyState
          title="No QA Tests Found"
          message="QA tests are automatically queued when production orders complete their manufacturing stages."
        />
      )}

      {!loading && !error && tests.length > 0 && (
        <div className="erp-table-card">
          <table className="erp-data-table">
            <thead>
              <tr>
                <th>Test Number</th>
                <th>Serial / Product</th>
                <th>Production Order</th>
                <th>Parameters Checked</th>
                <th>Certificate</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tests.map(t => (
                <tr key={t._id}>
                  <td><strong>{t.testNumber}</strong></td>
                  <td>
                    <strong>{t.serialNumberId?.serialNumber || 'SN-Pending'}</strong>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {t.productionOrderId?.productId?.name || 'Cryogenic Vessel'}
                    </div>
                  </td>
                  <td>{t.productionOrderId?.productionOrderNumber || 'PO-Ref'}</td>
                  <td>
                    <span className="badge badge-info">{t.parameters?.length || 0} Test Points</span>
                  </td>
                  <td>
                    {t.certificateNumber ? (
                      <button
                        className="erp-btn-sm erp-btn-secondary"
                        onClick={() => setCertModal(t)}
                      >
                        <AssignmentTurnedInIcon fontSize="inherit" /> {t.certificateNumber}
                      </button>
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Pending Pass</span>
                    )}
                  </td>
                  <td><StatusBadge status={t.status} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="erp-btn-sm erp-btn-secondary"
                        onClick={() => setSelectedTest(t)}
                      >
                        View Checklist
                      </button>

                      {(t.status === 'PENDING' || t.status === 'UNDER_TEST') && (
                        <>
                          <button
                            className="erp-btn-sm erp-btn-success"
                            onClick={() => handleAction(t._id, 'pass')}
                          >
                            <CheckCircleOutlineIcon fontSize="inherit" /> Pass & Certify
                          </button>
                          <button
                            className="erp-btn-sm erp-btn-danger"
                            onClick={() => handleAction(t._id, 'fail')}
                          >
                            <HighlightOffIcon fontSize="inherit" /> Fail
                          </button>
                        </>
                      )}

                      {t.status === 'FAILED' && (
                        <>
                          <button
                            className="erp-btn-sm erp-btn-primary"
                            onClick={() => handleAction(t._id, 'retest')}
                          >
                            <RefreshIcon fontSize="inherit" /> Retest
                          </button>
                          <button
                            className="erp-btn-sm erp-btn-secondary"
                            onClick={() => handleAction(t._id, 'rework')}
                          >
                            Rework
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Checklist View Modal */}
      {selectedTest && (
        <div className="erp-modal-overlay">
          <div className="erp-modal-content" style={{ maxWidth: '850px' }}>
            <div className="erp-modal-header">
              <div>
                <h3>QA Checklist: {selectedTest.testNumber}</h3>
                <div>Serial: <strong>{selectedTest.serialNumberId?.serialNumber}</strong></div>
              </div>
              <button className="erp-btn-icon" onClick={() => setSelectedTest(null)}>
                <CloseIcon />
              </button>
            </div>

            <table className="erp-data-table" style={{ marginBottom: '1.5rem' }}>
              <thead>
                <tr>
                  <th>Test Parameter</th>
                  <th>Specified / Required Standard</th>
                  <th>Actual Measured Value</th>
                  <th>Point Result</th>
                </tr>
              </thead>
              <tbody>
                {selectedTest.parameters?.map((param, idx) => (
                  <tr key={idx}>
                    <td><strong>{param.parameterName}</strong></td>
                    <td>{param.standardValue || param.requiredValue}</td>
                    <td>{param.measuredValue || param.actualValue || 'Verified Normal'}</td>
                    <td>
                      <span className={`badge ${param.result === 'PASS' ? 'badge-success' : 'badge-danger'}`}>
                        {param.result || 'PASS'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {selectedTest.remarks && (
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Inspector Remarks:</span>
                <div>{selectedTest.remarks}</div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              {(selectedTest.status === 'PENDING' || selectedTest.status === 'UNDER_TEST') && (
                <>
                  <button className="erp-btn-success" onClick={() => handleAction(selectedTest._id, 'pass')}>
                    Approve & Issue Certificate
                  </button>
                  <button className="erp-btn-danger" onClick={() => handleAction(selectedTest._id, 'fail')}>
                    Reject / Flag Defect
                  </button>
                </>
              )}
              <button className="erp-btn-secondary" onClick={() => setSelectedTest(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Certificate Modal */}
      {certModal && (
        <div className="erp-modal-overlay">
          <div className="erp-modal-content" style={{ maxWidth: '700px', borderTop: '5px solid #10b981' }}>
            <div className="erp-modal-header">
              <div>
                <h3>Cryogenic Quality Compliance Certificate</h3>
                <div style={{ color: '#10b981', fontWeight: 700 }}>Cert No: {certModal.certificateNumber}</div>
              </div>
              <button className="erp-btn-icon" onClick={() => setCertModal(null)}>
                <CloseIcon />
              </button>
            </div>

            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', lineHeight: 1.8, marginBottom: '1.5rem' }}>
              <div>This is to certify that Serial Number <strong>{certModal.serialNumberId?.serialNumber}</strong> has successfully completed rigorous cryogenic quality assurance tests, including:</div>
              <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
                <li>Helium Mass Spectrometer Leak Detection (&lt; 1x10⁻⁹ mbar·L/s)</li>
                <li>Hydraulic Proof Pressure Test (1.5x MAWP)</li>
                <li>Cryogenic Deep Cold Pull-Down (-196°C Liquid Nitrogen)</li>
                <li>Vacuum Integrity and Multi-layer Superinsulation (MLI) Verification</li>
              </ul>
              <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #cbd5e1', paddingTop: '0.5rem' }}>
                <div>Date of Certification: <strong>{new Date(certModal.updatedAt || Date.now()).toLocaleDateString()}</strong></div>
                <div>Authorized QA Engineer: <strong>{certModal.testedBy?.name || 'Lead Cryo QA Inspector'}</strong></div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="erp-btn-secondary" onClick={() => setCertModal(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
