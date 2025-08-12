# Arduino Wiring Diagram

## 🔌 **Physical Connections**

### **Required Components:**
- Arduino Uno/Nano/Mega
- Flame Sensor (IR flame detector)
- Gas Sensor (MQ-2)
- PIR Motion Sensor
- Relay Module (5V)
- IR Receiver (TSOP1838)
- Breadboard
- Jumper wires

---

## 📍 **Pin Connections**

### **Flame Sensor (Pin 2)**
```
Flame Sensor    →    Arduino
VCC            →    5V
GND            →    GND
DO (Digital)   →    Pin 2
```

### **Gas Sensor (Pin A0)**
```
Gas Sensor     →    Arduino
VCC            →    5V
GND            →    GND
AO (Analog)    →    Pin A0
```

### **Motion Sensor (Pin 6)**
```
Motion Sensor  →    Arduino
VCC            →    5V
GND            →    GND
OUT            →    Pin 6
```

### **Relay Module (Pin 4)**
```
Relay Module   →    Arduino
VCC            →    5V
GND            →    GND
IN             →    Pin 4
```

### **IR Receiver (Pin 3)**
```
IR Receiver    →    Arduino
VCC            →    5V
GND            →    GND
OUT            →    Pin 3
```

---

## 🔧 **Power Supply**

### **Arduino Power:**
- USB cable from computer (5V)
- Or external 7-12V power supply

### **Sensor Power:**
- All sensors powered from Arduino 5V and GND
- No external power supply needed

---

## 📋 **Step-by-Step Setup**

### **Step 1: Connect Sensors**
1. **Flame Sensor:**
   - Connect VCC to Arduino 5V
   - Connect GND to Arduino GND
   - Connect DO to Arduino Pin 2

2. **Gas Sensor:**
   - Connect VCC to Arduino 5V
   - Connect GND to Arduino GND
   - Connect AO to Arduino Pin A0

3. **Motion Sensor:**
   - Connect VCC to Arduino 5V
   - Connect GND to Arduino GND
   - Connect OUT to Arduino Pin 6

### **Step 2: Connect Output Devices**
1. **Relay Module:**
   - Connect VCC to Arduino 5V
   - Connect GND to Arduino GND
   - Connect IN to Arduino Pin 4

2. **IR Receiver:**
   - Connect VCC to Arduino 5V
   - Connect GND to Arduino GND
   - Connect OUT to Arduino Pin 3

### **Step 3: Test Connections**
1. Upload the Arduino code
2. Open Serial Monitor (9600 baud)
3. Verify sensor readings appear

---

## ⚠️ **Important Notes**

### **Sensor Placement:**
- **Flame Sensor:** Point towards potential fire sources
- **Gas Sensor:** Place in area where gas leaks might occur
- **Motion Sensor:** Position to detect movement in monitored area

### **Safety Considerations:**
- **Relay Module:** Can control high-voltage devices (be careful!)
- **Gas Sensor:** May need calibration for your environment
- **Flame Sensor:** Sensitive to IR light, avoid direct sunlight

### **Troubleshooting:**
- **No readings:** Check wiring and power connections
- **False readings:** Adjust sensor sensitivity or placement
- **Relay not working:** Check relay module connections and power

---

## 🔍 **Testing the Setup**

### **Serial Monitor Output:**
```
Flame: Safe | Gas: 245 | Motion: None
Flame: Safe | Gas: 250 | Motion: None
Flame: DETECTED | Gas: 567 | Motion: DETECTED
⚠ Hazard detected! Relay activated.
```

### **Expected Behavior:**
- **Normal state:** All sensors show safe/normal readings
- **Flame detected:** Flame sensor shows "DETECTED"
- **Gas leak:** Gas sensor value > 400
- **Motion detected:** Motion sensor shows "DETECTED"
- **Hazard:** Relay activates automatically

---

## 📱 **Dashboard Connection**

Once hardware is connected:
1. Start the Node.js server: `npm start`
2. Open dashboard: `http://localhost:3000`
3. Dashboard will auto-detect Arduino
4. Real-time sensor data will appear

The interface automatically parses the Arduino's serial output and displays it in the beautiful Tailwind CSS dashboard! 