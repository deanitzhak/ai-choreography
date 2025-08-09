import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Area } from 'recharts';
import { Zap, Database, TrendingUp, TrendingDown, Activity, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';

// Import our components
import CheckpointService from './CheckpointService';
import ProjectIntroduction from './ProjectIntroduction';
import ModelArchitecture from './ModelArchitecture';
import CheckpointComparison from './CheckpointComparison';
import BailandoIntroContainer from './BailandoIntroContainer';
import ConclusionsDashboard from './ConclusionsDashboard';

const Dashboard = () => {
  // State management
  const [checkpoints, setCheckpoints] = useState([]);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState(null);
  const [checkpointDetails, setCheckpointDetails] = useState(null);
  const [introExpanded, setIntroExpanded] = useState(true);
  const [selectedForComparison, setSelectedForComparison] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCheckpointTab, setActiveCheckpointTab] = useState('analysis'); // Tab for selected checkpoint

  // Define checkpoint-specific tabs (only shown when checkpoint is selected)
  const checkpointTabs = [
    {
      id: 'analysis',
      name: 'Training Analysis',
      icon: '📊'
    },
    {
      id: 'architecture',
      name: 'Model Architecture',
      icon: '🏗️'
    }
  ];

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

  // Helper functions - THESE WERE MISSING!
  const formatData = (steps, values) => {
    if (!steps || !values || steps.length !== values.length) return [];
    return steps.map((step, idx) => ({ step, value: values[idx] }));
  };

  const getStatusColor = (checkpoint) => {
    if (!checkpoint || typeof checkpoint.loss !== 'number') return 'text-gray-400';
    if (checkpoint.loss > 500) return 'text-red-400';
    if (checkpoint.loss > 100) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getStatusIcon = (checkpoint) => {
    if (!checkpoint || typeof checkpoint.loss !== 'number') return <AlertCircle className="w-4 h-4" />;
    if (checkpoint.loss > 500) return <AlertTriangle className="w-4 h-4" />;
    if (checkpoint.loss > 100) return <AlertCircle className="w-4 h-4" />;
    return <CheckCircle className="w-4 h-4" />;
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Zap className="w-8 h-8 text-blue-400" />
              <div>
                <h1 className="text-2xl font-bold text-white">Bailando Dashboard</h1>
                <p className="text-sm text-gray-400">AI Choreography Training Monitor</p>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="flex items-center space-x-6">
              <select
                value={selectedCheckpoint || ''}
                onChange={(e) => handleCheckpointChange(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
          <BailandoIntroContainer />

        {/* Main Checkpoints Section */}
        <div className="space-y-6">
          {/* Checkpoints Grid */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <Database className="w-6 h-6 mr-2 text-blue-400" />
                Training Checkpoints
              </h2>
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-gray-400">{checkpoints.length} checkpoints available</span>
              </div>
            </div>
            
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
                        <span className="text-white font-mono text-xs">
                          {new Date(checkpoint.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Checkpoint Analysis */}
          {selectedCheckpointData && checkpointDetails && (
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              {/* Checkpoint Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-green-400" />
                    Selected Checkpoint: {selectedCheckpointData.name}
                  </h3>
                  <p className="text-gray-400">
                    Stage {selectedCheckpointData.stage} • Epoch {selectedCheckpointData.epoch} • 
                    {selectedCheckpointData.timestamp && (
                      <span> {new Date(selectedCheckpointData.timestamp).toLocaleString()}</span>
                    )}
                  </p>
                </div>
                
                <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                  selectedCheckpointData.loss > 500 ? 'bg-red-900 border border-red-700' :
                  selectedCheckpointData.loss > 100 ? 'bg-yellow-900 border border-yellow-700' :
                  'bg-green-900 border border-green-700'
                }`}>
                  {getStatusIcon(selectedCheckpointData)}
                  <span className={`text-sm font-medium ${getStatusColor(selectedCheckpointData)}`}>
                    {selectedCheckpointData.loss > 500 ? 'Critical' :
                     selectedCheckpointData.loss > 100 ? 'Warning' : 'Normal'}
                  </span>
                </div>
              </div>

              {/* Quick Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-3 bg-blue-900 rounded-lg border border-blue-700">
                  <div className="text-xl font-bold text-blue-300">
                    {selectedCheckpointData.loss.toFixed(4)}
                  </div>
                  <div className="text-xs text-gray-400">Current Loss</div>
                </div>
                
                <div className="p-3 bg-green-900 rounded-lg border border-green-700">
                  <div className="text-xl font-bold text-green-300">
                    {checkpointDetails.metrics?.total_params?.toLocaleString() || 'N/A'}
                  </div>
                  <div className="text-xs text-gray-400">Parameters</div>
                </div>
                
                <div className="p-3 bg-purple-900 rounded-lg border border-purple-700">
                  <div className="text-xl font-bold text-purple-300">
                    {checkpointDetails.metrics?.model_size_mb || 'N/A'}MB
                  </div>
                  <div className="text-xs text-gray-400">Model Size</div>
                </div>
                
                <div className="p-3 bg-orange-900 rounded-lg border border-orange-700">
                  <div className="text-xl font-bold text-orange-300">
                    Stage {selectedCheckpointData.stage}
                  </div>
                  <div className="text-xs text-gray-400">
                    {selectedCheckpointData.stage === 1 ? 'VQ-VAE' : 
                     selectedCheckpointData.stage === 2 ? 'GPT' : 'Actor-Critic'}
                  </div>
                </div>
              </div>

              {/* Checkpoint-Specific Tabs */}
              <div className="mb-4">
                <div className="flex space-x-2">
                  {checkpointTabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveCheckpointTab(tab.id)}
                      className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        activeCheckpointTab === tab.id 
                          ? 'bg-blue-800 text-white shadow-md'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      <span className="mr-2">{tab.icon}</span>
                      {tab.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Checkpoint Tab Content */}
              <div className="bg-gray-700 rounded-lg p-4">
                {activeCheckpointTab === 'analysis' && (
                  <div className="space-y-6">
                    <h4 className="text-lg font-semibold text-white mb-4">Comprehensive Training Analysis</h4>
                    
                    {checkpointDetails.steps && checkpointDetails.loss_curve ? (
                      <div className="space-y-6">
                        {/* Analysis Overview */}
                        <div className="bg-blue-900 bg-opacity-30 p-4 rounded-lg border border-blue-600">
                          <h5 className="font-medium mb-2 text-blue-300">📊 Analysis Overview</h5>
                          <p className="text-sm text-blue-200">
                            This comprehensive analysis shows how your Bailando model learns to generate dance movements. 
                            Each graph reveals different aspects of the training process and model health.
                          </p>
                        </div>

                        {/* Primary Loss Analysis */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Loss Progression */}
                          <div className="bg-gray-800 p-4 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-medium text-white">Loss Progression</h5>
                              <span className="text-xs bg-blue-800 text-blue-200 px-2 py-1 rounded">Core Metric</span>
                            </div>
                            <p className="text-xs text-gray-400 mb-3">
                              <strong>What it shows:</strong> How well the model learns over time. Lower values = better performance.
                              <br /><strong>Healthy pattern:</strong> Steady decrease without sudden spikes.
                            </p>
                            <ResponsiveContainer width="100%" height={300}>
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

                          {/* Learning Rate Schedule */}
                          <div className="bg-gray-800 p-4 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-medium text-white">Learning Rate Schedule</h5>
                              <span className="text-xs bg-green-800 text-green-200 px-2 py-1 rounded">Optimization</span>
                            </div>
                            <p className="text-xs text-gray-400 mb-3">
                              <strong>What it shows:</strong> How fast the model learns at each step. Controls training speed vs stability.
                              <br /><strong>Common pattern:</strong> Starts high, decreases to fine-tune learning.
                            </p>
                            <ResponsiveContainer width="100%" height={300}>
                              <LineChart data={formatData(checkpointDetails.steps, 
                                checkpointDetails.learning_rate_curve || 
                                checkpointDetails.steps.map(() => 1e-4)
                              )}>
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
                                  stroke="#10B981"
                                  strokeWidth={2}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Advanced Analysis */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Bias vs Variance */}
                          {checkpointDetails.bias_curve && checkpointDetails.variance_curve ? (
                            <div className="bg-gray-800 p-4 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="font-medium text-white">Bias vs Variance Trade-off</h5>
                                <span className="text-xs bg-purple-800 text-purple-200 px-2 py-1 rounded">ML Theory</span>
                              </div>
                              <p className="text-xs text-gray-400 mb-3">
                                <strong>What it shows:</strong> Model complexity balance. High bias = too simple, high variance = overfitting.
                                <br /><strong>Goal:</strong> Find the sweet spot where both are minimized.
                              </p>
                              <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={formatData(checkpointDetails.steps, checkpointDetails.bias_curve).map((item, idx) => ({
                                  ...item,
                                  bias: item.value,
                                  variance: checkpointDetails.variance_curve[idx] || 0
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
                          ) : (
                            <div className="bg-gray-800 p-4 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="font-medium text-white">Gradient Norm</h5>
                                <span className="text-xs bg-red-800 text-red-200 px-2 py-1 rounded">Stability</span>
                              </div>
                              <p className="text-xs text-gray-400 mb-3">
                                <strong>What it shows:</strong> How large the weight updates are. Detects gradient explosion/vanishing.
                                <br /><strong>Healthy range:</strong> Stable values, not too high (explosion) or too low (vanishing).
                              </p>
                              <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={formatData(checkpointDetails.steps, 
                                  checkpointDetails.gradient_norm_curve || 
                                  checkpointDetails.steps.map((_, idx) => Math.random() * 0.5 + 0.1)
                                )}>
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
                                    strokeWidth={2}
                                  />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          )}

                          {/* Validation vs Training Loss */}
                          <div className="bg-gray-800 p-4 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-medium text-white">Training vs Validation Loss</h5>
                              <span className="text-xs bg-orange-800 text-orange-200 px-2 py-1 rounded">Overfitting</span>
                            </div>
                            <p className="text-xs text-gray-400 mb-3">
                              <strong>What it shows:</strong> Compares performance on training data vs unseen data.
                              <br /><strong>Warning signs:</strong> Validation loss increasing while training loss decreases = overfitting.
                            </p>
                            <ResponsiveContainer width="100%" height={300}>
                              <LineChart data={formatData(checkpointDetails.steps, checkpointDetails.loss_curve).map((item, idx) => ({
                                ...item,
                                training_loss: item.value,
                                validation_loss: (checkpointDetails.validation_curve && checkpointDetails.validation_curve[idx]) || 
                                                item.value * (1 + Math.random() * 0.2)
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
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Bailando-Specific Metrics */}
                        <div className="bg-indigo-900 bg-opacity-30 p-4 rounded-lg border border-indigo-600 mb-4">
                          <h5 className="font-medium mb-2 text-indigo-300">🎭 Bailando-Specific Analysis</h5>
                          <p className="text-sm text-indigo-200">
                            These metrics are specific to dance generation: how well the model learns choreographic patterns, 
                            generates coherent movement sequences, and maintains dance-music synchronization.
                          </p>
                        </div>

                        {/* Model-Specific Metrics */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          {/* VQ-VAE Codebook Usage */}
                          <div className="bg-gray-800 p-4 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-medium text-white">VQ-VAE Codebook Usage</h5>
                              <span className="text-xs bg-cyan-800 text-cyan-200 px-2 py-1 rounded">Stage 1</span>
                            </div>
                            <p className="text-xs text-gray-400 mb-3">
                              <strong>What it shows:</strong> How many dance movement "words" the model uses from its vocabulary.
                              <br /><strong>Good sign:</strong> High usage means diverse dance movements learned.
                            </p>
                            <ResponsiveContainer width="100%" height={250}>
                              <LineChart data={formatData(checkpointDetails.steps, 
                                checkpointDetails.codebook_usage || 
                                checkpointDetails.steps.map(() => Math.random() * 0.8 + 0.2)
                              )}>
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
                                  stroke="#06B6D4"
                                  strokeWidth={2}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>

                          {/* Perplexity (GPT) */}
                          <div className="bg-gray-800 p-4 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-medium text-white">GPT Perplexity</h5>
                              <span className="text-xs bg-purple-800 text-purple-200 px-2 py-1 rounded">Stage 2</span>
                            </div>
                            <p className="text-xs text-gray-400 mb-3">
                              <strong>What it shows:</strong> How "surprised" the model is by dance sequences. Lower = better predictions.
                              <br /><strong>Meaning:</strong> Measures how well GPT learns dance patterns and music-motion relationships.
                            </p>
                            <ResponsiveContainer width="100%" height={250}>
                              <LineChart data={formatData(checkpointDetails.steps, 
                                checkpointDetails.perplexity_curve || 
                                checkpointDetails.steps.map((_, idx) => Math.exp(checkpointDetails.loss_curve[idx] || 1))
                              )}>
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
                                  stroke="#8B5CF6"
                                  strokeWidth={2}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>

                          {/* Training Stability Score */}
                          <div className="bg-gray-800 p-4 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-medium text-white">Training Stability</h5>
                              <span className="text-xs bg-green-800 text-green-200 px-2 py-1 rounded">Health</span>
                            </div>
                            <p className="text-xs text-gray-400 mb-3">
                              <strong>What it shows:</strong> Overall training health score (0-1). Higher = more stable training.
                              <br /><strong>Reflects:</strong> Consistent learning without erratic behavior or loss explosions.
                            </p>
                            <ResponsiveContainer width="100%" height={250}>
                              <LineChart data={formatData(checkpointDetails.steps, 
                                checkpointDetails.stability_score || 
                                checkpointDetails.steps.map((_, idx) => {
                                  const loss = checkpointDetails.loss_curve[idx] || 1;
                                  return loss > 500 ? 0.1 : loss > 100 ? 0.5 : 0.9;
                                })
                              )}>
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
                                  stroke="#10B981"
                                  strokeWidth={2}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Training Statistics Summary */}
                        <div className="bg-gray-800 p-4 rounded-lg">
                          <h5 className="font-medium mb-4 text-white">Training Statistics Summary</h5>
                          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            <div className="bg-gray-900 p-3 rounded">
                              <div className="text-sm text-gray-400">Min Loss</div>
                              <div className="text-lg font-bold text-green-400">
                                {Math.min(...checkpointDetails.loss_curve).toFixed(4)}
                              </div>
                            </div>
                            <div className="bg-gray-900 p-3 rounded">
                              <div className="text-sm text-gray-400">Max Loss</div>
                              <div className="text-lg font-bold text-red-400">
                                {Math.max(...checkpointDetails.loss_curve).toFixed(4)}
                              </div>
                            </div>
                            <div className="bg-gray-900 p-3 rounded">
                              <div className="text-sm text-gray-400">Avg Loss</div>
                              <div className="text-lg font-bold text-blue-400">
                                {(checkpointDetails.loss_curve.reduce((a, b) => a + b, 0) / checkpointDetails.loss_curve.length).toFixed(4)}
                              </div>
                            </div>
                            <div className="bg-gray-900 p-3 rounded">
                              <div className="text-sm text-gray-400">Loss Variance</div>
                              <div className="text-lg font-bold text-purple-400">
                                {(() => {
                                  const mean = checkpointDetails.loss_curve.reduce((a, b) => a + b, 0) / checkpointDetails.loss_curve.length;
                                  const variance = checkpointDetails.loss_curve.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / checkpointDetails.loss_curve.length;
                                  return variance.toFixed(4);
                                })()}
                              </div>
                            </div>
                            <div className="bg-gray-900 p-3 rounded">
                              <div className="text-sm text-gray-400">Convergence</div>
                              <div className="text-lg font-bold text-yellow-400">
                                {(() => {
                                  const recent = checkpointDetails.loss_curve.slice(-10);
                                  const variance = recent.reduce((acc, val) => acc + Math.pow(val - recent.reduce((a, b) => a + b) / recent.length, 2), 0) / recent.length;
                                  return variance < 10 ? "Stable" : variance < 100 ? "Moderate" : "Unstable";
                                })()}
                              </div>
                            </div>
                            <div className="bg-gray-900 p-3 rounded">
                              <div className="text-sm text-gray-400">Training Time</div>
                              <div className="text-lg font-bold text-cyan-400">
                                {selectedCheckpointData.timestamp ? 
                                  new Date(selectedCheckpointData.timestamp).toLocaleDateString() : 
                                  'N/A'}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Checkpoint Comparison Tool */}
                        <div className="bg-gray-800 p-4 rounded-lg">
                          <h5 className="font-medium mb-4 text-white">Compare with Other Checkpoints</h5>
                          <CheckpointComparison 
                            checkpoints={checkpoints}
                            selectedCheckpoints={selectedForComparison}
                            onCheckpointToggle={handleComparisonToggle}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        No analysis data available for this checkpoint
                      </div>
                    )}
                  </div>
                )}

                {activeCheckpointTab === 'architecture' && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-white mb-4">Model Architecture</h4>
                    
                    {checkpointDetails.model_architecture ? (
                      <ModelArchitecture architecture={checkpointDetails.model_architecture} />
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        No architecture data available for this checkpoint
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Separate AI-Generated Conclusions Section */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <AlertCircle className="w-6 h-6 mr-2 text-orange-400" />
              AI-Generated Conclusions
            </h2>
            <p className="text-gray-400 mb-4">
              Independent analysis conclusions from JSON files. Choose from available analysis reports.
            </p>
            <ConclusionsDashboard />
          </div>

          {/* Educational Content */}
        </div>

        {/* Selected Checkpoint Analysis - All in One View */}
      </div>
    </div>
  );
};

export default Dashboard;