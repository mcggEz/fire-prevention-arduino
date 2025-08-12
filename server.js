const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.static('public'));
app.use(express.json());

// Serial port configuration
let serialPort;
let parser;
let reconnectInterval;
let isReconnecting = false;

// Try to connect to Arduino
async function connectToArduino() {
  SerialPort.list().then(ports => {
    console.log('Available ports:');
    ports.forEach(port => {
      console.log(`${port.path} - ${port.manufacturer || 'Unknown'}`);
    });
    
    // Always try COM7 first
    let arduinoPort = ports.find(port => port.path === 'COM7');
    if (!arduinoPort) {
      // Fallback to previous logic if COM7 is not found
      arduinoPort = ports.find(port => 
        port.manufacturer?.includes('Arduino') || 
        port.path.includes('COM') ||
        port.path.includes('ttyUSB') ||
        port.path.includes('ttyACM')
      );
    }
    
    if (arduinoPort) {
      console.log(`Attempting to connect to ${arduinoPort.path}...`);
      
      // Try to connect with error handling
      try {
        serialPort = new SerialPort({ 
          path: arduinoPort.path, 
          baudRate: 9600,
          autoOpen: false // Don't open immediately
        });
        
        parser = serialPort.pipe(new ReadlineParser({ delimiter: '\r\n' }));
        
        parser.on('data', (data) => {
          console.log('Arduino data:', data);
          parseArduinoData(data);
        });
        
        serialPort.on('error', (err) => {
          console.error('Serial port error:', err);
          io.emit('connection_status', { connected: false, error: err.message });
          
          // Start automatic reconnection on error
          if (!isReconnecting) {
            startAutoReconnect();
          }
        });
        
        serialPort.on('open', () => {
          console.log('✅ Serial port opened successfully!');
          io.emit('connection_status', { connected: true });
          
          // Stop reconnection attempts when successfully connected
          stopAutoReconnect();
        });
        
        serialPort.on('close', () => {
          console.log('❌ Serial port closed');
          io.emit('connection_status', { connected: false });
          
          // Start automatic reconnection if not already reconnecting
          if (!isReconnecting) {
            console.log('🔄 Starting reconnection due to port close...');
            startAutoReconnect();
          }
        });
        
        // Now try to open the port
        serialPort.open((err) => {
          if (err) {
            console.error('Failed to open port:', err);
            io.emit('connection_status', { connected: false, error: err.message });
            
            // Start reconnection if this is a connection attempt
            if (!isReconnecting) {
              startAutoReconnect();
            }
          }
        });
        
      } catch (error) {
        console.error('Error creating serial port:', error);
        io.emit('connection_status', { connected: false, error: error.message });
      }
    } else {
      console.log('No Arduino found. Please check connection.');
      io.emit('connection_status', { connected: false, error: 'No Arduino found' });
    }
  }).catch(err => {
    console.error('Error listing ports:', err);
    io.emit('connection_status', { connected: false, error: err.message });
  });
}

// Try alternative ports if the first one fails
function tryAlternativePorts(ports, failedPort) {
  const availablePorts = ports.filter(port => port.path !== failedPort);
  
  if (availablePorts.length > 0) {
    const nextPort = availablePorts[0];
    console.log(`Trying alternative port: ${nextPort.path}`);
    
    try {
      if (serialPort) {
        serialPort.close();
      }
      
      serialPort = new SerialPort({ 
        path: nextPort.path, 
        baudRate: 9600,
        autoOpen: false
      });
      
      parser = serialPort.pipe(new ReadlineParser({ delimiter: '\r\n' }));
      
      parser.on('data', (data) => {
        console.log('Arduino data:', data);
        parseArduinoData(data);
      });
      
      serialPort.on('error', (err) => {
        console.error('Alternative port also failed:', err);
        io.emit('connection_status', { connected: false, error: 'All ports failed' });
      });
      
      serialPort.on('open', () => {
        console.log(`Successfully connected to ${nextPort.path}!`);
        io.emit('connection_status', { connected: true });
      });
      
      serialPort.open((err) => {
        if (err) {
          console.error('Failed to open alternative port:', err);
          io.emit('connection_status', { connected: false, error: err.message });
        }
      });
      
    } catch (error) {
      console.error('Error with alternative port:', error);
    }
  }
}

// Parse Arduino serial data
function parseArduinoData(data) {
  try {
    console.log('Received from Arduino:', data);
    
    // Parse sensor data from Arduino output
    if (data.includes('Flame:') && data.includes('Gas:') && data.includes('Motion:')) {
      const flameMatch = data.match(/Flame:\s*(DETECTED|Safe)/);
      const gasMatch = data.match(/Gas:\s*(\d+)/);
      const motionMatch = data.match(/Motion:\s*(DETECTED|None)/);
      
      if (flameMatch && gasMatch && motionMatch) {
        const sensorData = {
          flame: flameMatch[1] === 'DETECTED',
          gas: parseInt(gasMatch[1]),
          motion: motionMatch[1] === 'DETECTED', // "DETECTED" means motion detected (true)
          timestamp: new Date().toISOString()
        };
        
        console.log('Parsed sensor data:', sensorData);
        io.emit('sensor_data', sensorData);
      }
    }
    
    // Parse hazard detection (simplified)
    if (data.includes('Hazard detected! Relay activated.')) {
      io.emit('hazard_alert', {
        message: 'Hazard detected! Relay activated.',
        timestamp: new Date().toISOString()
      });
    }
    
    // Parse IR control messages
    if (data.includes('Manual ON via IR.') || data.includes('Manual OFF via IR.')) {
      const isOn = data.includes('Manual ON via IR.');
      io.emit('ir_control', {
        action: isOn ? 'ON' : 'OFF',
        timestamp: new Date().toISOString()
      });
    }
    
    // Check for startup message
    if (data.includes('Arduino Fire Prevention System Started')) {
      console.log('Arduino system initialized successfully!');
    }
    
  } catch (error) {
    console.error('Error parsing Arduino data:', error);
  }
}

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('Client connected');
  
  // Send current connection status
  socket.emit('connection_status', { 
    connected: serialPort && serialPort.isOpen 
  });
  
  // Handle manual relay control
  socket.on('relay_control', (data) => {
    if (serialPort && serialPort.isOpen) {
      const command = data.action === 'ON' ? '1' : '0';
      serialPort.write(command + '\n');
      console.log(`Manual relay control: ${data.action}`);
      
      // Emit relay status update
      io.emit('relay_status', { status: data.action });
    } else {
      console.log('Cannot control relay - Arduino not connected');
    }
  });

  // Handle settings updates
  socket.on('update_settings', (data) => {
    console.log('Settings updated:', data);
    // You can store settings in memory or database here
    io.emit('settings_updated', data);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// API endpoints
app.get('/api/status', (req, res) => {
  res.json({
    connected: serialPort && serialPort.isOpen,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/ports', async (req, res) => {
  try {
    const ports = await SerialPort.list();
    res.json(ports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/connect', (req, res) => {
  const { port } = req.body;
  if (!port) {
    return res.status(400).json({ error: 'Port is required' });
  }
  
  try {
    if (serialPort) {
      serialPort.close();
    }
    
    serialPort = new SerialPort({ path: port, baudRate: 9600 });
    parser = serialPort.pipe(new ReadlineParser({ delimiter: '\r\n' }));
    
    parser.on('data', parseArduinoData);
    
    serialPort.on('open', () => {
      console.log(`Connected to ${port}`);
      io.emit('connection_status', { connected: true });
      res.json({ success: true, message: `Connected to ${port}` });
    });
    
    serialPort.on('error', (err) => {
      console.error('Serial port error:', err);
      res.status(500).json({ error: err.message });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Dashboard available at http://localhost:${PORT}`);
  
  // Try to connect to Arduino on startup
  setTimeout(connectToArduino, 1000);
  
  // Start demo mode if no Arduino is connected after 5 seconds
  setTimeout(() => {
    if (!serialPort || !serialPort.isOpen) {
      console.log('No Arduino connected. Starting demo mode...');
      startDemoMode();
    }
  }, 5000);
  
  // Connection health check every 10 seconds
  setInterval(() => {
    if (serialPort && !serialPort.isOpen && !isReconnecting) {
      console.log('🔍 Health check: Arduino appears disconnected, starting reconnection...');
      startAutoReconnect();
    }
  }, 10000);
});

// Demo mode for testing without Arduino
function startDemoMode() {
  console.log('Demo mode: Simulating sensor data...');
  
  setInterval(() => {
    const demoData = {
      flame: Math.random() > 0.95, // 5% chance of flame
      gas: Math.floor(Math.random() * 600) + 100, // Random gas value 100-700
      motion: Math.random() > 0.8, // 20% chance of motion
      timestamp: new Date().toISOString()
    };
    
    io.emit('sensor_data', demoData);
    
    // Simulate hazard alerts
    if (demoData.flame || demoData.gas > 400 || demoData.motion) {
      io.emit('hazard_alert', {
        message: 'Demo: Hazard detected! Relay activated.',
        timestamp: new Date().toISOString()
      });
    }
    
    // Simulate IR control
    if (Math.random() > 0.98) { // 2% chance
      const action = Math.random() > 0.5 ? 'ON' : 'OFF';
      io.emit('ir_control', {
        action: action,
        timestamp: new Date().toISOString()
      });
    }
  }, 2000); // Update every 2 seconds
  
  io.emit('connection_status', { connected: true, demo: true });
}

// Auto-reconnection functions
function startAutoReconnect() {
  if (isReconnecting) return;
  
  isReconnecting = true;
  console.log('🔄 Starting automatic reconnection...');
  
  // Clear any existing reconnection interval
  if (reconnectInterval) {
    clearInterval(reconnectInterval);
  }
  
  // Try to reconnect every 2 seconds
  reconnectInterval = setInterval(async () => {
    console.log('🔄 Attempting to reconnect to Arduino...');
    
    // Close existing connection if any
    if (serialPort) {
      try {
        if (serialPort.isOpen) {
          serialPort.close();
        }
      } catch (error) {
        console.log('Error closing existing port:', error.message);
      }
    }
    
    // Reset connection state
    serialPort = null;
    parser = null;
    
    // Try to connect again
    try {
      await connectToArduino();
    } catch (error) {
      console.log('Reconnection attempt failed:', error.message);
    }
  }, 2000);
}

function stopAutoReconnect() {
  if (reconnectInterval) {
    clearInterval(reconnectInterval);
    reconnectInterval = null;
  }
  isReconnecting = false;
  console.log('✅ Auto-reconnection stopped - Arduino connected successfully');
}

// Cleanup on server shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  stopAutoReconnect();
  if (serialPort) {
    serialPort.close();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down server...');
  stopAutoReconnect();
  if (serialPort) {
    serialPort.close();
  }
  process.exit(0);
});