import React from 'react';

const LoadingState = () => {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400 mx-auto mb-4"></div>
        <p className="text-gray-400 text-lg">Loading ML Dashboard...</p>
        <p className="text-gray-500 text-sm mt-2">Connecting to checkpoint server...</p>
      </div>
    </div>
  );
};

export default LoadingState;
