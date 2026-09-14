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
    return view === 'room' && sessionStorage.getItem('chatRoomId') ? 'join' : 'create';
  });
  const [joinError, setJoinError] = useState('');

  useEffect(() => {
    const handlePopState = () => {
      setRoute(parseRoomRoute());
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleCreateRoom = (trimmedUsername) => {
    setUsername(trimmedUsername);
    sessionStorage.setItem('chatUsername', trimmedUsername);
    sessionStorage.removeItem('chatRoomId');
    setRoomMode('create');
    setJoinError('');
    setRoute({ view: 'room', roomId: '' });
  };

  const handleJoinRoom = (trimmedUsername, code) => {
    const upperCode = code.trim().toUpperCase();
    setUsername(trimmedUsername);
    sessionStorage.setItem('chatUsername', trimmedUsername);
    sessionStorage.setItem('chatRoomId', upperCode);
    setRoomMode('join');
    setJoinError('');
    setRoute(navigateToRoom(upperCode));
  };

  const handleRoomReady = (roomId) => {
    sessionStorage.setItem('chatRoomId', roomId);
    setRoute(navigateToRoom(roomId));
  };

  const handleLeaveRoom = () => {
    sessionStorage.removeItem('chatRoomId');
    setJoinError('');
    setRoute(navigateToHome());
  };

  const handleJoinFailed = (error) => {
    sessionStorage.removeItem('chatRoomId');
    setJoinError(error);
    setRoute(navigateToHome());
  };

  const isHome = route.view === 'home';
  const isRoom = route.view === 'room';
  const hasUsername = Boolean(username.trim());

  if (isRoom && !hasUsername) {
    return (
      <div className={`app ${theme} app--home`}>
        <Home
          username={username}
          onUsernameChange={setUsername}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          joinError={joinError || 'Please enter a username to join this room.'}
          initialJoinMode={Boolean(route.roomId)}
          initialRoomCode={route.roomId}
        />
      </div>
    );
  }

  return (
    <div className={`app ${theme}${isHome ? ' app--home' : ''}`}>
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
