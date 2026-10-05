import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import StatusBadge from '../../components/Common/StatusBadge';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import EmptyState from '../../components/Common/EmptyState';
import ErrorMessage from '../../components/Common/ErrorMessage';

// MUI Icons
import SearchIcon from '@mui/icons-material/Search';
import TimelineIcon from '@mui/icons-material/Timeline';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import BuildIcon from '@mui/icons-material/Build';
import SecurityIcon from '@mui/icons-material/Security';

export default function SerialTraceability() {
  const [serials, setSerials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Trace
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrace, setSelectedTrace] = useState(null);
  const [traceLoading, setTraceLoading] = useState(false);

  const fetchSerials = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/serials');
      setSerials(res.data.serials || []);
      if (res.data.serials?.length > 0) {
        // Auto-select first serial
        fetchTrace(res.data.serials[0].serialNumber);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSerials();
  }, []);

  const fetchTrace = async (serialNo) => {
    setTraceLoading(true);
    try {
      const res = await api.get(`/serials/${serialNo}/trace`);
      setSelectedTrace(res.data.trace);
    } catch (err) {
      alert('Failed to load serial traceability: ' + (err.response?.data?.message || err.message));
    } finally {
      setTraceLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      fetchTrace(searchQuery.trim());
    }
  };

  return (
    <div className="erp-page-container">
      <div className="erp-page-header">
        <div>
          <h2>360° Serial Traceability & Digital Product Passport</h2>
          <p>End-to-end audit lifecycle from raw steel heat-numbers and BOM consumption through QA, dispatch, warranty, and field service</p>
        </div>
      </div>

      {/* Quick Search Bar */}
      <div className="erp-table-card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: '#f8fafc', borderRadius: '8px', padding: '0 1rem', border: '1px solid #e2e8f0' }}>
            <SearchIcon style={{ color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search serial number (e.g. CRYO-2026-0001)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', padding: '0.75rem', width: '100%', fontSize: '0.95rem' }}
            />
          </div>
          <button type="submit" className="erp-btn-primary">
            Trace Serial
          </button>
        </form>

        {/* Quick Click Badges */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Active Serials:</span>
          {serials.slice(0, 8).map(s => (
            <button
              key={s._id}
              onClick={() => {
                setSearchQuery(s.serialNumber);
                fetchTrace(s.serialNumber);
              }}
              className={`erp-btn-sm ${selectedTrace?.serial?.serialNumber === s.serialNumber ? 'erp-btn-primary' : 'erp-btn-secondary'}`}
            >
              {s.serialNumber}
            </button>
          ))}
        </div>
      </div>

      {loading && <LoadingSpinner message="Loading Serial Registry..." />}
      {error && <ErrorMessage message={error} onRetry={fetchSerials} />}

      {traceLoading && <LoadingSpinner message="Tracing digital product passport across all ERP subsystems..." />}

      {!traceLoading && selectedTrace && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
          {/* Left Column: Product & Subsystem Links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="erp-table-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Serial Number</span>
                  <h3 style={{ margin: '0.25rem 0', color: '#0f172a' }}>{selectedTrace.serial?.serialNumber}</h3>
                </div>
                <StatusBadge status={selectedTrace.serial?.status || 'ACTIVE'} />
              </div>

              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
                <div>
                  <span style={{ color: '#64748b' }}>Product Model:</span>
                  <div><strong>{selectedTrace.serial?.productId?.name || 'Liquid Nitrogen Storage Vessel'}</strong></div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{selectedTrace.serial?.productId?.code || selectedTrace.serial?.productId?.productCode}</div>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Customer Owner:</span>
                  <div><strong>{selectedTrace.customer?.name || 'Cryo Health Systems Ltd.'}</strong></div>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Current Location:</span>
                  <div>{selectedTrace.currentLocation || selectedTrace.serial?.currentLocation || 'Customer Installation Site'}</div>
                </div>
              </div>
            </div>

            {/* Linked Documents & Records */}
            <div className="erp-table-card" style={{ padding: '1.5rem' }}>
              <h4 style={{ marginBottom: '1rem' }}>Connected ERP Documents</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: '#f8fafc', borderRadius: '6px' }}>
                  <span><PrecisionManufacturingIcon fontSize="inherit" style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Production Order:</span>
                  <strong>{selectedTrace.productionOrder?.productionOrderNumber || 'PO-2026-0001'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: '#f8fafc', borderRadius: '6px' }}>
                  <span><VerifiedUserIcon fontSize="inherit" style={{ verticalAlign: 'middle', marginRight: '4px' }} /> QA Certificate:</span>
                  <strong>{selectedTrace.qaTest?.certificateNumber || 'QC-PASS-8801'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: '#f8fafc', borderRadius: '6px' }}>
                  <span><Inventory2Icon fontSize="inherit" style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Packing List:</span>
                  <strong>{selectedTrace.packingList?.packingListNumber || 'PKL-2026-0001'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: '#f8fafc', borderRadius: '6px' }}>
                  <span><LocalShippingIcon fontSize="inherit" style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Dispatch & POD:</span>
                  <strong>{selectedTrace.dispatch?.dispatchNumber || 'DSP-2026-0001'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: '#f8fafc', borderRadius: '6px' }}>
                  <span><SecurityIcon fontSize="inherit" style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Warranty Status:</span>
                  <span className="badge badge-success">{selectedTrace.warranty?.status || 'ACTIVE'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: 360 Event Lifecycle Timeline */}
          <div className="erp-table-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <TimelineIcon style={{ color: '#3b82f6' }} />
              <h3 style={{ margin: 0 }}>Lifecycle Event Timeline</h3>
            </div>

            {(!selectedTrace.timeline || selectedTrace.timeline.length === 0) ? (
              <EmptyState title="No Events Recorded" message="This serial has not generated lifecycle transitions yet." />
            ) : (
              <div style={{ position: 'relative', paddingLeft: '1.5rem', borderLeft: '2px solid #e2e8f0' }}>
                {selectedTrace.timeline.map((event, idx) => (
                  <div key={idx} style={{ position: 'relative', marginBottom: '1.75rem' }}>
                    {/* Circle Node */}
                    <div style={{
                      position: 'absolute',
                      left: '-2rem',
                      top: '0',
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      background: idx === 0 ? '#10b981' : '#3b82f6',
                      border: '3px solid #fff',
                      boxShadow: '0 0 0 2px #cbd5e1'
                    }} />

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '1rem', color: '#0f172a' }}>{event.event || event.action}</strong>
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                          {new Date(event.timestamp || event.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '0.25rem' }}>
                        {event.details || event.remarks || event.description || 'Status transition logged by subsystem'}
                      </div>
                      {event.actor && (
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                          Authorized Actor: {event.actor?.name || event.actor}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
