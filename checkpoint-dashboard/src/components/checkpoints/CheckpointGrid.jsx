import React from 'react';
import { Database } from 'lucide-react';
import CheckpointCard from './CheckpointCard';

const CheckpointGrid = ({ 
  checkpoints, 
  selectedCheckpoint, 
  onCheckpointSelect 
}) => {
  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <Database className="w-6 h-6 mr-2 text-blue-400" />
          Training Checkpoints
        </h2>
        <div className="flex items-center space-x-2 text-sm">
          <span className="text-gray-400">{checkpoints.length} checkpoints available</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {checkpoints.map((checkpoint) => (
          <CheckpointCard
            key={checkpoint.id}
            checkpoint={checkpoint}
            isSelected={selectedCheckpoint === checkpoint.id}
            onSelect={onCheckpointSelect}
          />
        ))}
      </div>
    </div>
  );
};

export default CheckpointGrid;
