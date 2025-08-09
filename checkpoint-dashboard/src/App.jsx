import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, Zap, Settings, Monitor, Play, Database,
  Brain, Activity, Terminal, Cpu
} from 'lucide-react';

// Import components
import Dashboard from './Services/Dashboard';
import RealTimeTrainingPanel from './Services/RealTimeTrainingPanel';

const MainApp = () => {
  const [activeView, setActiveView] = useState('dashboard');

  const views = [
    {
      id: 'dashboard',
      title: 'Analysis Dashboard',
      icon: BarChart3,
      description: 'View training results, checkpoints, and model architecture',
      color: 'blue'
    },
    {
      id: 'training',
      title: 'Real-time Training',
      icon: Zap,
      description: 'Start, monitor, and control training in real-time',
      color: 'green'
    },
    {
      id: 'optimization',
      title: 'Model Optimization',
      icon: Settings,
      description: 'Optimize configurations and analyze performance',
      color: 'purple'
    },
    {
      id: 'monitoring',
      title: 'System Monitor',
      icon: Monitor,
      description: 'Hardware usage, memory, and system diagnostics',
      color: 'orange'
    }
  ];

  const getViewColor = (color) => {
    const colors = {
      blue: { bg: 'bg-blue-600', hover: 'hover:bg-blue-700', text: 'text-blue-400', border: 'border-blue-500' },
      green: { bg: 'bg-green-600', hover: 'hover:bg-green-700', text: 'text-green-400', border: 'border-green-500' },
      purple: { bg: 'bg-purple-600', hover: 'hover:bg-purple-700', text: 'text-purple-400', border: 'border-purple-500' },
      orange: { bg: 'bg-orange-600', hover: 'hover:bg-orange-700', text: 'text-orange-400', border: 'border-orange-500' }
    };
    return colors[color];
  };

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;
      case 'training':
        return <RealTimeTrainingPanel />;
      case 'optimization':
        return <ModelOptimizationPanel />;
      case 'monitoring':
        return <SystemMonitorPanel />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Main Navigation Header */}
      <div className="bg-gray-800 shadow-lg border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            {/* Logo and Title */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Brain className="w-8 h-8 text-blue-400" />
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    Dean And Nikolai - AI Platform - 3D Dance Generation
                  </h1>
                  <p className="text-sm text-gray-400">
                    3D Dance Generation • Training • Analysis
                  </p>
                </div>
              </div>
            </div>

            {/* View Navigation */}
            <div className="flex items-center space-x-1 bg-gray-700 p-1 rounded-lg">
              {views.map((view) => {
                const Icon = view.icon;
                const isActive = activeView === view.id;
                const colors = getViewColor(view.color);
                
                return (
                  <motion.button
                    key={view.id}
                    onClick={() => setActiveView(view.id)}
                    className={`relative px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200 ${
                      isActive 
                        ? `${colors.bg} text-white shadow-lg` 
                        : 'text-gray-400 hover:text-white hover:bg-gray-600'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium hidden md:block">
                      {view.title}
                    </span>
                    
                    {isActive && (
                      <motion.div
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-t"
                        layoutId="activeIndicator"
                        transition={{ duration: 0.2 }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 text-sm text-gray-400">
                <Activity className="w-4 h-4 text-green-400" />
                <span>Server: Online</span>
              </div>
            </div>
          </div>

          {/* View Description */}
          <div className="pb-4">
            <motion.p
              key={activeView}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-gray-400"
            >
              {views.find(v => v.id === activeView)?.description}
            </motion.p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <motion.div
        key={activeView}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className="flex-1"
      >
        {renderActiveView()}
      </motion.div>
    </div>
  );
};

// Placeholder components for other views
const ModelOptimizationPanel = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
      <div className="flex items-center space-x-3 mb-4">
        <Settings className="w-6 h-6 text-purple-400" />
        <h2 className="text-xl font-bold text-white">Model Optimization</h2>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Optimizer */}
        <div className="bg-gray-700 p-4 rounded-lg">
          <h3 className="text-white font-semibold mb-3">Configuration Optimizer</h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-400 block mb-1">Target Device:</label>
              <select className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm">
                <option>CPU Optimized</option>
                <option>GPU Optimized</option>
                <option>Mobile Optimized</option>
              </select>
            </div>
            
            <div>
              <label className="text-sm text-gray-400 block mb-1">Max Parameters:</label>
              <input 
                type="text" 
                placeholder="15M"
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm"
              />
            </div>
            
            <button className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition-colors">
              Optimize Configuration
            </button>
          </div>
        </div>

        {/* Performance Analysis */}
        <div className="bg-gray-700 p-4 rounded-lg">
          <h3 className="text-white font-semibold mb-3">Performance Analysis</h3>
          <div className="space-y-2 text-sm text-gray-300">
            <div className="flex justify-between">
              <span>Current Model Size:</span>
              <span className="text-white">52.8M parameters</span>
            </div>
            <div className="flex justify-between">
              <span>Memory Usage:</span>
              <span className="text-yellow-400">3.2GB / 4GB</span>
            </div>
            <div className="flex justify-between">
              <span>Training Speed:</span>
              <span className="text-white">2.3 epochs/hour</span>
            </div>
            <div className="flex justify-between">
              <span>Optimization Potential:</span>
              <span className="text-green-400">75% reduction possible</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const SystemMonitorPanel = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
      <div className="flex items-center space-x-3 mb-4">
        <Monitor className="w-6 h-6 text-orange-400" />
        <h2 className="text-xl font-bold text-white">System Monitor</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* CPU Usage */}
        <div className="bg-gray-700 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-3">
            <Cpu className="w-5 h-5 text-blue-400" />
            <h3 className="text-white font-semibold">CPU Usage</h3>
          </div>
          <div className="text-3xl font-bold text-blue-400 mb-2">67%</div>
          <div className="w-full bg-gray-600 rounded-full h-2">
            <div className="bg-blue-500 h-2 rounded-full" style={{width: '67%'}}></div>
          </div>
          <div className="text-sm text-gray-400 mt-2">8 cores active</div>
        </div>

        {/* Memory Usage */}
        <div className="bg-gray-700 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-3">
            <Database className="w-5 h-5 text-green-400" />
            <h3 className="text-white font-semibold">Memory</h3>
          </div>
          <div className="text-3xl font-bold text-green-400 mb-2">3.2GB</div>
          <div className="w-full bg-gray-600 rounded-full h-2">
            <div className="bg-green-500 h-2 rounded-full" style={{width: '80%'}}></div>
          </div>
          <div className="text-sm text-gray-400 mt-2">80% of 4GB used</div>
        </div>

        {/* Training Status */}
        <div className="bg-gray-700 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-3">
            <Activity className="w-5 h-5 text-purple-400" />
            <h3 className="text-white font-semibold">Training</h3>
          </div>
          <div className="text-3xl font-bold text-purple-400 mb-2">Active</div>
          <div className="w-full bg-gray-600 rounded-full h-2">
            <div className="bg-purple-500 h-2 rounded-full animate-pulse" style={{width: '45%'}}></div>
          </div>
          <div className="text-sm text-gray-400 mt-2">Epoch 45/100</div>
        </div>
      </div>
    </div>
  </div>
);

export default MainApp;