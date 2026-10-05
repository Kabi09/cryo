import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import StatusBadge from '../../components/Common/StatusBadge';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import EmptyState from '../../components/Common/EmptyState';
import ErrorMessage from '../../components/Common/ErrorMessage';

export default function LedgerMovements() {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchMovements() {
      try {
        const res = await api.get('/inventory/ledger');
        setMovements(res.data.movements || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchMovements();
  }, []);

  if (loading) return <LoadingSpinner message="Querying immutable inventory ledger..." />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f3f4f6' }}>
          Double-Entry Inventory Movement Ledger
        </h1>
        <p style={{ fontSize: '0.825rem', color: '#9ca3af' }}>
          Cryptographically auditable and immutable physical stock transactions
        </p>
      </div>

      {movements.length === 0 ? (
        <EmptyState title="No movements logged" description="Inventory movements will be recorded here when GRNs, material issues or adjustments occur." />
      ) : (
        <div className="erp-table-container">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Movement #</th>
                <th>Movement Type</th>
                <th>Item / SKU</th>
                <th>Warehouse Bay</th>
                <th>Quantity Delta</th>
                <th>Running Balance</th>
                <th>Reference Source</th>
                <th>Audit Remarks</th>
                <th>Recorded At</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m._id}>
                  <td style={{ fontWeight: 600, color: '#38bdf8' }}>{m.movementNumber}</td>
                  <td><StatusBadge status={m.movementType} /></td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{m.itemId?.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{m.itemId?.sku}</div>
                  </td>
                  <td>{m.warehouseId?.name}</td>
                  <td style={{
                    fontWeight: 700,
                    color: m.quantity > 0 ? '#10b981' : '#ef4444'
                  }}>
                    {m.quantity > 0 ? `+${m.quantity}` : m.quantity} {m.itemId?.uom}
                  </td>
                  <td style={{ fontWeight: 700 }}>{m.balanceAfter} {m.itemId?.uom}</td>
                  <td>
                    <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 600 }}>
                      {m.referenceEntityType}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>{m.remarks || '-'}</td>
                  <td>{new Date(m.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
