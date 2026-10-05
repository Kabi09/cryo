import React from 'react';
import InboxIcon from '@mui/icons-material/Inbox';

export default function EmptyState({
  title = 'No records found',
  description = 'There are no active records in this view.',
  actionLabel,
  onAction
}) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px',
      textAlign: 'center',
      border: '1px dashed #223249',
      borderRadius: '12px',
      background: 'rgba(17, 24, 39, 0.4)',
      margin: '16px 0'
    }}>
      <InboxIcon style={{ fontSize: '48px', color: '#4b5563', marginBottom: '12px' }} />
      <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#e5e7eb', marginBottom: '6px' }}>
        {title}
      </h4>
      <p style={{ fontSize: '0.85rem', color: '#9ca3af', maxWidth: '400px', marginBottom: actionLabel ? '16px' : '0' }}>
        {description}
      </p>
      {actionLabel && onAction && (
        <button className="btn btn-primary btn-sm" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
