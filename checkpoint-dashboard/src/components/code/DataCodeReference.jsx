import React, { useState } from 'react';
import codeReference from '../codeReference.json';

const DataCodeReference = ({ codeKey, variant = 'default' }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const ref = codeReference.code_examples[codeKey];
  
  if (!ref) return null;

  return (
    <div className="my-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex items-center space-x-2 text-sm rounded px-3 py-2 transition-all ${
          variant === 'compact' 
            ? 'text-blue-400 hover:text-blue-300 bg-blue-900 bg-opacity-30 hover:bg-opacity-50' 
            : 'text-blue-400 hover:text-blue-300 border border-blue-600 hover:border-blue-500'
        }`}
      >
        <span className="text-xs">{isExpanded ? '▼' : '▶'}</span>
        <span className="font-mono">{ref.title}</span>
        <span className="text-xs text-gray-500">({ref.file})</span>
      </button>
      
      {isExpanded && (
        <div className="mt-2 bg-gray-900 border border-blue-700 rounded-lg overflow-hidden">
          <div className="bg-blue-900 bg-opacity-50 p-3 text-sm">
            <div className="flex items-center justify-between">
              <div className="text-blue-300 font-semibold">{ref.title}</div>
              <div className="text-blue-400 text-xs">{ref.complexity}</div>
            </div>
            <div className="text-gray-400 text-xs mt-1">
              {ref.file} • Lines {ref.line_range}
            </div>
          </div>
          
          <div className="p-4">
            <pre className="text-xs text-gray-300 bg-black p-3 rounded overflow-x-auto">
              <code>{ref.code}</code>
            </pre>
            
            <div className="mt-3 text-sm text-gray-400">
              {ref.explanation}
            </div>
            
            {ref.training_details && (
              <div className="mt-3 bg-gray-800 p-3 rounded">
                <div className="text-blue-400 font-semibold mb-2">Training Details:</div>
                {Object.entries(ref.training_details).map(([key, value]) => (
                  <div key={key} className="text-xs text-gray-300 mb-1">
                    <span className="text-blue-300">{key}:</span> {typeof value === 'object' ? JSON.stringify(value) : value}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DataCodeReference;