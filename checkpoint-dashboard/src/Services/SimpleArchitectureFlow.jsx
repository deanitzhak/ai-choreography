import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, Music, Zap, Code, Play } from 'lucide-react';

const SimpleArchitectureFlow = () => {
  const [activeStage, setActiveStage] = useState(0);
  
  const stages = [
    {
      icon   : Music,
      title  : 'SMPL Input',
      desc   : '72D pose data',
      color  : '#3B82F6',
      formula: 'P ∈ ℝᵀˣ⁷²'
    },
    {
      icon   : Brain,
      title  : 'VQ-VAE',
      desc   : 'Quantization',
      color  : '#8B5CF6',
      formula: 'z_q = argmin ||z_e - e_k||²'
    },
    {
      icon   : Zap,
      title  : 'Codebook',
      desc   : '1024 codes',
      color  : '#F59E0B',
      formula: 'E ∈ ℝ¹⁰²⁴ˣ²⁵⁶'
    },
    {
      icon   : Code,
      title  : 'GPT',
      desc   : 'Music→Dance',
      color  : '#10B981',
      formula: 'P(z_t|z_{<t}, music)'
    },
    {
      icon   : Play,
      title  : 'Output',
      desc   : 'Generated dance',
      color  : '#EF4444',
      formula: 'D ∈ ℝᵀˣ⁷²'
    }
  ];

  return (
    <div className = "bg-gray-800 p-4 rounded-lg border border-gray-600 max-w-4xl">
    <h3  className = "text-lg font-bold text-white mb-4">🎭 Bailando Pipeline</h3>
      
      {/* Flow Visualization */}
      <div className = "flex items-center justify-between mb-4">
        {stages.map((stage, idx) => {
          const Icon     = stage.icon;
          const isActive = activeStage === idx;
          
          return (
            <div key = {idx} className = "flex items-center">
              <motion.div
                className={`p-3 rounded-lg cursor-pointer transition-all ${
                  isActive ? 'scale-110 shadow-lg': 'scale-100'
                }`}
                style={{ 
                  backgroundColor: isActive ? stage.color: stage.color + '40',
                  border         : `2px solid ${isActive ? stage.color : 'transparent'}`
                }}
                onClick    = {() => setActiveStage(idx)}
                whileHover = {{ scale: 1.05 }}
              >
                <Icon className = "w-6 h-6 text-white" />
              </motion.div>
              
              {idx < stages.length - 1 && (
                <motion.div 
                  className = "w-8 h-0.5 mx-2"
                  style     = {{ 
                    backgroundColor: isActive ? stage.color: '#4B5563'
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Stage Details */}
      <motion.div
        key       = {activeStage}
        initial   = {{ opacity: 0, y: 10 }}
        animate   = {{ opacity: 1, y: 0 }}
        className = "bg-gray-700 p-4 rounded-lg"
      >
        <div className = "flex items-center space-x-3 mb-2">
          <div 
            className = "w-8 h-8 rounded-full flex items-center justify-center"
            style     = {{ backgroundColor: stages[activeStage].color }}
          >
            <span className = "text-white font-bold text-sm">{activeStage + 1}</span>
          </div>
          <div>
            <h4 className = "text-white font-semibold">{stages[activeStage].title}</h4>
            <p  className = "text-gray-400 text-sm">{stages[activeStage].desc}</p>
          </div>
        </div>
        
        {/* Mathematical Formula */}
        <div  className = "bg-gray-900 p-3 rounded border border-gray-600">
        <code className = "text-blue-300 font-mono text-sm">
            {stages[activeStage].formula}
          </code>
        </div>
      </motion.div>
    </div>
  );
};

export default SimpleArchitectureFlow;