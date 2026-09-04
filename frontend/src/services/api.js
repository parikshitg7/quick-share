const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

let activeRoomPassword = null;

export function setRoomPassword(password) {
  activeRoomPassword = password;
}

export function getRoomPassword() {
  return activeRoomPassword;
}

export function clearRoomPassword() {
  activeRoomPassword = null;
}

function getHeaders(extraHeaders = {}) {
  const headers = { ...extraHeaders };
  if (activeRoomPassword) {
    headers['X-Room-Password'] = activeRoomPassword;
  }
  return headers;
}

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

export async function createRoom(expiryOption = '24h', password = null, encryptionSalt = null) {
  const response = await fetch(`${API_BASE_URL}/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      expiry_option: expiryOption,
      password: password || null,
      encryption_salt: encryptionSalt || null,
    }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to create room: ${response.statusText}`);
  }
  return await response.json();
}

export async function getRoom(roomId) {
  const response = await fetch(`${API_BASE_URL}/rooms/${roomId}`, {
    headers: getHeaders(),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const err = new Error(errorData.detail || `Failed to fetch room: ${response.statusText}`);
    err.status = response.status;
    throw err;
  }
  return await response.json();
}

export async function getRoomByCode(shortCode) {
  const response = await fetch(`${API_BASE_URL}/rooms/by-code/${shortCode}`, {
    headers: getHeaders(),
  });
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
    headers: getHeaders(),
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
    headers: getHeaders(),
    body: formData,
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const err = new Error(errorData.detail || `Failed to create item: ${response.statusText}`);
    err.status = response.status;
    throw err;
  }
  return await response.json();
}

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
    headers: getHeaders(),
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const err = new Error(errorData.detail || `Upload failed: ${response.statusText}`);
    err.status = response.status;
    throw err;
  }
  return await response.json();
}

export async function getItems(roomId) {
  const response = await fetch(`${API_BASE_URL}/rooms/${roomId}/items`, {
    headers: getHeaders(),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const err = new Error(errorData.detail || `Failed to fetch items: ${response.statusText}`);
    err.status = response.status;
    throw err;
  }
  return await response.json();
}

export function getItemDownloadUrl(itemId) {
  return `${API_BASE_URL}/items/${itemId}/download`;
}

export async function markItemViewed(itemId) {
  const response = await fetch(`${API_BASE_URL}/items/${itemId}/mark-viewed`, {
    method: 'POST',
    headers: getHeaders(),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const err = new Error(errorData.detail || `Failed to mark item viewed: ${response.statusText}`);
    err.status = response.status;
    throw err;
  }
  return await response.json();
}

export async function deleteItem(itemId) {
  const response = await fetch(`${API_BASE_URL}/items/${itemId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const err = new Error(errorData.detail || `Failed to delete item: ${response.statusText}`);
    err.status = response.status;
    throw err;
  }
  return await response.json();
}