import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import MainLayout from '../layouts/MainLayout';

// Auth Pages
import Login from '../pages/Auth/Login';

// Dashboard
import Dashboard from '../pages/Dashboard/Dashboard';

// Sales Pages
import Leads from '../pages/Sales/Leads';
import Customers from '../pages/Sales/Customers';
import Quotations from '../pages/Sales/Quotations';
import QuotationDetail from '../pages/Sales/QuotationDetail';
import CustomerPO from '../pages/Sales/CustomerPO';
import SalesOrders from '../pages/Sales/SalesOrders';
import Payments from '../pages/Sales/Payments';

// Production Pages
import ProductionOrders from '../pages/Production/ProductionOrders';
import BOMView from '../pages/Production/BOMView';
import MaterialRequests from '../pages/Production/MaterialRequests';
import FloorOperations from '../pages/Production/FloorOperations';

// Inventory & Procurement Pages
import StockOverview from '../pages/Inventory/StockOverview';
import LedgerMovements from '../pages/Inventory/LedgerMovements';
import ProcurementRFQs from '../pages/Inventory/ProcurementRFQs';
import VendorPOs from '../pages/Inventory/VendorPOs';
import GRNView from '../pages/Inventory/GRNView';

// Quality & Traceability Pages
import QATesting from '../pages/Quality/QATesting';
import SerialTraceability from '../pages/Quality/SerialTraceability';

// Logistics & Finance Pages
import PackingView from '../pages/Logistics/PackingView';
import Invoices from '../pages/Logistics/Invoices';
import Dispatches from '../pages/Logistics/Dispatches';
import Deliveries from '../pages/Logistics/Deliveries';

// Field Service & Warranty Pages
import Installations from '../pages/Service/Installations';
import CommissioningView from '../pages/Service/CommissioningView';
import Warranties from '../pages/Service/Warranties';
import ServiceTickets from '../pages/Service/ServiceTickets';
import RMAView from '../pages/Service/RMAView';

// Masters & Governance Pages
import MastersView from '../pages/Masters/MastersView';
import AuditLogsView from '../pages/System/AuditLogsView';

// Protected Route Component
function ProtectedRoute({ children }) {
  const { isAuthenticated, token } = useSelector((state) => state.auth);
  const storedToken = localStorage.getItem('cryo_erp_token');

  if (!isAuthenticated && !storedToken && !token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={<Login />} />

      {/* Protected Routes in MainLayout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />

        {/* Sales */}
        <Route path="sales/leads" element={<Leads />} />
        <Route path="sales/customers" element={<Customers />} />
        <Route path="sales/quotations" element={<Quotations />} />
        <Route path="sales/quotations/:id" element={<QuotationDetail />} />
        <Route path="sales/customer-pos" element={<CustomerPO />} />
        <Route path="sales/orders" element={<SalesOrders />} />
        <Route path="sales/payments" element={<Payments />} />

        {/* Production */}
        <Route path="production/orders" element={<ProductionOrders />} />
        <Route path="production/boms" element={<BOMView />} />
        <Route path="production/material-requests" element={<MaterialRequests />} />
        <Route path="production/operations" element={<FloorOperations />} />

        {/* Inventory & Procurement */}
        <Route path="inventory/stock" element={<StockOverview />} />
        <Route path="inventory/ledger" element={<LedgerMovements />} />
        <Route path="inventory/rfqs" element={<ProcurementRFQs />} />
        <Route path="inventory/vendor-pos" element={<VendorPOs />} />
        <Route path="inventory/grns" element={<GRNView />} />

        {/* Quality & Traceability */}
        <Route path="quality/tests" element={<QATesting />} />
        <Route path="quality/serials" element={<SerialTraceability />} />

        {/* Logistics & Invoicing */}
        <Route path="logistics/packing" element={<PackingView />} />
        <Route path="logistics/invoices" element={<Invoices />} />
        <Route path="logistics/dispatches" element={<Dispatches />} />
        <Route path="logistics/deliveries" element={<Deliveries />} />

        {/* Field Service & Warranty */}
        <Route path="service/installations" element={<Installations />} />
        <Route path="service/commissionings" element={<CommissioningView />} />
        <Route path="service/warranties" element={<Warranties />} />
        <Route path="service/tickets" element={<ServiceTickets />} />
        <Route path="service/rmas" element={<RMAView />} />

        {/* Masters & System */}
        <Route path="masters" element={<MastersView />} />
        <Route path="system/audit" element={<AuditLogsView />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
