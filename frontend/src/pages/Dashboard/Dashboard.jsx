import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

// MUI Icons
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import VerifiedIcon from '@mui/icons-material/Verified';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import DescriptionIcon from '@mui/icons-material/Description';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await api.get('/system/dashboard/stats');
        setStats(res.data.stats);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) return <LoadingSpinner message="Loading Executive Dashboard..." />;

  const KPI_CARDS = [
    {
      title: 'Gross Revenue (Verified)',
      value: `₹${(stats?.totalRevenue || 0).toLocaleString('en-IN')}`,
      sub: 'Cumulative verified bank credits',
      icon: CurrencyRupeeIcon,
      color: '#10b981',
      path: '/sales/payments'
    },
    {
      title: 'Active Production Orders',
      value: stats?.activeProduction || 0,
      sub: 'Manufacturing runs on floor',
      icon: PrecisionManufacturingIcon,
      color: '#0284c7',
      path: '/production/orders'
    },
    {
      title: 'Open Quotations',
      value: stats?.openQuotations || 0,
      sub: 'Under review / negotiation',
      icon: DescriptionIcon,
      color: '#38bdf8',
      path: '/sales/quotations'
    },
    {
      title: 'Confirmed Sales Orders',
      value: stats?.confirmedOrders || 0,
      sub: 'Customer PO verified',
      icon: ShoppingCartIcon,
      color: '#6366f1',
      path: '/sales/orders'
    },
    {
      title: 'QA Inspection Passed',
      value: stats?.passedQA || 0,
      sub: 'Certified cryogenic units',
      icon: VerifiedIcon,
      color: '#06b6d4',
      path: '/quality/tests'
    },
    {
      title: 'Low Stock Shortages',
      value: stats?.lowStockItems || 0,
      sub: 'Items below reorder point',
      icon: WarningAmberIcon,
      color: '#f59e0b',
      path: '/inventory/stock'
    },
    {
      title: 'Open Field Tickets',
      value: stats?.openTickets || 0,
      sub: 'Site service & maintenance',
      icon: SupportAgentIcon,
      color: '#ec4899',
      path: '/service/tickets'
    },
    {
      title: 'Enquiry Leads Funnel',
      value: stats?.totalLeads || 0,
      sub: 'Captured client enquiries',
      icon: TrendingUpIcon,
      color: '#8b5cf6',
      path: '/sales/leads'
    }
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f3f4f6', letterSpacing: '-0.02em' }}>
            Operations Command Center
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#9ca3af', marginTop: '2px' }}>
            Real-time manufacturing, commercial and field service analytics for <strong style={{ color: '#38bdf8' }}>{user?.role}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/sales/leads')}>
            + New Enquiry
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/sales/quotations')}>
            + Create Quotation
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        {KPI_CARDS.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              onClick={() => navigate(kpi.path)}
              style={{
                backgroundColor: '#162032',
                border: '1px solid #223249',
                borderRadius: '12px',
                padding: '20px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = kpi.color;
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#223249';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#9ca3af' }}>
                  {kpi.title}
                </span>
                <div style={{
                  padding: '8px',
                  borderRadius: '8px',
                  backgroundColor: `rgba(${parseInt(kpi.color.slice(1,3), 16)}, ${parseInt(kpi.color.slice(3,5), 16)}, ${parseInt(kpi.color.slice(5,7), 16)}, 0.15)`,
                  color: kpi.color
                }}>
                  <Icon style={{ fontSize: '20px' }} />
                </div>
              </div>

              <div style={{ marginTop: '14px' }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f3f4f6', letterSpacing: '-0.02em' }}>
                  {kpi.value}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px' }}>
                  {kpi.sub}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Launchpad */}
      <div style={{
        backgroundColor: '#162032',
        border: '1px solid #223249',
        borderRadius: '12px',
        padding: '24px'
      }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f3f4f6', marginBottom: '16px' }}>
          Workflow Action Launchpad
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px'
        }}>
          <button className="btn btn-secondary" onClick={() => navigate('/sales/customer-pos')} style={{ justifyContent: 'flex-start' }}>
            <span style={{ color: '#38bdf8' }}>01.</span> Run 4-Way PO Verification
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/production/orders')} style={{ justifyContent: 'flex-start' }}>
            <span style={{ color: '#38bdf8' }}>02.</span> Release Production Orders
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/quality/tests')} style={{ justifyContent: 'flex-start' }}>
            <span style={{ color: '#38bdf8' }}>03.</span> Cryo QA Testing Bay
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/quality/serials')} style={{ justifyContent: 'flex-start' }}>
            <span style={{ color: '#38bdf8' }}>04.</span> 360° Serial Traceability
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/logistics/deliveries')} style={{ justifyContent: 'flex-start' }}>
            <span style={{ color: '#38bdf8' }}>05.</span> Delivery & POD Upload
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/service/tickets')} style={{ justifyContent: 'flex-start' }}>
            <span style={{ color: '#38bdf8' }}>06.</span> Field Service Diagnosis
          </button>
        </div>
      </div>
    </div>
  );
}
