import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import EmptyState from '../../components/Common/EmptyState';
import ErrorMessage from '../../components/Common/ErrorMessage';

// MUI Icons
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import TuneIcon from '@mui/icons-material/Tune';

export default function StockOverview() {
  const [stock, setStock] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Adjustment Modal
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustItem, setAdjustItem] = useState(null);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  const fetchStock = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sRes, wRes] = await Promise.all([
        api.get('/inventory/stock'),
        api.get('/masters/warehouses')
      ]);
      setStock(sRes.data.items || []);
      setWarehouses(wRes.data.warehouses || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, []);

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!adjustItem) return;
    try {
      await api.post('/inventory/adjust', {
        itemId: adjustItem._id,
        warehouseId: adjustItem.primaryWarehouseId?._id || adjustItem.primaryWarehouseId,
        adjustmentQuantity: Number(adjustQty),
        reason: adjustReason
      });
      alert('Stock adjustment posted to ledger successfully!');
      setShowAdjustModal(false);
      setAdjustQty('');
      setAdjustReason('');
      fetchStock();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f3f4f6' }}>
            Perpetual Inventory & Stock Catalog
          </h1>
          <p style={{ fontSize: '0.825rem', color: '#9ca3af' }}>
            Real-time stock ledger balances: available, reserved for production, and shop floor issues
          </p>
        </div>
      </div>

      {error && <ErrorMessage message={error} onRetry={fetchStock} />}

      {loading ? (
        <LoadingSpinner message="Checking stock balances across bays..." />
      ) : stock.length === 0 ? (
        <EmptyState title="No stock items found" description="Master materials and components will appear here." />
      ) : (
        <div className="erp-table-container">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Component SKU</th>
                <th>Material Description</th>
                <th>Category</th>
                <th>Warehouse Bay</th>
                <th>Available</th>
                <th>Reserved</th>
                <th>Floor Issued</th>
                <th>Reorder Level</th>
                <th>Unit Cost</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {stock.map((item) => {
                const isLow = item.availableQuantity <= item.reorderLevel;
                return (
                  <tr key={item._id}>
                    <td style={{ fontWeight: 700, color: '#38bdf8' }}>{item.sku}</td>
                    <td style={{ fontWeight: 600 }}>{item.name}</td>
                    <td><span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{item.category?.replace(/_/g, ' ')}</span></td>
                    <td>{item.primaryWarehouseId?.name || 'Raw Materials Bay'}</td>
                    <td>
                      <span style={{
                        fontWeight: 700,
                        color: isLow ? '#ef4444' : '#10b981',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        {isLow && <WarningAmberIcon style={{ fontSize: '16px' }} />}
                        {item.availableQuantity} {item.uom}
                      </span>
                    </td>
                    <td>{item.reservedQuantity} {item.uom}</td>
                    <td>{item.issuedQuantity} {item.uom}</td>
                    <td>{item.reorderLevel} {item.uom}</td>
                    <td>₹{item.unitCost?.toLocaleString('en-IN')}</td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setAdjustItem(item);
                          setShowAdjustModal(true);
                        }}
                      >
                        <TuneIcon style={{ fontSize: '15px' }} />
                        Adjust Stock
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {showAdjustModal && adjustItem && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Post Stock Adjustment: {adjustItem.name}</h3>
              <button className="close-btn" onClick={() => setShowAdjustModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAdjustSubmit}>
              <div className="modal-body">
                <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginBottom: '16px' }}>
                  Current Available Stock: <strong style={{ color: '#38bdf8' }}>{adjustItem.availableQuantity} {adjustItem.uom}</strong>
                </p>

                <div className="form-group">
                  <label>Adjustment Quantity (+ to add surplus, - to write off damage) *</label>
                  <input
                    type="number"
                    required
                    value={adjustQty}
                    onChange={(e) => setAdjustQty(e.target.value)}
                    placeholder="e.g. 5 or -2"
                  />
                </div>

                <div className="form-group">
                  <label>Audit Justification / Variance Reason *</label>
                  <textarea
                    required
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    placeholder="Physical stock audit discrepancy, shrinkage, or damaged during handling..."
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAdjustModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Post to Double-Entry Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
