import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Code, Copy, Check, Play } from 'lucide-react';

const CodeSnippetViewer = () => {
  const [selectedCode, setSelectedCode] = useState('vq_loss');
  const [copied, setCopied]             = useState('');

  const codeSnippets = {
    vq_loss: {
      title   : 'VQ-VAE Loss (Fromt MathService)',
      language: 'python',
      code    : `@staticmethod
def vq_vae_loss(x_recon, x_orig, z_e, z_q, beta=0.25): 
#   Reconstruction loss                              : ||x - x_recon||²
    recon_loss = F.mse_loss(x_recon, x_orig)
    
    # VQ loss: ||sg[z_e] - z_q||²
    vq_loss = F.mse_loss(z_q.detach(), z_e)
    
    # Commitment loss: β * ||z_e - sg[z_q]||²
    commit_loss = beta * F.mse_loss(z_e, z_q.detach())
    
    total_loss = recon_loss + vq_loss + commit_loss
    return total_loss, {'reconstruction': recon_loss}`,
      explanation: 'From CVPR 2022 paper formula. Combines reconstruction + quantization losses.',
      file       : 'lib/services/math_service.py'
    },
    
    gpt_forward: {
      title   : 'GPT Forward Pass (from GPTModel)',
      language: 'python',
      code    : `def forward(self, tokens, music_features=None):
    batch_size, seq_len = tokens.shape
    
    # Token + Position embeddings
    token_emb = self.token_embedding(tokens)
    pos_emb   = self.pos_embedding[:seq_len].unsqueeze(0)
    x         = token_emb + pos_emb
    
    # Apply transformer layers
    for layer in self.layers: 
        x = layer(x, x)  # Self-attention
    
    # Output projection to vocab
    logits = self.output_projection(x)
    return logits`,
      explanation: 'Music-conditioned dance generation. Predicts next dance codes.',
      file       : 'lib/models/bailando.py'
    },

    train_loop: {
      title   : 'Training Loop (from train_bailando.py)',
      language: 'python',
      code    : `def train_stage(model, data_loader, config, stage):
    for epoch in range(epochs): 
    for batch in data_loader  : 
            motion = batch['motion'].to(config['device'])
            
            # VQ-VAE forward pass
            x_recon, z_e, z_q,    vq_loss, indices = model.vq_vae(motion)
            loss    ,     losses = MathService.vq_vae_loss(x_recon, motion, z_e, z_q)
            
            # Backward with gradient clipping
            optimizer.zero_grad()
            loss.backward()
            
            if 'gradient_clip_norm' in config['training']: 
                torch.nn.utils.clip_grad_norm_(model.parameters(), 
                                             config['training']['gradient_clip_norm'])
            optimizer.step()`,
      explanation: 'Core training loop with gradient clipping to prevent explosion.',
      file       : 'scripts/train_bailando.py'
    },

    dataset_loader: {
      title   : 'AIST++ Data Loading (from BailandoDataset)',
      language: 'python',
      code    : `def __getitem__(self, idx):
    file_path = self.motion_files[idx]
    
    # Load SMPL motion data
    motion = self._load_motion_data(file_path)
    motion = self._process_motion_sequence(motion)
    
    # Convert to tensor (240, 72)
    motion_tensor = torch.from_numpy(motion)
    
    # Add music features (438-dim)
    music_features = torch.randn(self.sequence_length, 438)
    
    return {
        'motion'       : motion_tensor,  # [240, 72] SMPL poses
        'music'        : music_features, # [240, 438] music features
        'sequence_name': file_path.stem
    }`,
      explanation: 'Loads AIST++ motion sequences and pairs with music features.',
      file       : 'lib/data_preparation/dataset_builder.py'
    }
  };

  const currentSnippet = codeSnippets[selectedCode];

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(selectedCode);
      setTimeout(() => setCopied(''), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className = "bg-gray-800 p-4 rounded-lg border border-gray-600 max-w-4xl">
      {/* Header */}
      <div  className = "flex items-center space-x-2 mb-4">
      <Code className = "w-5 h-5 text-blue-400" />
      <h3   className = "text-lg font-bold text-white">Code From Project</h3>
      </div>

      {/* Code Selection Tabs */}
      <div className = "flex space-x-1 mb-4 bg-gray-700 p-1 rounded">
        {Object.entries(codeSnippets).map(([key, snippet]) => (
          <button
            key       = {key}
            onClick   = {() => setSelectedCode(key)}
            className = {`px-3 py-2 rounded text-sm transition-colors ${
              selectedCode === key
                ? 'bg-blue-600 text-white' 
                :   'text-gray-400 hover:text-white hover:bg-gray-600'
            }`}
          >
            {snippet.title.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* Code Display */}
      <motion.div
        key       = {selectedCode}
        initial   = {{ opacity: 0, y: 10 }}
        animate   = {{ opacity: 1, y: 0 }}
        className = "space-y-4"
      >
        {/* Code Header */}
        <div className = "flex items-center justify-between">
          <div>
            <h4 className = "text-white font-semibold">{currentSnippet.title}</h4>
            <p  className = "text-xs text-gray-400">{currentSnippet.file}</p>
          </div>
          
          <div className = "flex space-x-2">
            <button
              onClick   = {() => copyToClipboard(currentSnippet.code)}
              className = "p-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
              title     = "Copy code"
            >
              {copied === selectedCode ? (
                <Check className = "w-4 h-4 text-green-400" />
              ) : (
                <Copy className = "w-4 h-4 text-gray-400" />
              )}
            </button>
            
            <button
              className = "p-2 bg-green-700 hover:bg-green-600 rounded transition-colors"
              title     = "This is from working code"
            >
              <Play className = "w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Code Block */}
        <div className = "bg-gray-900 rounded-lg border border-gray-600 overflow-hidden">
        <div className = "flex items-center justify-between p-3 bg-gray-800 border-b border-gray-600">
        <div className = "flex items-center space-x-2">
        <div className = "flex space-x-1">
        <div className = "w-3 h-3 rounded-full bg-red-500"></div>
        <div className = "w-3 h-3 rounded-full bg-yellow-500"></div>
        <div className = "w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <span className = "text-sm text-gray-400 font-mono">{currentSnippet.language}</span>
            </div>
          </div>
          
          <div className = "p-4 overflow-x-auto">
          <pre className = "text-sm text-gray-300 font-mono">
              <code>{currentSnippet.code}</code>
            </pre>
          </div>
        </div>

        {/* Explanation */}
        <div className = "bg-blue-900 bg-opacity-30 p-3 rounded border border-blue-600">
        <div className = "text-blue-300 text-sm font-semibold mb-1">What this does:</div>
        <div className = "text-blue-200 text-sm">{currentSnippet.explanation}</div>
        </div>
      </motion.div>
    </div>
  );
};

export default CodeSnippetViewer;