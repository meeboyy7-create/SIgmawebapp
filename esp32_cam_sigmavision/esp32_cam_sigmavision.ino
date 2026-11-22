/*
 * SigmaVision ESP32-CAM — Captive Portal Edition
 * Board : AI Thinker ESP32-CAM | 115200 baud
 * Camera/WS code identical to original working version (164eebb).
 * Only change: Serial readLine replaced with captive portal WebUI.
 */
#include "esp_camera.h"
#include <WiFi.h>
#include <WebServer.h>
#include <DNSServer.h>
#include <WebSocketsClient.h>
#include <Preferences.h>

// ── Config ────────────────────────────────────────────────
#define WS_HOST "hopeful-ambition-production-82bb042a.up.railway.app"
#define WS_PORT 443
#define WS_PATH "/"

// ── AI Thinker ESP32-CAM pins — UNCHANGED from working version ────
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
WebServer        httpServer(80);
DNSServer        dnsServer;

char g_ssid[64];
char g_pass[64];
char g_room[128];
bool g_wsConnected = false;
bool g_registered  = false;

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

// ── URL decode ────────────────────────────────────────────
String urlDecode(const String& s) {
  String out; out.reserve(s.length());
  for (int i = 0; i < (int)s.length(); i++) {
    if (s[i]=='+'){out+=' ';continue;}
    if (s[i]=='%'&&i+2<(int)s.length()){char h[3]={s[i+1],s[i+2],0};out+=(char)strtol(h,nullptr,16);i+=2;}
    else out+=s[i];
  }
  return out;
}

// ── Captive portal ────────────────────────────────────────
const char PORTAL_HTML[] PROGMEM = R"(<!DOCTYPE html><html><head><meta charset='UTF-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>SigmaVision Setup</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,sans-serif;background:#0b0d0d;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px}.c{background:#151918;border:1px solid rgba(255,255,255,.1);border-radius:20px;padding:28px;width:100%;max-width:400px}h2{font-size:20px;font-weight:800;margin-bottom:5px}.s{font-size:13px;color:rgba(255,255,255,.4);margin-bottom:24px}label{display:block;font-size:11px;font-weight:700;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.1em;margin-bottom:6px}input{width:100%;padding:11px 13px;border-radius:9px;border:1.5px solid rgba(255,255,255,.1);background:rgba(255,255,255,.05);color:#fff;font-size:14px;margin-bottom:16px;outline:none;-webkit-appearance:none}.h{font-size:11px;color:rgba(255,255,255,.3);margin-top:-12px;margin-bottom:16px}button{width:100%;padding:13px;border-radius:9px;border:none;background:#fff;color:#111;font-weight:800;font-size:15px;cursor:pointer}</style></head><body><div class='c'><h2>&#9671; SigmaVision</h2><div class='s'>Camera Setup &mdash; connect once, stream forever</div><form method='POST' action='/save'><label>WiFi Name</label><input name='ssid' type='text' required autocomplete='off' autocorrect='off' autocapitalize='none' spellcheck='false'><label>WiFi Password</label><input name='pass' type='password' autocomplete='off'><div class='h'>Leave blank if open network</div><label>Room ID</label><input name='room' type='text' required autocomplete='off' autocorrect='off' autocapitalize='none' spellcheck='false'><div class='h'>App &rarr; Setup panel &rarr; Copy Room ID</div><button type='submit'>Save &amp; Connect &rarr;</button></form></div></body></html>)";

void portalRoot() { httpServer.send_P(200,"text/html",PORTAL_HTML); }
void portalRedirect() { httpServer.sendHeader("Location","http://192.168.4.1/",true); httpServer.send(302,"text/plain",""); }
void portalSave() {
  String ssid=urlDecode(httpServer.arg("ssid"));
  String pass=urlDecode(httpServer.arg("pass"));
  String room=urlDecode(httpServer.arg("room"));
  Serial.printf("[PORTAL] ssid='%s'  room='%s'\n",ssid.c_str(),room.c_str());
  if (ssid.length()==0||room.length()<4){httpServer.send(400,"text/plain","Missing");return;}
  strlcpy(g_ssid,ssid.c_str(),sizeof(g_ssid));
  strlcpy(g_pass,pass.c_str(),sizeof(g_pass));
  strlcpy(g_room,room.c_str(),sizeof(g_room));
  saveCreds();
  httpServer.send(200,"text/html","<html><body style='background:#0b0d0d;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;text-align:center'><div><div style='font-size:52px'>&#10003;</div><h2>Saved!</h2><p style='color:rgba(255,255,255,.45)'>Rebooting...</p></div></body></html>");
  delay(2000);
  ESP.restart();
}
void runCaptivePortal() {
  Serial.println("[PORTAL] Starting SigmaVision-Setup hotspot...");
  WiFi.mode(WIFI_AP);
  IPAddress apIP(192,168,4,1);
  WiFi.softAPConfig(apIP,apIP,IPAddress(255,255,255,0));
  WiFi.softAP("SigmaVision-Setup");
  Serial.println("[PORTAL] Connect to 'SigmaVision-Setup' → open 192.168.4.1");
  dnsServer.setTTL(0);
  dnsServer.start(53,"*",apIP);
  httpServer.on("/",HTTP_GET,portalRoot);
  httpServer.on("/save",HTTP_POST,portalSave);
  httpServer.on("/generate_204",HTTP_GET,[](){ httpServer.send(204,"text/plain",""); });
  httpServer.on("/gen_204",HTTP_GET,[](){ httpServer.send(204,"text/plain",""); });
  httpServer.on("/hotspot-detect.html",HTTP_GET,portalRoot);
  httpServer.on("/connecttest.txt",HTTP_GET,[](){ httpServer.send(200,"text/plain","Microsoft Connect Test"); });
  httpServer.on("/ncsi.txt",HTTP_GET,[](){ httpServer.send(200,"text/plain","Microsoft NCSI"); });
  httpServer.on("/success.txt",HTTP_GET,[](){ httpServer.send(200,"text/plain",""); });
  httpServer.onNotFound(portalRedirect);
  httpServer.begin();
  while(true){dnsServer.processNextRequest();httpServer.handleClient();delay(2);}
}

// ── WebSocket event handler — IDENTICAL to 164eebb ────────
void onWsEvent(WStype_t type, uint8_t* payload, size_t length) {
  switch (type) {
    case WStype_CONNECTED:
      Serial.println("[WS] Connected to Railway");
      g_wsConnected = true;
      g_registered  = false;
      {
        String msg = String("{\"type\":\"cam\",\"roomId\":\"") + g_room + "\"}";
        ws.sendTXT(msg);
        Serial.printf("[WS] Sent cam register room=%s\n", g_room);
      }
      break;
    case WStype_TEXT:
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

// ── Camera init — IDENTICAL to 164eebb ───────────────────
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

  pinMode(0, INPUT_PULLUP);
  delay(50);
  bool force = (digitalRead(0) == LOW);

  loadCreds();

  // No credentials or GPIO0 held LOW → captive portal
  if (force || strlen(g_ssid) == 0) {
    if (force) { prefs.begin("sv",false); prefs.clear(); prefs.end(); g_ssid[0]=0; }
    runCaptivePortal(); // never returns
    return;
  }

  // ── Credentials exist — normal boot (identical to 164eebb) ──
  if (!initCamera()) {
    Serial.println("[CAM] Halting."); while (true) delay(1000);
  }

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

  ws.beginSSL(WS_HOST, WS_PORT, WS_PATH);
  ws.onEvent(onWsEvent);
  ws.setReconnectInterval(3000);
  Serial.printf("[WS] Connecting to %s\n", WS_HOST);
}

// ── Loop — IDENTICAL to 164eebb ───────────────────────────
void loop() {
  ws.loop();
  if (!g_registered) return;
  camera_fb_t* fb = esp_camera_fb_get();
  if (!fb) { delay(10); return; }
  ws.sendBIN(fb->buf, fb->len);
  esp_camera_fb_return(fb);
  delay(66);
}
