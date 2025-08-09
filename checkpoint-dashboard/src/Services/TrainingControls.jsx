import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Square, Settings, Wifi, WifiOff, Database, 
  RotateCcw, Zap, CheckCircle, AlertTriangle 
} from 'lucide-react';

// 🎮 Enhanced Training Controls with Checkpoint Selection
const TrainingControls = ({ 
  connectionState, 
  trainingData, 
  startTraining, 
  stopTraining, 
  optimizeConfig 
}) => {
  const [trainingConfig, setTrainingConfig] = useState({
    config_path: 'config/bailando_config_stable.yaml',
    stage: 1,
    resume_mode: 'fresh', // 'fresh', 'latest', 'select', 'specific'
    resume_checkpoint: '',
    auto_optimize: true,
    auto_analyze: true,
    target_loss: 30.0,
    use_stable_config: true
  });

  const [availableConfigs, setAvailableConfigs] = useState([]);
  const [availableCheckpoints, setAvailableCheckpoints] = useState([]);
  const [showCheckpointSelector, setShowCheckpointSelector] = useState(false);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState(null);

  // Resume mode options
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
      value: 'select', 
      label: 'Select Checkpoint', 
      description: 'Choose specific checkpoint interactively',
      icon: Database,
      color: 'text-purple-400'
    }
  ];

  // 🔧 Load available configs and checkpoints
  useEffect(() => {
    loadAvailableConfigs();
    if (trainingConfig.resume_mode === 'select') {
      loadAvailableCheckpoints();
    }
  }, [trainingConfig.resume_mode, trainingConfig.stage]);

  const loadAvailableConfigs = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/configs/available');
      if (response.ok) {
        const configs = await response.json();
        setAvailableConfigs(configs);
      }
    } catch (error) {
      console.warn('Failed to load configs:', error);
    }
  };

  const loadAvailableCheckpoints = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/checkpoints/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          stage: trainingConfig.stage,
          logs_directory: 'outputs/logs'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setAvailableCheckpoints(data.available_checkpoints || []);
      }
    } catch (error) {
      console.warn('Failed to load checkpoints:', error);
    }
  };

  // 🚀 Handle training start with enhanced options
  const handleStartTraining = async () => {
    const config = {
      ...trainingConfig,
      resume_checkpoint: trainingConfig.resume_mode === 'specific' ? selectedCheckpoint?.file_path : null
    };
    
    const result = await startTraining(config);
    
    if (!result.success) {
      alert(`Training failed: ${result.error}`);
    }
  };

  // 🛠️ Handle config optimization
  const handleOptimizeConfig = async () => {
    const result = await optimizeConfig(trainingConfig.config_path);
    
    if (result.error) {
      alert(`Optimization failed: ${result.error}`);
    } else {
      alert('Configuration optimized successfully!');
      if (result.optimized_config_path) {
        setTrainingConfig(prev => ({
          ...prev,
          config_path: result.optimized_config_path
        }));
      }
    }
  };

  // 📋 Handle checkpoint selection
  const handleCheckpointSelect = (checkpoint) => {
    setSelectedCheckpoint(checkpoint);
    setTrainingConfig(prev => ({
      ...prev,
      resume_mode: 'specific',
      resume_checkpoint: checkpoint.file_path
    }));
    setShowCheckpointSelector(false);
  };

  // 🎨 Get resume mode styling
  const getResumeModeStyling = (mode) => {
    const selected = trainingConfig.resume_mode === mode.value;
    return {
      button: `p-3 rounded-lg border-2 transition-all ${
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
          <h2 className="text-xl font-bold text-white">Enhanced Training Control</h2>
          
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
              disabled={!isConnected}
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
            onClick={handleOptimizeConfig}
            disabled={isTraining}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span>Optimize</span>
          </button>
        </div>
      </div>

      {/* Resume Mode Selection */}
      <div>
        <h3 className="text-white font-semibold mb-3">Training Mode</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {resumeModes.map((mode) => {
            const styling = getResumeModeStyling(mode);
            const Icon = mode.icon;
            
            return (
              <motion.button
                key={mode.value}
                onClick={() => setTrainingConfig(prev => ({ ...prev, resume_mode: mode.value }))}
                disabled={isTraining}
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
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Checkpoint Selection (when select mode is chosen) */}
      <AnimatePresence>
        {trainingConfig.resume_mode === 'select' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-700 p-4 rounded-lg border border-gray-600"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-white font-semibold">Select Checkpoint</h4>
              <span className="text-sm text-gray-400">
                {availableCheckpoints.length} available for Stage {trainingConfig.stage}
              </span>
            </div>
            
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {availableCheckpoints.map((checkpoint) => (
                <button
                  key={checkpoint.id}
                  onClick={() => handleCheckpointSelect(checkpoint)}
                  className={`w-full p-3 rounded border text-left transition-all ${
                    selectedCheckpoint?.id === checkpoint.id
                      ? 'bg-blue-900 border-blue-500'
                      : 'bg-gray-800 border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-medium">{checkpoint.name}</div>
                      <div className="text-sm text-gray-400">
                        Loss: {checkpoint.loss.toFixed(4)} • {checkpoint.timestamp}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {checkpoint.recommended && (
                        <CheckCircle className="w-4 h-4 text-green-400" title="Recommended" />
                      )}
                      {checkpoint.loss > 500 && (
                        <AlertTriangle className="w-4 h-4 text-red-400" title="Unstable" />
                      )}
                    </div>
                  </div>
                </button>
              ))}
              
              {availableCheckpoints.length === 0 && (
                <div className="text-gray-400 text-center py-4">
                  No checkpoints found for Stage {trainingConfig.stage}
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
          <h3 className="text-white font-semibold">Basic Configuration</h3>
          
          <div>
            <label className="text-sm text-gray-400 block mb-1">Configuration File:</label>
            <select
              value={trainingConfig.config_path}
              onChange={(e) => setTrainingConfig(prev => ({ ...prev, config_path: e.target.value }))}
              disabled={isTraining}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm"
            >
              {availableConfigs.map(config => (
                <option key={config.path} value={config.path}>
                  {config.name} - {config.description}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-400 block mb-1">Stage:</label>
              <select
                value={trainingConfig.stage}
                onChange={(e) => setTrainingConfig(prev => ({ ...prev, stage: parseInt(e.target.value) }))}
                disabled={isTraining}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm"
              >
                <option value={1}>Stage 1 (VQ-VAE) - Motion Compression</option>
                <option value={2}>Stage 2 (GPT) - Sequence Generation</option> 
                <option value={3}>Stage 3 (Actor-Critic) - Policy Learning</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-1">Target Loss:</label>
              <input
                type="number"
                value={trainingConfig.target_loss}
                onChange={(e) => setTrainingConfig(prev => ({ ...prev, target_loss: parseFloat(e.target.value) }))}
                disabled={isTraining}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm"
                step="0.1"
                min="0"
              />
            </div>
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="space-y-4">
          <h3 className="text-white font-semibold">Advanced Options</h3>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="auto_optimize"
                checked={trainingConfig.auto_optimize}
                onChange={(e) => setTrainingConfig(prev => ({ ...prev, auto_optimize: e.target.checked }))}
                disabled={isTraining}
                className="rounded"
              />
              <label htmlFor="auto_optimize" className="text-gray-300 text-sm">
                Auto-optimize configuration before training
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="auto_analyze"
                checked={trainingConfig.auto_analyze}
                onChange={(e) => setTrainingConfig(prev => ({ ...prev, auto_analyze: e.target.checked }))}
                disabled={isTraining}
                className="rounded"
              />
              <label htmlFor="auto_analyze" className="text-gray-300 text-sm">
                Auto-analyze previous training before starting
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="use_stable_config"
                checked={trainingConfig.use_stable_config}
                onChange={(e) => setTrainingConfig(prev => ({ ...prev, use_stable_config: e.target.checked }))}
                disabled={isTraining}
                className="rounded"
              />
              <label htmlFor="use_stable_config" className="text-gray-300 text-sm">
                Auto-switch to stable config if issues detected
              </label>
            </div>
          </div>

          {/* Current Selection Summary */}
          <div className="bg-gray-900 p-3 rounded border border-gray-600">
            <div className="text-sm text-gray-400 mb-1">Current Selection:</div>
            <div className="space-y-1 text-xs">
              <div className="text-white">
                <strong>Mode:</strong> {resumeModes.find(m => m.value === trainingConfig.resume_mode)?.label}
              </div>
              <div className="text-gray-300">
                <strong>Stage:</strong> {trainingConfig.stage} | 
                <strong> Config:</strong> {trainingConfig.config_path.split('/').pop()}
              </div>
              {selectedCheckpoint && (
                <div className="text-blue-300">
                  <strong>Checkpoint:</strong> {selectedCheckpoint.name} (Loss: {selectedCheckpoint.loss.toFixed(2)})
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

