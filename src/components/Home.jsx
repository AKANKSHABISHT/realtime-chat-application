import React, { useEffect, useState } from 'react';
import '../styles/home.scss';

const MIN_LENGTH = 2;
const MAX_LENGTH = 20;
const ROOM_CODE_LENGTH = 6;

function getValidation(username) {
  const trimmed = username.trim();

  if (!trimmed) {
    return {
      valid: false,
      message: 'Username is required.',
      trimmed,
    };
  }

  if (trimmed.length < MIN_LENGTH) {
    return {
      valid: false,
      message: 'Username must be at least 2 characters.',
      trimmed,
    };
  }

  if (trimmed.length > MAX_LENGTH) {
    return {
      valid: false,
      message: 'Username cannot exceed 20 characters.',
      trimmed,
    };
  }

  return {
    valid: true,
    message: '',
    trimmed,
  };
}

function isValidRoomCode(code) {
  return /^[A-Za-z0-9]{6}$/.test(code.trim());
}

function Home({
  username,
  onUsernameChange,
  theme,
  onToggleTheme,
  onCreateRoom,
  onJoinRoom,
  joinError: externalJoinError = '',
  initialJoinMode = false,
  initialRoomCode = '',
}) {
  const [touched, setTouched] = useState(false);
  const [joinMode, setJoinMode] = useState(
    () => Boolean(externalJoinError)
  );
  const [roomCode, setRoomCode] = useState(
    initialRoomCode || ''
  );

  const [roomTouched, setRoomTouched] = useState(false);
  const [joinError, setJoinError] = useState(
    externalJoinError
  );
  // Shared room URL
  const isSharedRoom = Boolean(
    initialRoomCode && initialRoomCode.trim()
  );
  useEffect(() => {
    if (externalJoinError) {
      setJoinError(externalJoinError);

      // Only show the room-code panel for normal
      // "Join Room" flow.
      if (!isSharedRoom) {
        setJoinMode(true);
      }
    }
  }, [externalJoinError, isSharedRoom]);

  useEffect(() => {
    if (initialRoomCode) {
      setRoomCode(
        initialRoomCode.trim().toUpperCase()
      );
    }
  }, [initialRoomCode]);

  const validation = getValidation(username);
  const isValid = validation.valid;
  const showError = touched && !isValid;

  const trimmedRoomCode = roomCode
    .trim()
    .toUpperCase();

  const roomCodeValid = isValidRoomCode(
    roomCode
  );

  const showRoomError =
    roomTouched &&
    joinMode &&
    !roomCodeValid &&
    roomCode.length > 0;

  const displayJoinError =
    joinError || externalJoinError;

  const handleChange = (e) => {
    const value = e.target.value.slice(
      0,
      MAX_LENGTH
    );

    onUsernameChange(value);
  };

  const persistUsername = () => {
    if (!isValid) return;

    sessionStorage.setItem(
      'chatUsername',
      validation.trimmed
    );

    onUsernameChange(
      validation.trimmed
    );
  };

  const handleBlur = () => {
    setTouched(true);

    if (isValid) {
      persistUsername();
    }
  };

  // CREATE ROOM
  const handleCreateRoom = () => {
    if (!isValid) {
      setTouched(true);
      return;
    }

    persistUsername();
    setJoinError('');

    onCreateRoom(
      validation.trimmed
    );
  };

  // Show normal Join Room flow
  const handleShowJoin = () => {
    if (!isValid) {
      setTouched(true);
      return;
    }

    persistUsername();
    setJoinError('');
    setJoinMode(true);
  };

  const handleRoomCodeChange = (e) => {
    const value = e.target.value
      .replace(/[^A-Za-z0-9]/g, '')
      .slice(0, ROOM_CODE_LENGTH)
      .toUpperCase();

    setRoomCode(value);
    setJoinError('');
  };

  // NORMAL JOIN USING ROOM CODE
  const handleJoinSubmit = () => {
    setRoomTouched(true);

    if (!isValid) {
      setTouched(true);
      return;
    }

    if (!roomCodeValid) {
      setJoinError(
        'Enter a valid 6-character room code.'
      );
      return;
    }

    persistUsername();
    setJoinError('');

    onJoinRoom(
      validation.trimmed,
      trimmedRoomCode
    );
  };

  // JOIN FROM SHARED ROOM LINK
  const handleSharedRoomJoin = () => {
    if (!isValid) {
      setTouched(true);
      return;
    }

    const code = initialRoomCode
      .trim()
      .toUpperCase();

    if (!isValidRoomCode(code)) {
      setJoinError(
        'This room link contains an invalid room code.'
      );
      return;
    }

    persistUsername();
    setJoinError('');

    // IMPORTANT:
    // This is the ONLY action that joins
    // the room from a shared URL.
    onJoinRoom(
      validation.trimmed,
      code
    );
  };

  // Username Enter key
  const handleUsernameKeyDown = (e) => {
    if (e.key !== 'Enter') return;

    /*
     * VERY IMPORTANT:
     *
     * If this is a shared room URL,
     * pressing Enter must NOT join/create anything.
     *
     * User must click "Join Room".
     */
    if (isSharedRoom) {
      e.preventDefault();
      return;
    }

    /*
     * In normal Join Room mode,
     * pressing Enter on username should
     * not create a room.
     */
    if (joinMode) {
      return;
    }

    if (!isValid) {
      return;
    }

    e.preventDefault();

    handleCreateRoom();
  };

  // Room-code Enter key
  const handleRoomCodeKeyDown = (e) => {
    if (
      e.key === 'Enter' &&
      isValid &&
      roomCodeValid
    ) {
      e.preventDefault();
      handleJoinSubmit();
    }
  };

  return (
    <div className="home">

      {/* Theme */}
      <button
        type="button"
        className="home-theme-btn"
        onClick={onToggleTheme}
        aria-label="Toggle theme"
      >
        {theme === 'light' ? '🌙' : '🌞'}
      </button>

      <div className="home-card">

        {/* Icon */}
        <div
          className="home-icon"
          aria-hidden="true"
        >
          ♟
        </div>

        {/* Title */}
        <h1 className="home-title">
          {isSharedRoom
            ? 'Welcome!'
            : 'REAL-TIME GAME CHAT'}
        </h1>

        {/* Tagline */}
        <p className="home-tagline">
          {isSharedRoom ? (
            <>
              You've been invited to join room{' '}
              <strong>
                {initialRoomCode}
              </strong>.
            </>
          ) : (
            <>
              Play together.
              <br />
              Chat together.
            </>
          )}
        </p>

        {/* Description */}
        <p className="home-description">
          {isSharedRoom
            ? 'Enter your username below to join the room.'
            : 'Create a room or join your friends and chat in real time.'}
        </p>

        <div className="home-form">

          {/* Username */}
          <label
            className="home-label"
            htmlFor="username"
          >
            Username{' '}
            <span className="home-required">
              *
            </span>
          </label>

          <input
            id="username"
            type="text"
            className={`home-input${
              showError
                ? ' home-input--invalid'
                : ''
            }`}
            placeholder="Enter your username"
            value={username}
            maxLength={MAX_LENGTH}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleUsernameKeyDown}
            autoComplete="username"
            autoCapitalize="off"
            spellCheck="false"
          />

          <div className="home-input-meta">

            <span
              className={`home-hint${
                showError
                  ? ' home-hint--error'
                  : ''
              }`}
            >
              {showError
                ? validation.message
                : '2–20 characters'}
            </span>

            <span className="home-count">
              {username.length}/{MAX_LENGTH}
            </span>

          </div>

          {/* ================================================= */}
          {/* SHARED ROOM URL                                  */}
          {/* ================================================= */}

          {isSharedRoom ? (

            <button
              type="button"
              className="home-action-btn"
              disabled={!isValid}
              onClick={handleSharedRoomJoin}
            >
              Join Room
            </button>

          ) : (

            /* ================================================= */
            /* NORMAL HOME PAGE                                 */
            /* ================================================= */

            !joinMode ? (
              <>
                <button
                  type="button"
                  className="home-action-btn"
                  disabled={!isValid}
                  onClick={handleCreateRoom}
                >
                  Create Room
                </button>

                <button
                  type="button"
                  className="home-action-btn home-action-btn--secondary"
                  disabled={!isValid}
                  onClick={handleShowJoin}
                >
                  Join Room
                </button>
              </>
            ) : (

              /* ================================================= */
              /* NORMAL JOIN BY ROOM CODE                          */
              /* ================================================= */

              <div className="home-join-panel">

                <label
                  className="home-label"
                  htmlFor="roomCode"
                >
                  Room Code{' '}
                  <span className="home-required">
                    *
                  </span>
                </label>

                <input
                  id="roomCode"
                  type="text"
                  className={`home-input home-input--code${
                    showRoomError ||
                    displayJoinError
                      ? ' home-input--invalid'
                      : ''
                  }`}
                  placeholder="Enter 6-digit code"
                  value={roomCode}
                  maxLength={ROOM_CODE_LENGTH}
                  onChange={handleRoomCodeChange}
                  onBlur={() =>
                    setRoomTouched(true)
                  }
                  onKeyDown={
                    handleRoomCodeKeyDown
                  }
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck="false"
                />

                <div className="home-input-meta">

                  <span
                    className={`home-hint${
                      showRoomError ||
                      displayJoinError
                        ? ' home-hint--error'
                        : ''
                    }`}
                  >
                    {displayJoinError ||
                      (showRoomError
                        ? 'Room code must be 6 characters.'
                        : '6-character code')}
                  </span>

                  <span className="home-count">
                    {roomCode.length}/
                    {ROOM_CODE_LENGTH}
                  </span>

                </div>

                <button
                  type="button"
                  className="home-action-btn"
                  disabled={
                    !isValid ||
                    !roomCodeValid
                  }
                  onClick={
                    handleJoinSubmit
                  }
                >
                  Join
                </button>

                <button
                  type="button"
                  className="home-action-btn home-action-btn--secondary"
                  onClick={() => {
                    setJoinMode(false);
                    setRoomCode('');
                    setRoomTouched(false);
                    setJoinError('');
                  }}
                >
                  Back
                </button>

              </div>
            )
          )}

          {/* Error for shared-room join */}
          {isSharedRoom &&
            displayJoinError && (
              <p
                className="home-hint home-hint--error"
                role="alert"
              >
                {displayJoinError}
              </p>
            )}

        </div>

        <ul className="home-features">
          <li>Real-time communication</li>
          <li>Secure rooms</li>
        </ul>

      </div>
    </div>
  );
}

export default Home;