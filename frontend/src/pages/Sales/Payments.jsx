import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import StatusBadge from '../../components/Common/StatusBadge';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import EmptyState from '../../components/Common/EmptyState';
import ErrorMessage from '../../components/Common/ErrorMessage';

// MUI Icons
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import UndoIcon from '@mui/icons-material/Undo';
import PaymentIcon from '@mui/icons-material/Payment';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [salesOrderId, setSalesOrderId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentType, setPaymentType] = useState('ADVANCE');
  const [method, setMethod] = useState('RTGS');
  const [bankName, setBankName] = useState('HDFC Bank');
  const [transactionRef, setTransactionRef] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [payRes, soRes] = await Promise.all([
        api.get('/payments'),
        api.get('/sales-orders')
      ]);
      setPayments(payRes.data.payments || []);
      setOrders(soRes.data.orders || []);
      if (soRes.data.orders?.length > 0) {
        setSalesOrderId(soRes.data.orders[0]._id);
        setAmount(soRes.data.orders[0].advanceRequiredAmount || 500000);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const so = orders.find(o => o._id === salesOrderId);
      if (!so) throw new Error('Please select a valid sales order');

      await api.post('/payments', {
        customerId: so.customerId._id || so.customerId,
        salesOrderId: so._id,
        expectedAmount: Number(amount),
        receivedAmount: Number(amount),
        paymentType,
        method,
        bankName,
        transactionReference: transactionRef || `TXN-${Date.now().toString().slice(-6)}`
      });

      setShowModal(false);
      setTransactionRef('');
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleVerify = async (id) => {
    try {
      await api.post(`/payments/${id}/actions/verify`);
      alert('Payment receipt verified and posted to treasury!');
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleReverse = async (id) => {
    const reason = prompt('Enter reason for reversing payment:');
    if (!reason) return;
    try {
      await api.post(`/payments/${id}/actions/reverse`, { reversalReason: reason });
      alert('Payment reversed.');
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f3f4f6' }}>
            Payment Receipts & Accounts Treasury
          </h1>
          <p style={{ fontSize: '0.825rem', color: '#9ca3af' }}>
            Record customer bank remittances, verify credits, and reconcile order balances
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Record Payment Receipt
        </button>
      </div>

      {error && <ErrorMessage message={error} onRetry={fetchData} />}

      {loading ? (
        <LoadingSpinner message="Loading financial transactions..." />
      ) : payments.length === 0 ? (
        <EmptyState
          title="No payments recorded"
          description="Log customer advance or balance remittances to release orders."
          actionLabel="+ Log First Payment"
          onAction={() => setShowModal(true)}
        />
      ) : (
        <div className="erp-table-container">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Receipt #</th>
                <th>Client Account</th>
                <th>Sales Order</th>
                <th>Amount</th>
                <th>Type</th>
                <th>Method</th>
                <th>Bank Ref</th>
                <th>Payment Date</th>
                <th>Status</th>
                <th>Verification Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p._id}>
                  <td style={{ fontWeight: 700, color: '#38bdf8' }}>{p.paymentNumber}</td>
                  <td style={{ fontWeight: 600 }}>{p.customerId?.companyName}</td>
                  <td>{p.salesOrderId?.salesOrderNumber || 'General Credit'}</td>
                  <td style={{ fontWeight: 700, color: '#10b981' }}>₹{p.receivedAmount?.toLocaleString('en-IN')}</td>
                  <td><span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{p.paymentType}</span></td>
                  <td>{p.method}</td>
                  <td><span style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{p.transactionReference}</span></td>
                  <td>{new Date(p.paymentDate).toLocaleDateString()}</td>
                  <td><StatusBadge status={p.status} /></td>
                  <td>
                    {p.status === 'PENDING' ? (
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handleVerify(p._id)}
                      >
                        <CheckCircleIcon style={{ fontSize: '16px' }} />
                        Verify Bank Credit
                      </button>
                    ) : p.status === 'VERIFIED' ? (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleReverse(p._id)}
                        style={{ color: '#ef4444' }}
                      >
                        <UndoIcon style={{ fontSize: '16px' }} />
                        Reverse
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Reconciled</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Record Payment Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Record Customer Payment Remittance</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Linked Sales Order *</label>
                  <select
                    value={salesOrderId}
                    onChange={(e) => {
                      setSalesOrderId(e.target.value);
                      const so = orders.find(item => item._id === e.target.value);
                      if (so) setAmount(so.advanceRequiredAmount || 500000);
                    }}
                    required
                  >
                    {orders.map((so) => (
                      <option key={so._id} value={so._id}>
                        {so.salesOrderNumber} - {so.customerId?.companyName} (Balance Due: ₹{so.balanceDueAmount?.toLocaleString('en-IN')})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Remittance Amount (₹) *</label>
                    <input
                      type="number"
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Payment Stage</label>
                    <select value={paymentType} onChange={(e) => setPaymentType(e.target.value)}>
                      <option value="ADVANCE">Advance Release Payment</option>
                      <option value="STAGE">Milestone Stage Payment</option>
                      <option value="BALANCE">Final Balance Payment</option>
                      <option value="SERVICE">Service Repair Fee</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Payment Mode</label>
                    <select value={method} onChange={(e) => setMethod(e.target.value)}>
                      <option value="RTGS">RTGS Real Time Gross</option>
                      <option value="NEFT">NEFT Bank Transfer</option>
                      <option value="CHEQUE">Corporate Cheque</option>
                      <option value="WIRE_TRANSFER">Swift Wire Transfer</option>
                      <option value="UPI">UPI Digital Payment</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Remitting / Depository Bank</label>
                    <input
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. State Bank of India"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Bank UTR / Transaction Reference *</label>
                  <input
                    required
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    placeholder="e.g. SBINR5202603018899"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Record Receipt Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
