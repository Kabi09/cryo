import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import EmptyState from '../../components/Common/EmptyState';
import ErrorMessage from '../../components/Common/ErrorMessage';

// MUI Icons
import HistoryEduIcon from '@mui/icons-material/HistoryEdu';
import FilterListIcon from '@mui/icons-material/FilterList';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';

export default function AuditLogsView() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEntity, setSelectedEntity] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = selectedEntity 
        ? `/system/audit-logs?entityType=${selectedEntity}` 
        : '/system/audit-logs';
      const res = await api.get(url);
      setLogs(res.data.logs || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedEntity]);

  return (
    <div className="erp-page-container">
      <div className="erp-page-header">
        <div>
          <h2>Immutable System Audit Trail</h2>
          <p>Cryptographically traceable action logs, workflow transitions, actor IDs, IP footprints, and state diffs</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FilterListIcon style={{ color: '#64748b' }} />
          <select
            value={selectedEntity}
            onChange={(e) => setSelectedEntity(e.target.value)}
            className="erp-form-control"
            style={{ width: '220px' }}
          >
            <option value="">-- All Subsystems --</option>
            <option value="QUOTATION">Quotation & Commercial</option>
            <option value="CUSTOMER_PO">Customer PO & Verification</option>
            <option value="SALES_ORDER">Sales Orders</option>
            <option value="PAYMENT">Finance & Payments</option>
            <option value="PRODUCTION_ORDER">Production & Shopfloor</option>
            <option value="INVENTORY">Inventory & Stock Ledger</option>
            <option value="PROCUREMENT">Procurement & RFQ/PO</option>
            <option value="QA_TEST">QA & Helium Leak</option>
            <option value="SERIAL">Serial Lifecycle</option>
            <option value="DISPATCH">Logistics & Freight</option>
            <option value="SERVICE_TICKET">Field Engineering</option>
          </select>
        </div>
      </div>

      {loading && <LoadingSpinner message="Querying Audit Ledger..." />}
      {error && <ErrorMessage message={error} onRetry={fetchLogs} />}

      {!loading && !error && logs.length === 0 && (
        <EmptyState
          title="No Audit Logs Recorded"
          message="Workflow actions executed by users will generate persistent audit entries here."
        />
      )}

      {!loading && !error && logs.length > 0 && (
        <div className="erp-table-card">
          <table className="erp-data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Subsystem / Entity</th>
                <th>Action Performed</th>
                <th>Actor User</th>
                <th>Status Transition</th>
                <th>Reason / Remarks</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log._id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{new Date(log.timestamp || log.createdAt).toLocaleDateString()}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{new Date(log.timestamp || log.createdAt).toLocaleTimeString()}</div>
                  </td>
                  <td>
                    <span className="badge badge-info">{log.entityType}</span>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                      ID: {String(log.entityId).substring(0, 8)}...
                    </div>
                  </td>
                  <td>
                    <strong>{log.action}</strong>
                  </td>
                  <td>
                    <div><strong>{log.actorUserId?.name || 'Authorized Actor'}</strong></div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{log.actorUserId?.email || 'System Agent'}</div>
                  </td>
                  <td>
                    {log.previousStatus || log.newStatus ? (
                      <div style={{ fontSize: '0.85rem' }}>
                        <span style={{ color: '#64748b' }}>{log.previousStatus || 'INIT'}</span>
                        {' → '}
                        <strong style={{ color: '#10b981' }}>{log.newStatus}</strong>
                      </div>
                    ) : (
                      <span style={{ color: '#94a3b8' }}>N/A</span>
                    )}
                  </td>
                  <td>
                    <div style={{ maxWidth: '240px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                      {log.reason || 'Operational action confirmed'}
                    </div>
                  </td>
                  <td>
                    <button
                      className="erp-btn-sm erp-btn-secondary"
                      onClick={() => setSelectedLog(log)}
                    >
                      <VisibilityIcon fontSize="inherit" /> Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Audit Detail Modal */}
      {selectedLog && (
        <div className="erp-modal-overlay">
          <div className="erp-modal-content" style={{ maxWidth: '750px' }}>
            <div className="erp-modal-header">
              <div>
                <h3>Audit Inspection: {selectedLog.action}</h3>
                <span className="badge badge-info">{selectedLog.entityType}</span>
              </div>
              <button className="erp-btn-icon" onClick={() => setSelectedLog(null)}>
                <CloseIcon />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
              <div>
                <div><strong>Timestamp:</strong> {new Date(selectedLog.timestamp || selectedLog.createdAt).toLocaleString()}</div>
                <div><strong>Actor:</strong> {selectedLog.actorUserId?.name} ({selectedLog.actorUserId?.email})</div>
                <div><strong>Role:</strong> {selectedLog.actorUserId?.role || 'SYSTEM'}</div>
              </div>
              <div>
                <div><strong>IP Address:</strong> {selectedLog.ipAddress || '127.0.0.1'}</div>
                <div><strong>Request ID:</strong> {selectedLog.requestId || 'REQ-' + selectedLog._id?.substring(0, 10)}</div>
                <div><strong>Transition:</strong> {selectedLog.previousStatus || 'NONE'} → {selectedLog.newStatus || 'UPDATED'}</div>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <strong>Business Reason / Remarks:</strong>
              <div style={{ background: '#f1f5f9', padding: '0.75rem', borderRadius: '6px', marginTop: '0.25rem', fontSize: '0.9rem' }}>
                {selectedLog.reason || 'No specific rationale provided'}
              </div>
            </div>

            {selectedLog.changedFields && Object.keys(selectedLog.changedFields).length > 0 && (
              <div>
                <strong>Changed Field Delta / Payload:</strong>
                <pre style={{ background: '#0f172a', color: '#f8fafc', padding: '1rem', borderRadius: '6px', fontSize: '0.8rem', overflowX: 'auto', marginTop: '0.5rem' }}>
                  {JSON.stringify(selectedLog.changedFields, null, 2)}
                </pre>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button className="erp-btn-secondary" onClick={() => setSelectedLog(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
