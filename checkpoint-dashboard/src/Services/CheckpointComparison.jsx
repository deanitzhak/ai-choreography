import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Activity } from 'lucide-react';
import CheckpointService from './CheckpointService';

const CheckpointComparison = ({ checkpoints, selectedCheckpoints, onCheckpointToggle }) => {
  const [comparisonData, setComparisonData] = useState([]);
  const [loading, setLoading]               = useState(false);

    // Load comparison data when selected checkpoints change
  useEffect(() => {
    const loadComparisonData = async () => {
      if (selectedCheckpoints.length === 0) {
        setComparisonData([]);
        return;
      }

      setLoading(true);
      try {
        const data = await Promise.all(
          selectedCheckpoints.map(async (id) => {
            const checkpoint = checkpoints.find(cp => cp.id === id);
            return {
              id       : checkpoint.id,
              name     : checkpoint.name,
              epoch    : checkpoint.epoch,
              loss     : checkpoint.loss,
              timestamp: checkpoint.timestamp,
            };
          })
        );
        
          // Sort by epoch for proper comparison
        data.sort((a, b) => a.epoch - b.epoch);
        setComparisonData(data);
      } catch (error) {
        console.error('Error loading comparison data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadComparisonData();
  }, [selectedCheckpoints, checkpoints]);

    // Determine performance status color based on loss value
  const getPerformanceColor = (loss) => {
    if (loss > 500) return 'text-red-400 bg-red-900';
    if (loss > 100) return 'text-yellow-400 bg-yellow-900';
    return 'text-green-400 bg-green-900';
  };

  const getPerformanceStatus = (loss) => {
    if (loss > 500) return { icon: '⚠️', label: 'Unstable', color: 'text-red-400' };
    if (loss > 100) return { icon: '⚡', label: 'High', color: 'text-yellow-400' };
    return { icon: '✅', label: 'Stable', color: 'text-green-400' };
  };

  return (
    <div className = "bg-gray-800 p-6 rounded-lg border border-gray-700">
      {/* Header */}
      <h3       className = "text-lg font-semibold mb-4 flex items-center text-white">
      <Activity className = "w-5 h-5 mr-2 text-green-400" />
        Checkpoint Comparison
      </h3>
      
      {/* Checkpoint Selection */}
      <div className = "mb-6">
      <p   className = "text-sm text-gray-400 mb-3">
          Select checkpoints to compare (click to toggle): 
        </p>
        <div className = "flex flex-wrap gap-2">
          {checkpoints.map(checkpoint => (
            <button
              key       = {checkpoint.id}
              onClick   = {() => onCheckpointToggle(checkpoint.id)}
              className = {`px-3 py-2 text-xs rounded-lg border transition-all duration-200 hover:scale-105 ${
                selectedCheckpoints.includes(checkpoint.id)
                  ? 'bg-blue-700 border-blue-500 text-blue-200 shadow-lg'
                  :  'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <div className = "font-medium">Epoch {checkpoint.epoch}</div>
              <div className = "text-xs opacity-75">Loss: {checkpoint.loss.toFixed(1)}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Comparison Results */}
      {loading && (
        <div className = "text-center py-8">
        <div className = "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-2"></div>
        <p   className = "text-gray-400">Loading comparison data...</p>
        </div>
      )}

      {!loading && comparisonData.length === 0 && (
        <div      className = "text-center py-8 text-gray-400">
        <Activity className = "w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Select checkpoints above to compare their performance</p>
        </div>
      )}

      {!loading && comparisonData.length > 0 && (
        <div className = "space-y-6">
          {/* Loss Comparison Chart */}
          <div>
            <h4                  className       = "font-semibold mb-3 text-white">Loss Progression Comparison</h4>
            <ResponsiveContainer width           = "100%" height           = {300}>
            <BarChart            data            = {comparisonData} margin = {{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid       strokeDasharray = "3 3" stroke            = "#374151" />
                <XAxis 
                  dataKey = "epoch"
                  stroke  = "#9ca3af"
                  label   = {{ value: 'Epoch', position: 'insideBottom', offset: -5, style: { textAnchor: 'middle', fill: '#9ca3af' } }}
                />
                <YAxis 
                  stroke = "#9ca3af"
                  label  = {{ value: 'Loss', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9ca3af' } }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937',
                    border         : '1px solid #374151',
                    borderRadius   : '8px',
                    color          : '#fff'
                  }}
                  formatter      = {(value, name) => [value.toFixed(4), 'Loss']}
                  labelFormatter = {(label) => `Epoch ${label}`}
                />
                <Legend />
                <Bar 
                  dataKey = "loss"
                  fill    = "#EF4444"
                  name    = "Loss"
                  radius  = {[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Detailed Comparison Table */}
          {comparisonData.length > 1 && (
            <div>
              <h4    className = "font-semibold mb-3 text-white">Detailed Metrics Comparison</h4>
              <div   className = "overflow-x-auto">
              <table className = "w-full text-sm border border-gray-600 rounded-lg overflow-hidden">
              <thead className = "bg-gray-700">
                    <tr>
                      <th className = "p-3 text-left text-gray-300 font-semibold">Checkpoint</th>
                      <th className = "p-3 text-left text-gray-300 font-semibold">Loss</th>
                      <th className = "p-3 text-left text-gray-300 font-semibold">Status</th>
                      <th className = "p-3 text-left text-gray-300 font-semibold">Δ from Previous</th>
                      <th className = "p-3 text-left text-gray-300 font-semibold">% Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonData.map((data, idx) => {
                      const prevLoss          = idx > 0 ? comparisonData[idx - 1].loss : data.loss;
                      const lossChange        = data.loss - prevLoss;
                      const lossChangePercent = idx > 0 ? ((lossChange / prevLoss) * 100) : 0;
                      const status            = getPerformanceStatus(data.loss);
                      
                      return (
                        <tr key       = {data.id} className = "border-b border-gray-700 hover:bg-gray-700 transition-colors">
                        <td className = "p-3 font-medium text-white">
                            <div>Epoch {data.epoch}</div>
                            <div className = "text-xs text-gray-400">{data.name}</div>
                          </td>
                          <td   className = "p-3">
                          <span className = {`font-mono rounded-full px-3 py-1 text-sm ${getPerformanceColor(data.loss)}`}>
                              {data.loss.toFixed(4)}
                            </span>
                          </td>
                          <td   className = "p-3">
                          <span className = {`font-medium ${status.color}`}>
                              {status.icon} {status.label}
                            </span>
                          </td>
                          <td className = "p-3">
                            {idx > 0 ? (
                              <span className = {`font-mono text-sm ${lossChange > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                {lossChange > 0 ? '+' : ''}{lossChange.toFixed(2)}
                              </span>
                            ) : (
                              <span className = "text-gray-500">—</span>
                            )}
                          </td>
                          <td className = "p-3">
                            {idx > 0 ? (
                              <span className = {`font-mono text-sm ${lossChangePercent > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                {lossChangePercent > 0 ? '+' : ''}{lossChangePercent.toFixed(1)}%
                              </span>
                            ) : (
                              <span className = "text-gray-500">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Summary Statistics */}
          <div className = "grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className = "bg-gray-700 p-4 rounded-lg">
          <div className = "text-gray-400 text-xs mb-1">BEST LOSS</div>
          <div className = "text-white text-lg font-bold">
                {Math.min(...comparisonData.map(d => d.loss)).toFixed(4)}
              </div>
            </div>
            <div className = "bg-gray-700 p-4 rounded-lg">
            <div className = "text-gray-400 text-xs mb-1">WORST LOSS</div>
            <div className = "text-white text-lg font-bold">
                {Math.max(...comparisonData.map(d => d.loss)).toFixed(4)}
              </div>
            </div>
            <div className = "bg-gray-700 p-4 rounded-lg">
            <div className = "text-gray-400 text-xs mb-1">TOTAL CHANGE</div>
            <div className = "text-white text-lg font-bold">
                {comparisonData.length > 1 ? 
                  (comparisonData[comparisonData.length - 1].loss - comparisonData[0].loss).toFixed(2): 
                  '—'
                }
              </div>
            </div>
            <div className = "bg-gray-700 p-4 rounded-lg">
            <div className = "text-gray-400 text-xs mb-1">CHECKPOINTS</div>
            <div className = "text-white text-lg font-bold">
                {comparisonData.length}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckpointComparison;