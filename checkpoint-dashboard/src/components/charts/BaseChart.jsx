import React from 'react';
import { ResponsiveContainer } from 'recharts';

const BaseChart = ({ 
  title, 
  description, 
  badge, 
  badgeColor = 'blue', 
  height = 300, 
  children 
}) => {
  const badgeColors = {
    blue: 'bg-blue-800 text-blue-200',
    green: 'bg-green-800 text-green-200',
    purple: 'bg-purple-800 text-purple-200',
    red: 'bg-red-800 text-red-200',
    orange: 'bg-orange-800 text-orange-200',
    cyan: 'bg-cyan-800 text-cyan-200'
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <h5 className="font-medium text-white">{title}</h5>
        {badge && (
          <span className={`text-xs px-2 py-1 rounded ${badgeColors[badgeColor]}`}>
            {badge}
          </span>
        )}
      </div>
      {description && (
        <p className="text-xs text-gray-400 mb-3" dangerouslySetInnerHTML={{ __html: description }} />
      )}
      <ResponsiveContainer width="100%" height={height}>
        {children}
      </ResponsiveContainer>
    </div>
  );
};

export default BaseChart;
