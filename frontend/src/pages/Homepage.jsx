import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { checkHealth, createRoom } from '../services/api';
import ExpirySelector from '../components/ExpirySelector';

function HomePage() {
  const [backendStatus, setBackendStatus] = useState('Checking...');
  const [expiryOption, setExpiryOption] = useState('24h');
  const [password, setPassword] = useState('');
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
      const roomPassword = password.trim() || null;
      const newRoom = await createRoom(expiryOption, roomPassword);
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

      <ExpirySelector
        value={expiryOption}
        onChange={setExpiryOption}
        disabled={isCreating}
      />

      <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          Room Password (Optional):
        </label>
        <input
          type="password"
          placeholder="Leave empty for public room"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isCreating}
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            boxSizing: 'border-box',
            fontSize: '1rem',
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
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