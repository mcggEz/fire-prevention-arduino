// Initialize Socket.IO connection
const socket = io();

// DOM elements
const statusIndicator = document.getElementById('statusIndicator');
const statusText = document.getElementById('statusText');
const flameValue = document.getElementById('flameValue');
const gasValue = document.getElementById('gasValue');
const motionValue = document.getElementById('motionValue');
const relayValue = document.getElementById('relayValue');
const flameCard = document.getElementById('flameCard');
const gasCard = document.getElementById('gasCard');
const motionCard = document.getElementById('motionCard');
const relayCard = document.getElementById('relayCard');
const alertsList = document.getElementById('alertsList');
const alertModal = document.getElementById('alertModal');
const alertMessage = document.getElementById('alertMessage');
const closeModal = document.getElementById('closeModal');
const portSelect = document.getElementById('portSelect');
const refreshPorts = document.getElementById('refreshPorts');
const connectBtn = document.getElementById('connectBtn');
const relayOn = document.getElementById('relayOn');
const relayOff = document.getElementById('relayOff');

// State variables
let isConnected = false;
let currentRelayState = false;
let alerts = [];

// Initialize the dashboard
function initDashboard() {
    updateConnectionStatus(false, 'Connecting...');
    loadAvailablePorts();
    setupEventListeners();
}

// Update connection status
function updateConnectionStatus(connected, message) {
    isConnected = connected;
    
    // Reset status indicator classes
    statusIndicator.className = 'w-3 h-3 rounded-full bg-gray-400 animate-pulse-slow';
    
    if (connected) {
        statusIndicator.className = 'w-3 h-3 rounded-full bg-green-500';
        statusText.textContent = 'Connected';
    } else if (message.includes('error') || message.includes('No Arduino')) {
        statusIndicator.className = 'w-3 h-3 rounded-full bg-red-500';
        statusText.textContent = 'Connection Error';
    } else {
        statusText.textContent = message;
    }
}

// Update sensor values
function updateSensorValues(data) {
    // Update flame sensor
    flameValue.textContent = data.flame ? 'DETECTED' : 'Safe';
    flameValue.className = data.flame ? 'text-xl font-bold text-red-600' : 'text-xl font-bold text-green-600';
    
    // Update flame card styling
    if (data.flame) {
        flameCard.className = 'bg-red-50/95 backdrop-blur-lg rounded-2xl p-6 shadow-2xl transition-all duration-300 hover:transform hover:-translate-y-2 hover:shadow-3xl border-2 border-red-500';
        flameCard.querySelector('.w-16.h-16').className = 'w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white text-2xl';
    } else {
        flameCard.className = 'bg-white/95 backdrop-blur-lg rounded-2xl p-6 shadow-2xl transition-all duration-300 hover:transform hover:-translate-y-2 hover:shadow-3xl border-2 border-transparent';
        flameCard.querySelector('.w-16.h-16').className = 'w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl';
    }
    
    // Update gas sensor
    gasValue.textContent = data.gas;
    gasValue.className = data.gas > 400 ? 'text-xl font-bold text-yellow-600' : 'text-xl font-bold text-green-600';
    
    // Update gas card styling
    if (data.gas > 400) {
        gasCard.className = 'bg-yellow-50/95 backdrop-blur-lg rounded-2xl p-6 shadow-2xl transition-all duration-300 hover:transform hover:-translate-y-2 hover:shadow-3xl border-2 border-yellow-500';
        gasCard.querySelector('.w-16.h-16').className = 'w-16 h-16 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center text-white text-2xl';
    } else {
        gasCard.className = 'bg-white/95 backdrop-blur-lg rounded-2xl p-6 shadow-2xl transition-all duration-300 hover:transform hover:-translate-y-2 hover:shadow-3xl border-2 border-transparent';
        gasCard.querySelector('.w-16.h-16').className = 'w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl';
    }
    
    // Update motion sensor
    motionValue.textContent = data.motion ? 'DETECTED' : 'None';
    motionValue.className = data.motion ? 'text-xl font-bold text-yellow-600' : 'text-xl font-bold text-green-600';
    
    // Update motion card styling
    if (data.motion) {
        motionCard.className = 'bg-yellow-50/95 backdrop-blur-lg rounded-2xl p-6 shadow-2xl transition-all duration-300 hover:transform hover:-translate-y-2 hover:shadow-3xl border-2 border-yellow-500';
        motionCard.querySelector('.w-16.h-16').className = 'w-16 h-16 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center text-white text-2xl';
    } else {
        motionCard.className = 'bg-white/95 backdrop-blur-lg rounded-2xl p-6 shadow-2xl transition-all duration-300 hover:transform hover:-translate-y-2 hover:shadow-3xl border-2 border-transparent';
        motionCard.querySelector('.w-16.h-16').className = 'w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl';
    }
    
    // Update relay status based on hazard detection
    const hazard = data.flame || data.gas > 400 || data.motion;
    currentRelayState = hazard;
    relayValue.textContent = hazard ? 'ON' : 'OFF';
    relayValue.className = hazard ? 'text-xl font-bold text-red-600' : 'text-xl font-bold text-green-600';
    
    // Update relay card styling
    if (hazard) {
        relayCard.className = 'bg-red-50/95 backdrop-blur-lg rounded-2xl p-6 shadow-2xl transition-all duration-300 hover:transform hover:-translate-y-2 hover:shadow-3xl border-2 border-red-500';
        relayCard.querySelector('.w-16.h-16').className = 'w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white text-2xl';
    } else {
        relayCard.className = 'bg-white/95 backdrop-blur-lg rounded-2xl p-6 shadow-2xl transition-all duration-300 hover:transform hover:-translate-y-2 hover:shadow-3xl border-2 border-transparent';
        relayCard.querySelector('.w-16.h-16').className = 'w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl';
    }
}

// Add alert to the list
function addAlert(message, type = 'hazard') {
    const alert = {
        message,
        type,
        timestamp: new Date().toLocaleString()
    };
    
    alerts.unshift(alert);
    
    // Keep only last 10 alerts
    if (alerts.length > 10) {
        alerts.pop();
    }
    
    updateAlertsList();
}

// Update alerts list display
function updateAlertsList() {
    if (alerts.length === 0) {
        alertsList.innerHTML = '<p class="text-gray-500 italic text-center py-8">No alerts yet</p>';
        return;
    }
    
    alertsList.innerHTML = alerts.map(alert => `
        <div class="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
            <div class="text-sm text-gray-800">${alert.message}</div>
            <div class="text-xs text-gray-500 mt-2">${alert.timestamp}</div>
        </div>
    `).join('');
}

// Show alert modal
function showAlertModal(message) {
    alertMessage.textContent = message;
    alertModal.classList.remove('hidden');
    
    // Add entrance animation
    const modalContent = document.getElementById('modalContent');
    modalContent.classList.remove('scale-95');
    modalContent.classList.add('scale-100');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        hideAlertModal();
    }, 5000);
}

// Hide alert modal
function hideAlertModal() {
    const modalContent = document.getElementById('modalContent');
    modalContent.classList.remove('scale-100');
    modalContent.classList.add('scale-95');
    
    setTimeout(() => {
        alertModal.classList.add('hidden');
    }, 300);
}

// Load available serial ports
async function loadAvailablePorts() {
    try {
        const response = await fetch('/api/ports');
        const ports = await response.json();
        
        // Clear existing options except auto-detect
        portSelect.innerHTML = '<option value="">Auto-detect</option>';
        
        ports.forEach(port => {
            const option = document.createElement('option');
            option.value = port.path;
            option.textContent = `${port.path} - ${port.manufacturer || 'Unknown'}`;
            portSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading ports:', error);
    }
}

// Connect to selected port
async function connectToPort(port) {
    try {
        const response = await fetch('/api/connect', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ port })
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log('Connected successfully');
        } else {
            console.error('Connection failed:', result.error);
        }
    } catch (error) {
        console.error('Error connecting:', error);
    }
}

// Setup event listeners
function setupEventListeners() {
    // Relay control buttons
    relayOn.addEventListener('click', () => {
        if (isConnected) {
            socket.emit('relay_control', { action: 'ON' });
            addAlert('Manual relay activation', 'manual');
        }
    });
    
    relayOff.addEventListener('click', () => {
        if (isConnected) {
            socket.emit('relay_control', { action: 'OFF' });
            addAlert('Manual relay deactivation', 'manual');
        }
    });
    
    // Port management
    refreshPorts.addEventListener('click', loadAvailablePorts);
    
    connectBtn.addEventListener('click', () => {
        const selectedPort = portSelect.value;
        if (selectedPort) {
            connectToPort(selectedPort);
        }
    });
    
    // Modal close
    closeModal.addEventListener('click', hideAlertModal);
    
    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === alertModal) {
            hideAlertModal();
        }
    });
}

// Socket.IO event handlers
socket.on('connect', () => {
    console.log('Connected to server');
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
    updateConnectionStatus(false, 'Disconnected');
});

socket.on('connection_status', (data) => {
    updateConnectionStatus(data.connected, data.error || 'Connected');
});

socket.on('sensor_data', (data) => {
    updateSensorValues(data);
});

socket.on('hazard_alert', (data) => {
    addAlert(data.message, 'hazard');
    showAlertModal(data.message);
    
    // Play alert sound (if supported)
    try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
        audio.play();
    } catch (e) {
        // Sound not supported, continue silently
    }
});

socket.on('ir_control', (data) => {
    addAlert(`IR Remote: Manual ${data.action}`, 'ir');
});

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', initDashboard);

// Add some visual feedback for button clicks
document.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', function() {
        this.classList.add('scale-95');
        setTimeout(() => {
            this.classList.remove('scale-95');
        }, 150);
    });
});

// Add keyboard shortcuts
document.addEventListener('keydown', (event) => {
    if (!isConnected) return;
    
    switch(event.key.toLowerCase()) {
        case '1':
        case 'on':
            relayOn.click();
            break;
        case '0':
        case 'off':
            relayOff.click();
            break;
    }
});

// Add periodic status check
setInterval(() => {
    if (!isConnected) {
        fetch('/api/status')
            .then(response => response.json())
            .then(data => {
                if (data.connected !== isConnected) {
                    updateConnectionStatus(data.connected, data.connected ? 'Connected' : 'Disconnected');
                }
            })
            .catch(error => {
                console.error('Status check failed:', error);
            });
    }
}, 5000); 