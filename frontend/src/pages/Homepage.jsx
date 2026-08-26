import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { checkHealth, createRoom } from '../services/api';
import ExpirySelector from '../components/ExpirySelector';

function HomePage() {
  const [backendStatus, setBackendStatus] = useState('Checking...');
  const [expiryOption, setExpiryOption] = useState('24h');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function verifyConnection() {
      const result = await checkHealth();
      if (result && result.status === 'ok') {
        setBackendStatus('Connected');
      } else {
        setBackendStatus('Unreachable');
      }
    }

    verifyConnection();
  }, []);

  const handleCreateRoom = async () => {
    setIsCreating(true);
    setError(null);
    try {
      const newRoom = await createRoom(expiryOption);
      navigate(`/room/${newRoom.id}`);
    } catch (err) {
      console.error('Failed to create room:', err);
      setError('Failed to create room. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '600px' }}>
      <h1>Quick Share — Home</h1>
      <p>Backend: {backendStatus}</p>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Expiry Option Selector */}
      <ExpirySelector
        value={expiryOption}
        onChange={setExpiryOption}
        disabled={isCreating}
      />

      <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', alignItems: 'center' }}>
        <button
          onClick={handleCreateRoom}
          disabled={isCreating}
          style={{ padding: '10px 20px', fontSize: '1rem', cursor: 'pointer' }}
        >
          {isCreating ? 'Creating Room...' : 'Create Room'}
        </button>

        <Link
          to="/join"
          style={{
            padding: '10px 20px',
            fontSize: '1rem',
            textDecoration: 'none',
            border: '1px solid #ccc',
            borderRadius: '4px',
            color: '#333',
            backgroundColor: '#f5f5f5',
          }}
        >
          Join a Room
        </Link>
      </div>
    </div>
  );
}

export default HomePage;