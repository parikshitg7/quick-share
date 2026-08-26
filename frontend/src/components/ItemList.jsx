import React, { useState } from 'react';
import { getItemDownloadUrl, deleteItem } from '../services/api';

function ItemList({ items, onItemDeleted }) {
  const [copiedId, setCopiedId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const handleCopy = async (id, content) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await deleteItem(id);
      if (onItemDeleted) {
        onItemDeleted();
      }
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
              border: '1px solid #ccc',
              borderRadius: '8px',
              padding: '16px',
              backgroundColor: '#f9f9f9',
              maxWidth: '600px',
            }}
          >
            {/* TEXT TYPE */}
            {item.type === 'text' && (
              <>
                <pre
                  style={{
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    margin: '0 0 12px 0',
                  }}
                >
                  {item.content}
                </pre>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <small style={{ color: '#888' }}>
                    {new Date(item.uploaded_at).toLocaleTimeString()}
                  </small>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="button" onClick={() => handleCopy(item.id, item.content)}>
                      {copiedId === item.id ? 'Copied!' : 'Copy Text'}
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
                  <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                    <img
                      src={downloadUrl}
                      alt={item.content || 'Uploaded image'}
                      style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '4px', border: '1px solid #ddd' }}
                    />
                  </a>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <small style={{ color: '#888' }}>
                    {new Date(item.uploaded_at).toLocaleTimeString()} • {(item.size_bytes / 1024).toFixed(1)} KB
                  </small>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <a href={downloadUrl} download={item.content || 'download'}>
                      <button type="button">Download Image</button>
                    </a>
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
                  <video
                    controls
                    src={downloadUrl}
                    style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '4px', backgroundColor: '#000' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <small style={{ color: '#888' }}>
                    {new Date(item.uploaded_at).toLocaleTimeString()} • {(item.size_bytes / (1024 * 1024)).toFixed(2)} MB
                  </small>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <a href={downloadUrl} download={item.content || 'download'}>
                      <button type="button">Download Video</button>
                    </a>
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
                    <a href={downloadUrl} download={item.content || 'download'}>
                      <button type="button">Download File</button>
                    </a>
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