import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import StatusBadge from '../../components/Common/StatusBadge';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import EmptyState from '../../components/Common/EmptyState';
import ErrorMessage from '../../components/Common/ErrorMessage';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    gstin: '',
    pan: '',
    creditLimit: '1000000',
    creditDays: '30'
  });

  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/masters/customers');
      setCustomers(res.data.customers || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const customerCode = `CUST-${Date.now().toString().slice(-5)}`;
      await api.post('/masters/customers', {
        ...formData,
        customerCode,
        creditLimit: Number(formData.creditLimit) || 0,
        creditDays: Number(formData.creditDays) || 30
      });
      setShowModal(false);
      setFormData({ companyName: '', contactPerson: '', email: '', phone: '', gstin: '', pan: '', creditLimit: '1000000', creditDays: '30' });
      fetchCustomers();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f3f4f6' }}>
            Customer Accounts Directory
          </h1>
          <p style={{ fontSize: '0.825rem', color: '#9ca3af' }}>
            Approved client accounts with commercial credit terms and billing credentials
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + New Customer
        </button>
      </div>

      {error && <ErrorMessage message={error} onRetry={fetchCustomers} />}

      {loading ? (
        <LoadingSpinner message="Loading customer directory..." />
      ) : customers.length === 0 ? (
        <EmptyState
          title="No customers enrolled"
          description="Qualify leads or add new direct customers here."
          actionLabel="+ Add Customer"
          onAction={() => setShowModal(true)}
        />
      ) : (
        <div className="erp-table-container">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Customer Code</th>
                <th>Company Name</th>
                <th>Primary Contact</th>
                <th>GSTIN</th>
                <th>Credit Limit</th>
                <th>Credit Days</th>
                <th>Account Status</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c._id}>
                  <td style={{ fontWeight: 600, color: '#38bdf8' }}>{c.customerCode}</td>
                  <td style={{ fontWeight: 600 }}>{c.companyName}</td>
                  <td>
                    <div>{c.contactPerson}</div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{c.email} | {c.phone}</div>
                  </td>
                  <td><span style={{ fontFamily: 'monospace' }}>{c.gstin || 'Unregistered'}</span></td>
                  <td>₹{c.creditLimit?.toLocaleString('en-IN') || 0}</td>
                  <td>{c.creditDays || 30} Days</td>
                  <td><StatusBadge status={c.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Register Customer Account</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Company Legal Name *</label>
                    <input
                      required
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      placeholder="e.g. Apollo Advanced Cell Therapeutics Ltd"
                    />
                  </div>
                  <div className="form-group">
                    <label>Contact Person *</label>
                    <input
                      required
                      value={formData.contactPerson}
                      onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                      placeholder="e.g. Dr. Rajesh Sundaram"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Official Email *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="billing@company.com"
                    />
                  </div>
                  <div className="form-group">
                    <label>Contact Phone *</label>
                    <input
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 98401 23456"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>GSTIN</label>
                    <input
                      value={formData.gstin}
                      onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                      placeholder="33AABCA1234F1Z8"
                    />
                  </div>
                  <div className="form-group">
                    <label>PAN Number</label>
                    <input
                      value={formData.pan}
                      onChange={(e) => setFormData({ ...formData, pan: e.target.value })}
                      placeholder="AABCA1234F"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Authorized Credit Limit (₹)</label>
                    <input
                      type="number"
                      value={formData.creditLimit}
                      onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Credit Period (Days)</label>
                    <input
                      type="number"
                      value={formData.creditDays}
                      onChange={(e) => setFormData({ ...formData, creditDays: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Customer Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
