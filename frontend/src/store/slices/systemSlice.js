import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  dashboardStats: null,
  notifications: [],
  unreadCount: 0,
  auditLogs: [],
  loading: false,
  error: null
};

const systemSlice = createSlice({
  name: 'system',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    setDashboardStats: (state, action) => {
      state.dashboardStats = action.payload;
      state.loading = false;
    },
    setNotifications: (state, action) => {
      state.notifications = action.payload.notifications;
      state.unreadCount = action.payload.unreadCount;
      state.loading = false;
    },
    markNotificationAsRead: (state, action) => {
      const notif = state.notifications.find(n => n._id === action.payload);
      if (notif && !notif.isRead) {
        notif.isRead = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    setAuditLogs: (state, action) => {
      state.auditLogs = action.payload;
      state.loading = false;
    }
  }
});

export const {
  setLoading,
  setError,
  setDashboardStats,
  setNotifications,
  markNotificationAsRead,
  setAuditLogs
} = systemSlice.actions;

export default systemSlice.reducer;
