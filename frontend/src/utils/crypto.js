function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function generateSalt() {
  const array = new Uint8Array(16);
  window.crypto.getRandomValues(array);
  return bytesToHex(array);
}

export async function deriveKey(password, saltHex) {
  const encoder = new TextEncoder();
  const salt = hexToBytes(saltHex);
  const passwordKey = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptText(text, password, salt) {
  if (!text || !password || !salt) return text;
  const key = await deriveKey(password, salt);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encodedText = new TextEncoder().encode(text);

  const ciphertext = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encodedText
  );

  const ivHex = bytesToHex(iv);
  const ciphertextBase64 = btoa(
    String.fromCharCode(...new Uint8Array(ciphertext))
  );
  return `${ivHex}:${ciphertextBase64}`;
}

export async function decryptText(encryptedData, password, salt) {
  if (!encryptedData || !password || !salt) return encryptedData;

  try {
    const [ivHex, ciphertextBase64] = encryptedData.split(':');
    if (!ivHex || !ciphertextBase64) return encryptedData;

    const iv = hexToBytes(ivHex);
    const ciphertext = Uint8Array.from(atob(ciphertextBase64), (c) =>
      c.charCodeAt(0)
    );
    const key = await deriveKey(password, salt);

    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );

    return new TextDecoder().decode(decrypted);
  } catch (err) {
    console.error('Text decryption failed:', err);
    throw err;
  }
}

export async function encryptBuffer(arrayBuffer, password, salt) {
  if (!arrayBuffer || !password || !salt) return arrayBuffer;
  const key = await deriveKey(password, salt);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const ciphertext = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    arrayBuffer
  );

  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return combined.buffer;
}

export async function decryptBuffer(encryptedBuffer, password, salt) {
  if (!encryptedBuffer || !password || !salt) return encryptedBuffer;

  try {
    const data = new Uint8Array(encryptedBuffer);
    const iv = data.slice(0, 12);
    const ciphertext = data.slice(12);
    const key = await deriveKey(password, salt);

    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );

    return decrypted;
  } catch (err) {
    console.error('Buffer decryption failed:', err);
    throw err;
  }
}