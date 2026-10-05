import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  stock: [],
  ledger: [],
  rfqs: [],
  vendorPOs: [],
  grns: [],
  loading: false,
  error: null
};

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    setStock: (state, action) => {
      state.stock = action.payload;
      state.loading = false;
    },
    setLedger: (state, action) => {
      state.ledger = action.payload;
      state.loading = false;
    },
    setRFQs: (state, action) => {
      state.rfqs = action.payload;
      state.loading = false;
    },
    setVendorPOs: (state, action) => {
      state.vendorPOs = action.payload;
      state.loading = false;
    },
    setGRNs: (state, action) => {
      state.grns = action.payload;
      state.loading = false;
    }
  }
});

export const {
  setLoading,
  setError,
  setStock,
  setLedger,
  setRFQs,
  setVendorPOs,
  setGRNs
} = inventorySlice.actions;

export default inventorySlice.reducer;
