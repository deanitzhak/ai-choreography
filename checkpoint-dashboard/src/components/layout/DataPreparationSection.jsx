import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Database, FileText, Code, CheckCircle, AlertTriangle, Folder, File, ArrowRight } from 'lucide-react';

const DataPreparationSection = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [showFileDetails, setShowFileDetails] = useState(false);

  // Real data from your training system
  const preparationSteps = [
    {
      id: 'scanning',
      title: 'File Scanning',
      status: 'completed',
      description: 'Scan AIST++ dataset for motion files',
      code: `# File scanning from dataset_builder.py
motion_dir = self.data_path / config['data'].get('motion_dir', 'motions')
motion_files = list(motion_dir.glob("*.pkl"))

if self.max_files:
    motion_files = motion_files[:self.max_files]
    
print(f"🔍 Found {len(motion_files)} motion files to process")`,
      output: '🔍 Found 500 motion files to process'
    },
    {
      id: 'loading',
      title: 'SMPL Data Loading',
      status: 'completed', 
      description: 'Load pickle files containing SMPL pose data',
      code: `# Loading SMPL data from dataset_builder.py
with open(motion_file, 'rb') as f:
    motion_data = pickle.load(f)

# AIST++ format has 'smpl_poses' key
if isinstance(motion_data, dict) and 'smpl_poses' in motion_data:
    poses = motion_data['smpl_poses']`,
      output: "✅ Dict keys: ['smpl_loss', 'smpl_poses', 'smpl_scaling', 'smpl_trans']"
    },
    {
      id: 'processing',
      title: 'Motion Processing',
      status: 'completed',
      description: 'Convert object arrays to numerical tensors',
      code: `# Processing from _process_motion_data()
if poses.dtype == 'object':
    pose_list = []
    for pose_frame in poses:
        frame_array = np.array(pose_frame, dtype=np.float32)
        if frame_array.ndim == 1 and len(frame_array) >= 72:
            pose_list.append(frame_array[:72])
    
    if pose_list:
        stacked_poses = np.vstack(pose_list)
        return torch.FloatTensor(stacked_poses)`,
      output: '✅ Converted to tensor shape: [240, 72]'
    },
    {
      id: 'sequencing',
      title: 'Sequence Standardization',
      status: 'completed',
      description: 'Ensure all sequences are exactly 240 frames (8 seconds @ 30fps)',
      code: `# Sequence length standardization
if motion_tensor.size(0) > self.sequence_length:
    # Randomly crop to sequence length
    start_idx = torch.randint(0, motion_tensor.size(0) - self.sequence_length + 1, (1,)).item()
    motion_tensor = motion_tensor[start_idx:start_idx + self.sequence_length]
    
elif motion_tensor.size(0) < self.sequence_length:
    # Pad with zeros
    padding = self.sequence_length - motion_tensor.size(0)
    motion_tensor = torch.cat([motion_tensor, torch.zeros(padding, motion_tensor.size(1))], dim=0)`,
      output: '✅ Standardized to: [240, 72] (8 seconds @ 30fps)'
    },
    {
      id: 'batching',
      title: 'DataLoader Creation',
      status: 'completed',
      description: 'Create PyTorch DataLoader for batch training',
      code: `# DataLoader creation from train_bailando.py
data_loader = torch.utils.data.DataLoader(
    dataset, 
    batch_size=config['training']['batch_size'],
    shuffle=True,
    num_workers=0,  # CPU training optimization
    pin_memory=False,
    drop_last=False
)

print(f"📊 DataLoader created: {len(data_loader)} batches")`,
      output: '📊 DataLoader created: 63 batches'
    }
  ];

  const dataFlowSteps = [
    { 
      label: 'Raw .pkl Files', 
      format: 'AIST++ Motion', 
      size: '1,408 files'
    },
    { 
      label: 'SMPL Poses', 
      format: 'Object Arrays', 
      size: 'Variable length'
    },
    { 
      label: 'Tensors', 
      format: '[frames, 72]', 
      size: 'Float32'
    },
    { 
      label: 'Sequences', 
      format: '[240, 72]', 
      size: '8 seconds @ 30fps'
    },
    { 
      label: 'Batches', 
      format: '[8, 240, 72]', 
      size: 'Ready for training'
    }
  ];

  const currentStep = preparationSteps[activeStep];

  return (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-600 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Database className="w-6 h-6 text-blue-400" />
          <h3 className="text-xl font-bold text-white">Data Preparation Pipeline</h3>
        </div>
        <button
          onClick={() => setShowFileDetails(!showFileDetails)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm transition-colors"
        >
          {showFileDetails ? 'Hide' : 'Show'} File Details
        </button>
      </div>

      {/* Clean Data Flow Visualization */}
      <div className="mb-8">
        <h4 className="text-lg font-semibold text-white mb-4">📊 Data Transformation Flow</h4>
        <div className="flex items-center justify-between bg-gray-700 p-6 rounded-lg">
          {dataFlowSteps.map((step, index) => (
            <React.Fragment key={step.label}>
              <motion.div 
                className="text-center cursor-pointer"
                onClick={() => setActiveStep(Math.min(index, preparationSteps.length - 1))}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className={`w-20 h-20 rounded-xl flex items-center justify-center mb-3 transition-all duration-300 ${
                  index <= activeStep 
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg' 
                    : 'bg-gray-600 hover:bg-gray-500'
                }`}>
                  <span className="text-white font-bold text-lg">{index + 1}</span>
                </div>
                <div className="text-sm font-semibold text-white mb-1">{step.label}</div>
                <div className="text-xs text-gray-400">{step.format}</div>
                <div className="text-xs text-blue-300 font-medium">{step.size}</div>
              </motion.div>
              {index < dataFlowSteps.length - 1 && (
                <div className="flex-1 mx-4">
                  <ArrowRight className={`w-6 h-6 mx-auto transition-colors ${
                    index < activeStep ? 'text-blue-400' : 'text-gray-500'
                  }`} />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* AIST++ File Details (Collapsible) */}
      {showFileDetails && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-8 bg-gray-900 rounded-lg border border-gray-700 overflow-hidden"
        >
          <div className="p-6">
            <div className="flex items-center mb-4">
              <Folder className="w-5 h-5 text-blue-400 mr-2" />
              <h4 className="text-lg font-semibold text-white">AIST++ Dataset Structure</h4>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* PKL File Contents */}
              <div className="bg-gray-800 p-4 rounded-lg">
                <h5 className="text-md font-semibold text-blue-400 mb-3">📄 PKL File Contents</h5>
                <div className="space-y-3">
                  {[
                    { key: 'smpl_poses', desc: 'Joint rotations (24×3=72 params)', icon: '🏃' },
                    { key: 'smpl_trans', desc: 'Global position (x,y,z)', icon: '📍' },
                    { key: 'smpl_scaling', desc: 'Body size factor', icon: '📏' },
                    { key: 'smpl_loss', desc: 'Fitting error metrics', icon: '📊' }
                  ].map((item) => (
                    <div key={item.key} className="flex items-center p-2 bg-gray-700 rounded">
                      <span className="text-lg mr-3">{item.icon}</span>
                      <div className="flex-1">
                        <span className="font-mono text-blue-300 text-sm">{item.key}</span>
                        <div className="text-xs text-gray-400">{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sample Files */}
              <div className="bg-gray-800 p-4 rounded-lg">
                <h5 className="text-md font-semibold text-green-400 mb-3">🎵 Sample Dance Files</h5>
                <div className="space-y-3">
                  {[
                    { style: 'Hip-hop', file: 'gKR_sBM_cAll_d28_mKR3_ch07.pkl', emoji: '🎤' },
                    { style: 'Jazz', file: 'gJA_sBM_cAll_d14_mJA2_ch05.pkl', emoji: '🎷' },
                    { style: 'Ballet', file: 'gBA_sBM_cAll_d21_mBA1_ch03.pkl', emoji: '🩰' },
                    { style: 'Break', file: 'gBR_sBM_cAll_d09_mBR4_ch02.pkl', emoji: '💃' }
                  ].map((item) => (
                    <div key={item.style} className="flex items-center p-2 bg-gray-700 rounded">
                      <span className="text-lg mr-3">{item.emoji}</span>
                      <div className="flex-1">
                        <span className="font-semibold text-green-300 text-sm">{item.style}</span>
                        <div className="text-xs text-gray-400 font-mono">{item.file}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Step Navigation */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {preparationSteps.map((step, index) => (
          <button
            key={step.id}
            onClick={() => setActiveStep(index)}
            className={`p-4 rounded-lg border-2 text-center transition-all ${
              activeStep === index
                ? 'border-blue-500 bg-blue-900 shadow-lg'
                : 'border-gray-600 bg-gray-700 hover:border-gray-500 hover:bg-gray-600'
            }`}
          >
            <div className="flex items-center justify-center mb-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div className="text-sm font-semibold text-white">{step.title}</div>
            <div className="text-xs text-gray-400 mt-1 leading-tight">{step.description}</div>
          </button>
        ))}
      </div>

      {/* Active Step Details */}
      <motion.div
        key={activeStep}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-gray-900 p-6 rounded-lg border border-gray-700"
      >
        {/* Step Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">{activeStep + 1}</span>
            </div>
            <div>
              <h4 className="text-xl font-semibold text-white">{currentStep.title}</h4>
              <p className="text-gray-400">{currentStep.description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-green-400 text-sm font-semibold">Completed</span>
          </div>
        </div>

        {/* Code Block */}
        <div className="mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <Code className="w-4 h-4 text-blue-400" />
            <span className="text-blue-400 font-semibold">Implementation Code</span>
            <span className="text-xs text-gray-500 bg-gray-700 px-2 py-1 rounded">Python</span>
          </div>
          <pre className="bg-black p-4 rounded-lg overflow-x-auto text-sm border border-gray-600">
            <code className="text-green-400">{currentStep.code}</code>
          </pre>
        </div>

        {/* Output */}
        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-3">
            <FileText className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-400 font-semibold">Training Output</span>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg border-l-4 border-yellow-400">
            <code className="text-yellow-300">{currentStep.output}</code>
          </div>
        </div>

        {/* Navigation */}
        <div className="pt-4 border-t border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">
              Step {activeStep + 1} of {preparationSteps.length}
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
                disabled={activeStep === 0}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white text-sm transition-colors"
              >
                ← Previous
              </button>
              <button
                onClick={() => setActiveStep(Math.min(preparationSteps.length - 1, activeStep + 1))}
                disabled={activeStep === preparationSteps.length - 1}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white text-sm transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Key Statistics */}
      <div className="mt-8 grid grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-900 to-blue-800 p-4 rounded-lg text-center border border-blue-700">
          <div className="text-3xl font-bold text-blue-400">500</div>
          <div className="text-sm text-blue-300">Motion Files</div>
        </div>
        <div className="bg-gradient-to-br from-green-900 to-green-800 p-4 rounded-lg text-center border border-green-700">
          <div className="text-3xl font-bold text-green-400">240</div>
          <div className="text-sm text-green-300">Frames per Sequence</div>
        </div>
        <div className="bg-gradient-to-br from-purple-900 to-purple-800 p-4 rounded-lg text-center border border-purple-700">
          <div className="text-3xl font-bold text-purple-400">72</div>
          <div className="text-sm text-purple-300">SMPL Parameters</div>
        </div>
        <div className="bg-gradient-to-br from-yellow-900 to-yellow-800 p-4 rounded-lg text-center border border-yellow-700">
          <div className="text-3xl font-bold text-yellow-400">63</div>
          <div className="text-sm text-yellow-300">Training Batches</div>
        </div>
      </div>
    </div>
  );
};

export default DataPreparationSection;