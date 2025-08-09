import React from 'react';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import BaseChart from './BaseChart';
import { formatData, chartTooltipStyle, chartGridStyle, chartAxisStyle } from '../../utils/formatters';

const LearningRateChart = ({ steps, learningRateData }) => {
  const data = formatData(steps, learningRateData || steps.map(() => 1e-4));

  return (
    <BaseChart
      title="Learning Rate Schedule"
      badge="Optimization"
      badgeColor="green"
      description="<strong>What it shows:</strong> How fast the model learns at each step. Controls training speed vs stability.<br /><strong>Common pattern:</strong> Starts high, decreases to fine-tune learning."
    >
      <LineChart data={data}>
        <CartesianGrid {...chartGridStyle} />
        <XAxis dataKey="step" {...chartAxisStyle} />
        <YAxis {...chartAxisStyle} />
        <Tooltip contentStyle={chartTooltipStyle} />
        <Line 
          type="monotone"
          dataKey="value"
          stroke="#10B981"
          strokeWidth={2}
        />
      </LineChart>
    </BaseChart>
  );
};

export default LearningRateChart;
