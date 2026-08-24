import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

function RoomAccessPanel({ roomId, shortCode }) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const roomUrl = window.location.href;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(roomUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(shortCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (err) {
      console.error('Failed to copy short code:', err);
    }
  };

  return (
    <div
      style={{
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '24px',
        backgroundColor: '#fafafa',
        maxWidth: '600px',
      }}
    >
      <h3>Room Access</h3>
      <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ padding: '8px', backgroundColor: '#fff', border: '1px solid #eee', borderRadius: '4px' }}>
          <QRCodeSVG value={roomUrl} size={128} />
        </div>

        <div style={{ flex: 1, minWidth: '220px' }}>
          <div style={{ marginBottom: '12px' }}>
            <strong style={{ display: 'block', marginBottom: '4px' }}>Short Code:</strong>
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: '1.1rem',
                backgroundColor: '#eee',
                padding: '4px 8px',
                borderRadius: '4px',
                marginRight: '8px',
              }}
            >
              {shortCode}
            </span>
            <button type="button" onClick={handleCopyCode}>
              {copiedCode ? 'Copied!' : 'Copy Code'}
            </button>
          </div>

          <div>
            <strong style={{ display: 'block', marginBottom: '4px' }}>Direct Link:</strong>
            <button type="button" onClick={handleCopyLink}>
              {copiedLink ? 'Link Copied!' : 'Copy Room Link'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RoomAccessPanel;