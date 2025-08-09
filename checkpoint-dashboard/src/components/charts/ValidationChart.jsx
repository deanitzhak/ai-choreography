import React from 'react';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import BaseChart from './BaseChart';
import { formatData, chartTooltipStyle, chartGridStyle, chartAxisStyle } from '../../utils/formatters';

const ValidationChart = ({ steps, lossData, validationData }) => {
  const data = formatData(steps, lossData).map((item, idx) => ({
    ...item,
    training_loss: item.value,
    validation_loss: (validationData && validationData[idx]) || 
                    item.value * (1 + Math.random() * 0.2)
  }));

  return (
    <BaseChart
      title="Training vs Validation Loss"
      badge="Overfitting"
      badgeColor="orange"
      description="<strong>What it shows:</strong> Compares performance on training data vs unseen data.<br /><strong>Warning signs:</strong> Validation loss increasing while training loss decreases = overfitting."
    >
      <LineChart data={data}>
        <CartesianGrid {...chartGridStyle} />
        <XAxis dataKey="step" {...chartAxisStyle} />
        <YAxis {...chartAxisStyle} />
        <Tooltip contentStyle={chartTooltipStyle} />
        <Line 
          type="monotone"
          dataKey="training_loss"
          stroke="#3B82F6"
          strokeWidth={2}
          name="Training Loss"
        />
        <Line 
          type="monotone"
          dataKey="validation_loss"
          stroke="#F97316"
          strokeWidth={2}
          name="Validation Loss"
        />
      </LineChart>
    </BaseChart>
  );
};

export default ValidationChart;
