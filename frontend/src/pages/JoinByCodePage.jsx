import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getRoomByCode } from '../services/api';

function JoinByCodePage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const formattedCode = code.trim().toLowerCase();
      const room = await getRoomByCode(formattedCode);
      navigate(`/room/${room.id}`);
    } catch (err) {
      console.error('Failed to join by code:', err);
      setError(err.message || 'Room not found. Please verify the code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '500px' }}>
      <h1>Join Room by Code</h1>
      <p style={{ color: '#666' }}>Enter the human-friendly code (e.g., blue-dog-42) to access the room.</p>

      <form onSubmit={handleJoin} style={{ marginTop: '1.5rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <input
            type="text"
            placeholder="e.g. blue-dog-42"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '1rem',
              boxSizing: 'border-box',
              fontFamily: 'monospace',
            }}
          />
        </div>

        {error && <p style={{ color: 'red', marginTop: '0.5rem' }}>{error}</p>}

        <button
          type="submit"
          disabled={loading || !code.trim()}
          style={{ padding: '10px 20px', fontSize: '1rem', cursor: 'pointer', marginRight: '1rem' }}
        >
          {loading ? 'Looking up...' : 'Join Room'}
        </button>

        <Link to="/" style={{ textDecoration: 'none', color: '#0066cc' }}>
          Back Home
        </Link>
      </form>
    </div>
  );
}

export default JoinByCodePage;