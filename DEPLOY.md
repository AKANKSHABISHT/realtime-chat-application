# Deploy to EC2 (cost-effective)

One server runs both the React app and Socket.IO on **port 3001** — no extra services needed.

## EC2 setup (one time)

1. **Security group** — allow inbound TCP **3001** from `0.0.0.0/0` (or your IP range).
2. **Install Node.js 20+** on the instance:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs git
   ```
3. **Install PM2** (keeps the app running after logout):
   ```bash
   sudo npm install -g pm2
   ```

## Deploy from GitHub

```bash
cd ~
git clone https://github.com/YOUR_USERNAME/chat-app.git
cd chat-app
chmod +x scripts/deploy-ec2.sh
./scripts/deploy-ec2.sh
```

## Update after changes

```bash
cd ~/chat-app
git pull
./scripts/deploy-ec2.sh
```

## Access the app

Open in any browser/device:

```
http://18.209.18.122:3001
```

Share the **room code** so others on different networks can join the same room.

## Cost tips

- Use a **single small EC2 instance** (e.g. `t3.micro` free tier).
- One Node process serves static files + WebSockets — no separate database or Redis.
- Stop the instance when not in use to save money.

## PM2 commands

```bash
pm2 status
pm2 logs chat-app
pm2 restart chat-app
```
