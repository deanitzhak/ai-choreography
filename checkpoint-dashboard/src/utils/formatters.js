export const formatData = (steps, values) => {
  if (!steps || !values || steps.length !== values.length) return [];
  return steps.map((step, idx) => ({ step, value: values[idx] }));
};

export const getStatusColor = (checkpoint) => {
  if (!checkpoint || typeof checkpoint.loss !== 'number') return 'text-gray-400';
  if (checkpoint.loss > 500) return 'text-red-400';
  if (checkpoint.loss > 100) return 'text-yellow-400';
  return 'text-green-400';
};

export const getStatusIcon = (checkpoint) => {
  if (!checkpoint || typeof checkpoint.loss !== 'number') return 'AlertCircle';
  if (checkpoint.loss > 500) return 'AlertTriangle';
  if (checkpoint.loss > 100) return 'AlertCircle';
  return 'CheckCircle';
};

export const chartTooltipStyle = {
  backgroundColor: '#1f2937',
  border: '1px solid #374151',
  borderRadius: '8px',
  color: '#fff'
};

export const chartGridStyle = {
  strokeDasharray: "3 3",
  stroke: "#374151"
};

export const chartAxisStyle = {
  stroke: "#9ca3af"
};