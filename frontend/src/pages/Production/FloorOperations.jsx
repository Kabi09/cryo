import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import StatusBadge from '../../components/Common/StatusBadge';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import EmptyState from '../../components/Common/EmptyState';
import ErrorMessage from '../../components/Common/ErrorMessage';

// MUI Icons
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export default function FloorOperations() {
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [operations, setOperations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/production/orders');
      const activeOrders = res.data.orders || [];
      setOrders(activeOrders);
      if (activeOrders.length > 0) {
        setSelectedOrderId(activeOrders[0]._id);
        fetchOperations(activeOrders[0]._id);
      } else {
        setLoading(false);
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const fetchOperations = async (orderId) => {
    try {
      const res = await api.get(`/production/orders/${orderId}`);
      setOperations(res.data.operations || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleOrderChange = (orderId) => {
    setSelectedOrderId(orderId);
    setLoading(true);
    fetchOperations(orderId);
  };

  const handleStart = async (opId) => {
    try {
      await api.post(`/production/operations/${opId}/actions/start`);
      fetchOperations(selectedOrderId);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleComplete = async (opId) => {
    try {
      await api.post(`/production/operations/${opId}/actions/complete`, {
        yieldQuantity: 1,
        remarks: 'Workstation operation completed within engineering tolerances.'
      });
      fetchOperations(selectedOrderId);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f3f4f6' }}>
            Shop Floor Workstation Operations
          </h1>
          <p style={{ fontSize: '0.825rem', color: '#9ca3af' }}>
            Real-time stage tracking across Fabrication, Cascade Refrigeration, Electrical, and Final Assembly
          </p>
        </div>

        {orders.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.85rem', color: '#9ca3af', fontWeight: 600 }}>Work Order:</span>
            <select
              value={selectedOrderId}
              onChange={(e) => handleOrderChange(e.target.value)}
              style={{
                padding: '8px 14px',
                backgroundColor: '#162032',
                border: '1px solid #223249',
                borderRadius: '8px',
                color: '#38bdf8',
                fontWeight: 700
              }}
            >
              {orders.map((o) => (
                <option key={o._id} value={o._id}>
                  {o.productionOrderNumber} - {o.productId?.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {error && <ErrorMessage message={error} onRetry={fetchOrders} />}

      {loading ? (
        <LoadingSpinner message="Loading shop floor operations..." />
      ) : operations.length === 0 ? (
        <EmptyState title="No active operations" description="Select a work order or release a production order to generate floor routing operations." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {operations.map((op) => (
            <div
              key={op._id}
              style={{
                backgroundColor: '#162032',
                border: `1px solid ${op.status === 'COMPLETED' ? '#10b981' : op.status === 'IN_PROGRESS' ? '#0284c7' : '#223249'}`,
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(2, 132, 199, 0.2)',
                    color: '#38bdf8'
                  }}>
                    Step {op.sequenceNumber}
                  </span>
                  <StatusBadge status={op.status} />
                </div>

                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f3f4f6', marginBottom: '4px' }}>
                  {op.operationType?.replace(/_/g, ' ')}
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                  Work Center: <strong style={{ color: '#cbd5e1' }}>{op.workCenterId?.name || 'Central Bay'}</strong>
                </p>

                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div>Started: {op.startTime ? new Date(op.startTime).toLocaleTimeString() : 'Pending'}</div>
                  <div>Finished: {op.endTime ? new Date(op.endTime).toLocaleTimeString() : 'Pending'}</div>
                  <div>Duration: {op.actualDurationHours ? `${op.actualDurationHours} hrs` : '-'}</div>
                </div>
              </div>

              <div style={{ marginTop: '20px', paddingTop: '14px', borderTop: '1px solid #223249' }}>
                {op.status === 'PENDING' && (
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ width: '100%' }}
                    onClick={() => handleStart(op._id)}
                  >
                    <PlayArrowIcon style={{ fontSize: '16px' }} />
                    Start Workstation Operation
                  </button>
                )}

                {op.status === 'IN_PROGRESS' && (
                  <button
                    className="btn btn-success btn-sm"
                    style={{ width: '100%' }}
                    onClick={() => handleComplete(op._id)}
                  >
                    <CheckCircleIcon style={{ fontSize: '16px' }} />
                    Complete Operation
                  </button>
                )}

                {op.status === 'COMPLETED' && (
                  <div style={{ textAlign: 'center', color: '#10b981', fontSize: '0.8rem', fontWeight: 700 }}>
                    ✔ Completed & Quality Inspected
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
