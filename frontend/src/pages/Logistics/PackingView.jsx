import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import StatusBadge from '../../components/Common/StatusBadge';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import EmptyState from '../../components/Common/EmptyState';
import ErrorMessage from '../../components/Common/ErrorMessage';

// MUI Icons
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AddBoxIcon from '@mui/icons-material/AddBox';
import CloseIcon from '@mui/icons-material/Close';

export default function PackingView() {
  const [packingLists, setPackingLists] = useState([]);
  const [salesOrders, setSalesOrders] = useState([]);
  const [serials, setSerials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [soId, setSoId] = useState('');
  const [selectedSerialId, setSelectedSerialId] = useState('');
  const [packageType, setPackageType] = useState('Heavy-duty Wooden Crate with Cryo Shock Mounts');
  const [dimensions, setDimensions] = useState('1200 x 800 x 1400 mm');
  const [grossWeight, setGrossWeight] = useState('240 kg');
  const [remarks, setRemarks] = useState('');

  const fetchPacking = async () => {
    setLoading(true);
    setError(null);
    try {
      const [pRes, soRes, sRes] = await Promise.all([
        api.get('/logistics/packing-lists'),
        api.get('/sales/orders'),
        api.get('/serials')
      ]);
      setPackingLists(pRes.data.packingLists || []);
      setSalesOrders(soRes.data.orders || []);
      setSerials(sRes.data.serials || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPacking();
  }, []);

  const handleCreatePacking = async (e) => {
    e.preventDefault();
    if (!soId) return;

    try {
      await api.post('/logistics/packing-lists', {
        salesOrderId: soId,
        packageType,
        dimensions,
        grossWeight,
        serialNumbers: selectedSerialId ? [selectedSerialId] : [],
        remarks
      });
      alert('Packing list generated successfully!');
      setShowCreateModal(false);
      fetchPacking();
    } catch (err) {
      alert('Failed to generate packing list: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleAction = async (id, action) => {
    try {
      await api.post(`/logistics/packing-lists/${id}/actions/${action}`, {
        remarks: 'Crated, strapped, humidity indicators applied and sealed'
      });
      alert(`Packing list marked as ${action.toUpperCase()}!`);
      fetchPacking();
    } catch (err) {
      alert(`Failed to execute ${action}: ` + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="erp-page-container">
      <div className="erp-page-header">
        <div>
          <h2>Cryogenic Equipment Packing & Crating</h2>
          <p>Multi-barrier shock mount crating, nitrogen blanket seals, and package dimension manifests</p>
        </div>
        <button className="erp-btn-primary" onClick={() => setShowCreateModal(true)}>
          <AddBoxIcon fontSize="inherit" /> Create Packing List
        </button>
      </div>

      {loading && <LoadingSpinner message="Loading Packing Manifests..." />}
      {error && <ErrorMessage message={error} onRetry={fetchPacking} />}

      {!loading && !error && packingLists.length === 0 && (
        <EmptyState
          title="No Packing Lists Created"
          message="Generate packing lists for completed production orders and confirmed sales orders."
        />
      )}

      {!loading && !error && packingLists.length > 0 && (
        <div className="erp-table-card">
          <table className="erp-data-table">
            <thead>
              <tr>
                <th>Packing List #</th>
                <th>Sales Order</th>
                <th>Package Type</th>
                <th>Weight & Dims</th>
                <th>Serials Packed</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {packingLists.map(p => (
                <tr key={p._id}>
                  <td><strong>{p.packingListNumber}</strong></td>
                  <td>{p.salesOrderId?.salesOrderNumber || 'SO-Ref'}</td>
                  <td>{p.packageType || 'Export Sea-worthy Crate'}</td>
                  <td>
                    <div>{p.dimensions || 'Standard'}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Weight: {p.grossWeight || '150 kg'}</div>
                  </td>
                  <td>
                    <span className="badge badge-info">{p.serialNumbers?.length || 1} Unit(s)</span>
                  </td>
                  <td><StatusBadge status={p.status} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {p.status === 'DRAFT' && (
                        <button
                          className="erp-btn-sm erp-btn-success"
                          onClick={() => handleAction(p._id, 'complete')}
                        >
                          <CheckCircleIcon fontSize="inherit" /> Complete & Seal
                        </button>
                      )}
                      {p.status === 'COMPLETED' && (
                        <span className="badge badge-success">Sealed & Ready</span>
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
              <h3>Create Packing List</h3>
              <button className="erp-btn-icon" onClick={() => setShowCreateModal(false)}>
                <CloseIcon />
              </button>
            </div>
            <form onSubmit={handleCreatePacking}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Sales Order *</label>
                <select
                  required
                  value={soId}
                  onChange={(e) => setSoId(e.target.value)}
                  className="erp-form-control"
                >
                  <option value="">-- Select Confirmed Sales Order --</option>
                  {salesOrders.map(so => (
                    <option key={so._id} value={so._id}>
                      {so.salesOrderNumber} - {so.customerId?.name} (₹{so.totalAmount?.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Assign Ready Serial Number</label>
                <select
                  value={selectedSerialId}
                  onChange={(e) => setSelectedSerialId(e.target.value)}
                  className="erp-form-control"
                >
                  <option value="">-- Select Tested Serial (Optional) --</option>
                  {serials.map(s => (
                    <option key={s._id} value={s._id}>
                      {s.serialNumber} ({s.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Crating / Packaging Specification</label>
                <input
                  type="text"
                  required
                  value={packageType}
                  onChange={(e) => setPackageType(e.target.value)}
                  className="erp-form-control"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label>Package Dimensions (L x W x H)</label>
                  <input
                    type="text"
                    value={dimensions}
                    onChange={(e) => setDimensions(e.target.value)}
                    className="erp-form-control"
                  />
                </div>
                <div className="form-group">
                  <label>Gross Weight</label>
                  <input
                    type="text"
                    value={grossWeight}
                    onChange={(e) => setGrossWeight(e.target.value)}
                    className="erp-form-control"
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label>Handling Instructions & Remarks</label>
                <textarea
                  rows="2"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="erp-form-control"
                  placeholder="Do not tilt, fragile cryogenic sensors, keep upright..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" className="erp-btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="erp-btn-primary">
                  Generate Packing List
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
