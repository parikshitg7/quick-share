import React, { useState } from 'react';

function ItemList({ items }) {
  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = async (id, content) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  if (!items || items.length === 0) {
    return <p style={{ color: '#666' }}>No items in this room yet.</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {items.map((item) => (
        <div
          key={item.id}
          style={{
            border: '1px solid #ccc',
            borderRadius: '6px',
            padding: '12px',
            backgroundColor: '#f9f9f9',
            maxWidth: '600px',
          }}
        >
          <pre
            style={{
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              margin: '0 0 8px 0',
            }}
          >
            {item.content}
          </pre>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <small style={{ color: '#888' }}>
              {new Date(item.uploaded_at).toLocaleTimeString()}
            </small>
            <button type="button" onClick={() => handleCopy(item.id, item.content)}>
              {copiedId === item.id ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ItemList;