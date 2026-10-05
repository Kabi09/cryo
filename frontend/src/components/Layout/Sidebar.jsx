import React from 'react';
import { NavLink } from 'react-router-dom';

// MUI Icons
import DashboardIcon from '@mui/icons-material/Dashboard';
import ContactMailIcon from '@mui/icons-material/ContactMail';
import BusinessIcon from '@mui/icons-material/Business';
import DescriptionIcon from '@mui/icons-material/Description';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PaymentIcon from '@mui/icons-material/Payment';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ConstructionIcon from '@mui/icons-material/Construction';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import HistoryIcon from '@mui/icons-material/History';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import VerifiedIcon from '@mui/icons-material/Verified';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import BuildIcon from '@mui/icons-material/Build';
import ShieldIcon from '@mui/icons-material/Shield';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import SecurityIcon from '@mui/icons-material/Security';

const NAV_GROUPS = [
  {
    title: 'Core Operations',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: DashboardIcon }
    ]
  },
  {
    title: 'Sales & Commercials',
    items: [
      { label: 'Enquiries / Leads', path: '/sales/leads', icon: ContactMailIcon },
      { label: 'Customers', path: '/sales/customers', icon: BusinessIcon },
      { label: 'Quotations & Revisions', path: '/sales/quotations', icon: DescriptionIcon },
      { label: 'Customer PO & 4-Way', path: '/sales/customer-pos', icon: FactCheckIcon },
      { label: 'Sales Orders', path: '/sales/orders', icon: ShoppingCartIcon },
      { label: 'Payment Receipts', path: '/sales/payments', icon: PaymentIcon }
    ]
  },
  {
    title: 'Manufacturing & Staging',
    items: [
      { label: 'Production Orders', path: '/production/orders', icon: PrecisionManufacturingIcon },
      { label: 'Bill of Materials (BOM)', path: '/production/boms', icon: AccountTreeIcon },
      { label: 'Material Requests', path: '/production/material-requests', icon: AssignmentIcon },
      { label: 'Floor Operations', path: '/production/operations', icon: ConstructionIcon }
    ]
  },
  {
    title: 'Inventory & Procurement',
    items: [
      { label: 'Stock Catalog', path: '/inventory/stock', icon: Inventory2Icon },
      { label: 'Inventory Ledger', path: '/inventory/ledger', icon: HistoryIcon },
      { label: 'Procurement RFQs', path: '/inventory/rfqs', icon: DescriptionIcon },
      { label: 'Vendor POs', path: '/inventory/vendor-pos', icon: LocalShippingIcon },
      { label: 'GRN Inspection', path: '/inventory/grns', icon: ReceiptLongIcon }
    ]
  },
  {
    title: 'Quality & Traceability',
    items: [
      { label: 'QA Testing & Certs', path: '/quality/tests', icon: VerifiedIcon },
      { label: '360° Serial Traceability', path: '/quality/serials', icon: QrCode2Icon }
    ]
  },
  {
    title: 'Logistics & Invoicing',
    items: [
      { label: 'Packing Lists', path: '/logistics/packing', icon: Inventory2Icon },
      { label: 'Tax Invoices', path: '/logistics/invoices', icon: ReceiptLongIcon },
      { label: 'Dispatch Advice', path: '/logistics/dispatches', icon: LocalShippingIcon },
      { label: 'Deliveries & POD', path: '/logistics/deliveries', icon: VerifiedIcon }
    ]
  },
  {
    title: 'Field Service & Warranty',
    items: [
      { label: 'Installations', path: '/service/installations', icon: ConstructionIcon },
      { label: 'Commissioning Tests', path: '/service/commissionings', icon: VerifiedIcon },
      { label: 'Warranties', path: '/service/warranties', icon: ShieldIcon },
      { label: 'Service Tickets', path: '/service/tickets', icon: SupportAgentIcon },
      { label: 'RMA & Factory Return', path: '/service/rmas', icon: AssignmentReturnIcon }
    ]
  },
  {
    title: 'Governance & Masters',
    items: [
      { label: 'Master Catalogs', path: '/masters', icon: BusinessIcon },
      { label: 'Audit Trail', path: '/system/audit', icon: SecurityIcon }
    ]
  }
];

export default function Sidebar() {
  return (
    <aside style={{
      width: '260px',
      minWidth: '260px',
      backgroundColor: '#111827',
      borderRight: '1px solid #223249',
      height: 'calc(100vh - 64px)',
      position: 'sticky',
      top: '64px',
      overflowY: 'auto',
      padding: '16px 12px',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    }}>
      {NAV_GROUPS.map((group, gIdx) => (
        <div key={gIdx}>
          <div style={{
            fontSize: '0.675rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            color: '#6b7280',
            letterSpacing: '0.08em',
            padding: '4px 12px 8px 12px'
          }}>
            {group.title}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {group.items.map((item, iIdx) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={iIdx}
                  to={item.path}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '0.825rem',
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? '#38bdf8' : '#cbd5e1',
                    backgroundColor: isActive ? 'rgba(2, 132, 199, 0.15)' : 'transparent',
                    borderLeft: isActive ? '3px solid #38bdf8' : '3px solid transparent',
                    transition: 'all 0.15s ease'
                  })}
                >
                  <Icon style={{ fontSize: '18px', opacity: 0.85 }} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>
      ))}
    </aside>
  );
}
