<img width="2048" height="1152" alt="image" src="https://github.com/user-attachments/assets/12ff3aaa-d8e4-40d2-9d52-b3c9b64fa7f9" /># 🔥 Arduino Fire Prevention Dashboard

A comprehensive real-time fire prevention and monitoring system built with Arduino, Node.js, and modern web technologies. This system monitors flame, gas, and motion sensors to provide early warning and automated response capabilities.

<img width="1916" height="964" alt="image" src="https://github.com/user-attachments/assets/1800575e-47f0-4eb9-812d-90d580f98777" />
<img width="2048" height="1152" alt="image" src="https://github.com/user-attachments/assets/b8c82b2c-f196-4abf-9522-842e161e9a1e" />




## 🚀 Features

### Sensor Monitoring
- **🔥 Flame Detection** - Real-time fire detection with immediate alerts
- **💨 Gas Monitoring** - Air quality monitoring with customizable thresholds (500+ ppm danger level)
- **👥 Motion Detection** - Movement detection with smart timeout logic
- **📊 Real-time Charts** - Live gas level trends and system activity visualization

### Smart Alerts & Control
- **🔊 Audio Alerts** - Browser-based sound notifications for critical events
- **📱 Web Dashboard** - Modern Vercel-inspired dark theme interface
- **🎛️ IR Remote Control** - Manual buzzer control via infrared remote
- **🔄 Auto-reconnection** - Automatic Arduino reconnection without server restart


## 🛠️ Hardware Requirements

### Components
- **Arduino Uno/Nano** (or compatible board)
- **Flame Sensor** (Digital) → Pin 2
- **Gas Sensor (MQ-2/MQ-135)** (Analog) → Pin A0
- **PIR Motion Sensor** (Digital) → Pin 6
- **Relay Module** (for buzzer control) → Pin 4
- **IR Receiver** (for remote control) → Pin 3
- **Buzzer/Alarm** (connected via relay)
- **IR Remote Control** (compatible with NEC protocol)

### Wiring Diagram
```
Arduino Uno Connections:
├── Pin 2  → Flame Sensor (Digital OUT)
├── Pin 3  → IR Receiver (Signal)
├── Pin 4  → Relay Module (Control)
├── Pin 6  → PIR Motion Sensor (Digital OUT)
├── Pin A0 → Gas Sensor (Analog OUT)
├── 5V     → Sensors VCC
└── GND    → Sensors GND

Relay Module:
├── Control → Arduino Pin 4
├── VCC     → Arduino 5V
├── GND     → Arduino GND
├── NO/COM  → Buzzer/Alarm
```

## 💻 Software Setup

### Prerequisites
- **Node.js** (v14 or higher)
- **Arduino IDE** (for uploading firmware)
- **Modern Web Browser** (Chrome, Firefox, Safari, Edge)


### Key Technologies
- **Backend**: Node.js, Express.js, Socket.IO, SerialPort
- **Frontend**: HTML5, Tailwind CSS, Chart.js, WebSockets
- **Hardware**: Arduino C++, IRremote library
- **Communication**: Serial (USB), WebSocket, HTTP REST API

---

**⚠️ Safety Disclaimer:** This system is designed for educational and development purposes. For critical safety applications, please consult with professional fire safety experts and comply with local fire codes and regulations.
