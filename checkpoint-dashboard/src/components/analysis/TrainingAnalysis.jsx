import React from 'react';
import AnalysisOverview from './AnalysisOverview';
import BailandoSpecificAnalysis from './BailandoSpecificAnalysis';
import TrainingStatsSummary from './TrainingStatsSummary';
import LossProgressionChart from '../charts/LossProgressionChart';
import LearningRateChart from '../charts/LearningRateChart';
import ValidationChart from '../charts/ValidationChart';
import CodebookUsageChart from '../charts/CodebookUsageChart';
import CheckpointComparison from '../checkpoints/CheckpointComparison';

// NEW CHARTS - Add these imports
import BiasVarianceChart from '../charts/BiasVarianceChart';
import HyperparameterAnalysisChart from '../charts/HyperparameterAnalysisChart';
import ModelComplexityChart from '../charts/ModelComplexityChart';
import ProblemsAndSolutionsAnalysis from '../charts/ProblemsAndSolutionsAnalysis';

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
          learningRateData={checkpointDetails.lr_curve}
        />
      </div>

      {/* NEW: Bias-Variance & Hyperparameter Analysis */}
      <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 p-1 rounded-lg">
        <div className="bg-gray-800 p-4 rounded-lg">
          <h5 className="text-lg font-semibold text-white mb-4 flex items-center">
            🎯 Hyperparameter & Bias-Variance Analysis
            <span className="ml-2 text-xs bg-purple-600 px-2 py-1 rounded">NEW</span>
          </h5>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BiasVarianceChart 
              steps={checkpointDetails.steps}
              lossData={checkpointDetails.loss_curve}
              biasData={checkpointDetails.bias_curve}
              varianceData={checkpointDetails.variance_curve}
            />
            <HyperparameterAnalysisChart 
              steps={checkpointDetails.steps}
              lossData={checkpointDetails.loss_curve}
              learningRateData={checkpointDetails.lr_curve}
            />
          </div>
          
          {/* Model Complexity Analysis */}
          <div className="mt-6">
            <ModelComplexityChart 
              checkpointDetails={checkpointDetails}
            />
          </div>
        </div>
      </div>

      {/* Training vs Validation Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ValidationChart 
          steps={checkpointDetails.steps}
          lossData={checkpointDetails.loss_curve}
          validationData={checkpointDetails.validation_curve}
        />
        <CodebookUsageChart 
          steps={checkpointDetails.steps}
          codebookData={checkpointDetails.codebook_usage}
        />
      </div>

      <BailandoSpecificAnalysis />

      {/* NEW: Problems & Solutions Analysis */}
      <ProblemsAndSolutionsAnalysis 
        checkpointDetails={checkpointDetails}
        checkpoint={checkpoint}
      />

      {/* Training Statistics Summary */}
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

      {/* NEW: Analysis Notes & Recommendations */}
      <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 p-6 rounded-lg border border-blue-700">
        <h5 className="text-lg font-semibold text-white mb-4">📋 Key Analysis Notes</h5>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-gray-800 p-4 rounded-lg">
            <h6 className="font-medium text-blue-300 mb-2">Learning Rate Guidance</h6>
            <ul className="text-gray-300 space-y-1 text-xs">
              <li>• If spikes occur: Reduce LR by 50%</li>
              <li>• If too slow: Increase by 20-30%</li>
              <li>• Use cosine annealing for stability</li>
              <li>• Monitor gradient magnitude</li>
            </ul>
          </div>
          
          <div className="bg-gray-800 p-4 rounded-lg">
            <h6 className="font-medium text-green-300 mb-2">Bias-Variance Balance</h6>
            <ul className="text-gray-300 space-y-1 text-xs">
              <li>• High bias = too simple model</li>
              <li>• High variance = overfitting</li>
              <li>• Target ratio: 0.5-2.0</li>
              <li>• Use regularization if needed</li>
            </ul>
          </div>
          
          <div className="bg-gray-800 p-4 rounded-lg">
            <h6 className="font-medium text-purple-300 mb-2">Optimizer Selection</h6>
            <ul className="text-gray-300 space-y-1 text-xs">
              <li>• Adam: Good for most cases</li>
              <li>• AdamW: Better regularization</li>
              <li>• SGD+Momentum: More stable</li>
              <li>• Use gradient clipping always</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-yellow-900/30 rounded-lg border border-yellow-600">
          <h6 className="font-medium text-yellow-300 mb-2">🚨 Current Recommendations Based on Your Data:</h6>
          <div className="text-sm text-gray-300 space-y-2">
            {checkpoint?.loss > 500 && (
              <p>• <strong>Critical:</strong> Use emergency config immediately - current loss too high for stable training</p>
            )}
            {checkpointDetails?.metrics?.total_params > 15000000 && (
              <p>• <strong>Model Size:</strong> Switch to stable config (13M params) for better CPU performance</p>
            )}
            <p>• <strong>Learning Rate:</strong> Current configuration shows {
              checkpointDetails?.lr_curve?.[0] > 5e-5 ? 'aggressive' : 'conservative'
            } learning rate - adjust based on stability</p>
            <p>• <strong>Paper Alignment:</strong> {
              checkpointDetails?.paper_alignment_score > 0.8 ? 'Good' : 'Consider adjusting hyperparameters'
            } alignment with CVPR 2022 paper</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainingAnalysis;