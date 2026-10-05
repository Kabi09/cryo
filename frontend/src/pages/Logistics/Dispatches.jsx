import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import StatusBadge from '../../components/Common/StatusBadge';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import EmptyState from '../../components/Common/EmptyState';
import ErrorMessage from '../../components/Common/ErrorMessage';

// MUI Icons
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AddBoxIcon from '@mui/icons-material/AddBox';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CloseIcon from '@mui/icons-material/Close';

export default function Dispatches() {
  const [dispatches, setDispatches] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [packingLists, setPackingLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New Dispatch Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [invoiceId, setInvoiceId] = useState('');
  const [packingListId, setPackingListId] = useState('');
  const [transporterName, setTransporterName] = useState('VRL Heavy Logistics');
  const [vehicleNumber, setVehicleNumber] = useState('KA-01-EQ-9988');
  const [lrNumber, setLrNumber] = useState('LR-2026-4401');
  const [driverContact, setDriverContact] = useState('+91 98765 43210');
  const [ewayBill, setEwayBill] = useState('EWB-3344-9988-1122');
  const [remarks, setRemarks] = useState('');

  const fetchDispatches = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dRes, iRes, pRes] = await Promise.all([
        api.get('/logistics/dispatches'),
        api.get('/logistics/invoices'),
        api.get('/logistics/packing-lists')
      ]);
      setDispatches(dRes.data.dispatches || []);
      setInvoices(iRes.data.invoices || []);
      setPackingLists(pRes.data.packingLists || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDispatches();
  }, []);

  const handleCreateDispatch = async (e) => {
    e.preventDefault();
    if (!invoiceId) return;

    try {
      await api.post('/logistics/dispatches', {
        invoiceId,
        packingListId: packingListId || undefined,
        transporterName,
        vehicleNumber,
        lrNumber,
        driverContact,
        ewayBillNumber: ewayBill,
        remarks
      });
      alert('Dispatch advice created successfully!');
      setShowCreateModal(false);
      fetchDispatches();
    } catch (err) {
      alert('Failed to create dispatch advice: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleAction = async (dispatchId, action) => {
    try {
      await api.post(`/logistics/dispatches/${dispatchId}/actions/${action}`, {
        remarks: 'Vehicle inspected, GPS lock active, departed factory gate'
      });
      alert(`Dispatch marked as ${action.toUpperCase()}!`);
      fetchDispatches();
    } catch (err) {
      alert(`Failed to execute ${action}: ` + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="erp-page-container">
      <div className="erp-page-header">
        <div>
          <h2>Outbound Dispatch & Freight Logistics</h2>
          <p>Transporter assignment, Lorry Receipts (LR), vehicle gate pass, and E-Way Bill management</p>
        </div>
        <button className="erp-btn-primary" onClick={() => setShowCreateModal(true)}>
          <AddBoxIcon fontSize="inherit" /> Create Dispatch Advice
        </button>
      </div>

      {loading && <LoadingSpinner message="Loading Dispatch Records..." />}
      {error && <ErrorMessage message={error} onRetry={fetchDispatches} />}

      {!loading && !error && dispatches.length === 0 && (
        <EmptyState
          title="No Outbound Dispatches"
          message="Create a dispatch advice once tax invoices and packed crates are verified."
        />
      )}

      {!loading && !error && dispatches.length > 0 && (
        <div className="erp-table-card">
          <table className="erp-data-table">
            <thead>
              <tr>
                <th>Dispatch Number</th>
                <th>Invoice Ref</th>
                <th>Transporter</th>
                <th>Vehicle & LR Number</th>
                <th>E-Way Bill</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {dispatches.map(d => (
                <tr key={d._id}>
                  <td><strong>{d.dispatchNumber}</strong></td>
                  <td>{d.invoiceId?.invoiceNumber || 'INV-Ref'}</td>
                  <td>
                    <strong>{d.transporterName}</strong>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Driver: {d.driverContact || 'N/A'}</div>
                  </td>
                  <td>
                    <div><strong>{d.vehicleNumber}</strong></div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>LR: {d.lrNumber || 'N/A'}</div>
                  </td>
                  <td>{d.ewayBillNumber || 'Exempted'}</td>
                  <td><StatusBadge status={d.status} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {d.status === 'DRAFT' && (
                        <button
                          className="erp-btn-sm erp-btn-primary"
                          onClick={() => handleAction(d._id, 'dispatch')}
                        >
                          <LocalShippingIcon fontSize="inherit" /> Authorize Gate Out
                        </button>
                      )}
                      {d.status === 'DISPATCHED' && (
                        <button
                          className="erp-btn-sm erp-btn-success"
                          onClick={() => handleAction(d._id, 'intransit')}
                        >
                          <CheckCircleOutlineIcon fontSize="inherit" /> Mark In-Transit
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
              <h3>Create Outbound Dispatch Advice</h3>
              <button className="erp-btn-icon" onClick={() => setShowCreateModal(false)}>
                <CloseIcon />
              </button>
            </div>
            <form onSubmit={handleCreateDispatch}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label>Select Tax Invoice *</label>
                  <select
                    required
                    value={invoiceId}
                    onChange={(e) => setInvoiceId(e.target.value)}
                    className="erp-form-control"
                  >
                    <option value="">-- Choose Invoice --</option>
                    {invoices.map(inv => (
                      <option key={inv._id} value={inv._id}>
                        {inv.invoiceNumber} - {inv.customerId?.name} (₹{inv.totalAmount?.toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Select Packing List</label>
                  <select
                    value={packingListId}
                    onChange={(e) => setPackingListId(e.target.value)}
                    className="erp-form-control"
                  >
                    <option value="">-- Optional Packing List --</option>
                    {packingLists.map(p => (
                      <option key={p._id} value={p._id}>
                        {p.packingListNumber} - {p.packageType}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label>Transporter Name *</label>
                  <input
                    type="text"
                    required
                    value={transporterName}
                    onChange={(e) => setTransporterName(e.target.value)}
                    className="erp-form-control"
                  />
                </div>
                <div className="form-group">
                  <label>Vehicle Number *</label>
                  <input
                    type="text"
                    required
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    className="erp-form-control"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label>Lorry Receipt (LR) / Docket No.</label>
                  <input
                    type="text"
                    value={lrNumber}
                    onChange={(e) => setLrNumber(e.target.value)}
                    className="erp-form-control"
                  />
                </div>
                <div className="form-group">
                  <label>Driver Phone Contact</label>
                  <input
                    type="text"
                    value={driverContact}
                    onChange={(e) => setDriverContact(e.target.value)}
                    className="erp-form-control"
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>E-Way Bill Number</label>
                <input
                  type="text"
                  value={ewayBill}
                  onChange={(e) => setEwayBill(e.target.value)}
                  className="erp-form-control"
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label>Dispatch Notes</label>
                <textarea
                  rows="2"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="erp-form-control"
                  placeholder="Escort details, security seal numbers..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" className="erp-btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="erp-btn-primary">
                  Generate Dispatch Advice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
