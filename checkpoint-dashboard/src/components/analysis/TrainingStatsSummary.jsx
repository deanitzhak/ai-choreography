import React from 'react';

const TrainingStatsSummary = ({ lossData, checkpoint }) => {
  const minLoss = Math.min(...lossData);
  const maxLoss = Math.max(...lossData);
  const avgLoss = lossData.reduce((a, b) => a + b, 0) / lossData.length;
  
  const mean = avgLoss;
  const variance = lossData.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / lossData.length;
  
  const recent = lossData.slice(-10);
  const recentVariance = recent.reduce((acc, val) => acc + Math.pow(val - recent.reduce((a, b) => a + b) / recent.length, 2), 0) / recent.length;
  const convergenceStatus = recentVariance < 10 ? "Stable" : recentVariance < 100 ? "Moderate" : "Unstable";

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <h5 className="font-medium mb-4 text-white">Training Statistics Summary</h5>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-gray-900 p-3 rounded">
          <div className="text-sm text-gray-400">Min Loss</div>
          <div className="text-lg font-bold text-green-400">
            {minLoss.toFixed(4)}
          </div>
        </div>
        <div className="bg-gray-900 p-3 rounded">
          <div className="text-sm text-gray-400">Max Loss</div>
          <div className="text-lg font-bold text-red-400">
            {maxLoss.toFixed(4)}
          </div>
        </div>
        <div className="bg-gray-900 p-3 rounded">
          <div className="text-sm text-gray-400">Avg Loss</div>
          <div className="text-lg font-bold text-blue-400">
            {avgLoss.toFixed(4)}
          </div>
        </div>
        <div className="bg-gray-900 p-3 rounded">
          <div className="text-sm text-gray-400">Loss Variance</div>
          <div className="text-lg font-bold text-purple-400">
            {variance.toFixed(4)}
          </div>
        </div>
        <div className="bg-gray-900 p-3 rounded">
          <div className="text-sm text-gray-400">Convergence</div>
          <div className="text-lg font-bold text-yellow-400">
            {convergenceStatus}
          </div>
        </div>
        <div className="bg-gray-900 p-3 rounded">
          <div className="text-sm text-gray-400">Training Time</div>
          <div className="text-lg font-bold text-cyan-400">
            {checkpoint.timestamp ? 
              new Date(checkpoint.timestamp).toLocaleDateString() : 
              'N/A'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainingStatsSummary;
