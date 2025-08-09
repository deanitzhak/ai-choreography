import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';

const LossPointSystem = () => {
  const [currentLoss, setCurrentLoss] = useState(127.34);

    // Point system based on your actual training data
  const getPointSystemInfo = (loss) => {
    if (loss <= 30) {
      return {
        status : 'excellent',
        points : 100,
        color  : '#10B981',
        icon   : CheckCircle,
        message: 'Paper target achieved! Training converged.',
        action : 'Continue to Stage 2 (GPT)'
      };
    } else if (loss <= 100) {
      return {
        status : 'good',
        points : 75,
        color  : '#3B82F6',
        icon   : TrendingDown,
        message: 'Stable training, making progress.',
        action : 'Continue current configuration'
      };
    } else if (loss <= 500) {
      return {
        status : 'warning',
        points : 25,
        color  : '#F59E0B',
        icon   : TrendingUp,
        message: 'High loss detected. Monitor closely.',
        action : 'Consider reducing learning rate'
      };
    } else {
      return {
        status : 'critical',
        points : -50,
        color  : '#EF4444',
        icon   : AlertTriangle,
        message: 'LOSS EXPLOSION! Stop training immediately.',
        action : 'Apply stable config: bailando_config_stable.yaml'
      };
    }
  };

  const pointInfo = getPointSystemInfo(currentLoss);
  const Icon      = pointInfo.icon;

    // GPT Cross-Entropy explanation
  const gptCrossEntropyInfo = {
    title      : 'GPT Cross-Entropy in Our System',
    formula    : 'L_GPT = -∑ log P(z_t|z_{<t}, music)',
    explanation: [
      '• z_t: Dance code at time t (from VQ-VAE codebook)',
      '• z_{<t}: Previous dance codes (temporal context)',
      '• music: Music features (438-dim MFCC, chromagram)',
      '• P(): Probability from transformer softmax over 1024 codes'
    ],
    implementation: `# From your GPTModel.forward()
logits = self.output_projection(x)  # [B, T, 1024]
loss   = F.cross_entropy(logits.view(-1, 1024), targets.view(-1))`,
    purpose: 'Trains GPT to predict next dance move given music + previous moves'
  };

  return (
    <div className = "bg-gray-800 p-4 rounded-lg border border-gray-600 max-w-3xl">
      {/* Current Loss Display */}
      <div className = "mb-6">
      <h3  className = "text-lg font-bold text-white mb-4">📊 Loss Point System</h3>
        
        <div className = "bg-gray-700 p-4 rounded-lg mb-4">
        <div className = "flex items-center justify-between mb-3">
            <div>
              <label className = "text-sm text-gray-400 block mb-1">Current Loss:</label>
              <input
                type      = "number"
                value     = {currentLoss}
                onChange  = {(e) => setCurrentLoss(parseFloat(e.target.value) || 0)}
                className = "bg-gray-900 border border-gray-600 rounded px-3 py-1 text-white w-24"
                step      = "0.01"
              />
            </div>
            
            <motion.div
              className  = "flex items-center space-x-3 p-3 rounded-lg"
              style      = {{ backgroundColor: pointInfo.color + '20', border: `1px solid ${pointInfo.color}` }}
              animate    = {{ scale: currentLoss > 500 ? [1, 1.05, 1] : 1 }}
              transition = {{ repeat: currentLoss > 500 ? Infinity : 0, duration: 1 }}
            >
              <Icon className = "w-6 h-6" style = {{ color: pointInfo.color }} />
              <div>
                <div className = "text-white font-bold">{pointInfo.points} Points</div>
                <div className = "text-sm" style = {{ color: pointInfo.color }}>
                  {pointInfo.status.toUpperCase()}
                </div>
              </div>
            </motion.div>
          </div>
          
          <div className = "space-y-2">
          <p   className = "text-white text-sm">{pointInfo.message}</p>
          <p   className = "text-blue-300 text-sm font-semibold">
              → {pointInfo.action}
            </p>
          </div>
        </div>

        {/* Point Scale Visualization */}
        <div className = "bg-gray-900 p-3 rounded">
        <div className = "text-sm text-gray-400 mb-2">Point Scale:</div>
        <div className = "grid grid-cols-4 gap-2 text-xs">
        <div className = "bg-green-900 p-2 rounded text-center">
        <div className = "text-green-400 font-bold">+100</div>
        <div className = "text-gray-300">≤30</div>
        <div className = "text-gray-400">Perfect</div>
            </div>
            <div className = "bg-blue-900 p-2 rounded text-center">
            <div className = "text-blue-400 font-bold">+75</div>
            <div className = "text-gray-300">30-100</div>
            <div className = "text-gray-400">Good</div>
            </div>
            <div className = "bg-yellow-900 p-2 rounded text-center">
            <div className = "text-yellow-400 font-bold">+25</div>
            <div className = "text-gray-300">100-500</div>
            <div className = "text-gray-400">Warning</div>
            </div>
            <div className = "bg-red-900 p-2 rounded text-center">
            <div className = "text-red-400 font-bold">-50</div>
            <div className = "text-gray-300">&lt;500</div>
            <div className = "text-gray-400">Critical</div>
            </div>
          </div>
        </div>
      </div>

      {/* GPT Cross-Entropy Explanation */}
      <div className = "bg-gray-700 p-4 rounded-lg">
      <h4  className = "text-white font-semibold mb-3 flex items-center space-x-2">
          <span>🤖</span>
          <span>{gptCrossEntropyInfo.title}</span>
        </h4>
        
        <div className = "space-y-3">
          {/* Formula */}
          <div  className = "bg-gray-900 p-3 rounded border border-gray-600">
          <code className = "text-blue-300 font-mono text-sm">
              {gptCrossEntropyInfo.formula}
            </code>
          </div>
          
          {/* Explanation */}
          <div className = "text-sm text-gray-300">
          <div className = "mb-2 text-gray-400">Where:</div>
            {gptCrossEntropyInfo.explanation.map((item, idx) => (
              <div key = {idx} className = "text-gray-300 mb-1">{item}</div>
            ))}
          </div>
          
          {/* Implementation */}
          <div>
            <div  className = "text-sm text-gray-400 mb-2">From your code:</div>
            <div  className = "bg-gray-900 p-3 rounded border border-gray-600">
            <code className = "text-green-400 font-mono text-xs whitespace-pre-wrap">
                {gptCrossEntropyInfo.implementation}
              </code>
            </div>
          </div>
          
          {/* Purpose */}
          <div className = "bg-blue-900 bg-opacity-30 p-3 rounded border border-blue-600">
          <div className = "text-blue-300 text-sm font-semibold mb-1">Purpose:</div>
          <div className = "text-blue-200 text-sm">{gptCrossEntropyInfo.purpose}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LossPointSystem;