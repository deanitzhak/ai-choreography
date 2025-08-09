import React from 'react';
import { ComposedChart, Line, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ReferenceLine } from 'recharts';
import BaseChart from './BaseChart';
import { chartTooltipStyle, chartGridStyle, chartAxisStyle } from '../../utils/formatters';

const HyperparameterAnalysisChart = ({ steps, lossData, learningRateData }) => {
  // Create hyperparameter analysis data
  const data = steps.map((step, idx) => {
    const lr = learningRateData ? learningRateData[idx] : 0.0001 * Math.pow(0.98, step / 10);
    const loss = lossData[idx];
    
    // Calculate gradient magnitude estimation (simplified)
    const gradientMagnitude = idx > 0 ? Math.abs(loss - lossData[idx - 1]) : 0;
    
    // Calculate learning efficiency
    const learningEfficiency = idx > 0 ? 
      Math.max(0, (lossData[idx - 1] - loss) / (lr * 1000)) : 0;
    
    return {
      step,
      loss,
      learning_rate: lr,
      gradient_magnitude: gradientMagnitude,
      learning_efficiency: Math.min(learningEfficiency, 1), // Cap at 1 for visualization
      lr_scaled: lr * 10000 // Scale LR for better visualization
    };
  });

  // Analyze learning rate patterns
  const avgLR = data.reduce((sum, d) => sum + d.learning_rate, 0) / data.length;
  const maxGradient = Math.max(...data.map(d => d.gradient_magnitude));
  const avgEfficiency = data.reduce((sum, d) => sum + d.learning_efficiency, 0) / data.length;
  
  // Generate recommendations
  let lrRecommendation = "";
  let optimizerRecommendation = "";
  
  if (maxGradient > 50) {
    lrRecommendation = "🔴 Learning rate too high - causing loss spikes. Try reducing by 50% or add gradient clipping.";
  } else if (avgEfficiency < 0.1) {
    lrRecommendation = "🟡 Learning rate might be too low - slow convergence. Consider increasing by 20-50%.";
  } else {
    lrRecommendation = "🟢 Learning rate appears reasonable for current model complexity.";
  }

  // Optimizer recommendations based on your Bailando configuration
  if (maxGradient > 100) {
    optimizerRecommendation = "Recommend: Adam with gradient clipping (max_norm=1.0) or switch to AdamW";
  } else if (avgEfficiency > 0.7) {
    optimizerRecommendation = "Current optimizer performing well. Consider momentum scheduling.";
  } else {
    optimizerRecommendation = "Consider: SGD with momentum or RMSprop for more stable convergence.";
  }

  return (
    <BaseChart
      title="Learning Rate & Optimization Analysis"
      badge="Hyperparameters"
      badgeColor="indigo"
      description={`<strong>Learning Rate Analysis:</strong> ${lrRecommendation}<br />
                   <strong>Optimizer Recommendation:</strong> ${optimizerRecommendation}<br />
                   <strong>Avg LR:</strong> ${avgLR.toExponential(2)} | <strong>Max Gradient:</strong> ${maxGradient.toFixed(2)} | <strong>Avg Efficiency:</strong> ${(avgEfficiency * 100).toFixed(1)}%`}
    >
      <ComposedChart data={data}>
        <CartesianGrid {...chartGridStyle} />
        <XAxis dataKey="step" {...chartAxisStyle} />
        <YAxis {...chartAxisStyle} />
        <YAxis 
          yAxisId="lr" 
          orientation="right" 
          {...chartAxisStyle}
          label={{ value: 'Learning Rate (x10⁴)', angle: 90, position: 'insideRight' }}
        />
        
        <Tooltip 
          contentStyle={chartTooltipStyle}
          formatter={(value, name) => {
            if (name === 'learning_rate') return [value.toExponential(2), 'Learning Rate'];
            if (name === 'gradient_magnitude') return [value.toFixed(3), 'Gradient Magnitude'];
            if (name === 'learning_efficiency') return [(value * 100).toFixed(1) + '%', 'Learning Efficiency'];
            return [value.toFixed(4), name];
          }}
        />
        <Legend />
        
        {/* Loss as background area */}
        <Bar 
          dataKey="loss"
          fill="#374151"
          fillOpacity={0.3}
          name="Loss"
        />
        
        {/* Learning rate schedule */}
        <Line
          yAxisId="lr"
          type="monotone"
          dataKey="lr_scaled"
          stroke="#8B5CF6"
          strokeWidth={3}
          name="Learning Rate (×10⁴)"
        />
        
        {/* Gradient magnitude */}
        <Line
          type="monotone"
          dataKey="gradient_magnitude"
          stroke="#EF4444"
          strokeWidth={2}
          name="Gradient Magnitude"
        />
        
        {/* Learning efficiency */}
        <Line
          type="monotone"
          dataKey="learning_efficiency"
          stroke="#10B981"
          strokeWidth={2}
          name="Learning Efficiency"
        />
        
        {/* Reference lines for problematic values */}
        <ReferenceLine 
          y={50} 
          stroke="#EF4444" 
          strokeDasharray="5 5" 
          label="High Gradient Threshold"
        />
      </ComposedChart>
    </BaseChart>
  );
};

export default HyperparameterAnalysisChart;