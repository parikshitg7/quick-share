import React, { useState, useEffect, useRef } from 'react';
import { uploadFileItem } from '../services/api';

function FileDropZone({ roomId, onItemAdded }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleUpload = async (file) => {
    if (!file || isUploading) return;

    setIsUploading(true);
    setUploadStatus(`Uploading ${file.name}...`);
    setError(null);

    try {
      await uploadFileItem(roomId, file);
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
  }, [roomId, isUploading]);

  return (
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
        marginBottom: '2rem',
        maxWidth: '600px',
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
  );
}

export default FileDropZone;