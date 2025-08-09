import React from 'react';

const CheckpointTabs = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'analysis', name: 'Training Analysis', icon: '📊' },
    { id: 'architecture', name: 'Model Architecture', icon: '🏗️' }
  ];

  return (
    <div className="mb-4">
      <div className="flex space-x-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === tab.id 
                ? 'bg-blue-800 text-white shadow-md'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CheckpointTabs;
