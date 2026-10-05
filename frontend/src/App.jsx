import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginSuccess } from './store/slices/authSlice';
import api from './services/api';
import AppRoutes from './routes/AppRoutes';

export default function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    const token = localStorage.getItem('cryo_erp_token');
    const userStr = localStorage.getItem('cryo_erp_user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        dispatch(loginSuccess({ token, user }));
        // Verify current user from backend
        api.get('/auth/me').catch(() => {
          // If token expired or invalid, storage is cleared by axios interceptor
        });
      } catch (err) {
        localStorage.removeItem('cryo_erp_token');
        localStorage.removeItem('cryo_erp_user');
      }
    }
  }, [dispatch]);

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
