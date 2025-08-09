import React from 'react';
import { ComposedChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import BaseChart from './BaseChart';
import { formatData } from '../../utils/formatters';
import { chartTooltipStyle, chartGridStyle, chartAxisStyle } from '../../utils/formatters';

const LossProgressionChart = ({ steps, lossData }) => {
  const data = formatData(steps, lossData);

  return (
    <BaseChart
      title="Loss Progression"
      badge="Core Metric"
      badgeColor="blue"
      description="<strong>What it shows:</strong> How well the model learns over time. Lower values = better performance.<br /><strong>Healthy pattern:</strong> Steady decrease without sudden spikes."
    >
      <ComposedChart data={data}>
        <CartesianGrid {...chartGridStyle} />
        <XAxis dataKey="step" {...chartAxisStyle} />
        <YAxis {...chartAxisStyle} />
        <Tooltip contentStyle={chartTooltipStyle} />
        <Area 
          type="monotone"
          dataKey="value"
          fill="#3B82F6"
          fillOpacity={0.6}
          stroke="#3B82F6"
          strokeWidth={2}
        />
      </ComposedChart>
    </BaseChart>
  );
};

export default LossProgressionChart;
