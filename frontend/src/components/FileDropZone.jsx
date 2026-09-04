import React, { useState, useEffect, useRef } from 'react';
import { uploadFileItem, getRoom, getRoomPassword } from '../services/api';
import { encryptBuffer } from '../utils/crypto';

function FileDropZone({ roomId, onItemAdded }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [burnAfterRead, setBurnAfterRead] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleUpload = async (file) => {
    if (!file || isUploading) return;

    setIsUploading(true);
    setUploadStatus(`Uploading ${file.name}...`);
    setError(null);

    try {
      let fileToUpload = file;
      const password = getRoomPassword();

      if (password) {
        const room = await getRoom(roomId);
        if (room?.encryption_salt) {
          const rawBuffer = await file.arrayBuffer();
          const encryptedArrayBuffer = await encryptBuffer(
            rawBuffer,
            password,
            room.encryption_salt
          );
          fileToUpload = new File([encryptedArrayBuffer], file.name, {
            type: file.type || 'application/octet-stream',
          });
        }
      }

      await uploadFileItem(roomId, fileToUpload, burnAfterRead);
      setUploadStatus(`Successfully uploaded ${file.name}!`);
      if (onItemAdded) {
        onItemAdded();
      }
      setTimeout(() => setUploadStatus(null), 3000);
    } catch (err) {
      console.error('Upload failed:', err);
      setError(err.message || 'Upload failed. Please try again.');
      setUploadStatus(null);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUpload(e.target.files[0]);
    }
  };

  // Global paste listener for image clipboard data
  useEffect(() => {
    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            handleUpload(blob);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [roomId, isUploading, burnAfterRead]);

  return (
    <div style={{ marginTop: '1rem', marginBottom: '1.5rem', maxWidth: '600px' }}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          border: isDragging ? '2px dashed #0066cc' : '2px dashed #bbb',
          backgroundColor: isDragging ? '#eef6ff' : '#fafafa',
          borderRadius: '8px',
          padding: '24px',
          textAlign: 'center',
          boxSizing: 'border-box',
          transition: 'all 0.2s ease',
        }}
      >
        <p style={{ margin: '0 0 12px 0', color: '#555' }}>
          <strong>Drag & Drop</strong> files/images/videos here, or paste directly from clipboard
        </p>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          disabled={isUploading}
          style={{ display: 'none' }}
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          style={{
            padding: '8px 16px',
            fontSize: '0.95rem',
            cursor: isUploading ? 'not-allowed' : 'pointer',
          }}
        >
          {isUploading ? 'Uploading...' : 'Choose File'}
        </button>

        {uploadStatus && (
          <p style={{ color: 'green', marginTop: '12px', marginBottom: 0, fontWeight: 'bold' }}>
            {uploadStatus}
          </p>
        )}

        {error && (
          <p style={{ color: 'red', marginTop: '12px', marginBottom: 0 }}>
            {error}
          </p>
        )}
      </div>

      <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input
          type="checkbox"
          id="file-burn-after-read"
          checked={burnAfterRead}
          onChange={(e) => setBurnAfterRead(e.target.checked)}
          disabled={isUploading}
        />
        <label htmlFor="file-burn-after-read" style={{ fontSize: '0.9rem', color: '#555', cursor: 'pointer' }}>
          🔥 Delete after viewing/downloading (Burn-after-read)
        </label>
      </div>
    </div>
  );
}

export default FileDropZone;