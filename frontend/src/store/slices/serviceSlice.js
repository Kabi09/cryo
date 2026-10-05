import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  installations: [],
  commissionings: [],
  warranties: [],
  tickets: [],
  currentTicket: null,
  rmas: [],
  loading: false,
  error: null
};

const serviceSlice = createSlice({
  name: 'service',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    setInstallations: (state, action) => {
      state.installations = action.payload;
      state.loading = false;
    },
    setCommissionings: (state, action) => {
      state.commissionings = action.payload;
      state.loading = false;
    },
    setWarranties: (state, action) => {
      state.warranties = action.payload;
      state.loading = false;
    },
    setTickets: (state, action) => {
      state.tickets = action.payload;
      state.loading = false;
    },
    setCurrentTicket: (state, action) => {
      state.currentTicket = action.payload;
      state.loading = false;
    },
    setRMAs: (state, action) => {
      state.rmas = action.payload;
      state.loading = false;
    }
  }
});

export const {
  setLoading,
  setError,
  setInstallations,
  setCommissionings,
  setWarranties,
  setTickets,
  setCurrentTicket,
  setRMAs
} = serviceSlice.actions;

export default serviceSlice.reducer;
