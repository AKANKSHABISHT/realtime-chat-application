import React, { useState } from 'react';

function ShareRoom({ roomId }) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [shareMessage, setShareMessage] = useState('');

  if (!roomId) {
    return null;
  }

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopiedCode(true);
      setShareMessage('Room code copied!');
      setTimeout(() => {
        setCopiedCode(false);
        setShareMessage('');
      }, 2500);
    } catch {
      setShareMessage('Could not copy. Please copy manually.');
      setTimeout(() => setShareMessage(''), 2500);
    }
  };

  return (
    <section className="share-room" aria-label="Share room code">
      <div className="share-room-hero">
        <span className="share-room-hero-label">Room Code</span>
        <div className="share-room-hero-code">{roomId}</div>
        <button
          type="button"
          className="share-room-btn share-room-btn--hero"
          onClick={handleCopyCode}
        >
          {copiedCode ? 'Copied!' : 'Copy Room Code'}
        </button>
      </div>

      <p className="share-room-hint">
        Share this code with friends so they can join your room.
      </p>

      {shareMessage && (
        <p className="share-room-feedback" role="status">{shareMessage}</p>
      )}
    </section>
  );
}

export default ShareRoom;
