import React, { useState } from 'react';
import { getItemDownloadUrl, deleteItem, markItemViewed } from '../services/api';

function ItemList({ items, onItemDeleted, onItemRemoved }) {
  const [copiedId, setCopiedId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const notifyRemoved = (id) => {
    if (onItemRemoved) onItemRemoved(id);
    if (onItemDeleted) onItemDeleted(id);
  };

  const handleCopy = async (item) => {
    try {
      await navigator.clipboard.writeText(item.content);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);

      if (item.burn_after_read) {
        await markItemViewed(item.id);
        notifyRemoved(item.id);
      }
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleDownload = (item) => {
    const downloadUrl = getItemDownloadUrl(item.id);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = item.content || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (item.burn_after_read) {
      setTimeout(() => {
        notifyRemoved(item.id);
      }, 500);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await deleteItem(id);
      notifyRemoved(id);
    } catch (err) {
      console.error('Failed to delete item:', err);
      alert('Failed to delete item. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  if (!items || items.length === 0) {
    return <p style={{ color: '#666' }}>No items in this room yet.</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {items.map((item) => {
        const downloadUrl = getItemDownloadUrl(item.id);

        return (
          <div
            key={item.id}
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
                  ) : (
                    <pre
                      style={{
                        fontFamily: 'monospace',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        margin: '0',
                      }}
                    >
                      {item.content}
                    </pre>
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <small style={{ color: '#888' }}>
                    {new Date(item.uploaded_at).toLocaleTimeString()}
                  </small>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="button" onClick={() => handleCopy(item)}>
                      {copiedId === item.id
                        ? 'Copied!'
                        : item.burn_after_read
                        ? 'Copy & Burn 🔥'
                        : 'Copy Text'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      style={{ color: '#dc3545', cursor: 'pointer' }}
                    >
                      {deletingId === item.id ? 'Deleting...' : 'Delete'}
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
                  ) : (
                    <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                      <img
                        src={downloadUrl}
                        alt={item.content || 'Uploaded image'}
                        style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '4px', border: '1px solid #ddd' }}
                      />
                    </a>
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <small style={{ color: '#888' }}>
                    {new Date(item.uploaded_at).toLocaleTimeString()} • {(item.size_bytes / 1024).toFixed(1)} KB
                  </small>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="button" onClick={() => handleDownload(item)}>
                      {item.burn_after_read ? 'Download & Burn 🔥' : 'Download Image'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      style={{ color: '#dc3545', cursor: 'pointer' }}
                    >
                      {deletingId === item.id ? 'Deleting...' : 'Delete'}
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
                  ) : (
                    <video
                      controls
                      src={downloadUrl}
                      style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '4px', backgroundColor: '#000' }}
                    />
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <small style={{ color: '#888' }}>
                    {new Date(item.uploaded_at).toLocaleTimeString()} • {(item.size_bytes / (1024 * 1024)).toFixed(2)} MB
                  </small>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="button" onClick={() => handleDownload(item)}>
                      {item.burn_after_read ? 'Download & Burn 🔥' : 'Download Video'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      style={{ color: '#dc3545', cursor: 'pointer' }}
                    >
                      {deletingId === item.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* GENERIC FILE TYPE */}
            {item.type === 'file' && (
              <>
                <div style={{ marginBottom: '12px', fontWeight: 'bold', wordBreak: 'break-all' }}>
                  📄 {item.content || 'Unknown File'}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <small style={{ color: '#888' }}>
                    {new Date(item.uploaded_at).toLocaleTimeString()} • {(item.size_bytes / 1024).toFixed(1)} KB
                  </small>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="button" onClick={() => handleDownload(item)}>
                      {item.burn_after_read ? 'Download & Burn 🔥' : 'Download File'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      style={{ color: '#dc3545', cursor: 'pointer' }}
                    >
                      {deletingId === item.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default ItemList;