/*
 * SigmaVision ESP32-CAM
 * Board: AI Thinker ESP32-CAM | 115200 baud | Both NL & CR
 *
 * First boot: prompts for WiFi SSID + password + Room ID, saves to flash.
 * Reboots connect automatically.
 * Hold GPIO0 LOW at boot to re-enter credentials.
 *
 * Streams JPEG frames over WebSocket to Railway server.
 * Works across any network — no port forwarding needed.
 */

#include "esp_camera.h"
#include <WiFi.h>
#include <WebSocketsClient.h>
#include <Preferences.h>

// ── Config ────────────────────────────────────────────────
#define WS_HOST "hopeful-ambition-production-82bb042a.up.railway.app"
#define WS_PORT 443
#define WS_PATH "/"

// AI Thinker ESP32-CAM pins
#define PWDN_GPIO_NUM  32
#define RESET_GPIO_NUM -1
#define XCLK_GPIO_NUM   0
#define SIOD_GPIO_NUM  26
#define SIOC_GPIO_NUM  27
#define Y9_GPIO_NUM    35
#define Y8_GPIO_NUM    34
#define Y7_GPIO_NUM    39
#define Y6_GPIO_NUM    36
#define Y5_GPIO_NUM    21
#define Y4_GPIO_NUM    19
#define Y3_GPIO_NUM    18
#define Y2_GPIO_NUM     5
#define VSYNC_GPIO_NUM 25
#define HREF_GPIO_NUM  23
#define PCLK_GPIO_NUM  22

Preferences      prefs;
WebSocketsClient ws;

char g_ssid[64];
char g_pass[64];
char g_room[128];

bool g_wsConnected = false;
bool g_registered  = false;

// ── Serial line input ─────────────────────────────────────
void readLine(const char* prompt, char* buf, size_t len, bool mask) {
  while (Serial.available()) Serial.read();
  Serial.print(prompt);
  size_t i = 0;
  while (true) {
    if (!Serial.available()) continue;
    char c = Serial.read();
    if (c == '\n') { if (i > 0) { buf[i] = 0; Serial.println(); return; } continue; }
    if (c == '\r') continue;
    if ((c == '\b' || c == 127) && i > 0) { i--; Serial.print("\b \b"); continue; }
    if (i < len - 1) { buf[i++] = c; Serial.print(mask ? '*' : c); }
  }
}

// ── NVS ───────────────────────────────────────────────────
void loadCreds() {
  prefs.begin("sv", true);
  prefs.getString("ssid", g_ssid, sizeof(g_ssid));
  prefs.getString("pass", g_pass, sizeof(g_pass));
  prefs.getString("room", g_room, sizeof(g_room));
  prefs.end();
  if (strlen(g_room) == 0) strlcpy(g_room, "default", sizeof(g_room));
}

void saveCreds() {
  prefs.begin("sv", false);
  prefs.putString("ssid", g_ssid);
  prefs.putString("pass", g_pass);
  prefs.putString("room", g_room);
  prefs.end();
}

// ── WebSocket event handler ───────────────────────────────
void onWsEvent(WStype_t type, uint8_t* payload, size_t length) {
  switch (type) {
    case WStype_CONNECTED:
      Serial.println("[WS] Connected to Railway");
      g_wsConnected = true;
      g_registered  = false;
      // Register this camera with its room
      {
        String msg = String("{\"type\":\"cam\",\"roomId\":\"") + g_room + "\"}";
        ws.sendTXT(msg);
        Serial.printf("[WS] Sent cam register room=%s\n", g_room);
      }
      break;

    case WStype_TEXT:
      // Expect {"type":"cam_ack","ok":true}
      Serial.printf("[WS] Text: %s\n", (char*)payload);
      if (strstr((char*)payload, "cam_ack")) {
        g_registered = true;
        Serial.println("[WS] Registered — streaming...");
      }
      break;

    case WStype_DISCONNECTED:
      Serial.println("[WS] Disconnected");
      g_wsConnected = false;
      g_registered  = false;
      break;

    case WStype_ERROR:
      Serial.println("[WS] Error");
      break;

    default: break;
  }
}

// ── Camera init ───────────────────────────────────────────
bool initCamera() {
  camera_config_t cfg;
  cfg.ledc_channel=LEDC_CHANNEL_0; cfg.ledc_timer=LEDC_TIMER_0;
  cfg.pin_d0=Y2_GPIO_NUM; cfg.pin_d1=Y3_GPIO_NUM; cfg.pin_d2=Y4_GPIO_NUM; cfg.pin_d3=Y5_GPIO_NUM;
  cfg.pin_d4=Y6_GPIO_NUM; cfg.pin_d5=Y7_GPIO_NUM; cfg.pin_d6=Y8_GPIO_NUM; cfg.pin_d7=Y9_GPIO_NUM;
  cfg.pin_xclk=XCLK_GPIO_NUM; cfg.pin_pclk=PCLK_GPIO_NUM; cfg.pin_vsync=VSYNC_GPIO_NUM;
  cfg.pin_href=HREF_GPIO_NUM; cfg.pin_sscb_sda=SIOD_GPIO_NUM; cfg.pin_sscb_scl=SIOC_GPIO_NUM;
  cfg.pin_pwdn=PWDN_GPIO_NUM; cfg.pin_reset=RESET_GPIO_NUM;
  cfg.xclk_freq_hz = 20000000;
  cfg.pixel_format = PIXFORMAT_JPEG;
  cfg.frame_size   = FRAMESIZE_VGA;
  cfg.jpeg_quality = 15;
  cfg.fb_count     = 1;

  if (esp_camera_init(&cfg) != ESP_OK) {
    Serial.println("[CAM] Init failed!");
    return false;
  }
  Serial.println("[CAM] OK");
  return true;
}

// ── Setup ─────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\n=== SigmaVision ESP32-CAM ===");

  // Check GPIO0 for force-reconfigure
  pinMode(0, INPUT_PULLUP);
  delay(50);
  bool force = (digitalRead(0) == LOW);

  loadCreds();

  if (force || strlen(g_ssid) == 0) {
    Serial.println("\n[Setup] Enter credentials:");
    readLine("  SSID     : ", g_ssid, sizeof(g_ssid), false);
    readLine("  Password : ", g_pass, sizeof(g_pass), true);
    readLine("  Room ID  : ", g_room, sizeof(g_room), false);
    if (strlen(g_room) == 0) strlcpy(g_room, "default", sizeof(g_room));
    saveCreds();
    Serial.println("[Setup] Saved.");
  }

  // Camera FIRST
  if (!initCamera()) {
    Serial.println("[CAM] Halting."); while (true) delay(1000);
  }

  // Then WiFi
  Serial.printf("[WiFi] Connecting to %s", g_ssid);
  WiFi.begin(g_ssid, g_pass);
  for (int i = 0; i < 40 && WiFi.status() != WL_CONNECTED; i++) {
    delay(500); Serial.print(".");
  }
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("\n[WiFi] FAILED — clearing and restarting");
    prefs.begin("sv", false); prefs.clear(); prefs.end();
    delay(1000); ESP.restart();
  }
  Serial.printf("\n[WiFi] IP: %s\n", WiFi.localIP().toString().c_str());

  // WebSocket to Railway (SSL on port 443)
  ws.beginSSL(WS_HOST, WS_PORT, WS_PATH);
  ws.onEvent(onWsEvent);
  ws.setReconnectInterval(3000);
  Serial.printf("[WS] Connecting to %s\n", WS_HOST);
}

// ── Loop ──────────────────────────────────────────────────
void loop() {
  ws.loop();

  // Send frame only when registered
  if (!g_registered) return;

  camera_fb_t* fb = esp_camera_fb_get();
  if (!fb) { delay(10); return; }

  // Send raw JPEG bytes as binary WebSocket message
  ws.sendBIN(fb->buf, fb->len);
  esp_camera_fb_return(fb);

  // ~15 fps cap
  delay(66);
}
