# Real-Time Gaming Chat App

A room-based real-time chat app built with React, Vite, Node.js, Express, and Socket.IO.

## Features

- Username flow with session storage
- Create / join rooms with 6-character room codes
- Real-time messaging and typing indicators
- Online users list per room
- Mobile & tablet responsive UI

## Local development

```bash
# Terminal 1 — backend
cd server
npm install
npm start

# Terminal 2 — frontend
npm install
npm run dev
```

Open `http://localhost:5173` (or the port Vite prints).

## Production (EC2)

See **[DEPLOY.md](./DEPLOY.md)** for full EC2 setup.

Quick deploy on server:

```bash
git clone https://github.com/YOUR_USERNAME/chat-app.git
cd chat-app
chmod +x scripts/deploy-ec2.sh
./scripts/deploy-ec2.sh
```

App URL: `http://18.209.18.122:3001`

## Cost-effective architecture

- **One EC2 instance** serves both the React build and Socket.IO on port **3001**
- No database, Redis, or separate API server required
- Use `t3.micro` (free tier) and stop the instance when not in use
