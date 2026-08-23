import React, { useState, useEffect } from 'react';
import { checkHealth } from '../services/api';

function HomePage() {
  const [backendStatus, setBackendStatus] = useState('Checking...');

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

  return (
    <div>
      <h1>Quick Share — Home</h1>
      <p>Backend: {backendStatus}</p>
    </div>
  );
}

export default HomePage;