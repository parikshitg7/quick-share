import React, { useState, useEffect } from 'react';
import { deleteItem, markItemViewed, downloadItemBlob, getRoomPassword } from '../services/api';
import { decryptText, decryptBuffer } from '../utils/crypto';

function ItemCard({ item, encryptionSalt, onItemDeleted, onItemRemoved }) {
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [decryptedText, setDecryptedText] = useState('');
  const [decryptionError, setDecryptionError] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [mediaUrl, setMediaUrl] = useState(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  const password = getRoomPassword();

  const notifyRemoved = (id) => {
    if (onItemRemoved) onItemRemoved(id);
    if (onItemDeleted) onItemDeleted(id);
  };

  // Automatically decrypt text payload if room is encrypted
  useEffect(() => {
    let isMounted = true;

    async function processText() {
      if (item.type !== 'text') return;

      if (password && encryptionSalt) {
        try {
          setIsDecrypting(true);
          const plaintext = await decryptText(item.content, password, encryptionSalt);
          if (isMounted) {
            setDecryptedText(plaintext);
            setDecryptionError(false);
          }
        } catch (err) {
          console.error('Failed to decrypt text item:', err);
          if (isMounted) {
            setDecryptionError(true);
            setDecryptedText(item.content);
          }
        } finally {
          if (isMounted) setIsDecrypting(false);
        }
      } else {
        setDecryptedText(item.content);
      }
    }

    processText();

    return () => {
      isMounted = false;
    };
  }, [item, encryptionSalt, password]);

  // Decrypt and load image/video preview for non-burn items
  useEffect(() => {
    let isMounted = true;
    let objectUrl = null;

    async function loadMediaPreview() {
      if (item.burn_after_read) return;
      if (item.type !== 'image' && item.type !== 'video') return;

      try {
        const rawBuffer = await downloadItemBlob(item.id);
        let finalBlob;
        if (password && encryptionSalt) {
          const decryptedBuffer = await decryptBuffer(rawBuffer, password, encryptionSalt);
          finalBlob = new Blob([decryptedBuffer], { type: item.mime_type || (item.type === 'image' ? 'image/png' : 'video/mp4') });
        } else {
          finalBlob = new Blob([rawBuffer], { type: item.mime_type || (item.type === 'image' ? 'image/png' : 'video/mp4') });
        }

        objectUrl = URL.createObjectURL(finalBlob);
        if (isMounted) {
          setMediaUrl(objectUrl);
        }
      } catch (err) {
        console.error('Failed to load media preview:', err);
      }
    }

    loadMediaPreview();

    return () => {
      isMounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [item, encryptionSalt, password]);

  const handleCopy = async () => {
    try {
      const textToCopy = decryptedText || item.content;
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      if (item.burn_after_read) {
        await markItemViewed(item.id);
        notifyRemoved(item.id);
      }
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleDownload = async () => {
    setIsProcessingFile(true);
    try {
      const rawBuffer = await downloadItemBlob(item.id);

      let finalBlob;
      if (password && encryptionSalt) {
        const decryptedBuffer = await decryptBuffer(rawBuffer, password, encryptionSalt);
        finalBlob = new Blob([decryptedBuffer], { type: item.mime_type || 'application/octet-stream' });
      } else {
        finalBlob = new Blob([rawBuffer], { type: item.mime_type || 'application/octet-stream' });
      }

      const blobUrl = URL.createObjectURL(finalBlob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = item.file_name || item.content || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);

      if (item.burn_after_read) {
        await markItemViewed(item.id);
        notifyRemoved(item.id);
      }
    } catch (err) {
      console.error('Failed to download file:', err);
      alert('Failed to download or decrypt file.');
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteItem(item.id);
      notifyRemoved(item.id);
    } catch (err) {
      console.error('Failed to delete item:', err);
      alert('Failed to delete item. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      style={{
        border: item.burn_after_read ? '1px solid #ff4d4f' : '1px solid #ccc',
        borderRadius: '8px',
        padding: '16px',
        backgroundColor: item.burn_after_read ? '#fff5f5' : '#f9f9f9',
        maxWidth: '600px',
      }}
    >
      {item.burn_after_read && (
        <div style={{ fontSize: '0.85rem', color: '#d9534f', fontWeight: 'bold', marginBottom: '10px' }}>
          🔥 Burn-after-read (Will self-destruct after viewing/copying)
        </div>
      )}

      {/* TEXT TYPE */}
      {item.type === 'text' && (
        <>
          <div style={{ marginBottom: '12px' }}>
            {item.burn_after_read ? (
              <div
                style={{
                  padding: '16px',
                  backgroundColor: '#ffebe9',
                  border: '1px dashed #ff4d4f',
                  borderRadius: '4px',
                  textAlign: 'center',
                  color: '#d9534f',
                  fontWeight: '500',
                }}
              >
                🔒 Text content hidden for privacy.
                <br />
                <span style={{ fontSize: '0.85rem', color: '#666' }}>
                  Click "Copy & Burn 🔥" to copy directly to your clipboard and self-destruct.
                </span>
              </div>
            ) : isDecrypting ? (
              <p style={{ color: '#888', fontStyle: 'italic' }}>Decrypting message...</p>
            ) : decryptionError ? (
              <p style={{ color: '#dc3545' }}>⚠️ Unable to decrypt content with current password.</p>
            ) : (
              <pre
                style={{
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  margin: '0',
                }}
              >
                {decryptedText}
              </pre>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <small style={{ color: '#888' }}>
              {new Date(item.uploaded_at).toLocaleTimeString()}
            </small>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" onClick={handleCopy} disabled={isDecrypting}>
                {copied
                  ? 'Copied!'
                  : item.burn_after_read
                  ? 'Copy & Burn 🔥'
                  : 'Copy Text'}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                style={{ color: '#dc3545', cursor: 'pointer' }}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* IMAGE TYPE */}
      {item.type === 'image' && (
        <>
          <div style={{ marginBottom: '12px' }}>
            {item.burn_after_read ? (
              <div
                style={{
                  padding: '20px',
                  backgroundColor: '#ffebe9',
                  border: '1px dashed #ff4d4f',
                  borderRadius: '4px',
                  textAlign: 'center',
                  color: '#d9534f',
                  fontWeight: '500',
                }}
              >
                🖼️ Image preview hidden to prevent auto-destruction.
                <br />
                <span style={{ fontSize: '0.85rem', color: '#666' }}>
                  Click below to download and reveal.
                </span>
              </div>
            ) : mediaUrl ? (
              <a href={mediaUrl} target="_blank" rel="noopener noreferrer">
                <img
                  src={mediaUrl}
                  alt={item.file_name || item.content || 'Uploaded image'}
                  style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </a>
            ) : (
              <p style={{ color: '#888', fontStyle: 'italic' }}>Loading image preview...</p>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <small style={{ color: '#888' }}>
              {new Date(item.uploaded_at).toLocaleTimeString()} • {(item.size_bytes / 1024).toFixed(1)} KB
            </small>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" onClick={handleDownload} disabled={isProcessingFile}>
                {isProcessingFile
                  ? 'Decrypting...'
                  : item.burn_after_read
                  ? 'Download & Burn 🔥'
                  : 'Download Image'}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                style={{ color: '#dc3545', cursor: 'pointer' }}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* VIDEO TYPE */}
      {item.type === 'video' && (
        <>
          <div style={{ marginBottom: '12px' }}>
            {item.burn_after_read ? (
              <div
                style={{
                  padding: '20px',
                  backgroundColor: '#ffebe9',
                  border: '1px dashed #ff4d4f',
                  borderRadius: '4px',
                  textAlign: 'center',
                  color: '#d9534f',
                  fontWeight: '500',
                }}
              >
                🎥 Video player hidden to prevent auto-destruction.
                <br />
                <span style={{ fontSize: '0.85rem', color: '#666' }}>
                  Click below to download and watch.
                </span>
              </div>
            ) : mediaUrl ? (
              <video
                controls
                src={mediaUrl}
                style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '4px', backgroundColor: '#000' }}
              />
            ) : (
              <p style={{ color: '#888', fontStyle: 'italic' }}>Loading video preview...</p>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <small style={{ color: '#888' }}>
              {new Date(item.uploaded_at).toLocaleTimeString()} • {(item.size_bytes / (1024 * 1024)).toFixed(2)} MB
            </small>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" onClick={handleDownload} disabled={isProcessingFile}>
                {isProcessingFile
                  ? 'Decrypting...'
                  : item.burn_after_read
                  ? 'Download & Burn 🔥'
                  : 'Download Video'}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                style={{ color: '#dc3545', cursor: 'pointer' }}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* GENERIC FILE TYPE */}
      {item.type === 'file' && (
        <>
          <div style={{ marginBottom: '12px', fontWeight: 'bold', wordBreak: 'break-all' }}>
            📄 {item.file_name || item.content || 'Unknown File'}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <small style={{ color: '#888' }}>
              {new Date(item.uploaded_at).toLocaleTimeString()} • {(item.size_bytes / 1024).toFixed(1)} KB
            </small>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" onClick={handleDownload} disabled={isProcessingFile}>
                {isProcessingFile
                  ? 'Decrypting...'
                  : item.burn_after_read
                  ? 'Download & Burn 🔥'
                  : 'Download File'}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                style={{ color: '#dc3545', cursor: 'pointer' }}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ItemList({ items, encryptionSalt, onItemDeleted, onItemRemoved }) {
  if (!items || items.length === 0) {
    return <p style={{ color: '#666' }}>No items in this room yet.</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {items.map((item) => (
        <ItemCard
          key={item.id}
          item={item}
          encryptionSalt={encryptionSalt}
          onItemDeleted={onItemDeleted}
          onItemRemoved={onItemRemoved}
        />
      ))}
    </div>
  );
}

export default ItemList;