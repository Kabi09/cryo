import React from 'react';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export default function ActivityTimeline({ events = [] }) {
  if (!events || events.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: '#9ca3af' }}>
        No historical events recorded yet.
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', paddingLeft: '24px', margin: '16px 0' }}>
      {/* Vertical line */}
      <div
        style={{
          position: 'absolute',
          top: '8px',
          bottom: '8px',
          left: '7px',
          width: '2px',
          background: '#223249'
        }}
      />

      {events.map((evt, idx) => (
        <div key={idx} style={{ position: 'relative', marginBottom: '24px' }}>
          {/* Dot */}
          <div
            style={{
              position: 'absolute',
              left: '-24px',
              top: '2px',
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              background: '#0284c7',
              border: '2px solid #0b0f17',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          />

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#f3f4f6' }}>
                {evt.stage || evt.eventType || evt.action || 'Activity Event'}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                {new Date(evt.timestamp || evt.createdAt || Date.now()).toLocaleString()}
              </span>
            </div>
            <p style={{ fontSize: '0.825rem', color: '#cbd5e1', margin: '4px 0' }}>
              {evt.description || evt.reason || 'Event executed successfully'}
            </p>
            {evt.recordedBy && (
              <span style={{ fontSize: '0.75rem', color: '#38bdf8' }}>
                By: {typeof evt.recordedBy === 'object' ? evt.recordedBy.name : evt.actorName || 'System'}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
