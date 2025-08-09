import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Zap, Activity, Info, ArrowRight } from 'lucide-react';

const ModelArchitecture = ({ architecture }) => {
  const [selectedLayer, setSelectedLayer] = useState(null);
  const [showNeuralNetwork, setShowNeuralNetwork] = useState(false);

  // Color mapping for different layer types
  const getLayerColor = (type) => {
    const colors = {
      input: '#10B981',     // Green
      dense: '#3B82F6',     // Blue
      latent: '#8B5CF6',    // Purple
      quantize: '#F59E0B',  // Orange
      output: '#EF4444'     // Red
    };
    return colors[type] || '#6B7280';
  };

  // Calculate layer width based on size
  const getLayerWidth = (size) => {
    const minWidth = 40;
    const maxWidth = 120;
    const maxSize = Math.max(...architecture.map(l => l.size));
    return minWidth + (size / maxSize) * (maxWidth - minWidth);
  };

  // Handle layer click - show neural network below
  const handleLayerClick = (layerIndex) => {
    if (selectedLayer === layerIndex && showNeuralNetwork) {
      setSelectedLayer(null);
      setShowNeuralNetwork(false);
    } else {
      setSelectedLayer(layerIndex);
      setShowNeuralNetwork(true);
    }
  };

  // Generate neural network visualization for selected layer
  const NeuralNetworkVisualization = ({ layerIndex }) => {
    if (layerIndex >= architecture.length - 1) return null;

    const currentLayer = architecture[layerIndex];
    const nextLayer = architecture[layerIndex + 1];
    
    // Determine connection type
    const getConnectionType = (currentType, nextType) => {
      if (currentType === 'dense' || nextType === 'dense') return 'fully_connected';
      if (currentType === 'quantize') return 'quantization';
      if (nextType === 'output') return 'reconstruction';
      return 'fully_connected';
    };

    const connectionType = getConnectionType(currentLayer.type, nextLayer.type);
    
    // Simplified neuron display (max 8 neurons per layer for clarity)
    const maxNeurons = 8;
    const currentNeurons = Math.min(currentLayer.size, maxNeurons);
    const nextNeurons = Math.min(nextLayer.size, maxNeurons);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="mt-6 p-6 bg-gray-800 rounded-lg border border-gray-600"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-white flex items-center space-x-2">
            <Brain className="w-5 h-5 text-purple-400" />
            <span>Neural Network Detail: {currentLayer.name} → {nextLayer.name}</span>
          </h4>
          
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-gray-400">Connection Type:</span>
            <span className="px-2 py-1 bg-blue-900 text-blue-300 rounded text-xs font-mono">
              {connectionType.replace('_', ' ').toUpperCase()}
            </span>
          </div>
        </div>

        {/* Network Visualization */}
        <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between">
            {/* Source Layer */}
            <div className="flex flex-col items-center space-y-2">
              <h5 className="text-sm font-semibold text-white mb-2">{currentLayer.name}</h5>
              <div 
                className="p-3 rounded-lg border"
                style={{ 
                  backgroundColor: getLayerColor(currentLayer.type),
                  borderColor: getLayerColor(currentLayer.type)
                }}
              >
                <div className="grid grid-cols-1 gap-2">
                  {Array.from({ length: currentNeurons }, (_, i) => (
                    <motion.div
                      key={i}
                      className="w-4 h-4 rounded-full bg-white relative"
                      animate={{
                        scale: [1, 1.2, 1],
                        backgroundColor: ['#ffffff', '#ffd700', '#ffffff']
                      }}
                      transition={{
                        duration: 2,
                        delay: i * 0.1,
                        repeat: Infinity,
                        repeatDelay: 3
                      }}
                    >
                      <span className="absolute -right-8 top-0 text-xs text-gray-400">
                        n{i+1}
                      </span>
                    </motion.div>
                  ))}
                  {currentLayer.size > maxNeurons && (
                    <div className="text-xs text-white text-center mt-1">
                      +{currentLayer.size - maxNeurons} more
                    </div>
                  )}
                </div>
              </div>
              
              {/* Layer Info */}
              <div className="text-xs text-center text-gray-400">
                <div>{currentLayer.size} neurons</div>
                <div className="capitalize">{currentLayer.type}</div>
              </div>
            </div>

            {/* Connection Visualization */}
            <div className="flex-1 mx-8">
              <div className="relative">
                {/* Connection Lines */}
                <svg width="100%" height="200" className="overflow-visible">
                  {Array.from({ length: currentNeurons }, (_, i) =>
                    Array.from({ length: nextNeurons }, (_, j) => {
                      const weight = (Math.random() - 0.5) * 2; // -1 to 1
                      const isStrong = Math.abs(weight) > 0.5;
                      
                      return (
                        <motion.line
                          key={`${i}-${j}`}
                          x1="0"
                          y1={20 + i * 20}
                          x2="100%"
                          y2={20 + j * 20}
                          stroke={weight > 0 ? '#10B981' : '#EF4444'}
                          strokeWidth={isStrong ? 2 : 1}
                          opacity={0.3 + Math.abs(weight) * 0.4}
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{
                            duration: 1,
                            delay: (i + j) * 0.05
                          }}
                        />
                      );
                    })
                  )}
                </svg>

                {/* Activation Function */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <motion.div
                    className="bg-yellow-500 text-black px-3 py-2 rounded-lg font-bold text-sm"
                    animate={{
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 2
                    }}
                  >
                    {nextLayer.activation}
                  </motion.div>
                </div>
              </div>

              {/* Connection Stats */}
              <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                <div className="bg-gray-800 p-2 rounded text-center">
                  <div className="text-green-400 font-bold">
                    {Math.floor((currentNeurons * nextNeurons) * 0.6)}
                  </div>
                  <div className="text-gray-400">Positive</div>
                </div>
                <div className="bg-gray-800 p-2 rounded text-center">
                  <div className="text-red-400 font-bold">
                    {Math.floor((currentNeurons * nextNeurons) * 0.4)}
                  </div>
                  <div className="text-gray-400">Negative</div>
                </div>
                <div className="bg-gray-800 p-2 rounded text-center">
                  <div className="text-blue-400 font-bold">
                    {(currentLayer.params / 1000).toFixed(1)}K
                  </div>
                  <div className="text-gray-400">Weights</div>
                </div>
              </div>
            </div>

            {/* Target Layer */}
            <div className="flex flex-col items-center space-y-2">
              <h5 className="text-sm font-semibold text-white mb-2">{nextLayer.name}</h5>
              <div 
                className="p-3 rounded-lg border"
                style={{ 
                  backgroundColor: getLayerColor(nextLayer.type),
                  borderColor: getLayerColor(nextLayer.type)
                }}
              >
                <div className="grid grid-cols-1 gap-2">
                  {Array.from({ length: nextNeurons }, (_, i) => (
                    <motion.div
                      key={i}
                      className="w-4 h-4 rounded-full bg-white relative"
                      animate={{
                        scale: [1, 1.2, 1],
                        backgroundColor: ['#ffffff', '#00ff88', '#ffffff']
                      }}
                      transition={{
                        duration: 2,
                        delay: i * 0.1 + 0.5, // Slight delay after input
                        repeat: Infinity,
                        repeatDelay: 3
                      }}
                    >
                      <span className="absolute -left-8 top-0 text-xs text-gray-400">
                        n{i+1}
                      </span>
                    </motion.div>
                  ))}
                  {nextLayer.size > maxNeurons && (
                    <div className="text-xs text-white text-center mt-1">
                      +{nextLayer.size - maxNeurons} more
                    </div>
                  )}
                </div>
              </div>
              
              {/* Layer Info */}
              <div className="text-xs text-center text-gray-400">
                <div>{nextLayer.size} neurons</div>
                <div className="capitalize">{nextLayer.type}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Details */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Connection Details */}
          <div className="bg-gray-700 p-4 rounded-lg">
            <h6 className="text-white font-semibold mb-2 flex items-center space-x-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span>Connection Type</span>
            </h6>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Type:</span>
                <span className="text-white capitalize">{connectionType.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Connections:</span>
                <span className="text-white">{(currentLayer.size * nextLayer.size).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Density:</span>
                <span className="text-white">100%</span>
              </div>
            </div>
          </div>

          {/* Activation Function */}
          <div className="bg-gray-700 p-4 rounded-lg">
            <h6 className="text-white font-semibold mb-2 flex items-center space-x-2">
              <Activity className="w-4 h-4 text-green-400" />
              <span>Activation</span>
            </h6>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Function:</span>
                <span className="text-white font-mono">{nextLayer.activation}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Range:</span>
                <span className="text-white">
                  {nextLayer.activation === 'ReLU' ? '[0, ∞)' :
                   nextLayer.activation === 'Linear' ? '(-∞, ∞)' :
                   nextLayer.activation === 'Quantize' ? 'Discrete' : '[-1, 1]'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Non-linear:</span>
                <span className="text-white">
                  {nextLayer.activation === 'Linear' ? 'No' : 'Yes'}
                </span>
              </div>
            </div>
          </div>

          {/* Mathematical Formula */}
          <div className="bg-gray-700 p-4 rounded-lg">
            <h6 className="text-white font-semibold mb-2 flex items-center space-x-2">
              <Info className="w-4 h-4 text-blue-400" />
              <span>Formula</span>
            </h6>
            <div className="bg-gray-900 p-2 rounded border border-gray-600">
              <code className="text-green-400 text-xs font-mono">
                {nextLayer.activation === 'ReLU' ? 'f(x) = max(0, x)' :
                 nextLayer.activation === 'Linear' ? 'f(x) = x' :
                 nextLayer.activation === 'Quantize' ? 'f(x) = argmin ||x - e_k||²' :
                 'f(x) = x'}
              </code>
            </div>
            <div className="mt-2 text-xs text-gray-400">
              Output = {nextLayer.activation}(W·Input + b)
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center justify-center space-x-6 text-xs border-t border-gray-600 pt-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-1 bg-green-500 rounded"></div>
            <span className="text-gray-400">Positive Weights</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-1 bg-red-500 rounded"></div>
            <span className="text-gray-400">Negative Weights</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-gray-400">Activation Function</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-white"></div>
            <span className="text-gray-400">Neurons</span>
          </div>
        </div>
      </motion.div>
    );
  };

  const totalParams = architecture.reduce((sum, layer) => sum + layer.params, 0);

  return (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
      {/* Header */}
      <h3 className="text-lg font-semibold mb-4 flex items-center text-white">
        <Brain className="w-5 h-5 mr-2 text-purple-400" />
        VQ-VAE Architecture ({totalParams.toLocaleString()} parameters)
      </h3>

      {/* Instructions */}
      <div className="mb-4 p-3 bg-blue-900 bg-opacity-30 rounded border border-blue-600">
        <p className="text-blue-200 text-sm">
          💡 <strong>Click on any layer</strong> to see detailed neural network connections, 
          activation functions, and weight distributions below.
        </p>
      </div>
      
      {/* Architecture Visualization */}
      <div className="flex items-center justify-center space-x-4 overflow-x-auto pb-4">
        {architecture.map((layer, idx) => (
          <div key={idx} className="flex flex-col items-center space-y-2 relative">
            {/* Layer Block */}
            <motion.div
              className={`rounded-lg cursor-pointer transition-all duration-200 hover:scale-105 relative border-2 ${
                selectedLayer === idx ? 'ring-2 ring-white ring-opacity-50' : ''
              }`}
              style={{
                width: `${getLayerWidth(layer.size)}px`,
                height: '80px',
                backgroundColor: getLayerColor(layer.type),
                opacity: selectedLayer === idx ? 1 : 0.8,
                borderColor: selectedLayer === idx ? '#FFF' : 'transparent'
              }}
              onClick={() => handleLayerClick(idx)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Layer Info Inside Block */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-xs font-medium">
                <div className="text-lg font-bold">{layer.size}</div>
                <div className="opacity-75 capitalize">{layer.type}</div>
              </div>

              {/* Click indicator */}
              {selectedLayer === idx && (
                <motion.div
                  className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}
            </motion.div>
            
            {/* Layer Label */}
            <div className="text-xs text-center max-w-20">
              <div className="font-medium truncate text-white">{layer.name}</div>
              <div className="text-gray-400">{layer.params.toLocaleString()}</div>
            </div>
            
            {/* Connection Arrow */}
            {idx < architecture.length - 1 && (
              <div className="absolute left-full top-10 ml-2 flex items-center">
                <ArrowRight className="w-6 h-4 text-gray-500" />
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Neural Network Detail View - Displayed Below */}
      <AnimatePresence>
        {showNeuralNetwork && selectedLayer !== null && selectedLayer < architecture.length - 1 && (
          <NeuralNetworkVisualization layerIndex={selectedLayer} />
        )}
      </AnimatePresence>

      {/* Layer Details Panel (if no next layer to show connections) */}
      {selectedLayer !== null && selectedLayer >= architecture.length - 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 bg-gray-700 rounded-lg border border-gray-600"
        >
          <h4 className="font-semibold mb-3 text-white text-lg">
            {architecture[selectedLayer].name} (Output Layer)
          </h4>
          <p className="text-gray-300 text-sm">
            This is the final output layer. No connections to display.
          </p>
        </motion.div>
      )}
      
      {/* Legend */}
      <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs">
        {Object.entries({
          input: 'Input',
          dense: 'Dense', 
          latent: 'Latent',
          quantize: 'Quantize',
          output: 'Output'
        }).map(([type, label]) => (
          <div key={type} className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded" style={{backgroundColor: getLayerColor(type)}}></div>
            <span className="text-gray-400">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Helper function to provide layer descriptions
const getLayerDescription = (layer) => {
  const descriptions = {
    input: "Receives raw 3D pose data (72 dimensions representing SMPL joint rotations)",
    dense: "Fully connected layer that learns complex feature representations through matrix multiplication",
    latent: "Compressed representation layer that captures essential motion patterns in lower dimensional space",
    quantize: "Vector Quantization layer that maps continuous features to discrete codebook entries for choreographic memory",
    output: "Reconstructs the original pose data from the learned representations"
  };
  
  return descriptions[layer.type] || "Neural network layer for processing motion data";
};

export default ModelArchitecture;