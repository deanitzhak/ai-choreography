// ===== MAIN REFACTORED DASHBOARD =====

// Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { TrendingUp, AlertCircle } from 'lucide-react';

// Custom Hooks
import { useCheckpoints } from '../hooks/useCheckpoints';
import { useCheckpointDetails } from '../hooks/useCheckpointDetails';

// Layout Components
import DashboardHeader from './layout/DashboardHeader';
import LoadingState from './layout/LoadingState';
import ErrorState from './layout/ErrorState';

// Checkpoint Components
import CheckpointGrid from './checkpoints/CheckpointGrid';
import CheckpointMetrics from './checkpoints/CheckpointMetrics';
import CheckpointTabs from './checkpoints/CheckpointTabs';

// Analysis Components
import TrainingAnalysis from './analysis/TrainingAnalysis';

// Other Components (imported from original)
import ProjectIntroduction from './ProjectIntroduction';
import ModelArchitecture from './layout/ModelArchitecture';
import BailandoIntroContainer from './layout/BailandoIntroContainer';
import ConclusionsDashboard from './analysis/ConclusionsDashboard';

// Utils
import { getStatusColor, getStatusIcon } from '../utils/formatters';

const Dashboard = () => {
  // State management
  const [selectedCheckpoint, setSelectedCheckpoint] = useState(null);
  const [introExpanded, setIntroExpanded] = useState(true);
  const [selectedForComparison, setSelectedForComparison] = useState([]);
  const [activeCheckpointTab, setActiveCheckpointTab] = useState('analysis');

  // Custom hooks for data management
  const { checkpoints, loading, error, refetch } = useCheckpoints();
  const { checkpointDetails, loadCheckpointDetails } = useCheckpointDetails();

  // Auto-select latest checkpoint when checkpoints load
  useEffect(() => {
    if (checkpoints.length > 0 && !selectedCheckpoint) {
      const latest = checkpoints[checkpoints.length - 1];
      handleCheckpointChange(latest.id);
    }
  }, [checkpoints, selectedCheckpoint]);

  // Event handlers
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

  // Loading and error states
  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  // Data derivation
  const selectedCheckpointData = checkpoints.find(cp => cp.id === selectedCheckpoint);
  const latestCheckpoint = checkpoints.length > 0 ? checkpoints[checkpoints.length - 1] : null;

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <DashboardHeader 
        checkpoints={checkpoints}
        selectedCheckpoint={selectedCheckpoint}
        onCheckpointChange={handleCheckpointChange}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Project Introduction */}
        <ProjectIntroduction 
          isExpanded={introExpanded}
          onToggle={() => setIntroExpanded(!introExpanded)}
          latestCheckpoint={latestCheckpoint}
        />
        
        <BailandoIntroContainer />

        {/* Main Content */}
        <div className="space-y-6">
          {/* Checkpoints Grid */}
          <CheckpointGrid 
            checkpoints={checkpoints}
            selectedCheckpoint={selectedCheckpoint}
            onCheckpointSelect={handleCheckpointChange}
          />

          {/* Selected Checkpoint Analysis */}
          {selectedCheckpointData && checkpointDetails && (
            <SelectedCheckpointSection 
              checkpoint={selectedCheckpointData}
              checkpointDetails={checkpointDetails}
              activeTab={activeCheckpointTab}
              onTabChange={setActiveCheckpointTab}
              checkpoints={checkpoints}
              selectedForComparison={selectedForComparison}
              onComparisonToggle={handleComparisonToggle}
            />
          )}

          {/* AI-Generated Conclusions Section */}
          <AIConclusionsSection />
        </div>
      </div>
    </div>
  );
};

// ===== SUB-COMPONENTS =====

// Selected Checkpoint Section Component
const SelectedCheckpointSection = ({ 
  checkpoint, 
  checkpointDetails, 
  activeTab, 
  onTabChange,
  checkpoints,
  selectedForComparison,
  onComparisonToggle
}) => {
  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      {/* Checkpoint Header */}
      <CheckpointHeader checkpoint={checkpoint} />

      {/* Quick Metrics */}
      <CheckpointMetrics 
        checkpoint={checkpoint} 
        checkpointDetails={checkpointDetails} 
      />

      {/* Checkpoint-Specific Tabs */}
      <CheckpointTabs 
        activeTab={activeTab} 
        onTabChange={onTabChange} 
      />

      {/* Tab Content */}
      <div className="bg-gray-700 rounded-lg p-4">
        {activeTab === 'analysis' && (
          <TrainingAnalysis 
            checkpointDetails={checkpointDetails}
            checkpoint={checkpoint}
            checkpoints={checkpoints}
            selectedForComparison={selectedForComparison}
            onComparisonToggle={onComparisonToggle}
          />
        )}

        {activeTab === 'architecture' && (
          <ArchitectureTab checkpointDetails={checkpointDetails} />
        )}
      </div>
    </div>
  );
};

// Checkpoint Header Component
const CheckpointHeader = ({ checkpoint }) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h3 className="text-xl font-bold text-white flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-green-400" />
          Selected Checkpoint: {checkpoint.name}
        </h3>
        <p className="text-gray-400">
          Stage {checkpoint.stage} • Epoch {checkpoint.epoch} • 
          {checkpoint.timestamp && (
            <span> {new Date(checkpoint.timestamp).toLocaleString()}</span>
          )}
        </p>
      </div>
      
      <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
        checkpoint.loss > 500 ? 'bg-red-900 border border-red-700' :
        checkpoint.loss > 100 ? 'bg-yellow-900 border border-yellow-700' :
        'bg-green-900 border border-green-700'
      }`}>
        {getStatusIcon(checkpoint)}
        <span className={`text-sm font-medium ${getStatusColor(checkpoint)}`}>
          {checkpoint.loss > 500 ? 'Critical' :
           checkpoint.loss > 100 ? 'Warning' : 'Normal'}
        </span>
      </div>
    </div>
  );
};

// Architecture Tab Component
const ArchitectureTab = ({ checkpointDetails }) => {
  return (
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
  );
};

// AI Conclusions Section Component
const AIConclusionsSection = () => {
  return (
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
  );
};

export default Dashboard;