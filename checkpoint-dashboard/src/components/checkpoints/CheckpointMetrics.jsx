import React from 'react';

const CheckpointMetrics = ({ checkpoint, checkpointDetails }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="p-3 bg-blue-900 rounded-lg border border-blue-700">
        <div className="text-xl font-bold text-blue-300">
          {checkpoint.loss.toFixed(4)}
        </div>
        <div className="text-xs text-gray-400">Current Loss</div>
      </div>
      
      <div className="p-3 bg-green-900 rounded-lg border border-green-700">
        <div className="text-xl font-bold text-green-300">
          {checkpointDetails.metrics?.total_params?.toLocaleString() || 'N/A'}
        </div>
        <div className="text-xs text-gray-400">Parameters</div>
      </div>
      
      <div className="p-3 bg-purple-900 rounded-lg border border-purple-700">
        <div className="text-xl font-bold text-purple-300">
          {checkpointDetails.metrics?.model_size_mb || 'N/A'}MB
        </div>
        <div className="text-xs text-gray-400">Model Size</div>
      </div>
      
      <div className="p-3 bg-orange-900 rounded-lg border border-orange-700">
        <div className="text-xl font-bold text-orange-300">
          Stage {checkpoint.stage}
        </div>
        <div className="text-xs text-gray-400">
          {checkpoint.stage === 1 ? 'VQ-VAE' : 
           checkpoint.stage === 2 ? 'GPT' : 'Actor-Critic'}
        </div>
      </div>
    </div>
  );
};

export default CheckpointMetrics;
