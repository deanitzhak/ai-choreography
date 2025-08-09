import React from 'react';
import { getStatusColor, getStatusIcon } from '../../utils/formatters';

const CheckpointCard = ({ 
  checkpoint, 
  isSelected, 
  onSelect 
}) => {
  return (
    <div
      onClick={() => onSelect(checkpoint.id)}
      className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:scale-105 ${
        isSelected
          ? 'bg-blue-900 border-blue-400 shadow-lg'
          : 'bg-gray-700 border-gray-600 hover:border-gray-500'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="font-semibold text-white text-sm">
          {checkpoint.name}
        </span>
        <div className={`flex items-center ${getStatusColor(checkpoint)}`}>
          {getStatusIcon(checkpoint)}
        </div>
      </div>
      
      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-400">Epoch:</span>
          <span className="text-white font-mono">{checkpoint.epoch}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Loss:</span>
          <span className={`font-mono ${getStatusColor(checkpoint)}`}>
            {checkpoint.loss.toFixed(4)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Stage:</span>
          <span className="text-white font-mono">{checkpoint.stage}</span>
        </div>
        {checkpoint.timestamp && (
          <div className="flex justify-between">
            <span className="text-gray-400">Time:</span>
            <span className="text-white font-mono text-xs">
              {new Date(checkpoint.timestamp).toLocaleTimeString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckpointCard;
