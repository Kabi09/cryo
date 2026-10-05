import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  leads: [],
  customers: [],
  quotations: [],
  currentQuotation: null,
  revisions: [],
  customerPOs: [],
  currentPO: null,
  poVerification: null,
  salesOrders: [],
  currentOrder: null,
  payments: [],
  loading: false,
  error: null
};

const salesSlice = createSlice({
  name: 'sales',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    setLeads: (state, action) => {
      state.leads = action.payload;
      state.loading = false;
    },
    addLead: (state, action) => {
      state.leads.unshift(action.payload);
    },
    setCustomers: (state, action) => {
      state.customers = action.payload;
      state.loading = false;
    },
    setQuotations: (state, action) => {
      state.quotations = action.payload;
      state.loading = false;
    },
    setCurrentQuotation: (state, action) => {
      state.currentQuotation = action.payload.quotation;
      state.revisions = action.payload.revisions || [];
      state.loading = false;
    },
    setCustomerPOs: (state, action) => {
      state.customerPOs = action.payload;
      state.loading = false;
    },
    setCurrentPO: (state, action) => {
      state.currentPO = action.payload.po;
      state.poVerification = action.payload.verification || null;
      state.loading = false;
    },
    setSalesOrders: (state, action) => {
      state.salesOrders = action.payload;
      state.loading = false;
    },
    setCurrentOrder: (state, action) => {
      state.currentOrder = action.payload;
      state.loading = false;
    },
    setPayments: (state, action) => {
      state.payments = action.payload;
      state.loading = false;
    }
  }
});

export const {
  setLoading,
  setError,
  setLeads,
  addLead,
  setCustomers,
  setQuotations,
  setCurrentQuotation,
  setCustomerPOs,
  setCurrentPO,
  setSalesOrders,
  setCurrentOrder,
  setPayments
} = salesSlice.actions;

export default salesSlice.reducer;
