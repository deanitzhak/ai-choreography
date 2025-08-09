import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MemoryStick, AlertCircle, CheckCircle } from 'lucide-react';

const SimpleMemoryContext = () => {
  const [sequenceLength, setSequenceLength] = useState(240);
  const [batchSize, setBatchSize]           = useState(8);

    // Memory calculation based on your actual model
  const calculateMemory = () => {
    const motionData   = sequenceLength * 72 * batchSize * 4;          // float32
    const musicData    = sequenceLength * 438 * batchSize * 4;
    const hiddenStates = sequenceLength * 512 * batchSize * 4;
    const gradients    = (motionData + musicData + hiddenStates) * 2;
    
    const totalBytes = motionData + musicData + hiddenStates + gradients;
    const totalGB    = totalBytes / (1024 ** 3);
    
    return {
      totalGB,
      components: {
        motion   : motionData / (1024 ** 2),     // MB
        music    : musicData / (1024 ** 2),
        hidden   : hiddenStates / (1024 ** 2),
        gradients: gradients / (1024 ** 2)
      }
    };
  };

  const memory        = calculateMemory();
  const maxMemory     = 4;                                                                           // 4GB typical CPU limit
  const memoryPercent = (memory.totalGB / maxMemory) * 100;
  const status        = memoryPercent > 100 ? 'critical' : memoryPercent > 80 ? 'warning' : 'good';

    // Context window visualization
  const contextFrames = Math.min(sequenceLength, 240);
  const timeSeconds   = contextFrames / 30;             // 30 FPS

  return (
    <div         className = "bg-gray-800 p-4 rounded-lg border border-gray-600 max-w-2xl">
    <div         className = "flex items-center space-x-2 mb-4">
    <MemoryStick className = "w-5 h-5 text-purple-400" />
    <h3          className = "text-lg font-bold text-white">Memory & Context Window</h3>
      </div>

      {/* Configuration Controls */}
      <div className = "grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className = "text-sm text-gray-400 block mb-1">Sequence Length:</label>
          <select
            value     = {sequenceLength}
            onChange  = {(e) => setSequenceLength(Number(e.target.value))}
            className = "w-full bg-gray-700 border border-gray-600 rounded px-3 py-1 text-white"
          >
            <option value = {120}>120 frames (4s)</option>
            <option value = {240}>240 frames (8s)</option>
            <option value = {360}>360 frames (12s)</option>
            <option value = {480}>480 frames (16s)</option>
          </select>
        </div>
        
        <div>
          <label className = "text-sm text-gray-400 block mb-1">Batch Size:</label>
          <select
            value     = {batchSize}
            onChange  = {(e) => setBatchSize(Number(e.target.value))}
            className = "w-full bg-gray-700 border border-gray-600 rounded px-3 py-1 text-white"
          >
            <option value = {2}>2 (Emergency)</option>
            <option value = {4}>4 (Stable)</option>
            <option value = {8}>8 (Default)</option>
            <option value = {16}>16 (GPU only)</option>
          </select>
        </div>
      </div>

      {/* Memory Usage Display */}
      <div  className = "bg-gray-700 p-4 rounded-lg mb-4">
      <div  className = "flex items-center justify-between mb-2">
      <span className = "text-sm text-gray-300">Memory Usage</span>
      <div  className = "flex items-center space-x-2">
            {status === 'critical' && <AlertCircle className="w-4 h-4 text-red-400" />}
            {status === 'good' && <CheckCircle className="w-4 h-4 text-green-400" />}
            <span className={`text-sm font-mono ${
              status === 'critical' ? 'text-red-400' :
              status === 'warning' ? 'text-yellow-400' : 'text-green-400'
            }`}>
              {memory.totalGB.toFixed(2)}GB / {maxMemory}GB
            </span>
          </div>
        </div>

        {/* Memory Bar */}
        <div className = "w-full bg-gray-600 rounded-full h-3 mb-3">
          <motion.div
            className={`h-3 rounded-full ${
              status === 'critical' ? 'bg-red-500' :
              status === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            animate    = {{ width: `${Math.min(100, memoryPercent)}%` }}
            transition = {{ duration: 0.5 }}
          />
        </div>

        {/* Memory Breakdown */}
        <div className = "grid grid-cols-4 gap-2 text-xs">
          {Object.entries(memory.components).map(([key, value]) => (
            <div key       = {key} className = "bg-gray-600 p-2 rounded text-center">
            <div className = "text-white font-bold">{value.toFixed(0)}MB</div>
            <div className = "text-gray-400 capitalize">{key}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Context Window Info */}
      <div className = "bg-gray-700 p-4 rounded-lg">
      <h4  className = "text-white font-semibold mb-3">Context Window</h4>
        
        <div className = "grid grid-cols-3 gap-4 mb-3">
        <div className = "text-center">
        <div className = "text-2xl font-bold text-blue-400">{contextFrames}</div>
        <div className = "text-xs text-gray-400">Frames</div>
          </div>
          <div className = "text-center">
          <div className = "text-2xl font-bold text-green-400">{timeSeconds.toFixed(1)}s</div>
          <div className = "text-xs text-gray-400">Duration</div>
          </div>
          <div className = "text-center">
          <div className = "text-2xl font-bold text-purple-400">72</div>
          <div className = "text-xs text-gray-400">Dimensions</div>
          </div>
        </div>

        {/* Context Window Visualization */}
        <div className = "bg-gray-900 p-3 rounded">
        <div className = "text-xs text-gray-400 mb-2">Sequence Processing:</div>
        <div className = "flex items-center space-x-1">
            {Array.from({ length: 20 }, (_, i) => {
              const frameIndex  = (i / 20) * sequenceLength;
              const isProcessed = frameIndex < sequenceLength * 0.6;
              const isActive    = frameIndex >= sequenceLength * 0.4 && frameIndex < sequenceLength * 0.8;
              
              return (
                <motion.div
                  key       = {i}
                  className = {`h-4 flex-1 rounded ${
                    isActive    ? 'bg-blue-500': 
                    isProcessed ? 'bg-gray-600': 'bg-gray-700'
                  }`}
                  animate={{
                    opacity: isActive ? [0.5, 1, 0.5]: 1
                  }}
                  transition={{
                    repeat  : isActive ? Infinity: 0,
                    duration: 1
                  }}
                />
              );
            })}
          </div>
          <div className = "flex justify-between text-xs text-gray-500 mt-1">
            <span>Frame 0</span>
            <span className = "text-blue-400">Current Window</span>
            <span>Frame {sequenceLength}</span>
          </div>
        </div>

        {/* Memory Tips */}
        <div className = "mt-3 text-xs text-gray-400">
        <div className = "mb-1">💡 <strong>Tips:</strong></div>
          <div>• Reduce sequence length if memory exceeds limit</div>
          <div>• Use batch_size = 2-4 for CPU training</div>
          <div>• GPU allows larger batches (8-16)</div>
        </div>
      </div>
    </div>
  );
};

export default SimpleMemoryContext;