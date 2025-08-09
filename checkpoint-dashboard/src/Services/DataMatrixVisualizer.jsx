import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Database, Play, Pause } from 'lucide-react';

const DataMatrixVisualizer = () => {
  const [isAnimating, setIsAnimating]   = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);

    // SMPL joint data representation (simplified)
  const generateSMPLData = (frame = 0) => {
    const joints = 24;  // SMPL has 24 joints
    const axes   = 3;   // x, y, z rotations
    const data   = [];
    
    for (let joint = 0; joint < joints; joint++) {
      for (let axis = 0; axis < axes; axis++) {
          // Simulate realistic motion data
        const baseValue = Math.sin(frame * 0.1 + joint * 0.2 + axis) * 0.5;
        const noise     = (Math.random() - 0.5) * 0.1;
        data.push(baseValue + noise);
      }
    }
    return data;
  };

  useEffect(() => {
    if (isAnimating) {
      const timer = setInterval(() => {
        setCurrentFrame(prev => (prev + 1) % 30);
      }, 100);
      return () => clearInterval(timer);
    }
  }, [isAnimating]);

  const motionData = generateSMPLData(currentFrame);
  
    // Convert to matrix representation (24 joints × 3 axes)
  const matrixData = [];
  for (let i = 0; i < 24; i++) {
    matrixData.push([
      motionData[i * 3],       // x rotation
      motionData[i * 3 + 1],   // y rotation  
      motionData[i * 3 + 2]    // z rotation
    ]);
  }

  const getValueColor = (value) => {
    const intensity = Math.abs(value);
    if     (intensity > 0.4) return '#EF4444';  // Red for high values
    if     (intensity > 0.2) return '#F59E0B';  // Orange for medium
    return '#10B981';                           // Green for low
  };

  return (
    <div className = "bg-gray-800 p-4 rounded-lg border border-gray-600 max-w-2xl">
      {/* Header */}
      <div      className = "flex items-center justify-between mb-4">
      <div      className = "flex items-center space-x-2">
      <Database className = "w-5 h-5 text-blue-400" />
      <h3       className = "text-lg font-bold text-white">SMPL Data Matrix</h3>
        </div>
        
        <button
          onClick   = {() => setIsAnimating(!isAnimating)}
          className = {`px-3 py-1 rounded flex items-center space-x-2 ${
          isAnimating ? 'bg-red-600': 'bg-green-600'
          }           hover         : opacity-80`}
        >
          {isAnimating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          <span className = "text-sm text-white">
            {isAnimating ? 'Pause' : 'Animate'}
          </span>
        </button>
      </div>

      {/* Data Representation Info */}
      <div className = "grid grid-cols-3 gap-4 mb-4 text-sm">
      <div className = "bg-gray-700 p-2 rounded text-center">
      <div className = "text-blue-400 font-bold">24</div>
      <div className = "text-gray-400">SMPL Joints</div>
        </div>
        <div className = "bg-gray-700 p-2 rounded text-center">
        <div className = "text-green-400 font-bold">3</div>
        <div className = "text-gray-400">Rotation Axes</div>
        </div>
        <div className = "bg-gray-700 p-2 rounded text-center">
        <div className = "text-purple-400 font-bold">72</div>
        <div className = "text-gray-400">Total Dims</div>
        </div>
      </div>

      {/* Matrix Visualization */}
      <div className = "bg-gray-900 p-3 rounded border border-gray-600">
      <div className = "grid grid-cols-3 gap-1 mb-2">
      <div className = "text-xs text-gray-400 text-center">X</div>
      <div className = "text-xs text-gray-400 text-center">Y</div>
      <div className = "text-xs text-gray-400 text-center">Z</div>
        </div>
        
        {/* First 8 joints for display (space constraint) */}
        <div className = "space-y-1">
          {matrixData.slice(0, 8).map((jointData, jointIdx) => (
            <div key       = {jointIdx} className = "flex items-center space-x-1">
            <div className = "text-xs text-gray-400 w-12">
                J{jointIdx}: 
              </div>
              <div className = "flex space-x-1">
                {jointData.map((value, axisIdx) => (
                  <motion.div
                    key       = {axisIdx}
                    className = "w-8 h-6 rounded flex items-center justify-center text-xs font-mono text-white"
                    style     = {{ backgroundColor: getValueColor(value) }}
                    animate   = {{
                      scale: isAnimating ? 1 + Math.abs(value) * 0.2: 1
                    }}
                  >
                    {value.toFixed(1)}
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
          
          {/* Show continuation */}
          <div className = "text-center text-gray-500 text-xs py-1">
            ... {24 - 8} more joints
          </div>
        </div>

        {/* Frame counter */}
        <div className = "mt-2 pt-2 border-t border-gray-700 text-xs text-gray-400 text-center">
          Frame: {currentFrame} | Data Shape: (24, 3) → Flattened: (72,)
        </div>
      </div>

      {/* Value Legend */}
      <div  className = "mt-3 flex items-center justify-center space-x-4 text-xs">
      <div  className = "flex items-center space-x-1">
      <div  className = "w-3 h-3 rounded" style = {{ backgroundColor: '#10B981' }}></div>
      <span className = "text-gray-400">Low (0-0.2)</span>
        </div>
        <div  className = "flex items-center space-x-1">
        <div  className = "w-3 h-3 rounded" style = {{ backgroundColor: '#F59E0B' }}></div>
        <span className = "text-gray-400">Med (0.2-0.4)</span>
        </div>
        <div  className = "flex items-center space-x-1">
        <div  className = "w-3 h-3 rounded" style = {{ backgroundColor: '#EF4444' }}></div>
        <span className = "text-gray-400">High (&gt;0.4)</span>
        </div>
      </div>
    </div>
  );
};

export default DataMatrixVisualizer;