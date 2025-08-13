#include <IRremote.hpp> // Use only the new IRremote library

// ==== IR remote button commands ====
#define CMD_ON      12  // Button 1
#define CMD_OFF     24  // Button 2
#define CMD_MANUAL  94  // Button 3
#define CMD_AUTO     8  // Button 4

// ==== Pin definitions ====
const int flamePin = 2;
const int gasPin = A0;
const int motionPin = 6;
const int relayPin = 4;
const int irPin = 7; // IR receiver

bool manualMode = false; // false = Auto, true = Manual
bool relayState = false; // Current relay status

void setup() {
    pinMode(flamePin, INPUT);
    pinMode(motionPin, INPUT);
    pinMode(relayPin, OUTPUT);

    Serial.begin(9600);
    Serial.println("Arduino Fire Prevention System Started");

    IrReceiver.begin(irPin, ENABLE_LED_FEEDBACK);
}

void loop() {
    // ==== Sensor readings ====
    int gasValue = analogRead(gasPin);
    bool flameDetected = (digitalRead(flamePin) == LOW);
    bool motionDetected = (digitalRead(motionPin) == LOW); // LOW means obstacle detected

    bool hazard = flameDetected || gasValue > 500 || motionDetected;

    // ==== Auto mode operation ====
    if (!manualMode) { // Auto Mode
        relayState = hazard;
    }

    // ==== Apply relay state ====
    digitalWrite(relayPin, relayState ? HIGH : LOW);

    // ==== Debug status ====
    Serial.print("Mode: ");
    Serial.print(manualMode ? "MANUAL" : "AUTO");
    Serial.print(" | Relay: ");
    Serial.print(relayState ? "ON" : "OFF");
    Serial.print(" | Flame: ");
    Serial.print(flameDetected ? "YES" : "No");
    Serial.print(" | Gas: ");
    Serial.print(gasValue);
    Serial.print(" | Motion: ");
    Serial.println(motionDetected ? "YES" : "No");

    // ==== IR remote control ====
if (IrReceiver.decode()) {
    uint8_t command = IrReceiver.decodedIRData.command;
    Serial.print("📡 IR Command: ");
    Serial.println(command);

    if (command == CMD_AUTO) { // Switch to Auto mode
        manualMode = false;
        Serial.println("🤖 Auto Mode Activated");
    }
    else if (command == CMD_MANUAL) { // Switch to Manual mode
        manualMode = true;
        Serial.println("🔧 Manual Mode Activated");
    }
    else if (command == CMD_ON) { // Relay ON (Manual only)
        if (manualMode) {
            relayState = true;
            Serial.println("🔊 Relay ON (Manual)");
        } else {
            Serial.println("⚠ Relay ON ignored - Auto Mode active");
        }
    }
    else if (command == CMD_OFF) { // Relay OFF (Manual only)
        if (manualMode) {
            relayState = false;
            Serial.println("🔇 Relay OFF (Manual)");
        } else {
            Serial.println("⚠ Relay OFF ignored - Auto Mode active");
        }
    }

    IrReceiver.resume();
}


    delay(500);
}