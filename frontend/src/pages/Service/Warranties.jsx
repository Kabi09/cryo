import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import StatusBadge from '../../components/Common/StatusBadge';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import EmptyState from '../../components/Common/EmptyState';
import ErrorMessage from '../../components/Common/ErrorMessage';

// MUI Icons
import ShieldIcon from '@mui/icons-material/Shield';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export default function Warranties() {
  const [warranties, setWarranties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWarranties = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/service/warranties');
      setWarranties(res.data.warranties || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarranties();
  }, []);

  return (
    <div className="erp-page-container">
      <div className="erp-page-header">
        <div>
          <h2>Product Warranties & Guarantees</h2>
          <p>Authoritative warranty register activated upon successful commissioning verification</p>
        </div>
      </div>

      {loading && <LoadingSpinner message="Loading Warranty Database..." />}
      {error && <ErrorMessage message={error} onRetry={fetchWarranties} />}

      {!loading && !error && warranties.length === 0 && (
        <EmptyState
          title="No Warranties Activated"
          message="Warranties are automatically generated and activated when site commissioning passes."
        />
      )}

      {!loading && !error && warranties.length > 0 && (
        <div className="erp-table-card">
          <table className="erp-data-table">
            <thead>
              <tr>
                <th>Warranty Number</th>
                <th>Serial Number</th>
                <th>Customer</th>
                <th>Valid From</th>
                <th>Valid To</th>
                <th>Covered Components</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {warranties.map(w => {
                const isExpired = new Date(w.endDate) < new Date();
                return (
                  <tr key={w._id}>
                    <td>
                      <ShieldIcon fontSize="small" style={{ color: '#10b981', verticalAlign: 'middle', marginRight: '4px' }} />
                      <strong>{w.warrantyNumber}</strong>
                    </td>
                    <td>
                      <strong>{w.serialNumberId?.serialNumber || 'SN-Ref'}</strong>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        {w.serialNumberId?.productId?.name}
                      </div>
                    </td>
                    <td>{w.customerId?.name || 'Customer'}</td>
                    <td>{new Date(w.startDate).toLocaleDateString()}</td>
                    <td>
                      <strong>{new Date(w.endDate).toLocaleDateString()}</strong>
                      <div style={{ fontSize: '0.75rem', color: isExpired ? '#ef4444' : '#10b981' }}>
                        {isExpired ? 'Coverage Expired' : 'Under Active Guarantee'}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}>
                        {w.coveredParts?.join(', ') || 'Inner Vessel Vacuum, Relief Valves, Cryo Valves, Digital Transmitters'}
                      </div>
                    </td>
                    <td><StatusBadge status={w.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
