import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import StatusBadge from '../../components/Common/StatusBadge';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import EmptyState from '../../components/Common/EmptyState';
import ErrorMessage from '../../components/Common/ErrorMessage';

// MUI Icons
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export default function ProductionOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/production/orders');
      setOrders(res.data.orders || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleAction = async (id, action) => {
    try {
      await api.post(`/production/orders/${id}/actions/${action}`);
      alert(`Action '${action}' executed successfully on Production Order.`);
      fetchOrders();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f3f4f6' }}>
            Production Orders & Shop Floor Runs
          </h1>
          <p style={{ fontSize: '0.825rem', color: '#9ca3af' }}>
            Authoritative manufacturing work orders, BOM staging, and shop floor milestone releases
          </p>
        </div>
      </div>

      {error && <ErrorMessage message={error} onRetry={fetchOrders} />}

      {loading ? (
        <LoadingSpinner message="Loading production orders..." />
      ) : orders.length === 0 ? (
        <EmptyState
          title="No active production orders"
          description="Confirm a sales order and release it to manufacturing to trigger production orders."
        />
      ) : (
        <div className="erp-table-container">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Order Number</th>
                <th>Product SKU & Model</th>
                <th>Sales Order</th>
                <th>Target Qty</th>
                <th>Target Finish Date</th>
                <th>Status</th>
                <th>Execution Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((po) => (
                <tr key={po._id}>
                  <td style={{ fontWeight: 700, color: '#38bdf8' }}>{po.productionOrderNumber}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{po.productId?.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{po.productId?.sku} ({po.productId?.tempRating})</div>
                  </td>
                  <td>{po.salesOrderId?.salesOrderNumber || 'N/A'}</td>
                  <td style={{ fontWeight: 700 }}>{po.plannedQuantity} Unit(s)</td>
                  <td>{new Date(po.targetCompletionDate).toLocaleDateString()}</td>
                  <td><StatusBadge status={po.status} /></td>
                  <td>
                    {po.status === 'DRAFT' && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleAction(po._id, 'release')}
                      >
                        <PlayArrowIcon style={{ fontSize: '16px' }} />
                        Release Order (Stage Materials)
                      </button>
                    )}

                    {(po.status === 'RELEASED' || po.status === 'MATERIAL_READY' || po.status === 'IN_PROGRESS') && (
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handleAction(po._id, 'complete')}
                      >
                        <CheckCircleIcon style={{ fontSize: '16px' }} />
                        Complete Assembly & Send to QA →
                      </button>
                    )}

                    {po.status === 'COMPLETED' && (
                      <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
                        ✔ Transferred to Cryo QA Bay
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
