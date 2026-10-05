import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  tests: [],
  currentTest: null,
  serials: [],
  currentTrace: null,
  loading: false,
  error: null
};

const qualitySlice = createSlice({
  name: 'quality',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    setTests: (state, action) => {
      state.tests = action.payload;
      state.loading = false;
    },
    setCurrentTest: (state, action) => {
      state.currentTest = action.payload;
      state.loading = false;
    },
    setSerials: (state, action) => {
      state.serials = action.payload;
      state.loading = false;
    },
    setCurrentTrace: (state, action) => {
      state.currentTrace = action.payload;
      state.loading = false;
    }
  }
});

export const {
  setLoading,
  setError,
  setTests,
  setCurrentTest,
  setSerials,
  setCurrentTrace
} = qualitySlice.actions;

export default qualitySlice.reducer;
