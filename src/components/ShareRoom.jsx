import React, { useState } from 'react';

function ShareRoom({ roomId }) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [shareMessage, setShareMessage] = useState('');

  if (!roomId) {
    return null;
  }

  const handleCopyCode = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(roomId);
      } else {
        const textArea = document.createElement('textarea');

        textArea.value = roomId;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '0';
        textArea.style.opacity = '0';

        document.body.appendChild(textArea);

        textArea.focus();
        textArea.select();

        const copied = document.execCommand('copy');

        document.body.removeChild(textArea);

        if (!copied) {
          throw new Error('Copy command failed');
        }
      }

      setCopiedCode(true);
      setShareMessage('Room code copied!');

      setTimeout(() => {
        setCopiedCode(false);
        setShareMessage('');
      }, 2500);
    } catch (error) {
      console.error('Failed to copy room code:', error);

      setShareMessage('Could not copy. Please copy manually.');

      setTimeout(() => {
        setShareMessage('');
      }, 2500);
    }
  };

  return (
    <div className="share-room" aria-label="Share room code">
      <div className="share-room-hero">
        <button
          type="button"
          className="share-room-btn share-room-btn--hero"
          onClick={handleCopyCode}
          aria-label="Copy room code"
        >
          {copiedCode ? 'Copied!' : 'Copy'}
        </button>
      </div>

      {shareMessage && (
        <p className="share-room-feedback" role="status">
          {shareMessage}
        </p>
      )}
    </div>
  );
}

export default ShareRoom;