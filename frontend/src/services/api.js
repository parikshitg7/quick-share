const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export async function checkHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch health check:', error);
    return null;
  }
}

export async function createRoom() {
  const response = await fetch(`${API_BASE_URL}/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`Failed to create room: ${response.statusText}`);
  }
  return await response.json();
}

export async function getRoom(roomId) {
  const response = await fetch(`${API_BASE_URL}/rooms/${roomId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch room: ${response.statusText}`);
  }
  return await response.json();
}

export async function getRoomByCode(shortCode) {
  const response = await fetch(`${API_BASE_URL}/rooms/by-code/${shortCode}`);
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Room not found. Please check the code.');
    }
    throw new Error(`Failed to lookup code: ${response.statusText}`);
  }
  return await response.json();
}

export async function createTextItem(roomId, content) {
  const response = await fetch(`${API_BASE_URL}/rooms/${roomId}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'text', content }),
  });
  if (!response.ok) {
    throw new Error(`Failed to create item: ${response.statusText}`);
  }
  return await response.json();
}

export async function getItems(roomId) {
  const response = await fetch(`${API_BASE_URL}/rooms/${roomId}/items`);
  if (!response.ok) {
    throw new Error(`Failed to fetch items: ${response.statusText}`);
  }
  return await response.json();
}