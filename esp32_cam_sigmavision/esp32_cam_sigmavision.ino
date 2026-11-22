/*
 * SigmaVision ESP32-CAM  — Captive Portal Edition
 * Board : AI Thinker ESP32-CAM
 * Baud  : 115200
 *
 * FIRST BOOT (no saved credentials):
 *   1. ESP32 creates WiFi hotspot "SigmaVision-Setup" (open, no password)
 *   2. Connect any device to that network
 *   3. Browser auto-opens captive portal  OR  navigate to http://192.168.4.1
 *   4. Fill in: WiFi SSID / Password / Room ID  → Submit
 *   5. ESP32 saves to flash, reboots, streams to Railway forever
 *
 * RECONFIGURE:
 *   Hold GPIO0 LOW while powering on → returns to hotspot setup mode
 *
 * ROOM ID:
 *   Open SigmaVision webapp → Dashboard → "Copy Room ID" button
 *
 * LIBRARIES REQUIRED (Arduino Library Manager):
 *   • WebSockets  by Markus Sattler  (arduinoWebSockets)
 *   • esp32  board package by Espressif
 */

#include "esp_camera.h"
#include <WiFi.h>
#include <WebServer.h>
#include <DNSServer.h>
#include <WebSocketsClient.h>
#include <Preferences.h>

// ── Railway WebSocket target ───────────────────────────────
#define WS_HOST "hopeful-ambition-production-82bb042a.up.railway.app"
#define WS_PORT  443
#define WS_PATH  "/"

// ── Captive portal AP settings ────────────────────────────
#define AP_SSID   "SigmaVision-Setup"
#define AP_IP     "192.168.4.1"
#define DNS_PORT  53

// ── AI Thinker ESP32-CAM pin map ─────────────────────────
#define PWDN_GPIO_NUM   32
#define RESET_GPIO_NUM  -1
#define XCLK_GPIO_NUM    0
#define SIOD_GPIO_NUM   26
#define SIOC_GPIO_NUM   27
#define Y9_GPIO_NUM     35
#define Y8_GPIO_NUM     34
#define Y7_GPIO_NUM     39
#define Y6_GPIO_NUM     36
#define Y5_GPIO_NUM     21
#define Y4_GPIO_NUM     19
#define Y3_GPIO_NUM     18
#define Y2_GPIO_NUM      5
#define VSYNC_GPIO_NUM  25
#define HREF_GPIO_NUM   23
#define PCLK_GPIO_NUM   22

// ── Globals ───────────────────────────────────────────────
Preferences      prefs;
WebSocketsClient ws;
WebServer        httpServer(80);
DNSServer        dnsServer;

char g_ssid[64]  = {0};
char g_pass[64]  = {0};
char g_room[128] = {0};

bool g_wsConnected = false;
bool g_registered  = false;

// ── NVS helpers ───────────────────────────────────────────
void loadCreds() {
  prefs.begin("sv", true);
  prefs.getString("ssid", g_ssid, sizeof(g_ssid));
  prefs.getString("pass", g_pass, sizeof(g_pass));
  prefs.getString("room", g_room, sizeof(g_room));
  prefs.end();
  Serial.printf("[NVS] Loaded  ssid='%s'  room='%s'\n", g_ssid, g_room);
}

void saveCreds(const char* ssid, const char* pass, const char* room) {
  strlcpy(g_ssid, ssid, sizeof(g_ssid));
  strlcpy(g_pass, pass, sizeof(g_pass));
  strlcpy(g_room, room, sizeof(g_room));
  prefs.begin("sv", false);
  prefs.putString("ssid", g_ssid);
  prefs.putString("pass", g_pass);
  prefs.putString("room", g_room);
  prefs.end();
  Serial.printf("[NVS] Saved  ssid='%s'  room='%s'\n", g_ssid, g_room);
}

void clearCreds() {
  prefs.begin("sv", false);
  prefs.clear();
  prefs.end();
  g_ssid[0] = g_pass[0] = g_room[0] = 0;
  Serial.println("[NVS] Cleared all credentials");
}

// ── URL decode helper ─────────────────────────────────────
String urlDecode(const String& s) {
  String out;
  out.reserve(s.length());
  for (int i = 0; i < (int)s.length(); i++) {
    if (s[i] == '+') { out += ' '; continue; }
    if (s[i] == '%' && i + 2 < (int)s.length()) {
      char hex[3] = { s[i+1], s[i+2], 0 };
      out += (char)strtol(hex, nullptr, 16);
      i += 2;
    } else {
      out += s[i];
    }
  }
  return out;
}

// ── Captive portal HTML ───────────────────────────────────
const char SETUP_HTML[] PROGMEM = R"rawhtml(
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>SigmaVision Setup</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
       background:#0b0d0d;color:#f4f4ef;min-height:100vh;
       display:flex;align-items:center;justify-content:center;padding:20px}
  .card{background:#151918;border:1px solid rgba(255,255,255,0.1);
        border-radius:20px;padding:32px 28px;width:100%;max-width:400px;
        box-shadow:0 20px 60px rgba(0,0,0,0.6)}
  .logo{font-size:22px;font-weight:800;letter-spacing:-0.04em;
        color:#fff;margin-bottom:6px}
  .sub{font-size:13px;color:rgba(255,255,255,0.4);margin-bottom:28px}
  label{display:block;font-size:11px;font-weight:700;
        color:rgba(255,255,255,0.45);letter-spacing:0.1em;
        text-transform:uppercase;margin-bottom:6px}
  input{width:100%;padding:12px 14px;border-radius:10px;
        border:1.5px solid rgba(255,255,255,0.1);
        background:rgba(255,255,255,0.05);
        color:#fff;font-size:14px;outline:none;
        transition:border-color .2s;margin-bottom:16px}
  input:focus{border-color:rgba(255,255,255,0.4)}
  .hint{font-size:11px;color:rgba(255,255,255,0.3);
        margin-top:-12px;margin-bottom:16px;line-height:1.5}
  button{width:100%;padding:14px;border-radius:10px;
         border:none;background:#fff;color:#0b0d0d;
         font-weight:800;font-size:15px;cursor:pointer;
         letter-spacing:-0.01em;transition:opacity .2s}
  button:active{opacity:.8}
  .ok{display:none;background:#55db9c;color:#0b0d0d;
      border-radius:10px;padding:14px;text-align:center;
      font-weight:700;font-size:14px;margin-top:12px}
</style>
</head>
<body>
<div class="card">
  <div class="logo">&#9671; SigmaVision</div>
  <div class="sub">Camera Setup — connect once, stream forever</div>
  <form id="f" onsubmit="submit(event)">
    <label>WiFi Network Name (SSID)</label>
    <input name="ssid" type="text" placeholder="YourWiFiName" required autocomplete="off" autocorrect="off" autocapitalize="none">

    <label>WiFi Password</label>
    <input name="pass" type="password" placeholder="••••••••" autocomplete="off">
    <div class="hint">Leave blank if the network has no password</div>

    <label>Room ID</label>
    <input name="room" type="text" placeholder="Paste your Room ID here" required autocomplete="off" autocorrect="off" autocapitalize="none">
    <div class="hint">Open SigmaVision app &rarr; Dashboard &rarr; tap <b>Copy Room ID</b></div>

    <button type="submit" id="btn">Save &amp; Connect</button>
    <div class="ok" id="ok">&#10003; Saved! Camera is rebooting&hellip;</div>
  </form>
</div>
<script>
function submit(e){
  e.preventDefault();
  var d=new FormData(e.target);
  document.getElementById('btn').disabled=true;
  document.getElementById('btn').textContent='Saving\u2026';
  fetch('/save',{method:'POST',
    headers:{'Content-Type':'application/x-www-form-urlencoded'},
    body:new URLSearchParams(d).toString()})
  .then(r=>r.text()).then(()=>{
    document.getElementById('ok').style.display='block';
    document.getElementById('btn').style.display='none';
  }).catch(()=>{
    document.getElementById('btn').disabled=false;
    document.getElementById('btn').textContent='Save & Connect';
    alert('Error saving. Try again.');
  });
}
</script>
</body>
</html>
)rawhtml";

// ── HTTP handlers for captive portal ─────────────────────
void handleRoot() {
  Serial.println("[HTTP] Serving setup page");
  httpServer.send_P(200, "text/html", SETUP_HTML);
}

void handleSave() {
  Serial.println("[HTTP] Received /save POST");

  String ssid = urlDecode(httpServer.arg("ssid"));
  String pass = urlDecode(httpServer.arg("pass"));
  String room = urlDecode(httpServer.arg("room"));

  Serial.printf("[HTTP] ssid='%s'  room='%s'\n", ssid.c_str(), room.c_str());

  // ── Validate ──────────────────────────────────────────
  if (ssid.length() == 0) {
    Serial.println("[HTTP] ERROR: SSID is empty — rejecting");
    httpServer.send(400, "text/plain", "SSID required");
    return;
  }
  if (room.length() < 4) {
    Serial.println("[HTTP] ERROR: Room ID too short — rejecting");
    httpServer.send(400, "text/plain", "Room ID too short");
    return;
  }

  saveCreds(ssid.c_str(), pass.c_str(), room.c_str());
  httpServer.send(200, "text/plain", "OK");

  Serial.println("[HTTP] Credentials saved — rebooting in 2s...");
  delay(2000);
  ESP.restart();
}

// Redirect all unknown URLs to the setup page (captive portal trick)
void handleRedirect() {
  Serial.printf("[HTTP] Redirect: %s\n", httpServer.uri().c_str());
  httpServer.sendHeader("Location", "http://192.168.4.1/", true);
  httpServer.send(302, "text/plain", "");
}

// ── Captive portal mode ───────────────────────────────────
void runCaptivePortal() {
  Serial.println("\n[PORTAL] Starting captive portal hotspot...");

  WiFi.mode(WIFI_AP);
  IPAddress apIP(192, 168, 4, 1);
  IPAddress apSubnet(255, 255, 255, 0);
  WiFi.softAPConfig(apIP, apIP, apSubnet);
  WiFi.softAP(AP_SSID);  // open network, no password

  Serial.printf("[PORTAL] Hotspot: '%s'  IP: %s\n", AP_SSID, AP_IP);
  Serial.println("[PORTAL] Connect to 'SigmaVision-Setup' and open http://192.168.4.1");

  // DNS — redirect all domains to 192.168.4.1 (triggers captive portal popup)
  dnsServer.setTTL(0);  // no caching — ensures immediate redirect
  dnsServer.start(DNS_PORT, "*", apIP);

  // HTTP routes
  httpServer.on("/",          HTTP_GET,  handleRoot);
  httpServer.on("/save",      HTTP_POST, handleSave);
  // Captive portal detection endpoints
  // Android MUST get 204 — not a redirect — to trigger the popup
  httpServer.on("/generate_204", HTTP_GET, [](){ httpServer.send(204, "text/plain", ""); });
  httpServer.on("/gen_204",      HTTP_GET, [](){ httpServer.send(204, "text/plain", ""); });
  httpServer.on("/hotspot-detect.html",   HTTP_GET, handleRedirect);  // iOS
  httpServer.on("/connecttest.txt",       HTTP_GET, handleRedirect);  // Windows
  httpServer.on("/redirect",              HTTP_GET, handleRedirect);  // Windows alt
  httpServer.on("/success.txt",           HTTP_GET, handleRedirect);  // macOS
  httpServer.on("/canonical.html",        HTTP_GET, handleRedirect);  // Ubuntu
  httpServer.onNotFound(handleRedirect);

  httpServer.begin();
  Serial.println("[PORTAL] HTTP server started — waiting for user input...");

  // Loop until saved (handleSave calls ESP.restart)
  while (true) {
    dnsServer.processNextRequest();
    httpServer.handleClient();
    delay(2);
  }
}

// ── Camera init ───────────────────────────────────────────
bool initCamera() {
  Serial.println("[CAM] Initializing...");
  camera_config_t cfg;
  cfg.ledc_channel = LEDC_CHANNEL_0;
  cfg.ledc_timer   = LEDC_TIMER_0;
  cfg.pin_d0  = Y2_GPIO_NUM;  cfg.pin_d1 = Y3_GPIO_NUM;
  cfg.pin_d2  = Y4_GPIO_NUM;  cfg.pin_d3 = Y5_GPIO_NUM;
  cfg.pin_d4  = Y6_GPIO_NUM;  cfg.pin_d5 = Y7_GPIO_NUM;
  cfg.pin_d6  = Y8_GPIO_NUM;  cfg.pin_d7 = Y9_GPIO_NUM;
  cfg.pin_xclk    = XCLK_GPIO_NUM;
  cfg.pin_pclk    = PCLK_GPIO_NUM;
  cfg.pin_vsync   = VSYNC_GPIO_NUM;
  cfg.pin_href    = HREF_GPIO_NUM;
  cfg.pin_sccb_sda = SIOD_GPIO_NUM;
  cfg.pin_sccb_scl = SIOC_GPIO_NUM;
  cfg.pin_pwdn    = PWDN_GPIO_NUM;
  cfg.pin_reset   = RESET_GPIO_NUM;
  cfg.xclk_freq_hz = 20000000;
  cfg.pixel_format = PIXFORMAT_JPEG;
  cfg.frame_size   = FRAMESIZE_VGA;   // 640×480
  cfg.jpeg_quality = 15;              // 0=best, 63=worst
  cfg.fb_count     = 1;

  esp_err_t err = esp_camera_init(&cfg);
  if (err != ESP_OK) {
    Serial.printf("[CAM] Init FAILED — error 0x%x\n", err);
    return false;
  }
  Serial.println("[CAM] Init OK");
  return true;
}

// ── WebSocket event handler ───────────────────────────────
void onWsEvent(WStype_t type, uint8_t* payload, size_t length) {
  switch (type) {

    case WStype_CONNECTED:
      Serial.println("[WS] Connected to Railway ✓");
      g_wsConnected = true;
      g_registered  = false;
      {
        // Register camera into the room so server routes frames to the right dashboard
        String msg = String("{\"type\":\"cam\",\"roomId\":\"") + g_room + "\"}";
        ws.sendTXT(msg);
        Serial.printf("[WS] Registration sent — room='%s'\n", g_room);
      }
      break;

    case WStype_TEXT:
      Serial.printf("[WS] Server: %s\n", (char*)payload);
      if (strstr((char*)payload, "cam_ack")) {
        g_registered = true;
        Serial.println("[WS] ✓ Registration acknowledged — streaming JPEG frames");
      }
      break;

    case WStype_DISCONNECTED:
      Serial.println("[WS] Disconnected — will retry");
      g_wsConnected = false;
      g_registered  = false;
      break;

    case WStype_ERROR:
      Serial.printf("[WS] Error (len=%u)\n", length);
      break;

    case WStype_PING:
      Serial.println("[WS] Ping received");
      break;

    case WStype_PONG:
      Serial.println("[WS] Pong received");
      break;

    default: break;
  }
}

// ── Setup ─────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(600);
  Serial.println("\n=============================");
  Serial.println("   SigmaVision ESP32-CAM");
  Serial.println("=============================");

  // Check GPIO0 for force-reconfigure (hold LOW at boot)
  pinMode(0, INPUT_PULLUP);
  delay(60);
  bool forceSetup = (digitalRead(0) == LOW);
  if (forceSetup) {
    Serial.println("[BOOT] GPIO0 LOW — forcing setup mode");
    clearCreds();
  }

  // Load saved credentials
  loadCreds();

  // ── Decide: captive portal setup OR stream ────────────
  bool needsSetup = (strlen(g_ssid) == 0 || strlen(g_room) < 4);

  if (needsSetup) {
    Serial.println("[BOOT] No credentials — entering captive portal setup");
    runCaptivePortal();
    // runCaptivePortal() never returns — ESP.restart() is called after save
    return;
  }

  Serial.printf("[BOOT] Credentials found — ssid='%s'  room='%s'\n", g_ssid, g_room);

  // ── Init camera ───────────────────────────────────────
  if (!initCamera()) {
    Serial.println("[BOOT] Camera init failed — rebooting in 5s");
    delay(5000);
    ESP.restart();
  }

  // ── Connect to WiFi ───────────────────────────────────
  Serial.printf("[WiFi] Connecting to '%s'", g_ssid);
  WiFi.mode(WIFI_STA);
  WiFi.begin(g_ssid, g_pass);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 40) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("\n[WiFi] FAILED to connect");
    Serial.printf("[WiFi] Status code: %d\n", WiFi.status());
    // Track consecutive failures — only wipe after 3 to handle transient issues
    prefs.begin("sv", false);
    int fails = prefs.getInt("wifails", 0) + 1;
    prefs.putInt("wifails", fails);
    prefs.end();
    Serial.printf("[WiFi] Consecutive failures: %d\n", fails);
    if (fails >= 3) {
      Serial.println("[WiFi] 3 consecutive failures — clearing credentials and entering setup");
      clearCreds();
      prefs.begin("sv", false); prefs.putInt("wifails", 0); prefs.end();
    } else {
      Serial.printf("[WiFi] Retrying on next boot (%d/3 before wipe)\n", fails);
    }
    delay(1000);
    ESP.restart();
  }

  // Reset failure counter on successful connect
  prefs.begin("sv", false); prefs.putInt("wifails", 0); prefs.end();

  Serial.printf("\n[WiFi] Connected ✓  IP: %s  RSSI: %ddBm\n",
    WiFi.localIP().toString().c_str(), WiFi.RSSI());

  // ── Connect WebSocket to Railway ──────────────────────
  Serial.printf("[WS] Connecting to wss://%s:%d%s\n", WS_HOST, WS_PORT, WS_PATH);
  ws.beginSSL(WS_HOST, WS_PORT, WS_PATH);
  ws.onEvent(onWsEvent);
  ws.setReconnectInterval(3000);
  ws.enableHeartbeat(15000, 3000, 2);  // ping every 15s, timeout 3s, 2 retries
}

// ── Loop ──────────────────────────────────────────────────
uint32_t lastFrameMs  = 0;
uint32_t frameCount   = 0;
uint32_t lastStatsMs  = 0;

void loop() {
  ws.loop();

  // Not registered yet — wait
  if (!g_registered) return;

  // Frame rate cap — target ~15 fps (66ms between frames)
  uint32_t now = millis();
  if (now - lastFrameMs < 66) return;
  lastFrameMs = now;

  // Grab JPEG frame from camera
  camera_fb_t* fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("[CAM] Frame capture failed");
    delay(10);
    return;
  }

  // Send binary JPEG over WebSocket
  bool ok = ws.sendBIN(fb->buf, fb->len);
  esp_camera_fb_return(fb);

  if (!ok) {
    Serial.println("[WS] sendBIN failed — WebSocket may have dropped");
    return;
  }

  frameCount++;

  // Print stats every 10 seconds
  if (now - lastStatsMs >= 10000) {
    Serial.printf("[STREAM] %lu frames sent in last 10s  (~%lu fps)  heap=%lu\n",
      (unsigned long)frameCount, (unsigned long)(frameCount / 10), (unsigned long)ESP.getFreeHeap());
    frameCount   = 0;
    lastStatsMs  = now;
  }
}
