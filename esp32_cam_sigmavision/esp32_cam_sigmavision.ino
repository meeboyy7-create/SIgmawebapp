/*
 * SigmaVision ESP32-CAM — Clean final version
 * Board: AI Thinker ESP32-CAM | 115200 baud
 */
#include "esp_camera.h"
#include <WiFi.h>
#include <WebSocketsClient.h>
#include <Preferences.h>

#define WS_HOST "hopeful-ambition-production-8119be7a.up.railway.app"
#define WS_PORT 443
#define WS_PATH "/"

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

char g_ssid[64]  = "HUAWEI-7htD";
char g_pass[64]  = "3ugEmeus";
char g_room[128] = "MxsL1IHUpDej6iT6iZ0zRWhD6Vp2";

bool g_registered = false;

void onWsEvent(WStype_t type, uint8_t* payload, size_t length) {
  switch (type) {
    case WStype_CONNECTED:
      Serial.println("[WS] Connected");
      delay(300);
      ws.sendTXT(String("{\"type\":\"cam\",\"roomId\":\"") + g_room + "\"}");
      Serial.printf("[WS] Registered room=%s\n", g_room);
      break;
    case WStype_TEXT:
      Serial.printf("[WS] %s\n", (char*)payload);
      if (strstr((char*)payload, "cam_ack")) {
        g_registered = true;
        Serial.println("[WS] Streaming!");
      }
      break;
    case WStype_DISCONNECTED:
      Serial.println("[WS] Disconnected");
      g_registered = false;
      break;
    default: break;
  }
}

void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\n=== SigmaVision ESP32-CAM ===");
  Serial.printf("Room: %s\n", g_room);

  // Init camera with PSRAM
  camera_config_t cfg;
  cfg.ledc_channel = LEDC_CHANNEL_0;
  cfg.ledc_timer   = LEDC_TIMER_0;
  cfg.pin_d0  = Y2_GPIO_NUM; cfg.pin_d1 = Y3_GPIO_NUM;
  cfg.pin_d2  = Y4_GPIO_NUM; cfg.pin_d3 = Y5_GPIO_NUM;
  cfg.pin_d4  = Y6_GPIO_NUM; cfg.pin_d5 = Y7_GPIO_NUM;
  cfg.pin_d6  = Y8_GPIO_NUM; cfg.pin_d7 = Y9_GPIO_NUM;
  cfg.pin_xclk    = XCLK_GPIO_NUM;
  cfg.pin_pclk    = PCLK_GPIO_NUM;
  cfg.pin_vsync   = VSYNC_GPIO_NUM;
  cfg.pin_href    = HREF_GPIO_NUM;
  cfg.pin_sscb_sda = SIOD_GPIO_NUM;
  cfg.pin_sscb_scl = SIOC_GPIO_NUM;
  cfg.pin_pwdn    = PWDN_GPIO_NUM;
  cfg.pin_reset   = RESET_GPIO_NUM;
  cfg.xclk_freq_hz = 20000000;
  cfg.pixel_format = PIXFORMAT_JPEG;
  if (psramFound()) {
    cfg.frame_size   = FRAMESIZE_VGA;
    cfg.jpeg_quality = 12;
    cfg.fb_count     = 2;
    cfg.fb_location  = CAMERA_FB_IN_PSRAM;
    Serial.println("[CAM] PSRAM found — VGA 2-buffer mode");
  } else {
    cfg.frame_size   = FRAMESIZE_QVGA;
    cfg.jpeg_quality = 15;
    cfg.fb_count     = 1;
    Serial.println("[CAM] No PSRAM — QVGA 1-buffer mode");
  }

  if (esp_camera_init(&cfg) != ESP_OK) {
    Serial.println("[CAM] Init FAILED — rebooting");
    delay(3000); ESP.restart();
  }
  Serial.println("[CAM] OK");

  // Drain stale frames
  for (int i = 0; i < 5; i++) {
    camera_fb_t* fb = esp_camera_fb_get();
    if (fb) esp_camera_fb_return(fb);
    delay(50);
  }

  // WiFi
  Serial.printf("[WiFi] Connecting to %s\n", g_ssid);
  WiFi.begin(g_ssid, g_pass);
  for (int i = 0; i < 40 && WiFi.status() != WL_CONNECTED; i++) {
    delay(500); Serial.print(".");
  }
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("\n[WiFi] FAILED — rebooting"); delay(2000); ESP.restart();
  }
  Serial.printf("\n[WiFi] IP: %s\n", WiFi.localIP().toString().c_str());

  ws.beginSSL(WS_HOST, WS_PORT, WS_PATH);
  ws.onEvent(onWsEvent);
  ws.setReconnectInterval(3000);
  Serial.println("[WS] Connecting...");
}

void loop() {
  ws.loop();
  if (!g_registered) return;

  camera_fb_t* fb = esp_camera_fb_get();
  if (!fb) { delay(10); return; }

  ws.sendBIN(fb->buf, fb->len);
  esp_camera_fb_return(fb);
  delay(66);
}
