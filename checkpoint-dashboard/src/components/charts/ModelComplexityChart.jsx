import React from 'react';
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Cell } from 'recharts';
import BaseChart from './BaseChart';
import { chartTooltipStyle, chartGridStyle, chartAxisStyle } from '../../utils/formatters';

const ModelComplexityChart = ({ checkpointDetails }) => {
  // Extract model architecture from your Bailando configuration
  const architecture = checkpointDetails.model_architecture || [
    { name: "Input Layer", size: 72, type: "input", params: 0, activation: "None" },
    { name: "Encoder 1", size: 512, type: "dense", params: 36864, activation: "ReLU" },
    { name: "Encoder 2", size: 256, type: "dense", params: 131328, activation: "ReLU" },
    { name: "Latent", size: 256, type: "latent", params: 65792, activation: "Linear" },
    { name: "VQ Layer", size: 1024, type: "quantize", params: 262144, activation: "Quantize" },
    { name: "Decoder 1", size: 256, type: "dense", params: 262400, activation: "ReLU" },
    { name: "Decoder 2", size: 512, type: "dense", params: 131584, activation: "ReLU" },
    { name: "Output Layer", size: 72, type: "output", params: 36936, activation: "Linear" }
  ];

  // Calculate complexity metrics
  const totalParams = architecture.reduce((sum, layer) => sum + layer.params, 0);
  const totalSize = architecture.reduce((sum, layer) => sum + layer.size, 0);
  
  // Add complexity analysis to each layer
  const complexityData = architecture.map(layer => {
    const complexity = layer.params / totalParams;
    const efficiency = layer.size / (layer.params || 1);
    
    // Determine layer color based on complexity
    let color = '#10B981'; // Green for low complexity
    if (complexity > 0.3) color = '#EF4444'; // Red for high complexity
    else if (complexity > 0.15) color = '#F59E0B'; // Orange for medium complexity
    
    return {
      ...layer,
      complexity_ratio: complexity,
      efficiency_score: Math.min(efficiency * 1000, 100), // Scale for visualization
      color,
      params_mb: (layer.params * 4) / (1024 * 1024) // Assume 4 bytes per parameter
    };
  });

  // Generate recommendations based on your project's constraints
  const cpuThreshold = 15e6; // 15M parameters for CPU training
  const currentParams = totalParams;
  const isOverBudget = currentParams > cpuThreshold;
  
  let complexityRecommendation = "";
  if (isOverBudget) {
    const reduction = ((currentParams - cpuThreshold) / currentParams * 100).toFixed(1);
    complexityRecommendation = `🔴 Model too complex for CPU training (${(currentParams/1e6).toFixed(1)}M params). Reduce by ${reduction}% or use GPU.`;
  } else if (currentParams > cpuThreshold * 0.8) {
    complexityRecommendation = `🟡 Model approaching CPU limits. Consider optimization for better training speed.`;
  } else {
    complexityRecommendation = `🟢 Model complexity suitable for current hardware configuration.`;
  }

  // Find bottleneck layers
  const bottleneckLayers = complexityData
    .filter(layer => layer.complexity_ratio > 0.2)
    .map(layer => layer.name)
    .join(', ');

  return (
    <BaseChart
      title="Model Complexity & Optimization Analysis"
      badge="Architecture"
      badgeColor="cyan"
      description={`<strong>Complexity Analysis:</strong> ${complexityRecommendation}<br />
                   <strong>Total Parameters:</strong> ${(totalParams/1e6).toFixed(1)}M | <strong>Model Size:</strong> ${(totalParams * 4 / 1024 / 1024).toFixed(1)}MB<br />
                   <strong>Bottleneck Layers:</strong> ${bottleneckLayers || 'None identified'}<br />
                   <strong>CPU Training Threshold:</strong> ${(cpuThreshold/1e6).toFixed(0)}M params`}
    >
      <BarChart data={complexityData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
        <CartesianGrid {...chartGridStyle} />
        <XAxis 
          dataKey="name" 
          {...chartAxisStyle}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis 
          {...chartAxisStyle}
          label={{ value: 'Parameters (thousands)', angle: -90, position: 'insideLeft' }}
        />
        <Tooltip 
          contentStyle={chartTooltipStyle}
          formatter={(value, name) => {
            if (name === 'params') return [(value/1000).toFixed(1) + 'K', 'Parameters'];
            if (name === 'complexity_ratio') return [(value * 100).toFixed(1) + '%', 'Complexity %'];
            if (name === 'efficiency_score') return [value.toFixed(1), 'Efficiency Score'];
            return [value, name];
          }}
          labelFormatter={(label) => `Layer: ${label}`}
        />
        <Legend />
        
        {/* Parameter count bars with dynamic colors */}
        <Bar 
          dataKey="params" 
          name="Parameters"
          radius={[4, 4, 0, 0]}
        >
          {complexityData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
      
      {/* Additional information panel */}
      <div className="mt-4 p-3 bg-gray-800 rounded-lg">
        <h5 className="text-sm font-semibold text-white mb-2">Optimization Recommendations:</h5>
        <div className="text-xs text-gray-300 space-y-1">
          {isOverBudget && (
            <>
              <div>• Reduce VQ codebook size from 1024 to 512 (-50% VQ params)</div>
              <div>• Use smaller hidden dimensions (512→256, 256→128)</div>
              <div>• Apply model pruning to remove low-importance connections</div>
            </>
          )}
          <div>• Current config suitable for: {isOverBudget ? 'GPU training only' : 'CPU + GPU training'}</div>
          <div>• Estimated training time: {(totalParams / 1e6 * 0.5).toFixed(1)} hours per epoch</div>
        </div>
      </div>
    </BaseChart>
  );
};

export default ModelComplexityChart;