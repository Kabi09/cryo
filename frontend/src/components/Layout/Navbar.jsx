import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { markNotificationAsRead } from '../../store/slices/systemSlice';
import api from '../../services/api';

import NotificationsIcon from '@mui/icons-material/Notifications';
import LogoutIcon from '@mui/icons-material/Logout';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import PersonIcon from '@mui/icons-material/Person';

export default function Navbar() {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/system/notifications');
      if (res.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      // silent
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await api.put(`/system/notifications/${id}/read`);
      dispatch(markNotificationAsRead(id));
      setUnreadCount(prev => Math.max(0, prev - 1));
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    window.location.href = '/login';
  };

  return (
    <header style={{
      height: '64px',
      backgroundColor: '#111827',
      borderBottom: '1px solid #223249',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #0284c7, #06b6d4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff'
        }}>
          <AcUnitIcon style={{ fontSize: '22px' }} />
        </div>
        <div>
          <span style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em', color: '#f3f4f6' }}>
            CRYO<span style={{ color: '#38bdf8' }}>TECH</span>
          </span>
          <span style={{ fontSize: '0.65rem', display: 'block', color: '#06b6d4', fontWeight: 600, letterSpacing: '0.08em' }}>
            INDUSTRIAL ERP v1.0
          </span>
        </div>
      </div>

      {/* Right User Bar & Notifications */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {/* Notification Bell */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            style={{
              position: 'relative',
              color: '#9ca3af',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <NotificationsIcon style={{ fontSize: '24px' }} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '2px',
                right: '2px',
                background: '#ef4444',
                color: '#fff',
                fontSize: '0.65rem',
                fontWeight: 700,
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifMenu && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: '45px',
              width: '340px',
              maxHeight: '400px',
              overflowY: 'auto',
              backgroundColor: '#162032',
              border: '1px solid #223249',
              borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
              zIndex: 200,
              padding: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px', borderBottom: '1px solid #223249' }}>
                <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Notifications</span>
                <span style={{ fontSize: '0.75rem', color: '#38bdf8' }}>{unreadCount} Unread</span>
              </div>

              {notifications.length === 0 ? (
                <div style={{ padding: '24px 0', textAlign: 'center', fontSize: '0.8rem', color: '#9ca3af' }}>
                  No notifications
                </div>
              ) : (
                notifications.slice(0, 10).map((n) => (
                  <div
                    key={n._id}
                    onClick={() => handleMarkRead(n._id)}
                    style={{
                      padding: '10px 8px',
                      borderBottom: '1px solid #1a273a',
                      cursor: 'pointer',
                      opacity: n.isRead ? 0.6 : 1,
                      backgroundColor: n.isRead ? 'transparent' : 'rgba(2, 132, 199, 0.08)',
                      borderRadius: '6px',
                      marginTop: '4px'
                    }}
                  >
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f3f4f6' }}>{n.title}</div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '2px' }}>{n.message}</div>
                    <div style={{ fontSize: '0.65rem', color: '#6b7280', marginTop: '4px' }}>
                      {new Date(n.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* User Card */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '12px', borderLeft: '1px solid #223249' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38bdf8'
            }}>
              <PersonIcon style={{ fontSize: '20px' }} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f3f4f6', lineHeight: 1.2 }}>
                {user.name}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                <span style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  backgroundColor: 'rgba(2, 132, 199, 0.2)',
                  color: '#38bdf8',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  border: '1px solid rgba(2, 132, 199, 0.3)'
                }}>
                  {user.role}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Logout"
              style={{
                marginLeft: '8px',
                color: '#ef4444',
                padding: '6px',
                borderRadius: '6px',
                transition: 'background 0.2s'
              }}
            >
              <LogoutIcon style={{ fontSize: '20px' }} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
