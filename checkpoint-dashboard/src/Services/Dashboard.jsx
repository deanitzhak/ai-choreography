import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Area } from 'recharts';
import { Zap, Database, TrendingUp, TrendingDown, Activity, AlertCircle } from 'lucide-react';

// Import our components
import CheckpointService from './CheckpointService';
import ProjectIntroduction from './ProjectIntroduction';
import ModelArchitecture from './ModelArchitecture';
import CheckpointComparison from './CheckpointComparison';

const Dashboard = () => {
  // State management
  const [checkpoints, setCheckpoints] = useState([]);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState(null);
  const [checkpointDetails, setCheckpointDetails] = useState(null);
  const [introExpanded, setIntroExpanded] = useState(true);
  const [selectedForComparison, setSelectedForComparison] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load checkpoints on component mount
  useEffect(() => {
    loadCheckpoints();
  }, []);

  const loadCheckpoints = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await CheckpointService.getCheckpoints();
      setCheckpoints(data);
      
      // Auto-select the latest checkpoint
      if (data.length > 0) {
        const latest = data[data.length - 1];
        setSelectedCheckpoint(latest.id);
        await loadCheckpointDetails(latest.id);
      }
    } catch (error) {
      console.error('Failed to load checkpoints:', error);
      setError('Failed to load checkpoint data. Please check your server connection.');
    } finally {
      setLoading(false);
    }
  };

  const loadCheckpointDetails = async (checkpointId) => {
    try {
      const details = await CheckpointService.getCheckpointDetails(checkpointId);
      setCheckpointDetails(details);
    } catch (error) {
      console.error('Failed to load checkpoint details:', error);
      setError('Failed to load checkpoint details.');
    }
  };

  const handleCheckpointChange = async (checkpointId) => {
    setSelectedCheckpoint(checkpointId);
    await loadCheckpointDetails(checkpointId);
  };

  const handleComparisonToggle = (checkpointId) => {
    setSelectedForComparison(prev => 
      prev.includes(checkpointId)
        ? prev.filter(id => id !== checkpointId)
        : [...prev, checkpointId]
    );
  };

  // Helper functions
  const formatData = (steps, values) => {
    return steps.map((step, idx) => ({
      step,
      value: values[idx]
    }));
  };

  const getStatusColor = (checkpoint) => {
    if (!checkpoint || !checkpoint.loss) return 'text-gray-400';
    if (checkpoint.loss > 500) return 'text-red-400';
    if (checkpoint.loss > 100) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getStatusIcon = (checkpoint) => {
    if (!checkpoint || !checkpoint.loss) return <AlertCircle className="w-4 h-4" />;
    if (checkpoint.loss > 500) return <TrendingDown className="w-4 h-4" />;
    if (checkpoint.loss > 100) return <Activity className="w-4 h-4" />;
    return <TrendingUp className="w-4 h-4" />;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg">Loading ML Dashboard...</p>
          <p className="text-gray-500 text-sm mt-2">Connecting to checkpoint server...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Connection Error</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button 
            onClick={loadCheckpoints}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const selectedCheckpointData = checkpoints.find(cp => cp.id === selectedCheckpoint);
  const latestCheckpoint = checkpoints.length > 0 ? checkpoints[checkpoints.length - 1] : null;

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 shadow-lg border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center">
                <Zap className="w-8 h-8 mr-3 text-blue-400" />
                🎭 AI Choreography Dashboard
              </h1>
              <p className="text-gray-400 mt-1">Bailando: 3D Dance Generation Analysis</p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Checkpoint Selector */}
              <select
                value={selectedCheckpoint || ''}
                onChange={(e) => handleCheckpointChange(e.target.value)}
                className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Checkpoint</option>
                {checkpoints.map(checkpoint => (
                  <option key={checkpoint.id} value={checkpoint.id}>
                    {checkpoint.name} (Loss: {checkpoint.loss.toFixed(2)})
                  </option>
                ))}
              </select>
              
              {/* Status Info */}
              <div className="flex items-center space-x-2 text-sm">
                <Database className="w-4 h-4 text-green-400" />
                <span className="text-gray-400">{checkpoints.length} checkpoints</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Project Introduction */}
        <ProjectIntroduction 
          isExpanded={introExpanded} 
          onToggle={() => setIntroExpanded(!introExpanded)}
          latestCheckpoint={latestCheckpoint}
        />

        {/* Checkpoint Grid */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
          <h2 className="text-2xl font-bold mb-6 text-white flex items-center">
            <Database className="w-6 h-6 mr-2 text-blue-400" />
            Training Checkpoints
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {checkpoints.map((checkpoint) => (
              <div
                key={checkpoint.id}
                onClick={() => handleCheckpointChange(checkpoint.id)}
                className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:scale-105 ${
                  selectedCheckpoint === checkpoint.id
                    ? 'bg-blue-900 border-blue-400 shadow-lg'
                    : 'bg-gray-700 border-gray-600 hover:border-gray-500'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-white text-sm">
                    {checkpoint.name}
                  </span>
                  <div className={`flex items-center ${getStatusColor(checkpoint)}`}>
                    {getStatusIcon(checkpoint)}
                  </div>
                </div>
                
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Epoch:</span>
                    <span className="text-white font-mono">{checkpoint.epoch}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Loss:</span>
                    <span className={`font-mono ${getStatusColor(checkpoint)}`}>
                      {checkpoint.loss.toFixed(4)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Stage:</span>
                    <span className="text-white font-mono">{checkpoint.stage}</span>
                  </div>
                  {checkpoint.timestamp && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Time:</span>
                      <span className="text-white">
                        {new Date(checkpoint.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Checkpoint Analysis */}
        {checkpointDetails && selectedCheckpointData && (
          <>
            {/* Current Checkpoint Overview */}
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 mb-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center text-white">
                <TrendingUp className="w-5 h-5 mr-2 text-green-400" />
                Current Checkpoint: {selectedCheckpointData.name}
              </h2>
              
              {/* Metrics Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-blue-900 rounded-lg border border-blue-700">
                  <div className="text-2xl font-bold text-blue-300">
                    {selectedCheckpointData.loss.toFixed(4)}
                  </div>
                  <div className="text-sm text-gray-400">Current Loss</div>
                  <div className="text-xs text-blue-400 mt-1">
                    {selectedCheckpointData.loss > 500 ? 'Critical' : 
                     selectedCheckpointData.loss > 100 ? 'High' : 'Normal'}
                  </div>
                </div>
                
                <div className="p-4 bg-green-900 rounded-lg border border-green-700">
                  <div className="text-2xl font-bold text-green-300">
                    {checkpointDetails.metrics?.total_params.toLocaleString() || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-400">Parameters</div>
                  <div className="text-xs text-green-400 mt-1">Total Model Size</div>
                </div>
                
                <div className="p-4 bg-purple-900 rounded-lg border border-purple-700">
                  <div className="text-2xl font-bold text-purple-300">
                    {checkpointDetails.metrics?.model_size_mb || 'N/A'}MB
                  </div>
                  <div className="text-sm text-gray-400">Model Size</div>
                  <div className="text-xs text-purple-400 mt-1">Disk Usage</div>
                </div>
                
                <div className="p-4 bg-orange-900 rounded-lg border border-orange-700">
                  <div className="text-2xl font-bold text-orange-300">
                    {checkpointDetails.metrics?.learning_stability 
                      ? (checkpointDetails.metrics.learning_stability * 100).toFixed(1) + '%'
                      : 'N/A'
                    }
                  </div>
                  <div className="text-sm text-gray-400">Stability</div>
                  <div className="text-xs text-orange-400 mt-1">Training Consistency</div>
                </div>
              </div>

              {/* Training Curves */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Loss Curve */}
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-semibold mb-3 text-white">Loss Curve</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={formatData(checkpointDetails.steps, checkpointDetails.loss_curve)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="step" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1f2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#fff'
                        }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#EF4444" 
                        strokeWidth={3}
                        dot={{ r: 4 }}
                        name="Loss" 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Learning Rate */}
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-semibold mb-3 text-white">Learning Rate</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={formatData(checkpointDetails.steps, checkpointDetails.lr_curve)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="step" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1f2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#fff'
                        }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#3B82F6" 
                        strokeWidth={3}
                        dot={{ r: 4 }}
                        name="Learning Rate" 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Bias & Variance */}
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-semibold mb-3 text-white">Bias & Variance</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={formatData(checkpointDetails.steps, checkpointDetails.bias_curve).map((item, idx) => ({
                      ...item,
                      bias: item.value,
                      variance: checkpointDetails.variance_curve[idx]
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="step" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1f2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#fff'
                        }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="bias" 
                        stroke="#F59E0B" 
                        strokeWidth={2}
                        name="Bias" 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="variance" 
                        stroke="#8B5CF6" 
                        strokeWidth={2}
                        name="Variance" 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Training Progress */}
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-semibold mb-3 text-white">Training Progress</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <ComposedChart data={formatData(checkpointDetails.steps, checkpointDetails.loss_curve)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="step" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1f2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#fff'
                        }} 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        fill="#3B82F6" 
                        fillOpacity={0.6}
                        stroke="#3B82F6"
                        strokeWidth={2}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Model Architecture */}
            <div className="mb-6">
              <ModelArchitecture architecture={checkpointDetails.model_architecture} />
            </div>

            {/* Checkpoint Comparison */}
            <CheckpointComparison 
              checkpoints={checkpoints}
              selectedCheckpoints={selectedForComparison}
              onCheckpointToggle={handleComparisonToggle}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;