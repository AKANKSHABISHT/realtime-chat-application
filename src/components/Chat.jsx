import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import EmojiPicker from 'emoji-picker-react';

import { getSocketUrl } from '../config/socket';

const SOCKET_TIMEOUT_MS = 10000;

function Chat({
  username,
  roomMode,
  initialRoomId,
  onLeaveRoom,
  onJoinFailed,
  onRoomReady,
  onOnlineUsersUpdate,
  onSocketConnected,
  embedded = false,
}) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [myId, setMyId] = useState('');
  const [roomId, setRoomId] = useState(initialRoomId || '');
  const [roomReady, setRoomReady] = useState(false);
  const [usernameSet, setUsernameSet] = useState(false);
  const [toast, setToast] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const [showEmoji, setShowEmoji] = useState(false);

  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const toastTimeoutRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const joinedRoomRef = useRef('');
  const onLeaveRoomRef = useRef(onLeaveRoom);
  const onJoinFailedRef = useRef(onJoinFailed);
  const onRoomReadyRef = useRef(onRoomReady);
  const onOnlineUsersUpdateRef = useRef(onOnlineUsersUpdate);
  const onSocketConnectedRef = useRef(onSocketConnected);

  onLeaveRoomRef.current = onLeaveRoom;
  onJoinFailedRef.current = onJoinFailed;
  onRoomReadyRef.current = onRoomReady;
  onOnlineUsersUpdateRef.current = onOnlineUsersUpdate;
  onSocketConnectedRef.current = onSocketConnected;

  const showToast = (msg, duration = 2500) => {
    setToast(msg);

    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }

    toastTimeoutRef.current = setTimeout(() => {
      setToast('');
      toastTimeoutRef.current = null;
    }, duration);
  };

  const formatTypingLabel = (users) => {
    if (users.length === 1) {
      return `${users[0]} is typing`;
    }

    if (users.length === 2) {
      return `${users[0]} and ${users[1]} are typing`;
    }

    return `${users[0]}, ${users[1]} and others are typing`;
  };

  const markRoomReady = (id) => {
    joinedRoomRef.current = id;
    setRoomId(id);
    sessionStorage.setItem('chatRoomId', id);
    setRoomReady(true);
    onRoomReadyRef.current?.(id);
  };

  useEffect(() => {
    const socket = io(getSocketUrl(), {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    const failJoin = (errorMessage) => {
      showToast(errorMessage);
      onJoinFailedRef.current?.(errorMessage);
    };

    const joinExistingRoom = (targetRoomId) => {
      socket.timeout(SOCKET_TIMEOUT_MS).emit(
        'join room',
        { roomId: targetRoomId },
        (err, response) => {
          if (err) {
            failJoin('Server did not respond. Make sure the backend is running.');
            return;
          }

          if (response?.success) {
            markRoomReady(response.roomId);
            showToast(`Joined room ${response.roomId}`);
            return;
          }

          failJoin(response?.error || 'Room not found. Check the code and try again.');
        }
      );
    };

    const createNewRoom = () => {
      socket.timeout(SOCKET_TIMEOUT_MS).emit('create room', (err, response) => {
        if (err) {
          failJoin('Server did not respond. Make sure the backend is running on port 3001.');
          return;
        }

        if (response?.success) {
          markRoomReady(response.roomId);
          showToast(`Room ${response.roomId} created!`);
          return;
        }

        failJoin('Could not create room. Please try again.');
      });
    };

    const registerAndJoinRoom = () => {
      const trimmedName = username?.trim();

      if (!trimmedName) {
        showToast('Username is required.');
        onLeaveRoomRef.current();
        return;
      }

      socket.emit('register', trimmedName);
      setUsernameSet(true);

      if (joinedRoomRef.current) {
        joinExistingRoom(joinedRoomRef.current);
        return;
      }

      if (roomMode === 'create') {
        createNewRoom();
        return;
      }

      if (!initialRoomId) {
        failJoin('Room code is missing.');
        return;
      }

      joinExistingRoom(initialRoomId);
    };

    const handleConnect = () => {
      console.log('CONNECTED:', socket.id);
      setMyId(socket.id);
      onSocketConnectedRef.current?.(socket.id);
      registerAndJoinRoom();
    };

    const handleConnectError = (error) => {
      console.error('Socket connection error:', error.message);
      showToast('Cannot connect to server. Start it with: cd server && node index.js');
    };

    const handleChatMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
      setTypingUsers((prev) => prev.filter((name) => name !== msg.user));
    };

    const handleTyping = ({ typing, user }) => {
      const trimmedName = username?.trim();

      if (!user || user === trimmedName) {
        return;
      }

      setTypingUsers((prev) => {
        if (typing) {
          if (prev.includes(user)) {
            return prev;
          }
          return [...prev, user];
        }

        return prev.filter((name) => name !== user);
      });
    };

    const handleRoomUsers = (users) => {
      onOnlineUsersUpdateRef.current?.(users);
    };

    socket.on('connect', handleConnect);
    socket.on('connect_error', handleConnectError);
    socket.on('chat message', handleChatMessage);
    socket.on('typing', handleTyping);
    socket.on('room users', handleRoomUsers);

    return () => {
      if (joinedRoomRef.current) {
        socket.emit('leave room');
      }

      socket.off('connect', handleConnect);
      socket.off('connect_error', handleConnectError);
      socket.off('chat message', handleChatMessage);
      socket.off('typing', handleTyping);
      socket.off('room users', handleRoomUsers);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      socket.disconnect();
      socketRef.current = null;
      joinedRoomRef.current = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior, block: 'end' });
  };

  useEffect(() => {
    if (!roomReady) return;

    const frame = requestAnimationFrame(() => {
      scrollToBottom(messages.length <= 1 ? 'auto' : 'smooth');
    });

    return () => cancelAnimationFrame(frame);
  }, [messages, typingUsers, roomReady]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target)
      ) {
        setShowEmoji(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const stopTyping = () => {
    const socket = socketRef.current;

    if (socket?.connected) {
      socket.emit('typing', { typing: false });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  const emitTyping = () => {
    const socket = socketRef.current;

    if (!socket?.connected || !roomReady) {
      return;
    }

    socket.emit('typing', { typing: true });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 2000);
  };

  const sendMessage = () => {
    if (!usernameSet || !roomReady) {
      showToast('Still connecting to the room...');
      return;
    }

    const text = message.trim();

    if (!text) {
      return;
    }

    const socket = socketRef.current;

    if (!socket?.connected) {
      showToast('Not connected to server.');
      return;
    }

    socket.emit('chat message', { text });

    stopTyping();
    setMessage('');
    setShowEmoji(false);
  };

  const handleTyping = (e) => {
    const value = e.target.value;
    setMessage(value);

    const socket = socketRef.current;

    if (!socket?.connected || !roomReady) {
      return;
    }

    if (!value.trim()) {
      stopTyping();
      return;
    }

    emitTyping();
  };

  const onEmojiClick = (emojiData) => {
    setMessage((prev) => prev + emojiData.emoji);
    emitTyping();
  };

  const handleInputBlur = () => {
    stopTyping();
  };

  const chatEnabled = usernameSet && roomReady;

  return (
    <>
      {toast && (
        <div className="toast">
          <div className="toast-message">{toast}</div>
          <div className="toast-progress"></div>
        </div>
      )}

      <div className={`chat-container${embedded ? ' chat-container--embedded' : ''}`}>
        {!embedded && (
          <div className="chat-header">
            <span className="chat-header-title">
              {roomId ? `Room ${roomId}` : '💬 Game Chat'}
            </span>
          </div>
        )}

        <div className="chat-box">
          {!roomReady && (
            <div className="chat-status">
              {roomMode === 'create' ? 'Creating room...' : 'Joining room...'}
            </div>
          )}

          {messages.map((msg, index) => (
            <div
              key={`${msg.id}-${index}`}
              className={`chat-message ${msg.id === myId ? 'you' : 'other'}`}
            >
              <div className="username">{msg.user}</div>
              <div className="text">{msg.text}</div>
            </div>
          ))}

          {typingUsers.length > 0 && (
            <div className="typing-indicator" role="status" aria-live="polite">
              <span className="typing-indicator-text">
                {formatTypingLabel(typingUsers)}
              </span>
              <span className="typing-dots" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
            </div>
          )}

          <div ref={messagesEndRef} className="chat-scroll-anchor" aria-hidden="true" />
        </div>

        {showEmoji && (
          <div className="emoji-picker" ref={emojiPickerRef}>
            <EmojiPicker
              onEmojiClick={onEmojiClick}
              skinTonesDisabled
              autoFocusSearch={false}
            />
          </div>
        )}

        <div className="chat-input">
          <button
            type="button"
            className="emoji-btn"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowEmoji((prev) => !prev);
            }}
            aria-label="Open emoji picker"
          >
            😊
          </button>
          <input
            type="text"
            className="chat-message-input"
            placeholder={chatEnabled ? 'Type a message...' : 'Connecting to room...'}
            value={message}
            disabled={!chatEnabled}
            onChange={handleTyping}
            onBlur={handleInputBlur}
            enterKeyHint="send"
            autoComplete="off"
            autoCorrect="off"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                sendMessage();
              }
            }}
          />

          <button
            type="button"
            className="chat-send-btn"
            onClick={sendMessage}
            disabled={!chatEnabled}
          >
            Send
          </button>
        </div>
      </div>
    </>
  );
}

export default Chat;
