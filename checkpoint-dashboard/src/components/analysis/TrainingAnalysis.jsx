import React from 'react';
import AnalysisOverview from './AnalysisOverview';
import BailandoSpecificAnalysis from './BailandoSpecificAnalysis';
import TrainingStatsSummary from './TrainingStatsSummary';
import LossProgressionChart from '../charts/LossProgressionChart';
import LearningRateChart from '../charts/LearningRateChart';
import ValidationChart from '../charts/ValidationChart';
import CodebookUsageChart from '../charts/CodebookUsageChart';
import CheckpointComparison from '../checkpoints/CheckpointComparison';

const TrainingAnalysis = ({ 
  checkpointDetails, 
  checkpoint,
  checkpoints,
  selectedForComparison,
  onComparisonToggle
}) => {
  if (!checkpointDetails.steps || !checkpointDetails.loss_curve) {
    return (
      <div className="text-center py-8 text-gray-400">
        No analysis data available for this checkpoint
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h4 className="text-lg font-semibold text-white mb-4">Comprehensive Training Analysis</h4>
      
      <AnalysisOverview />

      {/* Primary Loss Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LossProgressionChart 
          steps={checkpointDetails.steps}
          lossData={checkpointDetails.loss_curve}
        />
        <LearningRateChart 
          steps={checkpointDetails.steps}
          learningRateData={checkpointDetails.learning_rate_curve}
        />
      </div>

      {/* Advanced Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ValidationChart 
          steps={checkpointDetails.steps}
          lossData={checkpointDetails.loss_curve}
          validationData={checkpointDetails.validation_curve}
        />
        {/* Add more charts as needed */}
      </div>

      <BailandoSpecificAnalysis />

      {/* Model-Specific Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <CodebookUsageChart 
          steps={checkpointDetails.steps}
          codebookData={checkpointDetails.codebook_usage}
        />
        {/* Add PerplexityChart and StabilityChart here */}
      </div>

      <TrainingStatsSummary 
        lossData={checkpointDetails.loss_curve}
        checkpoint={checkpoint}
      />

      {/* Checkpoint Comparison Tool */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <h5 className="font-medium mb-4 text-white">Compare with Other Checkpoints</h5>
        <CheckpointComparison 
          checkpoints={checkpoints}
          selectedCheckpoints={selectedForComparison}
          onCheckpointToggle={onComparisonToggle}
        />
      </div>
    </div>
  );
};

export default TrainingAnalysis;