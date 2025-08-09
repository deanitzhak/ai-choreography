import React from 'react';

const AnalysisOverview = () => {
  return (
    <div className="bg-blue-900 bg-opacity-30 p-4 rounded-lg border border-blue-600">
      <h5 className="font-medium mb-2 text-blue-300">📊 Analysis Overview</h5>
      <p className="text-sm text-blue-200">
        This comprehensive analysis shows how your Bailando model learns to generate dance movements. 
        Each graph reveals different aspects of the training process and model health.
      </p>
    </div>
  );
};

export default AnalysisOverview;
