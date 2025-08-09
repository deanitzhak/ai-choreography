import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, ArrowRight, CheckCircle, Clock, Brain, Cpu, Zap, Code, Copy, Check } from 'lucide-react';

// Import the code reference JSON (in real app: import codeReference from './codeReference.json')
import codeReference from './codeReference.json';

const TrainingStagesSection = () => {
  const [activeStage, setActiveStage] = useState(1);
  const [activeCodeExample, setActiveCodeExample] = useState('stage_1_training');
  const [copied, setCopied] = useState('');

  // Get stage-specific code examples from JSON
  const getStageCodeExamples = (stage) => {
    return Object.entries(codeReference.code_examples)
      .filter(([key, example]) => example.stage_relevance.includes(stage))
      .map(([key, example]) => ({ key, ...example }));
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(activeCodeExample);
      setTimeout(() => setCopied(''), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Real training configuration from your system (now using JSON data)
  const stages = [
    {
      id: 1,
      name: 'VQ-VAE Training',
      description: 'Learn choreographic memory by encoding dance moves into discrete codes',
      component: 'Vector Quantized Variational AutoEncoder',
      ...codeReference.training_progression.stage_1,
      purpose: 'Motion Compression & Discrete Representation',
      icon: Brain,
      color: 'blue',
      architecture: {
        'Encoder': 'Motion [240,72] → Latent [240,256]',
        'Vector Quantizer': 'Latent → Discrete Codes [240,1024]',
        'Decoder': 'Codes → Reconstructed Motion [240,72]',
        'Codebook Size': '1,024 discrete dance tokens'
      },
      trainedLayers: {
        'VQ-VAE Encoder': 'Linear(72→512) + Linear(512→256) + Linear(256→256)',
        'Vector Quantizer': 'Embedding(1024, 256) - Codebook learning',
        'VQ-VAE Decoder': 'Linear(256→256) + Linear(256→512) + Linear(512→72)',
        'Total Parameters': codeReference.training_progression.stage_1.total_parameters
      },
      frozenLayers: {
        'GPT': 'Not initialized in Stage 1',
        'Critic': 'Not initialized in Stage 1'
      },
      metrics: codeReference.training_progression.stage_1.success_metrics
    },
    {
      id: 2,
      name: 'GPT Training',
      description: 'Learn to predict next dance moves using transformer architecture',
      component: 'Generative Pre-trained Transformer',
      ...codeReference.training_progression.stage_2,
      purpose: 'Sequence Generation & Music Conditioning',
      icon: Cpu,
      color: 'green',
      architecture: {
        'Input': 'VQ Codes [batch, seq_len-1]',
        'Transformer': '12 layers, 8 heads, 512 embed_dim',
        'Output': 'Next token probabilities [batch, seq_len-1, 1024]',
        'Music Conditioning': 'Optional music features integration'
      },
      trainedLayers: {
        'Token Embedding': 'Embedding(1024, 512) - Learn token representations',
        'Position Embedding': 'Parameter(1024, 512) - Positional encoding',
        'Transformer Layers': '12 × TransformerDecoderLayer (self-attention + FFN)',
        'Output Projection': 'Linear(512, 1024) - Vocabulary prediction',
        'Total Parameters': codeReference.training_progression.stage_2.total_parameters
      },
      frozenLayers: {
        'VQ-VAE': 'Entire VQ-VAE frozen - used only for code generation',
        'Critic': 'Not initialized in Stage 2'
      },
      metrics: codeReference.training_progression.stage_2.success_metrics
    },
    {
      id: 3,
      name: 'Actor-Critic Training',
      description: 'Fine-tune with reinforcement learning for better dance quality',
      component: 'Actor-Critic Reinforcement Learning',
      ...codeReference.training_progression.stage_3,
      purpose: 'Quality Refinement & Music Synchronization',
      icon: Zap,
      color: 'purple',
      architecture: {
        'Actor': 'Policy network π(a|s) for action selection',
        'Critic': 'Value network V(s) for state evaluation',
        'Advantage': 'A(s,a) = Q(s,a) - V(s)',
        'Rewards': 'Beat alignment + motion quality scores'
      },
      trainedLayers: {
        'GPT (Actor)': 'Fine-tune transformer layers for policy generation',
        'Critic Network': 'Linear(512→256) + Linear(256→1) - NEW component',
        'Actor Parameters': '~60M parameters (fine-tuning)',
        'Critic Parameters': codeReference.training_progression.stage_3.total_parameters.split(' + ')[1]
      },
      frozenLayers: {
        'VQ-VAE': 'Entire VQ-VAE remains frozen',
        'GPT Embeddings': 'Token & position embeddings frozen'
      },
      metrics: codeReference.training_progression.stage_3.success_metrics
    }
  ];

  const currentStage = stages.find(s => s.id === activeStage);

  return (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-600 max-w-6xl">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <Play className="w-6 h-6 text-blue-400" />
        <h3 className="text-xl font-bold text-white">3-Stage Training Pipeline</h3>
        <div className="text-sm text-gray-400 bg-gray-700 px-3 py-1 rounded">
          Based on CVPR 2022 Bailando Paper
        </div>
      </div>

      {/* Stage Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {stages.map((stage, index) => (
            <React.Fragment key={stage.id}>
              <motion.button
                onClick={() => setActiveStage(stage.id)}
                className={`flex-1 p-4 rounded-lg border-2 transition-all text-center ${
                  activeStage === stage.id
                    ? `border-${stage.color}-500 bg-${stage.color}-900`
                    : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-center mb-2">
                  <stage.icon className={`w-6 h-6 ${
                    activeStage === stage.id ? `text-${stage.color}-400` : 'text-gray-400'
                  }`} />
                </div>
                <div className="text-sm font-semibold text-white">Stage {stage.id}</div>
                <div className="text-xs text-gray-400">{stage.name}</div>
                <div className="text-xs text-blue-300 mt-1">{stage.epochs} epochs</div>
              </motion.button>
              {index < stages.length - 1 && (
                <div className="mx-3">
                  <ArrowRight className={`w-6 h-6 ${
                    activeStage > stage.id ? 'text-blue-400' : 'text-gray-500'
                  }`} />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Active Stage Details */}
      <motion.div
        key={activeStage}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-gray-900 p-6 rounded-lg border border-gray-700"
      >
        {/* Stage Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 bg-gradient-to-br from-${currentStage.color}-500 to-${currentStage.color}-600 rounded-xl flex items-center justify-center`}>
              <currentStage.icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="text-2xl font-bold text-white">
                Stage {currentStage.id}: {currentStage.name}
              </h4>
              <p className="text-gray-400">{currentStage.description}</p>
              <div className="flex items-center space-x-4 mt-2 text-sm">
                <span className="text-blue-400">
                  <Clock className="w-4 h-4 inline mr-1" />
                  {currentStage.duration}
                </span>
                <span className="text-green-400">
                  {currentStage.duration.split(' ')[0]}
                </span>
                <span className="text-purple-400">
                  LR: {currentStage.learning_rate}
                </span>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className={`text-${currentStage.color}-400 font-semibold text-sm`}>
              {currentStage.component}
            </div>
            <div className="text-gray-400 text-xs mt-1">
              {currentStage.purpose}
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Code Examples from JSON */}
          <div>
            <h5 className="text-lg font-semibold text-white mb-3 flex items-center">
              <Code className="w-5 h-5 mr-2 text-blue-400" />
              Stage {currentStage.id} Code Examples
            </h5>
            
            {/* Code Example Selector */}
            <div className="mb-3">
              <select
                value={activeCodeExample}
                onChange={(e) => setActiveCodeExample(e.target.value)}
                className="w-full bg-gray-700 text-white px-3 py-2 rounded text-sm border border-gray-600"
              >
                {getStageCodeExamples(currentStage.id).map((example) => (
                  <option key={example.key} value={example.key}>
                    {example.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Active Code Example */}
            {codeReference.code_examples[activeCodeExample] && (
              <motion.div
                key={activeCodeExample}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-blue-400 text-sm font-semibold">
                    {codeReference.code_examples[activeCodeExample].file}
                  </span>
                  <button
                    onClick={() => copyToClipboard(codeReference.code_examples[activeCodeExample].code)}
                    className="flex items-center space-x-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs transition-colors"
                  >
                    {copied === activeCodeExample ? (
                      <Check className="w-3 h-3 text-green-400" />
                    ) : (
                      <Copy className="w-3 h-3 text-gray-400" />
                    )}
                    <span className="text-white">
                      {copied === activeCodeExample ? 'Copied!' : 'Copy'}
                    </span>
                  </button>
                </div>
                
                <pre className="bg-black p-4 rounded-lg overflow-x-auto text-sm border border-gray-600 max-h-80">
                  <code className="text-green-400">
                    {codeReference.code_examples[activeCodeExample].code}
                  </code>
                </pre>
                
                <div className="mt-2 text-xs text-gray-400">
                  {codeReference.code_examples[activeCodeExample].explanation}
                </div>
              </motion.div>
            )}
          </div>

          {/* Architecture & Layers */}
          <div className="space-y-4">
            {/* Architecture */}
            <div>
              <h5 className="text-lg font-semibold text-white mb-3 flex items-center">
                <span className="w-2 h-2 bg-purple-400 rounded-full mr-2"></span>
                Architecture Details
              </h5>
              <div className="bg-gray-800 p-4 rounded-lg space-y-2">
                {Object.entries(currentStage.architecture).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-gray-400">{key}:</span>
                    <span className="text-white font-mono text-xs">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Trained Layers */}
            <div>
              <h5 className="text-lg font-semibold text-green-400 mb-3 flex items-center">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                Trained Layers (Stage {currentStage.id})
              </h5>
              <div className="bg-gray-800 p-4 rounded-lg space-y-2">
                {Object.entries(currentStage.trainedLayers).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-green-400 font-semibold">{key}:</span>
                    <span className="text-white font-mono text-xs">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Frozen Layers */}
            <div>
              <h5 className="text-lg font-semibold text-red-400 mb-3 flex items-center">
                <span className="w-2 h-2 bg-red-400 rounded-full mr-2"></span>
                Frozen Layers
              </h5>
              <div className="bg-gray-800 p-4 rounded-lg space-y-2">
                {Object.entries(currentStage.frozenLayers).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-red-400">{key}:</span>
                    <span className="text-gray-400 font-mono text-xs">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Metrics */}
            <div>
              <h5 className="text-lg font-semibold text-yellow-400 mb-3 flex items-center">
                <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>
                Success Metrics
              </h5>
              <div className="bg-gray-800 p-4 rounded-lg space-y-2">
                {Object.entries(currentStage.metrics).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-gray-400">{key}:</span>
                    <span className="text-green-400 font-semibold">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Training Commands from JSON */}
        <div className="mt-6 bg-gray-800 p-4 rounded-lg">
          <h5 className="text-lg font-semibold text-white mb-3 flex items-center">
            <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
            Training Commands (from JSON)
          </h5>
          <div className="bg-black p-3 rounded text-sm font-mono space-y-2">
            <div className="text-blue-400"># Start Stage {currentStage.id} Training</div>
            <div className="text-green-400">
              {codeReference.commands[`stage_${currentStage.id}`]}
            </div>
            
            <div className="text-blue-400 mt-2"># Resume from Latest Checkpoint</div>
            <div className="text-green-400">
              {codeReference.commands.resume_latest.replace('{STAGE}', currentStage.id)}
            </div>
            
            <div className="text-blue-400 mt-2"># Monitor Training Progress</div>
            <div className="text-green-400">
              {codeReference.commands.analyze_checkpoint.replace('{STAGE}', currentStage.id)}
            </div>
            
            {/* Layer Training Info from JSON */}
            <div className="text-blue-400 mt-3"># Layer Configuration</div>
            <div className="text-yellow-400 text-xs">
              Trained: {codeReference.training_progression[`stage_${currentStage.id}`].trained_layers.slice(0, 3).join(', ')}...
            </div>
            <div className="text-red-400 text-xs">
              Frozen: {codeReference.training_progression[`stage_${currentStage.id}`].frozen_layers.join(', ') || 'None'}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-6 pt-4 border-t border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">
              Stage {activeStage} of {stages.length} • {currentStage.duration} • {Object.keys(getStageCodeExamples(activeStage)).length} code examples
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveStage(Math.max(1, activeStage - 1))}
                disabled={activeStage === 1}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white text-sm transition-colors"
              >
                ← Previous Stage
              </button>
              <button
                onClick={() => setActiveStage(Math.min(3, activeStage + 1))}
                disabled={activeStage === 3}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white text-sm transition-colors"
              >
                Next Stage →
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Overall Training Summary */}
      <div className="mt-6 bg-gradient-to-r from-blue-900 to-purple-900 p-4 rounded-lg border border-blue-700">
        <h4 className="text-white font-semibold mb-2">📊 Complete Training Pipeline</h4>
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-400">180</div>
            <div className="text-sm text-blue-300">Total Epochs</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-400">~12hrs</div>
            <div className="text-sm text-green-300">Training Time</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-400">3</div>
            <div className="text-sm text-purple-300">Training Stages</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-400">63M</div>
            <div className="text-sm text-yellow-300">Parameters</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainingStagesSection;