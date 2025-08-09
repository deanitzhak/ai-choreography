import React from 'react';
import { Zap, Database } from 'lucide-react';

const DashboardHeader = ({ 
  checkpoints, 
  selectedCheckpoint, 
  onCheckpointChange 
}) => {
  return (
    <div className="bg-gray-800 shadow-lg border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Zap className="w-8 h-8 text-blue-400" />
            <div>
              <h1 className="text-2xl font-bold text-white">Bailando Dashboard</h1>
              <p className="text-sm text-gray-400">AI Choreography Training Monitor</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <select
              value={selectedCheckpoint || ''}
              onChange={(e) => onCheckpointChange(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Checkpoint</option>
              {checkpoints.map(checkpoint => (
                <option key={checkpoint.id} value={checkpoint.id}>
                  {checkpoint.name} (Loss: {checkpoint.loss.toFixed(2)})
                </option>
              ))}
            </select>
            
            <div className="flex items-center space-x-2 text-sm">
              <Database className="w-4 h-4 text-green-400" />
              <span className="text-gray-400">{checkpoints.length} checkpoints</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
