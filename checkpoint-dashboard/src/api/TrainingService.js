import { useState, useEffect, useRef } from 'react';

class TrainingService {
  constructor() {
    this.baseURL = 'http://localhost:8000';
  }

  async getConclusions() {
    try {
      console.log('Fetching conclusions from:', `${this.baseURL}/api/conclusions`);
      
      const response = await fetch(`${this.baseURL}/api/conclusions`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response received:', text.substring(0, 200));
        throw new Error('Server returned HTML instead of JSON - check if server is running on correct port');
      }

      const data = await response.json();
      console.log('Successfully received conclusions:', data);
      return data;

    } catch (error) {
      console.error('TrainingService.getConclusions error:', error);
      throw error;
    }
  }
}

const trainingService = new TrainingService();

export const useTrainingService = () => {
  const [connectionState, setConnectionState] = useState({
    isConnected: false,
    status: 'disconnected'
  });

  const [trainingData, setTrainingData] = useState({
    isTraining: false,
    currentEpoch: 0,
    currentLoss: 0,
    currentStage: 1,
    trainingTime: 0,
    lastUpdate: null
  });

  const [alerts, setAlerts] = useState([]);
  const [consoleOutput, setConsoleOutput] = useState([]);
  
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const isConnectingRef = useRef(false);
  const connectionInitialized = useRef(false); // NEW: Prevent multiple useEffect calls

  // 🌐 WebSocket Connection Management - Fixed
  useEffect(() => {
    if (connectionInitialized.current) return; // Prevent multiple connections
    connectionInitialized.current = true;
    
    connectWebSocket();
    
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []); // Empty dependency array

  const connectWebSocket = () => {
    // Prevent multiple connection attempts
    if (isConnectingRef.current || (wsRef.current && wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    // Close existing connection if any
    if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
      wsRef.current.close();
    }

    try {
      isConnectingRef.current = true;
      setConnectionState({ isConnected: false, status: 'connecting' });
      
      // Use a single unique client ID for this session
      const clientId = `dashboard_main_${Date.now()}`;
      const ws = new WebSocket(`ws://localhost:8000/ws?client_id=${clientId}`);
      wsRef.current = ws;

      ws.onopen = () => {
        isConnectingRef.current = false;
        setConnectionState({ isConnected: true, status: 'connected' });
        console.log('🔌 WebSocket connected:', clientId);
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        handleWebSocketMessage(message);
      };

      ws.onclose = (event) => {
        isConnectingRef.current = false;
        setConnectionState({ isConnected: false, status: 'disconnected' });
        console.log('🔌 WebSocket disconnected:', event.code);
        
        // Only auto-reconnect if connection was lost unexpectedly
        if (event.code !== 1000 && event.code !== 1001 && connectionInitialized.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, 3000);
        }
      };

      ws.onerror = (error) => {
        isConnectingRef.current = false;
        setConnectionState({ isConnected: false, status: 'error' });
        console.error('🔌 WebSocket error:', error);
      };

    } catch (error) {
      isConnectingRef.current = false;
      setConnectionState({ isConnected: false, status: 'error' });
      console.error('🔌 WebSocket connection failed:', error);
    }
  };

  // 📨 Handle WebSocket Messages
  const handleWebSocketMessage = (message) => {
    switch (message.type) {
      case 'connection_established':
        console.log('🔌 Connection established:', message.data.connection_id);
        break;

      case 'training_update':
        setTrainingData(prev => ({
          ...prev,
          ...message.data
        }));
        break;

      case 'training_alert':
        const alert = {
          id: Date.now(),
          ...message.data,
          timestamp: new Date().toLocaleTimeString()
        };
        setAlerts(prev => [alert, ...prev.slice(0, 4)]);
        break;

      case 'console_output':
        const output = {
          id: Date.now(),
          message: message.data.message,
          timestamp: new Date().toLocaleTimeString()
        };
        setConsoleOutput(prev => [output, ...prev.slice(0, 49)]);
        break;

      case 'training_completed':
        setTrainingData(prev => ({ ...prev, isTraining: false }));
        const completionAlert = {
          id: Date.now(),
          level: 'success',
          message: `Training completed! Final loss: ${message.data.final_loss?.toFixed(4)}`,
          timestamp: new Date().toLocaleTimeString()
        };
        setAlerts(prev => [completionAlert, ...prev.slice(0, 4)]);
        break;

      case 'heartbeat':
        // Send pong to keep connection alive
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'ping' }));
        }
        break;
    }
  };

  // 🚀 Training Control Functions
  const startTraining = async (config) => {
    try {
      const response = await fetch('http://localhost:8000/api/training/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail);
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const stopTraining = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/training/stop', {
        method: 'POST'
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  };

  const optimizeConfig = async (configPath) => {
    try {
      const response = await fetch('http://localhost:8000/api/config/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config_path: configPath,
          target_device: 'cpu_optimized',
          max_parameters: 15e6
        })
      });

      return await response.json();
    } catch (error) {
      return { error: error.message };
    }
  };

  // 🏷️ Status Helpers
  const getStatusColor = (loss) => {
    if (loss > 500) return 'text-red-400';
    if (loss > 100) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getStatusLabel = (loss) => {
    if (loss > 500) return 'Critical';
    if (loss > 100) return 'High';
    return 'Normal';
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    connectionState,
    trainingData,
    alerts,
    consoleOutput,
    startTraining,
    stopTraining,
    optimizeConfig,
    getStatusColor,
    getStatusLabel,
    formatTime
  };
};

export default trainingService;