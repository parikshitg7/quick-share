import React, { useState } from 'react';
import { setRoomPassword, getRoom } from '../services/api';

function PasswordGate({ roomId, onSuccess }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) return;

    setSubmitting(true);
    setError(null);

    try {
      setRoomPassword(password);
      await getRoom(roomId);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Password verification failed:', err);
      setError('Incorrect password. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: '400px',
        margin: '3rem auto',
        padding: '2rem',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        backgroundColor: '#f8fafc',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        textAlign: 'center',
        fontFamily: 'sans-serif',
      }}
    >
      <h2 style={{ marginTop: 0, color: '#1e293b' }}>🔒 Protected Room</h2>
      <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
        This room is password-protected. Enter the password to view and share content.
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <input
            type="password"
            placeholder="Enter room password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              boxSizing: 'border-box',
              fontSize: '1rem',
            }}
            autoFocus
          />
        </div>

        {error && (
          <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '-0.5rem', marginBottom: '1rem' }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || !password}
          style={{
            width: '100%',
            padding: '10px 16px',
            backgroundColor: submitting || !password ? '#94a3b8' : '#2563eb',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            fontWeight: '600',
            fontSize: '1rem',
            cursor: submitting || !password ? 'not-allowed' : 'pointer',
          }}
        >
          {submitting ? 'Unlocking...' : 'Unlock Room'}
        </button>
      </form>
    </div>
  );
}

export default PasswordGate;