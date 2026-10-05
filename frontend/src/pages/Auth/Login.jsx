import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginRequest } from '../../store/slices/authSlice';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

const DEMO_ACCOUNTS = [
  { role: 'ADMIN', email: 'admin@example.com', label: 'Admin (Alexander Vance)' },
  { role: 'MANAGEMENT', email: 'management@example.com', label: 'Management (Victoria Sterling)' },
  { role: 'SALES', email: 'sales@example.com', label: 'Sales (Rohan Sharma)' },
  { role: 'SALES_MANAGER', email: 'manager@example.com', label: 'Sales Manager (Priya Narayanan)' },
  { role: 'ACCOUNTS', email: 'accounts@example.com', label: 'Accounts (Karthik Raman)' },
  { role: 'PURCHASE', email: 'purchase@example.com', label: 'Procurement (Devendra Patel)' },
  { role: 'STORE', email: 'store@example.com', label: 'Store & Materials (Murugan Sundaram)' },
  { role: 'PRODUCTION', email: 'production@example.com', label: 'Production (Anand Kulkarni)' },
  { role: 'QA', email: 'qa@example.com', label: 'QA Compliance (Dr. Shalini Menon)' },
  { role: 'DISPATCH', email: 'dispatch@example.com', label: 'Dispatch (Ganesh Pillai)' },
  { role: 'SERVICE_MANAGER', email: 'service@example.com', label: 'Service Mgr (Siddharth Roy)' },
  { role: 'SERVICE_ENGINEER', email: 'engineer@example.com', label: 'Field Engineer (Vikram Seth)' }
];

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('Password@123');

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(loginRequest({ email, password }));
  };

  const handleSelectDemo = (accEmail) => {
    setEmail(accEmail);
    setPassword('Password@123');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0b0f17',
      backgroundImage: 'radial-gradient(circle at 50% 20%, rgba(2, 132, 199, 0.12) 0%, transparent 60%)',
      padding: '24px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '520px',
        backgroundColor: 'rgba(22, 32, 50, 0.85)',
        border: '1px solid #223249',
        borderRadius: '16px',
        padding: '36px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(16px)'
      }}>
        {/* Brand header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #0284c7, #06b6d4)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            marginBottom: '12px',
            boxShadow: '0 0 25px rgba(2, 132, 199, 0.4)'
          }}>
            <AcUnitIcon style={{ fontSize: '32px' }} />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f3f4f6', letterSpacing: '-0.02em' }}>
            CRYO<span style={{ color: '#38bdf8' }}>TECH</span> ERP
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginTop: '4px' }}>
            Industrial Manufacturing & Mission-Critical Operations
          </p>
        </div>

        {error && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            color: '#f87171',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '20px'
          }}>
            <ErrorOutlineIcon style={{ fontSize: '20px' }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Work Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
            />
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label>Master Security Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }}
            disabled={loading}
          >
            <LockOpenIcon style={{ fontSize: '18px' }} />
            <span>{loading ? 'Authenticating System...' : 'Sign In to Workspace'}</span>
          </button>
        </form>

        {/* 12 Demo Accounts Switcher */}
        <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid #223249' }}>
          <div style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            color: '#38bdf8',
            letterSpacing: '0.05em',
            marginBottom: '10px',
            textAlign: 'center'
          }}>
            Instant Demo Account Switcher
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '8px',
            maxHeight: '160px',
            overflowY: 'auto'
          }}>
            {DEMO_ACCOUNTS.map((acc, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectDemo(acc.email)}
                style={{
                  padding: '6px 8px',
                  backgroundColor: email === acc.email ? 'rgba(2, 132, 199, 0.25)' : '#111827',
                  border: `1px solid ${email === acc.email ? '#38bdf8' : '#223249'}`,
                  borderRadius: '6px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '0.725rem',
                  color: email === acc.email ? '#38bdf8' : '#cbd5e1'
                }}
              >
                <div style={{ fontWeight: 600 }}>{acc.role}</div>
                <div style={{ fontSize: '0.675rem', color: '#9ca3af', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {acc.email}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
