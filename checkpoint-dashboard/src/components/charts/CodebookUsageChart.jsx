import React from 'react';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import BaseChart from './BaseChart';
import { formatData } from '../../utils/formatters';
import { chartTooltipStyle, chartGridStyle, chartAxisStyle } from '../../utils/formatters';

const CodebookUsageChart = ({ steps, codebookData }) => {
  const data = formatData(steps, codebookData || steps.map(() => Math.random() * 0.8 + 0.2));

  return (
    <BaseChart
      title="VQ-VAE Codebook Usage"
      badge="Stage 1"
      badgeColor="cyan"
      height={250}
      description={
        <span
          dangerouslySetInnerHTML={{
            __html:
              '<strong>What it shows:</strong> How many dance movement "words" the model uses from its vocabulary.<br /><strong>Good sign:</strong> High usage means diverse dance movements learned.'
          }}
        />
      }
    >
      <LineChart data={data}>
        <CartesianGrid {...chartGridStyle} />
        <XAxis dataKey="step" {...chartAxisStyle} />
        <YAxis {...chartAxisStyle} />
        <Tooltip contentStyle={chartTooltipStyle} />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#06B6D4"
          strokeWidth={2}
        />
      </LineChart>
    </BaseChart>
  );
};

export default CodebookUsageChart;