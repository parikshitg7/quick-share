import React, { useState } from 'react';
import { createTextItem, getRoom, getRoomPassword } from '../services/api';
import { encryptText } from '../utils/crypto';

function TextDropForm({ roomId, onItemAdded }) {
  const [content, setContent] = useState('');
  const [burnAfterRead, setBurnAfterRead] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      let payloadContent = content.trim();
      const password = getRoomPassword();

      if (password) {
        const room = await getRoom(roomId);
        if (room?.encryption_salt) {
          payloadContent = await encryptText(payloadContent, password, room.encryption_salt);
        }
      }

      await createTextItem(roomId, payloadContent, burnAfterRead);
      setContent('');
      setBurnAfterRead(false);
      if (onItemAdded) onItemAdded();
    } catch (err) {
      console.error('Error submitting text item:', err);
      if (err.status === 429) {
        setError('Rate limit exceeded. Too many requests. Please try again later.');
      } else {
        setError(err.message || 'Failed to send text. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: '1rem', marginBottom: '1.5rem' }}>
      <textarea
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          if (error) setError(null);
        }}
        placeholder="Paste or type text here..."
        rows={4}
        style={{ width: '100%', maxWidth: '600px', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
        disabled={isSubmitting}
      />
      
      <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input
          type="checkbox"
          id="text-burn-after-read"
          checked={burnAfterRead}
          onChange={(e) => setBurnAfterRead(e.target.checked)}
          disabled={isSubmitting}
        />
        <label htmlFor="text-burn-after-read" style={{ fontSize: '0.9rem', color: '#555', cursor: 'pointer' }}>
          🔥 Delete after viewing (Burn-after-read)
        </label>
      </div>

      <button
        type="submit"
        disabled={isSubmitting || !content.trim()}
        style={{ marginTop: '8px', padding: '8px 16px', cursor: 'pointer' }}
      >
        {isSubmitting ? 'Sharing...' : 'Share Text'}
      </button>

      {error && (
        <p style={{ color: 'red', marginTop: '8px', marginBottom: 0, fontSize: '0.9rem' }}>
          {error}
        </p>
      )}
    </form>
  );
}

export default TextDropForm;