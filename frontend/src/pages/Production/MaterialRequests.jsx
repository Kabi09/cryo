import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import StatusBadge from '../../components/Common/StatusBadge';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import EmptyState from '../../components/Common/EmptyState';
import ErrorMessage from '../../components/Common/ErrorMessage';

// MUI Icons
import OutboxIcon from '@mui/icons-material/Outbox';

export default function MaterialRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/production/material-requests');
      setRequests(res.data.requests || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleIssue = async (id) => {
    try {
      await api.post(`/production/material-requests/${id}/actions/issue`);
      alert('Materials successfully issued from store to shop floor!');
      fetchRequests();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f3f4f6' }}>
          Floor Material Requests & Component Staging
        </h1>
        <p style={{ fontSize: '0.825rem', color: '#9ca3af' }}>
          Exploded BOM requirements, inventory availability checks, and warehouse-to-floor issue transactions
        </p>
      </div>

      {error && <ErrorMessage message={error} onRetry={fetchRequests} />}

      {loading ? (
        <LoadingSpinner message="Checking warehouse staging..." />
      ) : requests.length === 0 ? (
        <EmptyState title="No active material requests" description="Material requests are automatically generated upon releasing a production order." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {requests.map((mr) => (
            <div
              key={mr._id}
              style={{
                backgroundColor: '#162032',
                border: '1px solid #223249',
                borderRadius: '12px',
                padding: '20px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f3f4f6' }}>
                      {mr.requestNumber}
                    </h3>
                    <StatusBadge status={mr.status} />
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '2px' }}>
                    Linked Production Order: <strong style={{ color: '#38bdf8' }}>{mr.productionOrderId?.productionOrderNumber}</strong>
                  </p>
                </div>

                {mr.status !== 'ISSUED' && (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleIssue(mr._id)}
                  >
                    <OutboxIcon style={{ fontSize: '16px' }} />
                    Issue Available Stock to Floor
                  </button>
                )}
              </div>

              {/* Items List */}
              <div className="erp-table-container">
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th>Component SKU</th>
                      <th>Material Name</th>
                      <th>Required Qty</th>
                      <th>Issued Qty</th>
                      <th>Shortage</th>
                      <th>Availability Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mr.items?.map((item, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600, color: '#38bdf8' }}>{item.sku}</td>
                        <td style={{ fontWeight: 600 }}>{item.name}</td>
                        <td>{item.requiredQty} {item.uom}</td>
                        <td>{item.issuedQty} {item.uom}</td>
                        <td style={{ color: item.shortageQty > 0 ? '#ef4444' : '#10b981', fontWeight: 700 }}>
                          {item.shortageQty} {item.uom}
                        </td>
                        <td><StatusBadge status={item.stockStatus} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
