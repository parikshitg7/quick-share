/**
 * Utility functions for zero-knowledge client-side encryption using Web Crypto API.
 * Uses PBKDF2 (SHA-256, 100k iterations) for key derivation and AES-GCM for encryption.
 */

// Generates a random 16-byte hex salt for PBKDF2 key derivation
export function generateSalt() {
  const array = new Uint8Array(16);
  window.crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

// Converts a hex string into a Uint8Array
function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

// Derives an AES-GCM 256-bit CryptoKey from a password string and hex salt
export async function deriveKey(password, saltHex) {
  const encoder = new TextEncoder();
  const passwordBytes = encoder.encode(password);
  const saltBytes = hexToBytes(saltHex);

  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    passwordBytes,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: 100000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypts plaintext string; returns JSON string containing base64 ciphertext and hex IV
export async function encryptText(text, key) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );

  const ciphertextArray = new Uint8Array(encryptedBuffer);
  const base64Ciphertext = btoa(String.fromCharCode(...ciphertextArray));
  const ivHex = Array.from(iv, (b) => b.toString(16).padStart(2, '0')).join('');

  return JSON.stringify({
    encrypted: true,
    iv: ivHex,
    ciphertext: base64Ciphertext,
  });
}

// Decrypts JSON formatted encrypted text payload back to plaintext string
export async function decryptText(encryptedPayloadString, key) {
  const payload = JSON.parse(encryptedPayloadString);
  const iv = hexToBytes(payload.iv);

  const binaryString = atob(payload.ciphertext);
  const ciphertextBytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    ciphertextBytes[i] = binaryString.charCodeAt(i);
  }

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertextBytes
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}

// Encrypts a File or Blob; prepends the 12-byte IV to the encrypted bytes and returns a new File object
export async function encryptFile(file, key) {
  const fileBuffer = await file.arrayBuffer();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    fileBuffer
  );

  // Combine IV (12 bytes) + Encrypted ArrayBuffer
  const combinedBuffer = new Uint8Array(iv.length + encryptedBuffer.byteLength);
  combinedBuffer.set(iv, 0);
  combinedBuffer.set(new Uint8Array(encryptedBuffer), iv.length);

  const encryptedBlob = new Blob([combinedBuffer], { type: 'application/octet-stream' });
  return new File([encryptedBlob], file.name, { type: 'application/octet-stream' });
}

// Decrypts an ArrayBuffer/Blob containing prepended 12-byte IV + ciphertext back into an ArrayBuffer
export async function decryptFile(combinedBuffer, key) {
  const bytes = new Uint8Array(combinedBuffer);
  const iv = bytes.slice(0, 12);
  const ciphertext = bytes.slice(12);

  return await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );
}