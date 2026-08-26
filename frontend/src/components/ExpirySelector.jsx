import React from 'react';

const EXPIRY_OPTIONS = [
  { value: '24h', label: '24 hours (Default)' },
  { value: '10m', label: '10 minutes' },
  { value: '1h', label: '1 hour' },
  { value: '7d', label: '7 days' },
  { value: 'burn_after_view', label: 'Burn after viewing' },
];

function ExpirySelector({ value, onChange, disabled }) {
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <label
        htmlFor="expiry-select"
        style={{
          display: 'block',
          marginBottom: '0.5rem',
          fontWeight: 'bold',
          fontSize: '0.95rem',
          color: '#1a1a1a',
        }}
      >
        Room Expiration:
      </label>
      <select
        id="expiry-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        style={{
          padding: '10px 14px',
          fontSize: '1rem',
          borderRadius: '6px',
          border: '1px solid #767676',
          backgroundColor: '#ffffff',
          color: '#000000',
          cursor: disabled ? 'not-allowed' : 'pointer',
          outline: 'none',
          minWidth: '220px',
        }}
      >
        {EXPIRY_OPTIONS.map((opt) => (
          <option
            key={opt.value}
            value={opt.value}
            style={{ backgroundColor: '#ffffff', color: '#000000' }}
          >
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default ExpirySelector;