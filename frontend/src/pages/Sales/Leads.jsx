import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import StatusBadge from '../../components/Common/StatusBadge';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import EmptyState from '../../components/Common/EmptyState';
import ErrorMessage from '../../components/Common/ErrorMessage';

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    source: 'WEBSITE',
    requirementDetails: '',
    estimatedBudget: ''
  });

  const fetchLeads = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/leads');
      setLeads(res.data.leads || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/leads', {
        ...formData,
        estimatedBudget: Number(formData.estimatedBudget) || 0
      });
      setShowModal(false);
      setFormData({ companyName: '', contactName: '', email: '', phone: '', source: 'WEBSITE', requirementDetails: '', estimatedBudget: '' });
      fetchLeads();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleQualify = async (id) => {
    try {
      const res = await api.post(`/leads/${id}/actions/qualify`);
      alert(`Lead Qualified! Customer code created: ${res.data.customer?.customerCode || 'Success'}`);
      fetchLeads();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleLose = async (id) => {
    const reason = prompt('Enter reason for losing this lead:');
    if (!reason) return;
    try {
      await api.post(`/leads/${id}/actions/lose`, { lostReason: reason });
      fetchLeads();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f3f4f6' }}>
            Customer Enquiries & Leads
          </h1>
          <p style={{ fontSize: '0.825rem', color: '#9ca3af' }}>
            Capture client enquiries, track requirements, and qualify leads into master accounts
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Capture Enquiry
        </button>
      </div>

      {error && <ErrorMessage message={error} onRetry={fetchLeads} />}

      {loading ? (
        <LoadingSpinner message="Fetching enquiries..." />
      ) : leads.length === 0 ? (
        <EmptyState
          title="No enquiries logged"
          description="Click '+ Capture Enquiry' to log a new client requirement."
          actionLabel="+ Log First Lead"
          onAction={() => setShowModal(true)}
        />
      ) : (
        <div className="erp-table-container">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Lead #</th>
                <th>Company</th>
                <th>Contact</th>
                <th>Source</th>
                <th>Estimated Budget</th>
                <th>Status</th>
                <th>Assigned Rep</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead._id}>
                  <td style={{ fontWeight: 600, color: '#38bdf8' }}>{lead.leadNumber}</td>
                  <td style={{ fontWeight: 600 }}>{lead.companyName}</td>
                  <td>
                    <div>{lead.contactName}</div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{lead.email} | {lead.phone}</div>
                  </td>
                  <td><span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{lead.source}</span></td>
                  <td>₹{lead.estimatedBudget?.toLocaleString('en-IN') || 0}</td>
                  <td><StatusBadge status={lead.status} /></td>
                  <td>{lead.assignedTo?.name || 'Unassigned'}</td>
                  <td>
                    {lead.status !== 'QUALIFIED' && lead.status !== 'LOST' ? (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleQualify(lead._id)}
                        >
                          Qualify
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleLose(lead._id)}
                        >
                          Lose
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Converted</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Capture Lead Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Capture New Industrial Enquiry</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Company / Organization Name *</label>
                    <input
                      required
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      placeholder="e.g. Apollo Advanced BioTech"
                    />
                  </div>
                  <div className="form-group">
                    <label>Contact Person *</label>
                    <input
                      required
                      value={formData.contactName}
                      onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                      placeholder="e.g. Dr. Rajesh Sundaram"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Email Address *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="biotech@apollohealth.org"
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone / Mobile *</label>
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
                    <label>Enquiry Source</label>
                    <select
                      value={formData.source}
                      onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    >
                      <option value="EXHIBITION">Exhibition / Industrial Expo</option>
                      <option value="WEBSITE">Website Form Submission</option>
                      <option value="COLD_CALL">Direct Cold Call</option>
                      <option value="REFERRAL">Institutional Referral</option>
                      <option value="GOVERNMENT_TENDER">Government Tender</option>
                      <option value="DIRECT">Direct Client Visit</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Estimated Budget (₹)</label>
                    <input
                      type="number"
                      value={formData.estimatedBudget}
                      onChange={(e) => setFormData({ ...formData, estimatedBudget: e.target.value })}
                      placeholder="2000000"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Cryogenic Technical Requirements *</label>
                  <textarea
                    required
                    value={formData.requirementDetails}
                    onChange={(e) => setFormData({ ...formData, requirementDetails: e.target.value })}
                    placeholder="Specify target temperature, capacity, vacuum specs and operational environment..."
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Log Enquiry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
