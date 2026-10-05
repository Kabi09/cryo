import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import StatusBadge from '../../components/Common/StatusBadge';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import EmptyState from '../../components/Common/EmptyState';
import ErrorMessage from '../../components/Common/ErrorMessage';

// MUI Icons
import ReceiptIcon from '@mui/icons-material/Receipt';
import PostAddIcon from '@mui/icons-material/PostAdd';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [salesOrders, setSalesOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New Invoice Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSoId, setSelectedSoId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [remarks, setRemarks] = useState('');

  // Invoice Details Modal
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const fetchInvoices = async () => {
    setLoading(true);
    setError(null);
    try {
      const [iRes, soRes] = await Promise.all([
        api.get('/logistics/invoices'),
        api.get('/sales/orders')
      ]);
      setInvoices(iRes.data.invoices || []);
      setSalesOrders(soRes.data.orders || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    const so = salesOrders.find(s => s._id === selectedSoId);
    if (!so) return;

    try {
      await api.post('/logistics/invoices', {
        salesOrderId: so._id,
        customerId: so.customerId?._id || so.customerId,
        dueDate: dueDate || new Date(Date.now() + 30*24*60*60*1000),
        remarks
      });
      alert('Tax Invoice generated successfully!');
      setShowCreateModal(false);
      fetchInvoices();
    } catch (err) {
      alert('Failed to generate invoice: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleAction = async (invoiceId, action) => {
    try {
      await api.post(`/logistics/invoices/${invoiceId}/actions/${action}`, {
        remarks: `Invoice ${action} executed by Accounts team`
      });
      alert(`Invoice marked as ${action.toUpperCase()}!`);
      if (selectedInvoice && selectedInvoice._id === invoiceId) setSelectedInvoice(null);
      fetchInvoices();
    } catch (err) {
      alert(`Failed to execute ${action}: ` + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="erp-page-container">
      <div className="erp-page-header">
        <div>
          <h2>Final Tax Invoices & Billing</h2>
          <p>GST compliant commercial invoices, tax schedules, accounts posting, and receivable reconciliation</p>
        </div>
        <button className="erp-btn-primary" onClick={() => setShowCreateModal(true)}>
          <ReceiptIcon fontSize="inherit" /> Generate Tax Invoice
        </button>
      </div>

      {loading && <LoadingSpinner message="Loading Tax Invoices..." />}
      {error && <ErrorMessage message={error} onRetry={fetchInvoices} />}

      {!loading && !error && invoices.length === 0 && (
        <EmptyState
          title="No Invoices Found"
          message="Generate final tax invoices for confirmed sales orders ready for dispatch."
        />
      )}

      {!loading && !error && invoices.length > 0 && (
        <div className="erp-table-card">
          <table className="erp-data-table">
            <thead>
              <tr>
                <th>Invoice Number</th>
                <th>Customer</th>
                <th>Sales Order</th>
                <th>Subtotal</th>
                <th>GST Tax</th>
                <th>Total Value</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv._id}>
                  <td><strong>{inv.invoiceNumber}</strong></td>
                  <td>
                    <strong>{inv.customerId?.name || 'Customer'}</strong>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>GSTIN: {inv.customerId?.gstNumber || 'Unregistered'}</div>
                  </td>
                  <td>{inv.salesOrderId?.salesOrderNumber || 'SO-Ref'}</td>
                  <td>₹{(inv.subtotal || 0).toLocaleString()}</td>
                  <td>₹{(inv.taxAmount || 0).toLocaleString()}</td>
                  <td><strong>₹{(inv.totalAmount || 0).toLocaleString()}</strong></td>
                  <td><StatusBadge status={inv.status} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="erp-btn-sm erp-btn-secondary"
                        onClick={() => setSelectedInvoice(inv)}
                      >
                        <VisibilityIcon fontSize="inherit" /> View Invoice
                      </button>

                      {inv.status === 'DRAFT' && (
                        <button
                          className="erp-btn-sm erp-btn-primary"
                          onClick={() => handleAction(inv._id, 'post')}
                        >
                          <PostAddIcon fontSize="inherit" /> Post to GL
                        </button>
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
              <h3>Generate Final Tax Invoice</h3>
              <button className="erp-btn-icon" onClick={() => setShowCreateModal(false)}>
                <CloseIcon />
              </button>
            </div>
            <form onSubmit={handleCreateInvoice}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Select Sales Order *</label>
                <select
                  required
                  value={selectedSoId}
                  onChange={(e) => setSelectedSoId(e.target.value)}
                  className="erp-form-control"
                >
                  <option value="">-- Choose Sales Order --</option>
                  {salesOrders.map(so => (
                    <option key={so._id} value={so._id}>
                      {so.salesOrderNumber} - {so.customerId?.name} (₹{so.totalAmount?.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Payment Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="erp-form-control"
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label>Billing & Delivery Remarks</label>
                <textarea
                  rows="2"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="erp-form-control"
                  placeholder="Terms of payment, consignee location..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" className="erp-btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="erp-btn-primary">
                  Generate Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div className="erp-modal-overlay">
          <div className="erp-modal-content" style={{ maxWidth: '850px' }}>
            <div className="erp-modal-header">
              <div>
                <h3>Tax Invoice: {selectedInvoice.invoiceNumber}</h3>
                <StatusBadge status={selectedInvoice.status} />
              </div>
              <button className="erp-btn-icon" onClick={() => setSelectedInvoice(null)}>
                <CloseIcon />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', background: '#f8fafc', padding: '1.25rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Billed To:</span>
                <div><strong>{selectedInvoice.customerId?.name}</strong></div>
                <div style={{ fontSize: '0.85rem' }}>{selectedInvoice.customerId?.address || 'Site delivery address'}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>GSTIN: {selectedInvoice.customerId?.gstNumber || 'N/A'}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Invoice Date:</span>
                <div>{new Date(selectedInvoice.createdAt).toLocaleDateString()}</div>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Sales Order Ref:</span>
                <div><strong>{selectedInvoice.salesOrderId?.salesOrderNumber}</strong></div>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Total Payable:</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#10b981' }}>
                  ₹{(selectedInvoice.totalAmount || 0).toLocaleString()}
                </div>
              </div>
            </div>

            <table className="erp-data-table" style={{ marginBottom: '1.5rem' }}>
              <thead>
                <tr>
                  <th>Item & HSN</th>
                  <th>Quantity</th>
                  <th>Rate</th>
                  <th>Tax</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {selectedInvoice.lineItems?.map((item, idx) => (
                  <tr key={idx}>
                    <td>
                      <strong>{item.description || item.itemCode}</strong>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>HSN: {item.hsnCode || '84186990'}</div>
                    </td>
                    <td>{item.quantity} Nos</td>
                    <td>₹{(item.unitPrice || 0).toLocaleString()}</td>
                    <td>{item.taxRate || 18}%</td>
                    <td>₹{(item.totalPrice || (item.quantity * item.unitPrice * (1 + (item.taxRate || 18)/100))).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              {selectedInvoice.status === 'DRAFT' && (
                <button
                  className="erp-btn-primary"
                  onClick={() => handleAction(selectedInvoice._id, 'post')}
                >
                  Post to Accounts
                </button>
              )}
              <button className="erp-btn-secondary" onClick={() => setSelectedInvoice(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
