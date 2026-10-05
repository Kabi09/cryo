import React from 'react';

const STATUS_COLORS = {
  // Green / Positive
  APPROVED: { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', border: '#10b981' },
  ACCEPTED: { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', border: '#10b981' },
  MATCH: { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', border: '#10b981' },
  CONFIRMED: { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', border: '#10b981' },
  VERIFIED: { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', border: '#10b981' },
  PAID: { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', border: '#10b981' },
  COMPLETED: { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', border: '#10b981' },
  PASSED: { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', border: '#10b981' },
  DELIVERED: { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', border: '#10b981' },
  ACTIVE: { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', border: '#10b981' },
  WARRANTY_ACTIVE: { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', border: '#10b981' },
  CLOSED: { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', border: '#10b981' },

  // Blue / In Progress
  IN_PROGRESS: { bg: 'rgba(2, 132, 199, 0.15)', text: '#38bdf8', border: '#0284c7' },
  IN_PRODUCTION: { bg: 'rgba(2, 132, 199, 0.15)', text: '#38bdf8', border: '#0284c7' },
  RELEASED: { bg: 'rgba(2, 132, 199, 0.15)', text: '#38bdf8', border: '#0284c7' },
  IN_TRANSIT: { bg: 'rgba(2, 132, 199, 0.15)', text: '#38bdf8', border: '#0284c7' },
  DISPATCHED: { bg: 'rgba(2, 132, 199, 0.15)', text: '#38bdf8', border: '#0284c7' },
  PACKED: { bg: 'rgba(2, 132, 199, 0.15)', text: '#38bdf8', border: '#0284c7' },
  QA_PASSED: { bg: 'rgba(6, 182, 212, 0.15)', text: '#06b6d4', border: '#06b6d4' },
  QUALIFIED: { bg: 'rgba(6, 182, 212, 0.15)', text: '#06b6d4', border: '#06b6d4' },

  // Amber / Warning / Pending
  PENDING: { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', border: '#f59e0b' },
  PENDING_APPROVAL: { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', border: '#f59e0b' },
  HOLD: { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', border: '#f59e0b' },
  ON_HOLD: { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', border: '#f59e0b' },
  NEGOTIATION: { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', border: '#f59e0b' },
  PARTIAL: { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', border: '#f59e0b' },
  PARTIALLY_PAID: { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', border: '#f59e0b' },

  // Red / Danger / Failure
  REJECTED: { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', border: '#ef4444' },
  CANCELLED: { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', border: '#ef4444' },
  MISMATCH: { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', border: '#ef4444' },
  FAILED: { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', border: '#ef4444' },
  LOST: { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', border: '#ef4444' },
  SCRAPPED: { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', border: '#ef4444' },
  EXPIRED: { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', border: '#ef4444' },
  VOIDED: { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', border: '#ef4444' }
};

export default function StatusBadge({ status }) {
  if (!status) return null;

  const normalized = String(status).toUpperCase();
  const theme = STATUS_COLORS[normalized] || {
    bg: 'rgba(156, 163, 175, 0.15)',
    text: '#9ca3af',
    border: '#4b5563'
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 10px',
        borderRadius: '9999px',
        fontSize: '0.725rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        backgroundColor: theme.bg,
        color: theme.text,
        border: `1px solid ${theme.border}`,
        whiteSpace: 'nowrap'
      }}
    >
      {normalized.replace(/_/g, ' ')}
    </span>
  );
}
