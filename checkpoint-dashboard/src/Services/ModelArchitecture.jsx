import React, { useState } from 'react';
import { Brain } from 'lucide-react';

const ModelArchitecture = ({ architecture }) => {
  const [selectedLayer, setSelectedLayer] = useState(null);
  
  // Color mapping for different layer types
  const getLayerColor = (type) => {
    const colors = {
      input: '#10B981',      // Green
      dense: '#3B82F6',      // Blue
      latent: '#8B5CF6',     // Purple
      quantize: '#F59E0B',   // Orange
      output: '#EF4444'      // Red
    };
    return colors[type] || '#6B7280'; // Default gray
  };

  // Calculate layer width based on size (for visual representation)
  const getLayerWidth = (size) => {
    const minWidth = 40;
    const maxWidth = 120;
    const maxSize = Math.max(...architecture.map(l => l.size));
    return minWidth + (size / maxSize) * (maxWidth - minWidth);
  };

  // Calculate total parameters
  const totalParams = architecture.reduce((sum, layer) => sum + layer.params, 0);

  return (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
      {/* Header */}
      <h3 className="text-lg font-semibold mb-4 flex items-center text-white">
        <Brain className="w-5 h-5 mr-2 text-purple-400" />
        VQ-VAE Architecture ({totalParams.toLocaleString()} parameters)
      </h3>
      
      {/* Architecture Visualization */}
      <div className="flex items-center justify-center space-x-4 overflow-x-auto pb-4">
        {architecture.map((layer, idx) => (
          <div key={idx} className="flex flex-col items-center space-y-2 relative">
            {/* Layer Block */}
            <div
              className="rounded-lg cursor-pointer transition-all duration-200 hover:scale-105 relative border-2"
              style={{
                width: `${getLayerWidth(layer.size)}px`,
                height: '80px',
                backgroundColor: getLayerColor(layer.type),
                opacity: selectedLayer === idx ? 1 : 0.8,
                borderColor: selectedLayer === idx ? '#FFF' : 'transparent'
              }}
              onClick={() => setSelectedLayer(selectedLayer === idx ? null : idx)}
            >
              {/* Layer Info Inside Block */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-xs font-medium">
                <div className="text-lg font-bold">{layer.size}</div>
                <div className="opacity-75 capitalize">{layer.type}</div>
              </div>
            </div>
            
            {/* Layer Label */}
            <div className="text-xs text-center max-w-20">
              <div className="font-medium truncate text-white">{layer.name}</div>
              <div className="text-gray-400">{layer.params.toLocaleString()}</div>
            </div>
            
            {/* Connection Arrow */}
            {idx < architecture.length - 1 && (
              <div className="absolute left-full top-10 ml-2 flex items-center">
                <div className="w-6 h-0.5 bg-gray-500"></div>
                <div className="w-0 h-0 border-l-4 border-l-gray-500 border-t-2 border-b-2 border-t-transparent border-b-transparent ml-1"></div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Layer Details Panel */}
      {selectedLayer !== null && (
        <div className="mt-6 p-4 bg-gray-700 rounded-lg border border-gray-600">
          <h4 className="font-semibold mb-3 text-white text-lg">
            {architecture[selectedLayer].name}
          </h4>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-gray-800 p-3 rounded">
              <div className="text-gray-400 text-xs mb-1">SIZE</div>
              <div className="text-white font-bold">{architecture[selectedLayer].size}</div>
            </div>
            
            <div className="bg-gray-800 p-3 rounded">
              <div className="text-gray-400 text-xs mb-1">TYPE</div>
              <div className="text-white font-bold capitalize">{architecture[selectedLayer].type}</div>
            </div>
            
            <div className="bg-gray-800 p-3 rounded">
              <div className="text-gray-400 text-xs mb-1">PARAMETERS</div>
              <div className="text-white font-bold">{architecture[selectedLayer].params.toLocaleString()}</div>
            </div>
            
            <div className="bg-gray-800 p-3 rounded">
              <div className="text-gray-400 text-xs mb-1">ACTIVATION</div>
              <div className="text-white font-bold">{architecture[selectedLayer].activation}</div>
            </div>
          </div>
          
          {/* Layer Description */}
          <div className="mt-4 p-3 bg-gray-800 rounded">
            <div className="text-gray-400 text-xs mb-1">DESCRIPTION</div>
            <div className="text-gray-300 text-sm">
              {getLayerDescription(architecture[selectedLayer])}
            </div>
          </div>
        </div>
      )}
      
      {/* Legend */}
      <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded" style={{backgroundColor: getLayerColor('input')}}></div>
          <span className="text-gray-400">Input</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded" style={{backgroundColor: getLayerColor('dense')}}></div>
          <span className="text-gray-400">Dense</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded" style={{backgroundColor: getLayerColor('latent')}}></div>
          <span className="text-gray-400">Latent</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded" style={{backgroundColor: getLayerColor('quantize')}}></div>
          <span className="text-gray-400">Quantize</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded" style={{backgroundColor: getLayerColor('output')}}></div>
          <span className="text-gray-400">Output</span>
        </div>
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