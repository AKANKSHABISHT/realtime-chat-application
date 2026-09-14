const ROOM_PATH_PATTERN = /^\/room\/([A-Za-z0-9]{6})$/;

export function parseRoomRoute(pathname = window.location.pathname) {
  const match = pathname.match(ROOM_PATH_PATTERN);

  if (match) {
    return {
      view: 'room',
      roomId: match[1].toUpperCase(),
    };
  }

  return {
    view: 'home',
    roomId: '',
  };
}

export function navigateToRoom(roomId) {
  const code = roomId.toUpperCase();
  window.history.pushState({}, '', `/room/${code}`);
  return parseRoomRoute(`/room/${code}`);
}

export function navigateToHome() {
  window.history.pushState({}, '', '/');
  return parseRoomRoute('/');
}

export function getRoomShareUrl(roomId) {
  return `${window.location.origin}/room/${roomId.toUpperCase()}`;
}
