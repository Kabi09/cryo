import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import StatusBadge from '../../components/Common/StatusBadge';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import EmptyState from '../../components/Common/EmptyState';
import ErrorMessage from '../../components/Common/ErrorMessage';

// MUI Icons
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import PaymentIcon from '@mui/icons-material/Payment';

export default function SalesOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/sales-orders');
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

  const handleReleaseProduction = async (id, advanceReceived, advanceRequired) => {
    if (advanceReceived < advanceRequired) {
      alert(`Cannot release to manufacturing: Advance payment is insufficient. Verified Advance: ₹${advanceReceived.toLocaleString('en-IN')}, Required: ₹${advanceRequired.toLocaleString('en-IN')}. Please record and verify customer payment first.`);
      return;
    }

    try {
      await api.post(`/sales-orders/${id}/actions/releaseProduction`);
      alert('Production release authorized! Work Order generated and BOM exploded.');
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
            Confirmed Sales Orders
          </h1>
          <p style={{ fontSize: '0.825rem', color: '#9ca3af' }}>
            Track verified orders, commercial advance releases, and manufacturing authorizations
          </p>
        </div>
      </div>

      {error && <ErrorMessage message={error} onRetry={fetchOrders} />}

      {loading ? (
        <LoadingSpinner message="Loading sales orders..." />
      ) : orders.length === 0 ? (
        <EmptyState
          title="No confirmed orders"
          description="Complete 4-Way PO verification to generate and confirm a sales order."
        />
      ) : (
        <div className="erp-table-container">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Order Number</th>
                <th>Client Account</th>
                <th>Total Value</th>
                <th>Advance Required</th>
                <th>Advance Verified</th>
                <th>Balance Due</th>
                <th>Status</th>
                <th>Committed Dispatch</th>
                <th>Production Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((so) => (
                <tr key={so._id}>
                  <td style={{ fontWeight: 700, color: '#38bdf8' }}>{so.salesOrderNumber}</td>
                  <td style={{ fontWeight: 600 }}>{so.customerId?.companyName}</td>
                  <td style={{ fontWeight: 700 }}>₹{so.grandTotal?.toLocaleString('en-IN')}</td>
                  <td>₹{so.advanceRequiredAmount?.toLocaleString('en-IN')}</td>
                  <td style={{ fontWeight: 700, color: so.advanceReceivedAmount >= so.advanceRequiredAmount ? '#10b981' : '#f59e0b' }}>
                    ₹{so.advanceReceivedAmount?.toLocaleString('en-IN') || 0}
                  </td>
                  <td>₹{so.balanceDueAmount?.toLocaleString('en-IN')}</td>
                  <td><StatusBadge status={so.status} /></td>
                  <td>{so.deliveryCommittedDate ? new Date(so.deliveryCommittedDate).toLocaleDateString() : 'TBD'}</td>
                  <td>
                    {so.status === 'CONFIRMED' ? (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleReleaseProduction(so._id, so.advanceReceivedAmount || 0, so.advanceRequiredAmount || 0)}
                      >
                        <PrecisionManufacturingIcon style={{ fontSize: '16px' }} />
                        Release to Production →
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 600 }}>
                        In Manufacturing / Logistics
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
