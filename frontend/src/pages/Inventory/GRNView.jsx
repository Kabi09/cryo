import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import StatusBadge from '../../components/Common/StatusBadge';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import EmptyState from '../../components/Common/EmptyState';
import ErrorMessage from '../../components/Common/ErrorMessage';

// MUI Icons
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AddBoxIcon from '@mui/icons-material/AddBox';
import CancelIcon from '@mui/icons-material/Cancel';
import CloseIcon from '@mui/icons-material/Close';

export default function GRNView() {
  const [grns, setGrns] = useState([]);
  const [vendorPos, setVendorPos] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New GRN modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [poId, setPoId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [challanNo, setChallanNo] = useState('');
  const [receivedQty, setReceivedQty] = useState('');
  const [acceptedQty, setAcceptedQty] = useState('');
  const [rejectedQty, setRejectedQty] = useState('0');
  const [rejectionReason, setRejectionReason] = useState('');
  const [remarks, setRemarks] = useState('');

  const fetchGRNs = async () => {
    setLoading(true);
    setError(null);
    try {
      const [gRes, poRes, wRes] = await Promise.all([
        api.get('/procurement/grns'),
        api.get('/procurement/vendor-pos'),
        api.get('/masters/warehouses')
      ]);
      setGrns(gRes.data.grns || []);
      setVendorPos(poRes.data.pos || []);
      setWarehouses(wRes.data.warehouses || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGRNs();
  }, []);

  const handleCreateGRN = async (e) => {
    e.preventDefault();
    const selectedPo = vendorPos.find(p => p._id === poId);
    if (!selectedPo) return;

    try {
      await api.post('/procurement/grns', {
        vendorPoId: poId,
        warehouseId: warehouseId || warehouses[0]?._id,
        deliveryChallanNumber: challanNo,
        lineItems: [{
          itemCode: selectedPo.lineItems?.[0]?.itemCode || 'RAW-STEEL',
          description: selectedPo.lineItems?.[0]?.description || 'Procured Items',
          receivedQuantity: Number(receivedQty),
          acceptedQuantity: Number(acceptedQty),
          rejectedQuantity: Number(rejectedQty),
          rejectionReason: rejectedQty > 0 ? rejectionReason : undefined
        }],
        remarks
      });
      alert('GRN draft created successfully!');
      setShowCreateModal(false);
      fetchGRNs();
    } catch (err) {
      alert('Failed to create GRN: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleAction = async (grnId, action) => {
    try {
      await api.post(`/procurement/grns/${grnId}/actions/${action}`, {
        remarks: `Action ${action} confirmed by Store Keeper`
      });
      alert(`GRN ${action} successfully posted! Inventory ledger updated.`);
      fetchGRNs();
    } catch (err) {
      alert(`Failed to execute ${action}: ` + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="erp-page-container">
      <div className="erp-page-header">
        <div>
          <h2>Goods Receipt Notes (GRN)</h2>
          <p>Store dock receiving, physical count verification, quality acceptance, and inventory ledger intake</p>
        </div>
        <button className="erp-btn-primary" onClick={() => setShowCreateModal(true)}>
          <AddBoxIcon fontSize="inherit" /> Create New GRN
        </button>
      </div>

      {loading && <LoadingSpinner message="Loading Goods Receipt Notes..." />}
      {error && <ErrorMessage message={error} onRetry={fetchGRNs} />}

      {!loading && !error && grns.length === 0 && (
        <EmptyState
          title="No GRNs Recorded"
          message="Receive supplier shipments against approved Vendor POs to create GRNs."
        />
      )}

      {!loading && !error && grns.length > 0 && (
        <div className="erp-table-card">
          <table className="erp-data-table">
            <thead>
              <tr>
                <th>GRN Number</th>
                <th>Vendor PO</th>
                <th>Supplier</th>
                <th>Delivery Challan</th>
                <th>Received / Accepted</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {grns.map(grn => {
                const totalRec = grn.lineItems?.reduce((acc, i) => acc + (i.receivedQuantity || 0), 0) || 0;
                const totalAcc = grn.lineItems?.reduce((acc, i) => acc + (i.acceptedQuantity || 0), 0) || 0;
                const totalRej = grn.lineItems?.reduce((acc, i) => acc + (i.rejectedQuantity || 0), 0) || 0;

                return (
                  <tr key={grn._id}>
                    <td><strong>{grn.grnNumber}</strong></td>
                    <td>{grn.vendorPoId?.poNumber || 'VPO-Ref'}</td>
                    <td>{grn.vendorPoId?.vendorId?.name || 'Supplier'}</td>
                    <td>{grn.deliveryChallanNumber || 'N/A'}</td>
                    <td>
                      <div>Rec: <strong>{totalRec}</strong> | Acc: <span style={{ color: '#10b981', fontWeight: 600 }}>{totalAcc}</span></div>
                      {totalRej > 0 && <div style={{ fontSize: '0.8rem', color: '#ef4444' }}>Rej: {totalRej}</div>}
                    </td>
                    <td><StatusBadge status={grn.status} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {grn.status === 'DRAFT' && (
                          <button
                            className="erp-btn-sm erp-btn-primary"
                            onClick={() => handleAction(grn._id, 'inspect')}
                          >
                            Inspect Goods
                          </button>
                        )}
                        {grn.status === 'INSPECTED' && (
                          <button
                            className="erp-btn-sm erp-btn-success"
                            onClick={() => handleAction(grn._id, 'accept')}
                          >
                            <CheckCircleIcon fontSize="inherit" /> Accept to Stock
                          </button>
                        )}
                        {grn.status === 'ACCEPTED' && (
                          <span className="badge badge-success">Stock Added</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create GRN Modal */}
      {showCreateModal && (
        <div className="erp-modal-overlay">
          <div className="erp-modal-content">
            <div className="erp-modal-header">
              <h3>Create Goods Receipt Note (Inward Inbound)</h3>
              <button className="erp-btn-icon" onClick={() => setShowCreateModal(false)}>
                <CloseIcon />
              </button>
            </div>
            <form onSubmit={handleCreateGRN}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Select Vendor Purchase Order *</label>
                <select
                  required
                  value={poId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setPoId(id);
                    const po = vendorPos.find(p => p._id === id);
                    if (po && po.lineItems?.[0]) {
                      setReceivedQty(po.lineItems[0].quantity);
                      setAcceptedQty(po.lineItems[0].quantity);
                    }
                  }}
                  className="erp-form-control"
                >
                  <option value="">-- Choose Approved Vendor PO --</option>
                  {vendorPos.filter(p => p.status === 'SENT' || p.status === 'APPROVED').map(p => (
                    <option key={p._id} value={p._id}>
                      {p.poNumber} - {p.vendorId?.name} (₹{p.totalAmount?.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label>Receiving Warehouse</label>
                  <select
                    value={warehouseId}
                    onChange={(e) => setWarehouseId(e.target.value)}
                    className="erp-form-control"
                  >
                    {warehouses.map(w => (
                      <option key={w._id} value={w._id}>{w.name} ({w.code})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Vendor Challan / Invoice No. *</label>
                  <input
                    type="text"
                    required
                    value={challanNo}
                    onChange={(e) => setChallanNo(e.target.value)}
                    className="erp-form-control"
                    placeholder="e.g. INV-2026-9901"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label>Received Qty *</label>
                  <input
                    type="number"
                    required
                    value={receivedQty}
                    onChange={(e) => setReceivedQty(e.target.value)}
                    className="erp-form-control"
                  />
                </div>
                <div className="form-group">
                  <label>Accepted Qty *</label>
                  <input
                    type="number"
                    required
                    value={acceptedQty}
                    onChange={(e) => setAcceptedQty(e.target.value)}
                    className="erp-form-control"
                  />
                </div>
                <div className="form-group">
                  <label>Rejected Qty</label>
                  <input
                    type="number"
                    value={rejectedQty}
                    onChange={(e) => setRejectedQty(e.target.value)}
                    className="erp-form-control"
                  />
                </div>
              </div>

              {Number(rejectedQty) > 0 && (
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label>Rejection Reason</label>
                  <input
                    type="text"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="erp-form-control"
                    placeholder="e.g. Flange surface scratches, dimension out of tolerance"
                  />
                </div>
              )}

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label>Dock Remarks / Gate Entry Ref</label>
                <textarea
                  rows="2"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="erp-form-control"
                  placeholder="Carrier name, vehicle number, seal intact..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" className="erp-btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="erp-btn-primary">
                  Create GRN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
