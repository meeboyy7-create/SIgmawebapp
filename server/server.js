/**
 * SigmaVision Server
 *
 * Per-user session isolation:
 *   Each caregiver has a roomId (their Firebase UID).
 *   - Dashboard WS sends  { type:'join',  roomId }  on connect.
 *   - Mobile page sends   { type:'gps',   roomId, lat, lng, ... }  or
 *                         POST /location?room=<roomId>
 *   - Server routes GPS only to WS clients in the same room.
 *   - Camera IP is also stored per-room.
 *
 * Zero cross-user data leakage.
 */
const express = require('express');
const http    = require('http');
const path    = require('path');
const { WebSocketServer } = require('ws');

const app    = express();
const server = http.createServer(app);
const wss    = new WebSocketServer({ server });
const PORT   = process.env.PORT || 3000;

/* ── Per-room state  ──────────────────────────────────────────
   rooms[roomId] = {
     location : { lat, lng, accuracy, timestamp } | null,
     camIp    : string | null,
     clients  : Set<WebSocket>,
   }
─────────────────────────────────────────────────────────────── */
const rooms = new Map();

function getRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, { location: null, camIp: null, clients: new Set() });
  }
  return rooms.get(roomId);
}

function cleanRoom(roomId) {
  const room = rooms.get(roomId);
  if (room && room.clients.size === 0) {
    rooms.delete(roomId);
    console.log(`[room] cleaned up ${roomId}`);
  }
}

function broadcast(roomId, payload) {
  const room = rooms.get(roomId);
  if (!room) return;
  const msg = JSON.stringify(payload);
  room.clients.forEach(ws => {
    if (ws.readyState === 1) ws.send(msg);
  });
}

// ── Middleware ──────────────────────────────────────────────
app.use(express.json());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, ngrok-skip-browser-warning');
  next();
});

// ── Static React build ──────────────────────────────────────
app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));

// ── Mobile GPS tracker page ─────────────────────────────────
app.get('/mobile', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'mobile.html'));
});

// ── POST /location?room=<roomId>  (from mobile page HTTP fallback) ──
app.post('/location', (req, res) => {
  const roomId = req.query.room || req.body.room || 'default';
  const { lat, lng, accuracy, timestamp } = req.body;
  if (!lat || !lng) return res.status(400).json({ error: 'Missing lat/lng' });

  const room = getRoom(roomId);
  room.location = { lat, lng, accuracy, timestamp: timestamp || Date.now() };
  console.log(`[GPS] room=${roomId}  ${lat},${lng}`);

  broadcast(roomId, { type: 'location', lat, lng, accuracy });
  res.json({ ok: true });
});

// ── GET /get_data?room=<roomId>  (polling fallback) ───────────
app.get('/get_data', (req, res) => {
  const roomId = req.query.room || 'default';
  const room   = rooms.get(roomId);
  res.json(room?.location || {});
});

// ── Camera IP — per room ────────────────────────────────────
app.get('/camip', (req, res) => {
  const roomId = req.query.room || 'default';
  const room   = rooms.get(roomId);
  res.json({ ip: room?.camIp || null });
});

app.post('/camip', (req, res) => {
  const roomId = req.query.room || req.body.room || 'default';
  const ip     = req.body.ip || null;
  getRoom(roomId).camIp = ip;
  console.log(`[cam] room=${roomId}  ip=${ip}`);
  res.json({ ok: true, ip });
});

// ── WebSocket ───────────────────────────────────────────────
wss.on('connection', (ws, req) => {
  console.log('[WS] connected:', req.socket.remoteAddress);
  let roomId = null;

  ws.on('message', (raw) => {
    let data;
    try { data = JSON.parse(raw); } catch { return; }

    // ── Dashboard joins a room ──
    if (data.type === 'join' && data.roomId) {
      // leave old room if re-joining
      if (roomId && rooms.has(roomId)) {
        rooms.get(roomId).clients.delete(ws);
        cleanRoom(roomId);
      }
      roomId = data.roomId;
      getRoom(roomId).clients.add(ws);
      console.log(`[WS] join room=${roomId}  size=${rooms.get(roomId).clients.size}`);

      // send current state to this client
      const room = rooms.get(roomId);
      if (room.location) ws.send(JSON.stringify({ type: 'location', ...room.location }));
      return;
    }

    // ── Mobile sends GPS ──
    if ((data.type === 'gps' || (data.lat && data.lng)) && data.roomId) {
      const rid = data.roomId;
      const loc = { lat: data.lat, lng: data.lng, accuracy: data.accuracy, timestamp: data.timestamp || Date.now() };
      getRoom(rid).location = loc;
      console.log(`[WS GPS] room=${rid}  ${loc.lat},${loc.lng}`);
      broadcast(rid, { type: 'location', ...loc });
      return;
    }

    // ── Legacy: no roomId — broadcast to 'default' ──
    if (data.lat && data.lng) {
      const loc = { lat: data.lat, lng: data.lng, accuracy: data.accuracy };
      getRoom('default').location = loc;
      broadcast('default', { type: 'location', ...loc });
    }
  });

  ws.on('close', () => {
    if (roomId && rooms.has(roomId)) {
      rooms.get(roomId).clients.delete(ws);
      cleanRoom(roomId);
    }
    console.log('[WS] disconnected');
  });

  ws.on('error', () => ws.terminate());
});

// ── SPA fallback ────────────────────────────────────────────
app.use((req, res, next) => {
  const api = ['/location', '/get_data', '/camip', '/mobile'];
  if (api.some(p => req.path.startsWith(p))) return next();
  res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
});

// ── Start ───────────────────────────────────────────────────
server.listen(PORT, '0.0.0.0', () => {
  console.log(`SigmaVision server  →  http://localhost:${PORT}`);
  console.log(`Mobile tracker      →  http://localhost:${PORT}/mobile`);
});

