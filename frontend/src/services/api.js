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

export async function createRoom(expiryOption = '24h') {
  const response = await fetch(`${API_BASE_URL}/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ expiry_option: expiryOption }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to create room: ${response.statusText}`);
  }
  return await response.json();
}

export async function getRoom(roomId) {
  const response = await fetch(`${API_BASE_URL}/rooms/${roomId}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const err = new Error(errorData.detail || `Failed to fetch room: ${response.statusText}`);
    err.status = response.status;
    throw err;
  }
  return await response.json();
}

export async function getRoomByCode(shortCode) {
  const response = await fetch(`${API_BASE_URL}/rooms/by-code/${shortCode}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (response.status === 404) {
      throw new Error('Room not found. Please check the code.');
    }
    const err = new Error(errorData.detail || `Failed to lookup code: ${response.statusText}`);
    err.status = response.status;
    throw err;
  }
  return await response.json();
}

export async function sealRoom(roomId) {
  const response = await fetch(`${API_BASE_URL}/rooms/${roomId}/seal`, {
    method: 'POST',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to seal room: ${response.statusText}`);
  }
  return await response.json();
}

export async function createTextItem(roomId, content, burnAfterRead = false) {
  const formData = new FormData();
  formData.append('type', 'text');
  formData.append('content', content);
  if (burnAfterRead) {
    formData.append('burn_after_read', 'true');
  }

  const response = await fetch(`${API_BASE_URL}/rooms/${roomId}/items`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to create item: ${response.statusText}`);
  }
  return await response.json();
}

// Alias addTextItem to createTextItem for backward compatibility
export const addTextItem = createTextItem;

export async function uploadFileItem(roomId, file, burnAfterRead = false) {
  const formData = new FormData();

  let type = 'file';
  if (file.type.startsWith('image/')) {
    type = 'image';
  } else if (file.type.startsWith('video/')) {
    type = 'video';
  }

  formData.append('type', type);
  formData.append('file', file);
  if (burnAfterRead) {
    formData.append('burn_after_read', 'true');
  }

  const response = await fetch(`${API_BASE_URL}/rooms/${roomId}/items`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Upload failed: ${response.statusText}`);
  }
  return await response.json();
}

export async function getItems(roomId) {
  const response = await fetch(`${API_BASE_URL}/rooms/${roomId}/items`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to fetch items: ${response.statusText}`);
  }
  return await response.json();
}

export function getItemDownloadUrl(itemId) {
  return `${API_BASE_URL}/items/${itemId}/download`;
}

export async function markItemViewed(itemId) {
  const response = await fetch(`${API_BASE_URL}/items/${itemId}/mark-viewed`, {
    method: 'POST',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to mark item viewed: ${response.statusText}`);
  }
  return await response.json();
}

export async function deleteItem(itemId) {
  const response = await fetch(`${API_BASE_URL}/items/${itemId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to delete item: ${response.statusText}`);
  }
  return await response.json();
}