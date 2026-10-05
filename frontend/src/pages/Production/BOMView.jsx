import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import EmptyState from '../../components/Common/EmptyState';
import ErrorMessage from '../../components/Common/ErrorMessage';

export default function BOMView() {
  const [boms, setBoms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchBOMs() {
      try {
        const res = await api.get('/production/boms');
        setBoms(res.data.boms || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchBOMs();
  }, []);

  if (loading) return <LoadingSpinner message="Loading engineering BOM specs..." />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f3f4f6' }}>
          Bill of Materials (BOM) Engineering Directory
        </h1>
        <p style={{ fontSize: '0.825rem', color: '#9ca3af' }}>
          Standardized product component trees, scrap allowances, and standard unit costing
        </p>
      </div>

      {boms.length === 0 ? (
        <EmptyState title="No active BOMs found" description="Create an engineering BOM to enable automatic production explosion." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {boms.map((bom) => (
            <div
              key={bom._id}
              style={{
                backgroundColor: '#162032',
                border: '1px solid #223249',
                borderRadius: '12px',
                padding: '24px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f3f4f6' }}>
                      {bom.bomNumber}
                    </h3>
                    <span style={{
                      backgroundColor: 'rgba(2, 132, 199, 0.2)',
                      color: '#38bdf8',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 700
                    }}>
                      v{bom.version}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginTop: '2px' }}>
                    Target Product: <strong style={{ color: '#38bdf8' }}>{bom.productId?.name}</strong> ({bom.productId?.sku})
                  </p>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Standard Material Cost</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981' }}>
                    ₹{bom.totalEstimatedCost?.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="erp-table-container">
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th>Component SKU</th>
                      <th>Material / Component Name</th>
                      <th>Qty per Unit</th>
                      <th>UOM</th>
                      <th>Estimated Unit Rate</th>
                      <th>Extended Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bom.items?.map((item, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600, color: '#38bdf8' }}>{item.sku}</td>
                        <td style={{ fontWeight: 600 }}>{item.name}</td>
                        <td>{item.quantityPerUnit}</td>
                        <td>{item.uom}</td>
                        <td>₹{item.estimatedUnitCost?.toLocaleString('en-IN')}</td>
                        <td style={{ fontWeight: 700, color: '#f3f4f6' }}>₹{item.totalEstimatedCost?.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
