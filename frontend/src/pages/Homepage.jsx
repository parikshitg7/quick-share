import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkHealth, createRoom } from '../services/api';

function HomePage() {
  const [backendStatus, setBackendStatus] = useState('Checking...');
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
      const newRoom = await createRoom();
      navigate(`/room/${newRoom.id}`);
    } catch (err) {
      console.error('Failed to create room:', err);
      setError('Failed to create room. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Quick Share — Home</h1>
      <p>Backend: {backendStatus}</p>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <button
        onClick={handleCreateRoom}
        disabled={isCreating}
        style={{ padding: '10px 20px', fontSize: '1rem', cursor: 'pointer' }}
      >
        {isCreating ? 'Creating Room...' : 'Create Room'}
      </button>
    </div>
  );
}

export default HomePage;