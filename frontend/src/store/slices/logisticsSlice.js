import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  packingLists: [],
  invoices: [],
  dispatches: [],
  deliveries: [],
  loading: false,
  error: null
};

const logisticsSlice = createSlice({
  name: 'logistics',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    setPackingLists: (state, action) => {
      state.packingLists = action.payload;
      state.loading = false;
    },
    setInvoices: (state, action) => {
      state.invoices = action.payload;
      state.loading = false;
    },
    setDispatches: (state, action) => {
      state.dispatches = action.payload;
      state.loading = false;
    },
    setDeliveries: (state, action) => {
      state.deliveries = action.payload;
      state.loading = false;
    }
  }
});

export const {
  setLoading,
  setError,
  setPackingLists,
  setInvoices,
  setDispatches,
  setDeliveries
} = logisticsSlice.actions;

export default logisticsSlice.reducer;
