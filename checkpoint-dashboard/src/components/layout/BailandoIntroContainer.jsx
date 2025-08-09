import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronRight, BookOpen, Code, Brain, Database, MemoryStick } from 'lucide-react';

// Import all the small components
import SimpleArchitectureFlow from './SimpleArchitectureFlow';
import DataMatrixVisualizer from '../charts/DataMatrixVisualizer';
import LossPointSystem from '../charts/LossPointSystem';
import SimpleMemoryContext from './SimpleMemoryContext';
import CodeSnippetViewer from '../code/CodeSnippetViewer';

const BailandoIntroContainer = () => {
  const [activeSection, setActiveSection] = useState('architecture');
  const [isExpanded, setIsExpanded] = useState(true);

  const sections = [
    {
      id: 'architecture',
      title: 'Architecture Flow',
      icon: Brain,
      component: SimpleArchitectureFlow,
      description: 'How data flows through VQ-VAE → GPT → Actor-Critic pipeline'
    },
    {
      id: 'data',
      title: 'Data Representation', 
      icon: Database,
      component: DataMatrixVisualizer,
      description: 'SMPL pose matrices and how the model reads motion data'
    },
    {
      id: 'metrics',
      title: 'Loss & Point System',
      icon: BookOpen,
      component: LossPointSystem,
      description: 'Understanding loss values, point scoring, and GPT cross-entropy'
    },
    {
      id: 'memory',
      title: 'Memory & Context',
      icon: MemoryStick,
      component: SimpleMemoryContext,
      description: 'Context window constraints and memory usage optimization'
    },
    {
      id: 'code',
      title: 'Code Examples',
      icon: Code,
      component: CodeSnippetViewer,
      description: 'Real code from your Bailando implementation'
    }
  ];

  const activeComponent = sections.find(s => s.id === activeSection)?.component;
  const ActiveComponent = activeComponent || SimpleArchitectureFlow;

  return (
    <div className="bg-gradient-to-r from-blue-900 to-purple-900 border border-blue-700 rounded-lg mb-6">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-6 flex items-center justify-between text-left hover:bg-blue-800 hover:bg-opacity-30 transition-colors rounded-lg"
      >
        <div className="flex items-center space-x-4">
          <Brain className="w-8 h-8 text-blue-400" />
          <div>
            <h2 className="text-2xl font-bold text-white">
              🎭 Understanding Bailando: Interactive Tutorial
            </h2>
            <p className="text-blue-300 text-sm mt-1">
              Learn how your AI choreography system works before diving into training
            </p>
            <p className="text-blue-400 text-xs mt-1">
              Interactive visualizations • Real code examples • Mathematical formulas
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <div className="text-blue-300 text-sm font-semibold">
              {sections.length} Interactive Modules
            </div>
            <div className="text-blue-400 text-xs">
              Click to {isExpanded ? 'collapse' : 'expand'}
            </div>
          </div>
          {isExpanded ? (
            <ChevronDown className="w-6 h-6 text-blue-400" />
          ) : (
            <ChevronRight className="w-6 h-6 text-blue-400" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-6 pb-6">
          {/* Section Navigation */}
          <div className="grid grid-cols-5 gap-2 mb-6">
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              
              return (
                <motion.button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`p-4 rounded-lg border-2 transition-all text-center ${
                    isActive 
                      ? 'border-white bg-gray-800 shadow-lg' 
                      : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Icon className={`w-6 h-6 mx-auto mb-2 ${
                    isActive ? 'text-blue-400' : 'text-gray-400'
                  }`} />
                  <h3 className="text-sm font-semibold text-white mb-1">
                    {section.title}
                  </h3>
                  <p className="text-xs text-gray-400 leading-tight">
                    {section.description}
                  </p>
                </motion.button>
              );
            })}
          </div>

          {/* Active Component Display */}
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-gray-900 p-6 rounded-lg border border-gray-700 justify-center"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <ActiveComponent />
          </motion.div>

          {/* Quick Navigation */}
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-blue-300">
              Module {sections.findIndex(s => s.id === activeSection) + 1} of {sections.length}
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  const currentIndex = sections.findIndex(s => s.id === activeSection);
                  const prevIndex = currentIndex > 0 ? currentIndex - 1 : sections.length - 1;
                  setActiveSection(sections[prevIndex].id);
                }}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm text-white transition-colors"
              >
                ← Previous
              </button>
              
              <button
                onClick={() => {
                  const currentIndex = sections.findIndex(s => s.id === activeSection);
                  const nextIndex = currentIndex < sections.length - 1 ? currentIndex + 1 : 0;
                  setActiveSection(sections[nextIndex].id);
                }}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm text-white transition-colors"
              >
                Next →
              </button>
            </div>
          </div>

          {/* Learning Path */}
          <div className="mt-4 bg-blue-900 bg-opacity-30 p-4 rounded border border-blue-600">
            <h4 className="text-blue-300 font-semibold mb-2">💡 Recommended Learning Path:</h4>
            <div className="text-blue-200 text-sm grid grid-cols-1 md:grid-cols-5 gap-2">
              {sections.map((section, idx) => (
                <div key={section.id} className="flex items-center space-x-2">
                  <span className={`w-6 h-6 rounded-full text-xs flex items-center justify-center ${
                    sections.findIndex(s => s.id === activeSection) >= idx 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-600 text-gray-400'
                  }`}>
                    {idx + 1}
                  </span>
                  <span className="text-xs">{section.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BailandoIntroContainer;