import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle, Activity, Terminal } from 'lucide-react';

// Import our lightweight service components
import { useTrainingService } from '../api/TrainingService';
import TrainingStatusCards from './TrainingStatusCards';
import EnhancedTrainingControls from './TrainingControls';

// 🚀 Enhanced Lightweight Real-time Training Panel
const RealTimeTrainingPanel = () => {
  const [showConsole, setShowConsole] = useState(false);
  
  // 🔧 Use our training service hook
  const {
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
  } = useTrainingService();

  // 🚨 Alert icon helper
  const getAlertIcon = (level) => {
    switch (level) {
      case 'critical':
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      default:
        return <Activity className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Enhanced Training Controls */}
      <EnhancedTrainingControls
        connectionState={connectionState}
        trainingData={trainingData}
        startTraining={startTraining}
        stopTraining={stopTraining}
        optimizeConfig={optimizeConfig}
      />

      {/* Status Cards */}
      <TrainingStatusCards
        trainingData={trainingData}
        getStatusColor={getStatusColor}
        getStatusLabel={getStatusLabel}
        formatTime={formatTime}
      />

      {/* Alerts & Console */}
      <div className="grid grid-cols-1 lg:grid-row gap-6">
        
        {/* Alerts Panel */}
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              <span>Training Alerts</span>
            </h3>
            <span className="text-sm text-gray-400">{alerts.length} alerts</span>
          </div>
          
          <div className="space-y-2 max-h-48 overflow-y-auto">
            <AnimatePresence>
              {alerts.slice(0, 5).map(alert => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className={`p-3 rounded border-l-4 text-sm ${
                    alert.level === 'critical' || alert.level === 'error' ? 'bg-red-900 border-red-400' :
                    alert.level === 'success' ? 'bg-green-900 border-green-400' :
                    'bg-blue-900 border-blue-400'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {getAlertIcon(alert.level)}
                    <div className="flex-1">
                      <div className="text-white font-medium">{alert.message}</div>
                      {alert.suggestion && (
                        <div className="text-gray-300 text-xs mt-1">{alert.suggestion}</div>
                      )}
                      <div className="text-gray-400 text-xs mt-1">{alert.timestamp}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {alerts.length === 0 && (
              <div className="text-gray-400 text-sm text-center py-4">
                No alerts. Training status will appear here.
              </div>
            )}
          </div>
        </div>

        {/* Console Toggle & Preview */}
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-green-400" />
              <span>Console Output</span>
            </h3>
            
            <button
              onClick={() => setShowConsole(!showConsole)}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-300 transition-colors"
            >
              {showConsole ? 'Hide' : 'Show'} Console
            </button>
          </div>

          {showConsole ? (
            <div className="bg-gray-900 rounded border border-gray-600 max-h-48 overflow-y-auto">
              <div className="p-3 font-mono text-sm">
                {consoleOutput.length > 0 ? (
                  <div className="space-y-1">
                    {consoleOutput.slice(0, 20).map(output => (
                      <div key={output.id} className="flex space-x-2 text-xs">
                        <span className="text-gray-500">{output.timestamp}</span>
                        <span className="text-green-400">{output.message}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 text-center py-4">
                    Console output will appear here...
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-gray-400 text-sm">
              {consoleOutput.length > 0 ? (
                <div>
                  <div className="font-mono text-xs bg-gray-900 p-2 rounded border">
                    Latest: {consoleOutput[0]?.message.substring(0, 50)}...
                  </div>
                  <div className="text-xs mt-1">{consoleOutput.length} total messages</div>
                </div>
              ) : (
                'No console output yet. Start training to see logs.'
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stage Information */}
      {trainingData.isTraining && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 p-4 rounded-lg border border-gray-700"
        >
          <h3 className="text-white font-semibold mb-3 flex items-center space-x-2">
            <Activity className="w-4 h-4 text-blue-400" />
            <span>Stage {trainingData.currentStage} Training</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-gray-700 p-3 rounded">
              <div className="text-gray-400">Current Focus:</div>
              <div className="text-white font-medium">
                {trainingData.currentStage === 1 && "Motion Compression (VQ-VAE)"}
                {trainingData.currentStage === 2 && "Sequence Generation (GPT)"}
                {trainingData.currentStage === 3 && "Policy Learning (Actor-Critic)"}
              </div>
            </div>
            
            <div className="bg-gray-700 p-3 rounded">
              <div className="text-gray-400">Expected Epochs:</div>
              <div className="text-white font-medium">
                {trainingData.currentStage === 1 && "100 epochs"}
                {trainingData.currentStage === 2 && "50 epochs"}
                {trainingData.currentStage === 3 && "25 epochs"}
              </div>
            </div>
            
            <div className="bg-gray-700 p-3 rounded">
              <div className="text-gray-400">Training Data:</div>
              <div className="text-white font-medium">
                {trainingData.currentStage === 1 && "Raw Motion → VQ Codes"}
                {trainingData.currentStage === 2 && "VQ Codes → Sequences"}
                {trainingData.currentStage === 3 && "Music → Motion Policy"}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Training Progress (Only show when training) */}
      {trainingData.isTraining && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 p-4 rounded-lg border border-gray-700"
        >
          <h3 className="text-white font-semibold mb-3">Training Progress</h3>
          
          <div className="space-y-3">
            {/* Loss Progress */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Loss Progress</span>
                <span className={getStatusColor(trainingData.currentLoss)}>
                  {trainingData.currentLoss.toFixed(4)} / 30.0 (target)
                </span>
              </div>
              <div className="w-full bg-gray-600 rounded-full h-2">
                <motion.div
                  className={`h-2 rounded-full ${
                    trainingData.currentLoss <= 30 ? 'bg-green-500' :
                    trainingData.currentLoss <= 100 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  animate={{
                    width: `${Math.min(100, (30 / Math.max(trainingData.currentLoss, 30)) * 100)}%`
                  }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            {/* Stage Progress */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Stage Progress</span>
                <span className="text-white">Stage {trainingData.currentStage} / 3</span>
              </div>
              <div className="flex space-x-1">
                {[1, 2, 3].map(stage => (
                  <div
                    key={stage}
                    className={`flex-1 h-2 rounded ${
                      stage < trainingData.currentStage ? 'bg-green-500' :
                      stage === trainingData.currentStage ? 'bg-blue-500' : 'bg-gray-600'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default RealTimeTrainingPanel;
