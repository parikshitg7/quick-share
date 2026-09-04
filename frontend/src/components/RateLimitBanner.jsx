import React from 'react';

function RateLimitBanner() {
  return (
    <div
      style={{
        backgroundColor: '#f8f9fa',
        border: '1px solid #e9ecef',
        borderRadius: '6px',
        padding: '0.5rem 1rem',
        margin: '1rem 0',
        fontSize: '0.85rem',
        color: '#6c757d',
        textAlign: 'center',
      }}
    >
      <span>ℹ️ Files up to 100MB · 500MB per room · Limited uploads per hour</span>
    </div>
  );
}

export default RateLimitBanner;