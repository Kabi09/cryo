import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import StatusBadge from '../../components/Common/StatusBadge';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import EmptyState from '../../components/Common/EmptyState';
import ErrorMessage from '../../components/Common/ErrorMessage';

export default function Quotations() {
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [customerId, setCustomerId] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [paymentTerms, setPaymentTerms] = useState('30% Advance, 70% against Proforma Invoice prior to dispatch');
  const [deliveryTerms, setDeliveryTerms] = useState('Ex-Works Chennai factory, freight extra');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [qRes, cRes, pRes] = await Promise.all([
        api.get('/quotations'),
        api.get('/masters/customers'),
        api.get('/masters/products')
      ]);
      setQuotations(qRes.data.quotations || []);
      setCustomers(cRes.data.customers || []);
      setProducts(pRes.data.products || []);
      if (cRes.data.customers?.length > 0) setCustomerId(cRes.data.customers[0]._id);
      if (pRes.data.products?.length > 0) {
        setProductId(pRes.data.products[0]._id);
        setUnitPrice(pRes.data.products[0].basePrice);
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

  const handleProductChange = (prodId) => {
    setProductId(prodId);
    const prod = products.find(p => p._id === prodId);
    if (prod) setUnitPrice(prod.basePrice);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const selectedProduct = products.find(p => p._id === productId);
      const subtotal = quantity * unitPrice;
      const discountAmount = (subtotal * discountPercent) / 100;
      const taxable = subtotal - discountAmount;
      const taxAmount = taxable * 0.18;
      const grandTotal = taxable + taxAmount;

      await api.post('/quotations', {
        customerId,
        items: [{
          productId,
          sku: selectedProduct?.sku || 'SKU-CUSTOM',
          name: selectedProduct?.name || 'Custom Cryogenic System',
          quantity: Number(quantity),
          unitPrice: Number(unitPrice),
          discountPercent: Number(discountPercent),
          taxPercent: 18,
          total: grandTotal
        }],
        paymentTerms,
        deliveryTerms,
        warrantyTerms: '12 Months comprehensive warranty from the date of Commissioning PASS'
      });

      setShowModal(false);
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
            Commercial Quotations & Revisions
          </h1>
          <p style={{ fontSize: '0.825rem', color: '#9ca3af' }}>
            Multi-stage formal proposals, commercial negotiations, and versioned revisions
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Draft Quotation
        </button>
      </div>

      {error && <ErrorMessage message={error} onRetry={fetchData} />}

      {loading ? (
        <LoadingSpinner message="Loading quotation registry..." />
      ) : quotations.length === 0 ? (
        <EmptyState
          title="No quotations created"
          description="Click '+ Draft Quotation' to create a new formal commercial proposal."
          actionLabel="+ Create First Quote"
          onAction={() => setShowModal(true)}
        />
      ) : (
        <div className="erp-table-container">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Quotation #</th>
                <th>Client Account</th>
                <th>Revision</th>
                <th>Subtotal</th>
                <th>Taxes (GST)</th>
                <th>Grand Total</th>
                <th>Status</th>
                <th>Created Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {quotations.map((q) => (
                <tr key={q._id}>
                  <td style={{ fontWeight: 700, color: '#38bdf8' }}>{q.quotationNumber}</td>
                  <td style={{ fontWeight: 600 }}>{q.customerId?.companyName || 'Unknown Customer'}</td>
                  <td>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(2, 132, 199, 0.15)',
                      color: '#38bdf8',
                      fontSize: '0.75rem',
                      fontWeight: 700
                    }}>
                      Rev {q.currentRevisionNumber || 0}
                    </span>
                  </td>
                  <td>₹{q.subtotal?.toLocaleString('en-IN')}</td>
                  <td>₹{q.taxAmount?.toLocaleString('en-IN')}</td>
                  <td style={{ fontWeight: 700, color: '#10b981' }}>₹{q.grandTotal?.toLocaleString('en-IN')}</td>
                  <td><StatusBadge status={q.status} /></td>
                  <td>{new Date(q.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => navigate(`/sales/quotations/${q._id}`)}
                    >
                      View & Manage →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Draft Quotation Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Draft Commercial Proposal</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Select Customer Account *</label>
                  <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} required>
                    {customers.map((c) => (
                      <option key={c._id} value={c._id}>{c.companyName} ({c.customerCode})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Select Cryogenic Product *</label>
                  <select value={productId} onChange={(e) => handleProductChange(e.target.value)} required>
                    {products.map((p) => (
                      <option key={p._id} value={p._id}>{p.name} - ₹{p.basePrice.toLocaleString('en-IN')}</option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Quantity *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Unit Base Price (₹) *</label>
                    <input
                      type="number"
                      required
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Discount (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Payment Terms</label>
                  <input
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Delivery Terms</label>
                  <input
                    value={deliveryTerms}
                    onChange={(e) => setDeliveryTerms(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Draft Quotation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
