import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  orders: [],
  currentOrder: null,
  operations: [],
  boms: [],
  materialRequests: [],
  loading: false,
  error: null
};

const productionSlice = createSlice({
  name: 'production',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    setOrders: (state, action) => {
      state.orders = action.payload;
      state.loading = false;
    },
    setCurrentOrder: (state, action) => {
      state.currentOrder = action.payload.order;
      state.operations = action.payload.operations || [];
      state.loading = false;
    },
    setBOMs: (state, action) => {
      state.boms = action.payload;
      state.loading = false;
    },
    setMaterialRequests: (state, action) => {
      state.materialRequests = action.payload;
      state.loading = false;
    }
  }
});

export const {
  setLoading,
  setError,
  setOrders,
  setCurrentOrder,
  setBOMs,
  setMaterialRequests
} = productionSlice.actions;

export default productionSlice.reducer;
