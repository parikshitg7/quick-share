import React, { useState } from 'react';
import { createTextItem } from '../services/api';

function TextDropForm({ roomId, onItemAdded }) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await createTextItem(roomId, content.trim());
      setContent('');
      if (onItemAdded) {
        onItemAdded();
      }
    } catch (err) {
      console.error('Failed to post text item:', err);
      setError('Failed to share text. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ marginBottom: '2rem' }}>
      <form onSubmit={handleSubmit}>
        <div>
          <textarea
            rows="4"
            style={{ width: '100%', maxWidth: '600px', padding: '8px', boxSizing: 'border-box' }}
            placeholder="Type or paste text to share..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={isSubmitting || !content.trim()} style={{ marginTop: '8px' }}>
          {isSubmitting ? 'Sharing...' : 'Share Text'}
        </button>
      </form>
    </div>
  );
}

export default TextDropForm;