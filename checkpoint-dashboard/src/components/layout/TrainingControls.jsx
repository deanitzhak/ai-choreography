import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Square, Settings, Wifi, WifiOff, Database, 
  RotateCcw, Zap, CheckCircle, AlertTriangle, Terminal 
} from 'lucide-react';

// 🎮 Fixed Training Controls that work with the corrected API
const TrainingControls = ({ 
  connectionState, 
  trainingData, 
  startTraining, 
  stopTraining 
}) => {
  // ✅ Simplified config that matches the API
  const [trainingConfig, setTrainingConfig] = useState({
    config_path: 'config/bailando_config_stable.yaml',
    stage: 1,
    resume_mode: 'fresh', // 'fresh', 'latest', 'specific'
    resume_checkpoint: '',
    run_name: '',
    preserve_logs: false
  });

  const [availableConfigs, setAvailableConfigs] = useState([]);
  const [availableCheckpoints, setAvailableCheckpoints] = useState([]);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState([]);
  const [showConsole, setShowConsole] = useState(false);

  // Resume mode options (simplified)
  const resumeModes = [
    { 
      value: 'fresh', 
      label: 'Fresh Start', 
      description: 'Start training from scratch with random weights',
      icon: Zap,
      color: 'text-blue-400'
    },
    { 
      value: 'latest', 
      label: 'Resume Latest', 
      description: 'Continue from the most recent checkpoint',
      icon: RotateCcw,
      color: 'text-green-400'
    },
    { 
      value: 'specific', 
      label: 'Specific Checkpoint', 
      description: 'Resume from a specific checkpoint file',
      icon: Database,
      color: 'text-purple-400'
    }
  ];

  // 🔧 Load available configs and checkpoints
  useEffect(() => {
    loadAvailableConfigs();
    if (trainingConfig.resume_mode === 'specific') {
      loadAvailableCheckpoints();
    }
  }, [trainingConfig.resume_mode]);

  // 📊 Fetch training logs periodically
  useEffect(() => {
    if (trainingData.isTraining) {
      const interval = setInterval(fetchLogs, 2000); // Every 2 seconds
      return () => clearInterval(interval);
    }
  }, [trainingData.isTraining]);

  const loadAvailableConfigs = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('http://localhost:8000/api/configs/available');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Handle both array and object responses
      let configs = [];
      if (Array.isArray(data)) {
        configs = data;
      } else if (data && Array.isArray(data.configs)) {
        configs = data.configs;
      }
      
      setAvailableConfigs(configs);
      
    } catch (error) {
      console.error('❌ Error loading configs:', error);
      setError(error.message);
      setAvailableConfigs([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableCheckpoints = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/training/checkpoints');
      
      if (response.ok) {
        const data = await response.json();
        setAvailableCheckpoints(data.checkpoints || []);
      }
    } catch (error) {
      console.warn('Failed to load checkpoints:', error);
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/training/logs?last_lines=20');
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.warn('Failed to fetch logs:', error);
    }
  };

  // 🚀 Handle training start (fixed to match API)
  const handleStartTraining = async () => {
    try {
      setError('');
      
      // ✅ Only send parameters that the API accepts
      const config = {
        config_path: trainingConfig.config_path,
        stage: trainingConfig.stage,
        resume_mode: trainingConfig.resume_mode,
        resume_checkpoint: trainingConfig.resume_mode === 'specific' ? trainingConfig.resume_checkpoint : null,
        run_name: trainingConfig.run_name || null,
        preserve_logs: trainingConfig.preserve_logs
      };
      
      console.log('🚀 Starting training with config:', config);
      
      const result = await startTraining(config);
      
      if (!result.success) {
        setError(result.error || 'Training failed to start');
        alert(`Training failed: ${result.error}`);
      } else {
        setShowConsole(true); // Auto-show console when training starts
      }
    } catch (error) {
      console.error('Training start error:', error);
      setError(error.message);
    }
  };

  // 📋 Handle checkpoint selection
  const handleCheckpointSelect = (checkpoint) => {
    setSelectedCheckpoint(checkpoint);
    setTrainingConfig(prev => ({
      ...prev,
      resume_mode: 'specific',
      resume_checkpoint: checkpoint.path
    }));
  };

  // 🎨 Get resume mode styling
  const getResumeModeStyling = (mode) => {
    const selected = trainingConfig.resume_mode === mode.value;
    return {
      button: `p-3 rounded-lg border-2 transition-all cursor-pointer ${
        selected 
          ? 'border-blue-500 bg-blue-900 shadow-lg' 
          : 'border-gray-600 bg-gray-700 hover:border-gray-500'
      }`,
      icon: `w-5 h-5 ${selected ? mode.color : 'text-gray-400'}`
    };
  };

  const { isConnected } = connectionState;
  const { isTraining } = trainingData;

  return (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 space-y-6">
      {/* Header with Connection Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h2 className="text-xl font-bold text-white">Training Control</h2>
          
          {/* Connection Indicator */}
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <Wifi className="w-4 h-4 text-green-400" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-400" />
            )}
            <span className={`text-sm ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        {/* Main Controls */}
        <div className="flex items-center space-x-2">
          {!isTraining ? (
            <button
              onClick={handleStartTraining}
              disabled={!isConnected || loading}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Play className="w-4 h-4" />
              <span>Start Training</span>
            </button>
          ) : (
            <button
              onClick={stopTraining}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Square className="w-4 h-4" />
              <span>Stop Training</span>
            </button>
          )}
          
          <button
            onClick={() => setShowConsole(!showConsole)}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
              showConsole ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-700'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Console</span>
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900 border border-red-600 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-red-300 text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Console Output */}
      <AnimatePresence>
        {showConsole && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-black rounded-lg border border-gray-600 overflow-hidden"
          >
            <div className="flex items-center justify-between p-3 bg-gray-900 border-b border-gray-600">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-green-400" />
                <span className="text-white font-medium">Training Console</span>
              </div>
              <span className="text-sm text-gray-400">
                {logs.length} lines {isTraining && '(Live)'}
              </span>
            </div>
            
            <div className="p-4 max-h-64 overflow-y-auto font-mono text-sm">
              {logs.length > 0 ? (
                <div className="space-y-1">
                  {logs.map((log, index) => (
                    <div key={index} className="text-green-300">
                      {log}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500">
                  {isTraining ? 'Waiting for output...' : 'No logs available. Start training to see output.'}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resume Mode Selection */}
      <div>
        <h3 className="text-white font-semibold mb-3">Training Mode</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {resumeModes.map((mode) => {
            const styling = getResumeModeStyling(mode);
            const Icon = mode.icon;
            
            return (
              <motion.div
                key={mode.value}
                onClick={() => setTrainingConfig(prev => ({ ...prev, resume_mode: mode.value }))}
                className={styling.button}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <Icon className={styling.icon} />
                  <span className="text-white font-medium">{mode.label}</span>
                </div>
                <p className="text-xs text-gray-400 text-left">
                  {mode.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Checkpoint Selection (when specific mode is chosen) */}
      <AnimatePresence>
        {trainingConfig.resume_mode === 'specific' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-700 p-4 rounded-lg border border-gray-600"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-white font-semibold">Select Checkpoint</h4>
              <button 
                onClick={loadAvailableCheckpoints}
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                Refresh
              </button>
            </div>
            
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {availableCheckpoints.map((checkpoint, index) => (
                <button
                  key={index}
                  onClick={() => handleCheckpointSelect(checkpoint)}
                  className={`w-full p-3 rounded border text-left transition-all ${
                    selectedCheckpoint?.path === checkpoint.path
                      ? 'bg-blue-900 border-blue-500'
                      : 'bg-gray-800 border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-medium">{checkpoint.name}</div>
                      <div className="text-sm text-gray-400">
                        Stage: {checkpoint.stage} • Loss: {checkpoint.loss} • Size: {checkpoint.size_mb}MB
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {checkpoint.directory === 'checkpoints_stable' && (
                        <CheckCircle className="w-4 h-4 text-green-400" title="Stable checkpoint" />
                      )}
                    </div>
                  </div>
                </button>
              ))}
              
              {availableCheckpoints.length === 0 && (
                <div className="text-gray-400 text-center py-4">
                  No checkpoints found. Click Refresh to reload.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Configuration Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Settings */}
        <div className="space-y-4">
          <h3 className="text-white font-semibold">Configuration</h3>
          
          <div>
            <label className="text-sm text-gray-400 block mb-1">Configuration File:</label>
            <select
              value={trainingConfig.config_path}
              onChange={(e) => setTrainingConfig(prev => ({ ...prev, config_path: e.target.value }))}
              disabled={isTraining || loading}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm"
            >
              <option value="config/bailando_config_stable.yaml">
                bailando_config_stable.yaml (Recommended)
              </option>
              
              {Array.isArray(availableConfigs) && availableConfigs.map(config => (
                <option key={config.path || config.name} value={config.path || config.name}>
                  {config.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-400 block mb-1">Stage:</label>
            <select
              value={trainingConfig.stage}
              onChange={(e) => setTrainingConfig(prev => ({ ...prev, stage: parseInt(e.target.value) }))}
              disabled={isTraining}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm"
            >
              <option value={1}>Stage 1 - VQ-VAE (Motion Compression)</option>
              <option value={2}>Stage 2 - GPT (Sequence Generation)</option> 
              <option value={3}>Stage 3 - Actor-Critic (Policy Learning)</option>
            </select>
          </div>
        </div>

        {/* Optional Settings */}
        <div className="space-y-4">
          <h3 className="text-white font-semibold">Optional Settings</h3>
          
          <div>
            <label className="text-sm text-gray-400 block mb-1">Run Name (optional):</label>
            <input
              type="text"
              value={trainingConfig.run_name}
              onChange={(e) => setTrainingConfig(prev => ({ ...prev, run_name: e.target.value }))}
              disabled={isTraining}
              placeholder="e.g., experiment_1"
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="preserve_logs"
              checked={trainingConfig.preserve_logs}
              onChange={(e) => setTrainingConfig(prev => ({ ...prev, preserve_logs: e.target.checked }))}
              disabled={isTraining}
              className="rounded"
            />
            <label htmlFor="preserve_logs" className="text-gray-300 text-sm">
              Preserve logs (use timestamped directory)
            </label>
          </div>

          {/* Current Selection Summary */}
          <div className="bg-gray-900 p-3 rounded border border-gray-600">
            <div className="text-sm text-gray-400 mb-1">Ready to start:</div>
            <div className="space-y-1 text-xs">
              <div className="text-white">
                <strong>Mode:</strong> {resumeModes.find(m => m.value === trainingConfig.resume_mode)?.label}
              </div>
              <div className="text-gray-300">
                <strong>Stage:</strong> {trainingConfig.stage} | 
                <strong> Config:</strong> {trainingConfig.config_path.split('/').pop()}
              </div>
              {trainingConfig.resume_mode === 'specific' && selectedCheckpoint && (
                <div className="text-blue-300">
                  <strong>Checkpoint:</strong> {selectedCheckpoint.name}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainingControls;