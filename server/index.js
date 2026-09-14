const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, '../dist')));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
});

const users = {};
const rooms = new Set();
const userRooms = {};

const ROOM_CODE_LENGTH = 6;
const ROOM_CODE_PATTERN = /^[A-Z0-9]{6}$/;

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';

  do {
    code = '';
    for (let i = 0; i < ROOM_CODE_LENGTH; i += 1) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
  } while (rooms.has(code));

  return code;
}

async function getRoomUsers(roomId) {
  const sockets = await io.in(roomId).fetchSockets();

  return sockets.map((socket) => ({
    id: socket.id,
    username: users[socket.id] || 'Guest',
  }));
}

async function broadcastRoomUsers(roomId) {
  if (!roomId) return;

  const userList = await getRoomUsers(roomId);
  io.to(roomId).emit('room users', userList);
}

function cleanupRoom(roomId) {
  if (!roomId) return;

  setTimeout(() => {
    io.in(roomId).fetchSockets().then((sockets) => {
      if (sockets.length === 0) {
        rooms.delete(roomId);
        console.log(`Room removed: ${roomId}`);
      }
    });
  }, 3000);
}

function leaveCurrentRoom(socket) {
  const roomId = userRooms[socket.id];

  if (!roomId) return roomId;

  socket.leave(roomId);
  delete userRooms[socket.id];
  broadcastRoomUsers(roomId);
  cleanupRoom(roomId);

  return roomId;
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('register', (username) => {
    users[socket.id] = username?.trim() || socket.id;

    console.log(
      `Registered: ${socket.id} -> ${users[socket.id]}`
    );

    const roomId = userRooms[socket.id];
    if (roomId) {
      broadcastRoomUsers(roomId);
    }
  });

  socket.on('create room', async (callback) => {
    leaveCurrentRoom(socket);

    const roomId = generateRoomCode();
    rooms.add(roomId);
    socket.join(roomId);
    userRooms[socket.id] = roomId;

    console.log(`Room created: ${roomId} by ${socket.id}`);

    await broadcastRoomUsers(roomId);

    if (typeof callback === 'function') {
      callback({ success: true, roomId });
    }
  });

  socket.on('join room', async ({ roomId }, callback) => {
    const code = roomId?.trim().toUpperCase();

    if (!code || !ROOM_CODE_PATTERN.test(code) || !rooms.has(code)) {
      if (typeof callback === 'function') {
        callback({
          success: false,
          error: 'Room not found. Check the code and try again.',
        });
      }
      return;
    }

    leaveCurrentRoom(socket);

    socket.join(code);
    userRooms[socket.id] = code;

    console.log(`${socket.id} joined room ${code}`);

    await broadcastRoomUsers(code);

    if (typeof callback === 'function') {
      callback({ success: true, roomId: code });
    }
  });

  socket.on('chat message', (msg) => {
    const username = users[socket.id] || socket.id;
    const roomId = userRooms[socket.id];

    if (!roomId) {
      return;
    }

    const message = {
      id: socket.id,
      user: username,
      text: msg.text,
    };

    console.log('Message from:', username, 'in room:', roomId);

    io.to(roomId).emit('chat message', message);
  });

  socket.on('typing', (data) => {
    const username = users[socket.id] || socket.id;
    const roomId = userRooms[socket.id];

    if (!roomId) {
      return;
    }

    const isTyping = Boolean(data?.typing);

    console.log('TYPING EVENT:', username, isTyping, 'in room:', roomId);

    socket.to(roomId).emit('typing', {
      typing: isTyping,
      user: username,
    });
  });

  socket.on('leave room', async () => {
    const roomId = leaveCurrentRoom(socket);
    console.log(`User left room: ${socket.id}`, roomId || '');
  });

  socket.on('disconnect', () => {
    const roomId = userRooms[socket.id];
    const username = users[socket.id];

    delete users[socket.id];
    delete userRooms[socket.id];

    if (roomId) {
      if (username) {
        socket.to(roomId).emit('typing', {
          typing: false,
          user: username,
        });
      }

      broadcastRoomUsers(roomId);
      cleanupRoom(roomId);
    }

    console.log('User disconnected:', socket.id);
  });
});

app.get(/^\/room\/[A-Za-z0-9]{6}$/, (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.get(/^(?!\/socket\.io).*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});
