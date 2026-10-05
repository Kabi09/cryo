import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import ErrorMessage from '../../components/Common/ErrorMessage';

// MUI Icons
import Inventory2Icon from '@mui/icons-material/Inventory2';
import BusinessIcon from '@mui/icons-material/Business';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import GavelIcon from '@mui/icons-material/Gavel';

export default function MastersView() {
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [workCenters, setWorkCenters] = useState([]);
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMasters = async () => {
    setLoading(true);
    setError(null);
    try {
      const [pRes, vRes, wRes, wcRes, tRes] = await Promise.all([
        api.get('/masters/products'),
        api.get('/masters/vendors'),
        api.get('/masters/warehouses'),
        api.get('/masters/workcenters'),
        api.get('/masters/terms')
      ]);
      setProducts(pRes.data.products || []);
      setVendors(vRes.data.vendors || []);
      setWarehouses(wRes.data.warehouses || []);
      setWorkCenters(wcRes.data.workCenters || []);
      setTerms(tRes.data.terms || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMasters();
  }, []);

  return (
    <div className="erp-page-container">
      <div className="erp-page-header">
        <div>
          <h2>Master Data Governance</h2>
          <p>Authoritative enterprise masters for cryogenic equipment, approved vendor base, facilities, and commercial terms</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
        <button
          className={`erp-btn-sm ${activeTab === 'products' ? 'erp-btn-primary' : 'erp-btn-secondary'}`}
          onClick={() => setActiveTab('products')}
        >
          <Inventory2Icon fontSize="inherit" /> Products Catalog ({products.length})
        </button>
        <button
          className={`erp-btn-sm ${activeTab === 'vendors' ? 'erp-btn-primary' : 'erp-btn-secondary'}`}
          onClick={() => setActiveTab('vendors')}
        >
          <BusinessIcon fontSize="inherit" /> Vendors & Suppliers ({vendors.length})
        </button>
        <button
          className={`erp-btn-sm ${activeTab === 'warehouses' ? 'erp-btn-primary' : 'erp-btn-secondary'}`}
          onClick={() => setActiveTab('warehouses')}
        >
          <WarehouseIcon fontSize="inherit" /> Warehouses ({warehouses.length})
        </button>
        <button
          className={`erp-btn-sm ${activeTab === 'workcenters' ? 'erp-btn-primary' : 'erp-btn-secondary'}`}
          onClick={() => setActiveTab('workcenters')}
        >
          <PrecisionManufacturingIcon fontSize="inherit" /> Work Centers ({workCenters.length})
        </button>
        <button
          className={`erp-btn-sm ${activeTab === 'terms' ? 'erp-btn-primary' : 'erp-btn-secondary'}`}
          onClick={() => setActiveTab('terms')}
        >
          <GavelIcon fontSize="inherit" /> Commercial Terms ({terms.length})
        </button>
      </div>

      {loading && <LoadingSpinner message="Loading Master Data..." />}
      {error && <ErrorMessage message={error} onRetry={fetchMasters} />}

      {!loading && !error && (
        <div className="erp-table-card">
          {activeTab === 'products' && (
            <table className="erp-data-table">
              <thead>
                <tr>
                  <th>Product Code</th>
                  <th>Equipment Name</th>
                  <th>Category</th>
                  <th>Base Price</th>
                  <th>HSN Code</th>
                  <th>Warranty (Months)</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p._id}>
                    <td><strong>{p.productCode || p.code}</strong></td>
                    <td>{p.name}</td>
                    <td>{p.category || 'Cryogenic Vessel'}</td>
                    <td>₹{(p.basePrice || p.standardCost || 0).toLocaleString()}</td>
                    <td>{p.hsnCode || '84186990'}</td>
                    <td>{p.defaultWarrantyMonths || 12} Months</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'vendors' && (
            <table className="erp-data-table">
              <thead>
                <tr>
                  <th>Vendor Code</th>
                  <th>Company Name</th>
                  <th>Category</th>
                  <th>Contact Email</th>
                  <th>GSTIN</th>
                  <th>Rating</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map(v => (
                  <tr key={v._id}>
                    <td><strong>{v.vendorCode}</strong></td>
                    <td>{v.name}</td>
                    <td>{v.category || 'Raw Material / Spares'}</td>
                    <td>{v.email}</td>
                    <td>{v.gstNumber || 'Unregistered'}</td>
                    <td>⭐ {v.rating || 4.5}/5</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'warehouses' && (
            <table className="erp-data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Warehouse Name</th>
                  <th>Type</th>
                  <th>Location</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {warehouses.map(w => (
                  <tr key={w._id}>
                    <td><strong>{w.code}</strong></td>
                    <td>{w.name}</td>
                    <td>{w.type || 'Storage'}</td>
                    <td>{w.location || 'Plant Bay'}</td>
                    <td><span className="badge badge-success">Active</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'workcenters' && (
            <table className="erp-data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Work Center Name</th>
                  <th>Operation Type</th>
                  <th>Hourly Cost</th>
                  <th>Capacity</th>
                </tr>
              </thead>
              <tbody>
                {workCenters.map(wc => (
                  <tr key={wc._id}>
                    <td><strong>{wc.code}</strong></td>
                    <td>{wc.name}</td>
                    <td>{wc.operationType || 'Manufacturing'}</td>
                    <td>₹{(wc.costPerHour || 1500).toLocaleString()}/hr</td>
                    <td>{wc.capacityHoursPerDay || 16} hrs/day</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'terms' && (
            <table className="erp-data-table">
              <thead>
                <tr>
                  <th>Term Code</th>
                  <th>Term Type</th>
                  <th>Title / Name</th>
                  <th>Standard Description</th>
                </tr>
              </thead>
              <tbody>
                {terms.map(t => (
                  <tr key={t._id}>
                    <td><strong>{t.code}</strong></td>
                    <td><span className="badge badge-info">{t.type}</span></td>
                    <td>{t.title || t.name}</td>
                    <td>{t.description || t.content}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
