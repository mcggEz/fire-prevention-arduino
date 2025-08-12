#include <IRremote.h> 

const int flamePin = 2; 
const int gasPin = A0; 
const int motionPin = 6; 
const int relayPin = 4; 
const int irPin = 3; 

IRrecv irrecv(irPin); 
decode_results results;
 

void setup() { 
    pinMode(flamePin, INPUT); 
    pinMode(motionPin, INPUT); 
    pinMode(relayPin, OUTPUT); 
    irrecv.enableIRIn(); 
    Serial.begin(9600); 
    Serial.println("Arduino Fire Prevention System Started");
} 
 
void loop() { 
    int gasValue = analogRead(gasPin); 
    bool flameDetected = digitalRead(flamePin) == LOW; 
    // Simple motion detection (no threshold, direct reading)
    bool motionDetected = digitalRead(motionPin) == LOW;
    
    // Debug: show all sensor states
    Serial.print("Raw values - Flame pin: ");
    Serial.print(digitalRead(flamePin));
    Serial.print(" | Motion pin: ");
    Serial.print(digitalRead(motionPin));
    Serial.print(" | Gas: ");
    Serial.println(gasValue);
    
    Serial.print("Processed - Flame: ");
    Serial.print(flameDetected);
    Serial.print(" | Motion: ");
    Serial.print(motionDetected);
    Serial.print(" | !Motion: ");
    Serial.println(!motionDetected); 
    // Trigger relay for flame, gas, or motion detected
    bool hazard = flameDetected || gasValue > 500 || motionDetected;
    
    // Debug: show what's causing the hazard
    Serial.print("Hazard calculation: ");
    Serial.print(flameDetected);
    Serial.print(" || ");
    Serial.print(gasValue > 500);
    Serial.print(" || ");
    Serial.print(motionDetected);
    Serial.print(" = ");
    Serial.println(hazard);
    
    // Debug: show hazard detection details (only when state changes)
    static bool lastHazardState = false;
    if (hazard != lastHazardState) {
        Serial.print("Hazard Debug - Flame: ");
        Serial.print(flameDetected);
        Serial.print(" | Gas>500: ");
        Serial.print(gasValue > 500);
        Serial.print(" | Motion: ");
        Serial.print(motionDetected);
        Serial.print(" | Hazard: ");
        Serial.println(hazard);
        lastHazardState = hazard;
    } 
 
    // Display sensor status continuously
    Serial.print("Flame: "); 
    Serial.print(flameDetected ? "DETECTED" : "Safe"); 
    Serial.print(" | Gas: "); 
    Serial.print(gasValue); 
    Serial.print(" | Motion: "); 
    Serial.println(motionDetected ? "DETECTED" : "None"); 
 
    // Activate relay (HIGH when hazard detected)
    if (hazard) { 
        digitalWrite(relayPin, HIGH); 
        Serial.println("🔊 BUZZER ACTIVATED - Relay HIGH");
        if (flameDetected) {
            Serial.println("🔥 FLAME HAZARD! Relay activated.");
        } else if (gasValue > 500) {
            Serial.println("⚠️ GAS HAZARD! Relay activated.");
        } else if (motionDetected) {
            Serial.println("👤 MOTION HAZARD! Relay activated.");
        } else {
            Serial.println("Hazard detected! Relay activated.");
        }
    } else { 
        digitalWrite(relayPin, LOW); 
        Serial.println("🔇 BUZZER DEACTIVATED - Relay LOW");
    } 
 
    // IR remote control for buzzer
    if (irrecv.decode(&results)) { 
        // Log the received IR code
        Serial.print("📡 IR Code received: 0x");
        Serial.println(results.value, HEX);
        
        if (results.value == 0xFF30CF) { // ON button 
            digitalWrite(relayPin, HIGH); 
            Serial.println("🔊 Manual BUZZER ON via IR Remote");
        } else if (results.value == 0xFF18E7) { // OFF button 
            digitalWrite(relayPin, LOW); 
            Serial.println("🔇 Manual BUZZER OFF via IR Remote");
        } else if (results.value == 0xFF02FD) { // 1 button - Test buzzer
            digitalWrite(relayPin, HIGH);
            delay(1000); // Buzzer on for 1 second
            digitalWrite(relayPin, LOW);
            Serial.println("🔊 Test buzzer - 1 second beep");
        } else if (results.value == 0xFF22DD) { // 2 button - Emergency mode
            digitalWrite(relayPin, HIGH);
            Serial.println("🚨 EMERGENCY MODE - Buzzer activated via IR");
        } else if (results.value == 0xFFC23D) { // 3 button - Stop all
            digitalWrite(relayPin, LOW);
            Serial.println("🛑 STOP ALL - Buzzer deactivated via IR");
        } else {
            // Unknown IR code
            Serial.print("❓ Unknown IR code: 0x");
            Serial.println(results.value, HEX);
        }
        irrecv.resume(); 
    } 
 
    delay(500); // Send data every 0.5 seconds
} 