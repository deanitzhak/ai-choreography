import React from 'react';
import { ChevronDown, ChevronRight, Brain, Target, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';

const ProjectIntroduction = ({ isExpanded, onToggle, latestCheckpoint }) => {
    // Analyze current training status
  const getDiagnosticStatus = () => {
    if (!latestCheckpoint) {
      return { 
        status        : 'unknown',
        message       : 'No data available',
        recommendation: 'Start training to see diagnostics'
      };
    }
    
    if (latestCheckpoint.loss > 500) {
      return { 
        status        : 'critical',
        message       : 'Loss explosion detected! Training is unstable.',
        recommendation: 'Reduce learning rate to 3×10⁻⁵ (paper value), add gradient clipping'
      };
    } else if (latestCheckpoint.loss > 100) {
      return { 
        status        : 'warning',
        message       : 'High loss values. Training may be unstable.',
        recommendation: 'Monitor for gradient explosion, consider learning rate decay'
      };
    } else {
      return { 
        status        : 'good',
        message       : 'Training appears stable.',
        recommendation: 'Continue current training configuration'
      };
    }
  };

  const diagnostic = getDiagnosticStatus();

    // Research context from CVPR 2022 paper
  const researchContext = {
    title         : "Bailando: 3D Dance Generation by Actor-Critic GPT with Choreographic Memory",
    authors       : "Li Siyao et al., CVPR 2022",
    venue         : "Computer Vision and Pattern Recognition Conference",
    contribution  : "Novel music-to-dance framework addressing spatial constraints and temporal coherency challenges",
    keyInnovations: [
      "Choreographic Memory: VQ-VAE-based quantized codebook of meaningful dancing units",
      "Actor-Critic GPT: Temporal coherency with music through reinforcement learning", 
      "Cross-Conditional Attention: Coherent upper/lower body coordination",
      "Beat-Align Reward: Synchronized alignment between motion and music beats"
    ],
    dataset    : "AIST++ (992 high-quality 60-FPS 3D pose sequences in SMPL format)",
    performance: "State-of-the-art results: FID_kinetic: 28.16, FID_geometric: 9.62, Beat Align Score: 0.2332"
  };

    // Mathematical formulas from the paper
  const formulas = [
    {
      category : "VQ-VAE Loss Function (Choreographic Memory)",
      formula  : "L_VQ = L_rec(P, P̂) + ||sg[e] - e_q||² + β||e - sg[e_q]||²",
      breakdown: [
        "L_rec = ||P̂ - P||₁ + α₁||P̂' - P'||₁ + α₂||P̂'' - P''||₁",
        "P', P'' = 1st and 2nd order derivatives (velocity, acceleration)",
        "sg[·] = stop gradient operator", 
        "β = 0.1 (commitment cost trade-off)"
      ],
      explanation : "From CVPR 2022 paper: Learns discrete dance positions while preventing jitters through velocity/acceleration constraints.",
      currentValue: latestCheckpoint ? `Current: ${latestCheckpoint.loss.toFixed(2)} (Paper optimal: ~10-30)`                                  : "N/A"
    },
    {
      category : "Cross-Conditional Motion GPT",
      formula  : "p̂ᵘₜ = arg max P(zᵘₖ|m₁...ₜ, pᵘ₀...ₜ₋₁, pˡ₀...ₜ₋₁)",
      breakdown: [
        "m₁...ₜ = Music features (438-dim: MFCC, chromagram, tempogram)",
        "pᵘ, pˡ = Upper/lower body pose codes from choreographic memory",
        "Cross-conditional attention allows upper ↔ lower body coordination",
        "Autoregressive generation with causal masking"
      ],
      explanation : "GPT predicts future dance codes conditioned on music and past movements. Prevents asynchronous upper/lower body motion.",
      currentValue: `Codebook size: 512 (upper) + 512 (lower) = 1024 total dance positions`
    },
    {
      category : "Actor-Critic Reinforcement Learning",
      formula  : "L_AC = (1/T') Σ CrossEntropy(aʰₜ, p̂ʰₜ₊₁) × sg[εₜ]",
      breakdown: [
        "εₜ = rₜ + sg[vₜ₊₁] - vₜ (TD-error)",
        "R = γ_b × R_beat + γ_c × R_consistency",
        "R_beat = -1 if music beat exists but no dance beat, +1 otherwise",
        "R_consistency penalizes opposite upper/lower body directions"
      ],
      explanation : "Fine-tunes GPT using RL to achieve better music-motion synchronization. Paper shows 0.2245 → 0.2332 beat alignment improvement.",
      currentValue: diagnostic.status === 'critical' ? "Status: Pre-GPT stage (VQ-VAE training)"                                                     : "Status: Ready for GPT training"
    }
  ];

  return (
    <div className = "bg-gradient-to-r from-blue-900 to-purple-900 border border-blue-700 rounded-lg mb-6">
      {/* Header */}
      <button
        onClick   = {onToggle}
        className = "w-full p-4 flex items-center justify-between text-left hover:bg-blue-800 transition-colors rounded-lg"
      >
        <div   className = "flex items-center space-x-3">
        <Brain className = "w-6 h-6 text-blue-400" />
          <div>
            <h2 className = "text-xl font-bold text-white">{researchContext.title}</h2>
            <p  className = "text-sm text-blue-300">{researchContext.authors} • {researchContext.venue}</p>
            <p  className = "text-xs text-blue-400 mt-1">{researchContext.contribution}</p>
          </div>
        </div>
        <div className = "flex items-center space-x-2">
          {diagnostic.status === 'critical' && <AlertTriangle className="w-5 h-5 text-red-400" />}
          {diagnostic.status === 'warning' && <AlertCircle className="w-5 h-5 text-yellow-400" />}
          {diagnostic.status === 'good' && <CheckCircle className="w-5 h-5 text-green-400" />}
          {isExpanded ? <ChevronDown className="w-5 h-5 text-blue-400" /> : <ChevronRight className="w-5 h-5 text-blue-400" />}
        </div>
      </button>
      
      {/* Expanded Content */}
      {isExpanded && (
        <div className = "p-6 pt-0 space-y-6">
          {/* Research Context */}
          <div    className = "bg-gray-800 p-5 rounded-lg border border-gray-700">
          <h3     className = "font-bold text-white mb-3 flex items-center">
          <Target className = "w-4 h-4 mr-2 text-blue-400" />
              Research Context & Key Innovations
            </h3>
            <div className = "grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
              <div>
                <div className = "font-semibold text-gray-300 mb-2">Paper Contributions:</div>
                {researchContext.keyInnovations.map((innovation, idx) => (
                  <div key = {idx} className = "text-gray-400 mb-1">• {innovation}</div>
                ))}
              </div>
              <div className = "space-y-2 text-gray-300">
                <div><strong>Dataset     : </strong> {researchContext.dataset}</div>
                <div><strong>Performance : </strong> {researchContext.performance}</div>
                <div><strong>Method      : </strong> 3-stage training pipeline (VQ-VAE → GPT → Actor-Critic)</div>
                <div><strong>Applications: </strong> Virtual character animation, choreography assistance</div>
              </div>
            </div>
          </div>

          {/* Training Status Alert */}
          <div className={`p-4 rounded-lg border-l-4 ${
            diagnostic.status === 'critical' ? 'bg-red-900 border-red-400' :
            diagnostic.status === 'warning' ? 'bg-yellow-900 border-yellow-400' :
            'bg-green-900 border-green-400'
          }`}>
            <div className = "flex items-center space-x-2 mb-2">
              {diagnostic.status === 'critical' && <AlertTriangle className="w-5 h-5 text-red-400" />}
              {diagnostic.status === 'warning' && <AlertCircle className="w-5 h-5 text-yellow-400" />}
              {diagnostic.status === 'good' && <CheckCircle className="w-5 h-5 text-green-400" />}
              <h3 className={`font-semibold ${
                diagnostic.status === 'critical' ? 'text-red-300' :
                diagnostic.status === 'warning' ? 'text-yellow-300' :
                'text-green-300'
              }`}>
                Current Training Status
              </h3>
            </div>
            <p className={`text-sm ${
              diagnostic.status === 'critical' ? 'text-red-200' :
              diagnostic.status === 'warning' ? 'text-yellow-200' :
              'text-green-200'
            }`}>
              {diagnostic.message}
            </p>
            <p className={`text-xs mt-1 font-medium ${
              diagnostic.status === 'critical' ? 'text-red-300' :
              diagnostic.status === 'warning' ? 'text-yellow-300' :
              'text-green-300'
            }`}>
              💡 Recommendation: {diagnostic.recommendation}
            </p>
          </div>

          {/* Mathematical Formulas */}
          <div className = "grid grid-cols-1 lg:grid-cols-2 gap-4">
            {formulas.map((section, idx) => (
              <div    key       = {idx} className = "bg-gray-800 p-5 rounded-lg border border-gray-700">
              <h3     className = "font-bold text-white mb-3 flex items-center">
              <Target className = "w-4 h-4 mr-2 text-blue-400" />
                  {section.category}
                </h3>
                
                <div  className = "space-y-3">
                <div  className = "p-3 bg-gray-900 rounded border border-gray-600">
                <code className = "text-sm font-mono text-blue-300">{section.formula}</code>
                  </div>
                  
                  <div className = "space-y-1">
                    {section.breakdown.map((item, i) => (
                      <div key = {i} className = "text-xs text-gray-400">
                        • {item}
                      </div>
                    ))}
                  </div>
                  
                  <p className = "text-sm text-gray-300">{section.explanation}</p>
                  
                  <div className={`text-xs font-mono p-2 rounded ${
                    section.currentValue.includes('774') ? 'bg-red-900 text-red-300'        : 
                    section.currentValue.includes('Paper') ? 'bg-yellow-900 text-yellow-300': 
                    'bg-blue-900 text-blue-300'
                  }`}>
                    {section.currentValue}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Training Optimization Tips */}
          <div className = "bg-gray-800 p-4 rounded-lg border border-gray-700">
          <h3  className = "font-semibold text-white mb-2">🎯 Training Optimization (Based on CVPR 2022 Paper)</h3>
          <div className = "grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className = "space-y-1">
          <div className = "text-red-300"><strong>For Loss Explosion (Current Issue):</strong></div>
          <div className = "text-gray-400">• Paper LR: 3×10⁻⁵ (VQ-VAE) vs Your: 1×10⁻⁴</div>
          <div className = "text-gray-400">• Add gradient clipping (max_norm=1.0)</div>
          <div className = "text-gray-400">• Reduce batch: 32 → 16 → 8</div>
          <div className = "text-gray-400">• Check velocity/acceleration loss terms</div>
              </div>
              <div className = "space-y-1">
              <div className = "text-blue-300"><strong>Paper Training Schedule:</strong></div>
              <div className = "text-gray-400">• Stage 1: VQ-VAE (400 epochs)</div>
              <div className = "text-gray-400">• Stage 2: GPT (400 epochs)</div>
              <div className = "text-gray-400">• Stage 3: Actor-Critic (10 epochs)</div>
              <div className = "text-gray-400">• Total: ~3 days on Tesla V100</div>
              </div>
              <div className = "space-y-1">
              <div className = "text-green-300"><strong>Expected Performance:</strong></div>
              <div className = "text-gray-400">• VQ-VAE reconstruction: FID &lt; 30</div>
              <div className = "text-gray-400">• GPT generation: BAS &gt; 0.22</div>
              <div className = "text-gray-400">• Final model: FID_k = 28.16, FID_g = 9.62</div>
              <div className = "text-gray-400">• User study: 84.5%+ win rate vs baselines</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectIntroduction;