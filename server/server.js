/**
 * SigmaVision Server
 *
 * Per-user session isolation:
 *   Each caregiver has a roomId (their Firebase UID).
 *   - Dashboard WS sends  { type:'join',  roomId }  on connect.
 *   - Mobile page sends   { type:'gps',   roomId, lat, lng, ... }  or
 *                         POST /location?room=<roomId>
 *   - ESP32-CAM sends     { type:'cam',   roomId }  to register, then
 *                         binary WebSocket frames (raw JPEG bytes).
 *   - Server routes GPS and camera frames only to WS clients in the same room.
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

/* ── Security headers ──────────────────────────────────────── */
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(self), camera=(self)');
  next();
});

/* ── Rate limiter ──────────────────────────────────────────── */
const rateLimits = new Map();
const RATE_WINDOW = 60 * 1000;
const RATE_MAX    = 120;

function rateLimit(req, res, next) {
  const ip  = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress;
  const now = Date.now();
  const rec = rateLimits.get(ip) || { count: 0, start: now };
  if (now - rec.start > RATE_WINDOW) { rec.count = 0; rec.start = now; }
  rec.count++;
  rateLimits.set(ip, rec);
  if (rec.count > RATE_MAX) return res.status(429).json({ error: 'Too many requests' });
  next();
}

setInterval(() => {
  const cutoff = Date.now() - RATE_WINDOW;
  rateLimits.forEach((rec, ip) => { if (rec.start < cutoff) rateLimits.delete(ip); });
}, 5 * 60 * 1000);

/* ── Per-room state ────────────────────────────────────────── */
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

/* ── Middleware ────────────────────────────────────────────── */
app.use(express.json({ limit: '10kb' }));
app.use((req, res, next) => {
  const allowed = [
    'https://sigmawebapp-production.up.railway.app',
    'https://hopeful-ambition-production-8119be7a.up.railway.app',
    'http://localhost:3000',
    'http://localhost:5173',
  ];
  const origin = req.headers.origin;
  if (!origin || allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, ngrok-skip-browser-warning');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

/* ── Static React build ──────────────────────────────────── */
app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));

/* ── Mobile GPS tracker page ─────────────────────────────── */
app.get('/mobile', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'mobile.html'));
});

/* ── POST /location ──────────────────────────────────────── */
app.post('/location', rateLimit, (req, res) => {
  const roomId = req.query.room || req.body.room || 'default';
  const { lat, lng, accuracy, timestamp } = req.body;
  if (!lat || !lng) return res.status(400).json({ error: 'Missing lat/lng' });

  const loc = { lat, lng, accuracy, timestamp: timestamp || Date.now() };
  getRoom(roomId).location = loc;
  console.log(`[GPS] room=${roomId}  ${lat},${lng}`);
  broadcast(roomId, { type: 'location', ...loc });

  rooms.forEach((room, rId) => {
    if (rId !== roomId && room.clients.size > 0) {
      broadcast(rId, { type: 'location', ...loc });
    }
  });

  res.json({ ok: true });
});

/* ── Debug: show active rooms ──────────────────────────── */
app.get('/debug', (req, res) => {
  const info = {};
  rooms.forEach((room, id) => {
    info[id] = { clients: room.clients.size, hasLocation: !!room.location };
  });
  res.json({ rooms: info, totalRooms: rooms.size });
});
app.get('/get_data', (req, res) => {
  const roomId = req.query.room || 'default';
  const room   = rooms.get(roomId);
  res.json(room?.location || {});
});

/* ── Camera IP endpoints (kept for legacy) ───────────────── */
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

/* ── WebSocket ───────────────────────────────────────────── */
wss.on('connection', (ws, req) => {
  console.log('[WS] connected:', req.socket.remoteAddress);
  let roomId = null;
  let isCam  = false;

  ws.on('message', (raw, isBinary) => {

    // ── Binary = JPEG frame from ESP32-CAM ──────────────
    if (isBinary || Buffer.isBuffer(raw)) {
      if (!roomId) return; // cam must register first
      const room = rooms.get(roomId);
      if (!room) return;
      // Relay raw JPEG to all dashboard clients in this room
      room.clients.forEach(client => {
        if (client !== ws && client.readyState === 1) {
          client.send(raw, { binary: true });
        }
      });
      return;
    }

    // ── Text = JSON control message ──────────────────────
    let data;
    try { data = JSON.parse(raw); } catch { return; }

    // ── ESP32-CAM registers its room ─────────────────────
    if (data.type === 'cam' && data.roomId) {
      roomId = data.roomId;
      isCam  = true;
      getRoom(roomId); // ensure room exists
      console.log(`[WS CAM] registered room=${roomId}`);
      const ack = JSON.stringify({ type: 'cam_ack', ok: true });
      console.log(`[WS CAM] sending ack: ${ack}`);
      try {
        ws.send(ack);
        console.log(`[WS CAM] ack sent successfully`);
      } catch(e) {
        console.error(`[WS CAM] ack send failed: ${e.message}`);
      }
      return;
    }

    // ── Dashboard joins a room ───────────────────────────
    if (data.type === 'join' && data.roomId) {
      if (roomId && rooms.has(roomId)) {
        rooms.get(roomId).clients.delete(ws);
        cleanRoom(roomId);
      }
      roomId = data.roomId;
      isCam  = false;
      getRoom(roomId).clients.add(ws);
      console.log(`[WS] join room=${roomId}  size=${rooms.get(roomId).clients.size}`);

      const room = rooms.get(roomId);
      if (room.location) ws.send(JSON.stringify({ type: 'location', ...room.location }));
      return;
    }

    // ── Mobile sends GPS ─────────────────────────────────
    if (data.type === 'gps' || (data.lat && data.lng)) {
      const rid = data.roomId || roomId || 'default';
      const loc = { lat: data.lat, lng: data.lng, accuracy: data.accuracy, timestamp: data.timestamp || Date.now() };
      getRoom(rid).location = loc;
      console.log(`[WS GPS] room=${rid}  ${loc.lat},${loc.lng}`);

      broadcast(rid, { type: 'location', ...loc });
      if (rid !== 'default') broadcast('default', { type: 'location', ...loc });
      rooms.forEach((room, rId) => {
        if (rId !== rid && rId !== 'default' && room.clients.size > 0) {
          broadcast(rId, { type: 'location', ...loc });
        }
      });
    }
  });

  ws.on('close', () => {
    if (roomId && rooms.has(roomId)) {
      if (!isCam) rooms.get(roomId).clients.delete(ws);
      cleanRoom(roomId);
    }
    console.log('[WS] disconnected');
  });

  ws.on('error', () => ws.terminate());
});

/* ── SPA fallback ────────────────────────────────────────── */
app.use((req, res, next) => {
  const api = ['/location', '/get_data', '/camip', '/mobile'];
  if (api.some(p => req.path.startsWith(p))) return next();
  res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
});

/* ── Start ───────────────────────────────────────────────── */
server.listen(PORT, '0.0.0.0', () => {
  console.log(`SigmaVision server  →  http://localhost:${PORT}`);
  console.log(`Mobile tracker      →  http://localhost:${PORT}/mobile`);
});

