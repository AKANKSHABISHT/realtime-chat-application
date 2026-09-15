import React, { useEffect, useState } from 'react';

import Home from './components/Home';
import Room from './components/Room';
import {
  navigateToHome,
  navigateToRoom,
  parseRoomRoute,
} from './utils/routing';

import './styles/main.scss';
import './styles/chat.scss';
import './styles/home.scss';
import './styles/room.scss';

function App() {
  const [username, setUsername] = useState(
    () => sessionStorage.getItem('chatUsername') || ''
  );
  const [theme, setTheme] = useState('light');
  const [route, setRoute] = useState(() => parseRoomRoute());
  const [roomMode, setRoomMode] = useState(() => {
    const { view } = parseRoomRoute();
    return view === 'room' && sessionStorage.getItem('chatRoomId')
      ? 'join'
      : 'create';
  });

  // IMPORTANT:
  // false = user has NOT clicked Create Room / Join Room
  // true  = user explicitly clicked one of those buttons
  const [joinRequested, setJoinRequested] = useState(false);

  const [joinError, setJoinError] = useState('');

  useEffect(() => {
    const handlePopState = () => {
      setRoute(parseRoomRoute());
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // CREATE ROOM
  const handleCreateRoom = (trimmedUsername) => {
    // User explicitly clicked Create Room.
    setJoinRequested(true);

    setUsername(trimmedUsername);

    sessionStorage.setItem(
      'chatUsername',
      trimmedUsername
    );

    sessionStorage.removeItem('chatRoomId');

    setRoomMode('create');
    setJoinError('');

    setRoute({
      view: 'room',
      roomId: '',
    });
  };

  // JOIN EXISTING ROOM
  const handleJoinRoom = (trimmedUsername, code) => {
    const upperCode = code.trim().toUpperCase();

    // User explicitly clicked Join Room.
    setJoinRequested(true);

    setUsername(trimmedUsername);

    sessionStorage.setItem(
      'chatUsername',
      trimmedUsername
    );

    sessionStorage.setItem(
      'chatRoomId',
      upperCode
    );

    setRoomMode('join');
    setJoinError('');

    setRoute(
      navigateToRoom(upperCode)
    );
  };

  const handleRoomReady = (roomId) => {
    sessionStorage.setItem(
      'chatRoomId',
      roomId
    );

    setRoute(
      navigateToRoom(roomId)
    );
  };

  const handleLeaveRoom = () => {
    // After leaving, require another explicit action.
    setJoinRequested(false);

    sessionStorage.removeItem('chatRoomId');

    setJoinError('');

    setRoute(
      navigateToHome()
    );
  };

  const handleJoinFailed = (error) => {
    setJoinRequested(false);

    sessionStorage.removeItem('chatRoomId');

    setJoinError(error);

    setRoute(
      navigateToHome()
    );
  };

  const isHome = route.view === 'home';
  const isRoom = route.view === 'room';

  /*
   * IMPORTANT:
   *
   * If the user opens:
   *
   * /room/FZWYNV
   *
   * joinRequested is false.
   *
   * Therefore Home stays visible even when username
   * changes.
   *
   * Typing a username CANNOT open Room.
   *
   * Only handleJoinRoom() or handleCreateRoom()
   * can set joinRequested to true.
   */

  if (isRoom && !joinRequested) {
    return (
      <div className={`app ${theme} app--home`}>
        <Home
          username={username}
          onUsernameChange={setUsername}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          joinError={joinError}
          initialJoinMode={Boolean(route.roomId)}
          initialRoomCode={route.roomId}
        />
      </div>
    );
  }

  return (
    <div
      className={`app ${
        theme
      }${isHome ? ' app--home' : ''}`}
    >
      {isHome ? (
        <Home
          username={username}
          onUsernameChange={setUsername}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          joinError={joinError}
        />
      ) : (
        <Room
          username={username}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          roomMode={roomMode}
          initialRoomId={route.roomId}
          onLeaveRoom={handleLeaveRoom}
          onJoinFailed={handleJoinFailed}
          onRoomReady={handleRoomReady}
        />
      )}
    </div>
  );
}

export default App;