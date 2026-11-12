# SigmaVision

A browser-based caregiver dashboard for the **S.I.G.M.A** (Smart Integrated Geo-Monitoring Assistant) smart cane system — built at **Naga City Science High School**.

The person with the cane carries the hardware. The caregiver opens a browser tab. That's it.

---

## What it does

| Feature | How |
|---|---|
| **Live camera feed** | ESP32-CAM on the cane streams over Wi-Fi to the dashboard |
| **GPS tracking** | Cane user opens `/mobile` on their phone, taps Start |
| **Obstacle detection** | HC-SR04 sensors buzz/vibrate the cane when something is ahead |
| **Per-user isolation** | Each caregiver session gets its own room — GPS/camera data never crosses |

---

## Stack

- **Frontend** — React + Vite, GSAP (SplitText, DrawSVG, MorphSVG, ScrambleText), Framer Motion, Leaflet
- **Backend** — Node.js + Express + WebSocket (`ws`)
- **Auth** — Firebase Authentication
- **Hardware** — ESP32-CAM, HC-SR04 ultrasonic sensors, custom cane mount

---

## Running locally

```bash
# 1. Install server deps
cd server && npm install

# 2. Install client deps
cd ../client && npm install

# 3. Build the React app
npm run build

# 4. Start the server (serves built client + handles GPS WS)
cd ../server && node server.js
```

Open `http://localhost:3000`

For the GPS tracker (phone): `http://localhost:3000/mobile?room=<your-uid>`

---

## Deployment

The Node server handles both the React SPA and the WebSocket GPS endpoint.
Deploy to any Node-compatible host (Railway, Render, Fly.io).

> GitHub Pages cannot run the Node server — use it only for the static frontend preview.

---

## Project structure

```
SIgmawebapp/
├── client/          React + Vite frontend
│   ├── src/
│   │   ├── App.jsx           Entry, auth, mobile detection
│   │   ├── MarketingPage.jsx Landing + dashboard
│   │   ├── AuthModal.jsx     Sign in / sign up
│   │   ├── LoadingScreen.jsx Custom loading state
│   │   ├── NotFound.jsx      404 page
│   │   ├── MobilePrompt.jsx  Phone detected → choose version
│   │   └── components/
│   │       ├── MonitorSplash.jsx   GSAP vector animation on monitor screen
│   │       ├── DashboardAnimator.jsx  Login entrance animations
│   │       ├── CrowdCanvas.jsx     Open Peeps crowd animation
│   │       └── MotionFAQ.jsx       Animated FAQ accordion
│   └── dist/        Built output (served by Node)
├── server/
│   └── server.js    Express + WebSocket, per-room GPS isolation
├── mobile.html      Phone GPS tracker page
└── README.md
```

---

Built by the SigmaVision team — Naga City Science High School.
