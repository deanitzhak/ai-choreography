import React from 'react';
import { motion } from 'framer-motion';
import { Activity, BarChart3, Clock, Cpu } from 'lucide-react';

// 📊 Training Status Cards - Lightweight metrics display
const TrainingStatusCards = ({ trainingData, getStatusColor, getStatusLabel, formatTime }) => {
  const { currentEpoch, currentLoss, currentStage, trainingTime, isTraining } = trainingData;

  const cards = [
    {
      icon: Activity,
      label: 'Current Epoch',
      value: currentEpoch,
      subtitle: `Stage ${currentStage}`,
      color: 'text-blue-400'
    },
    {
      icon: BarChart3,
      label: 'Current Loss',
      value: currentLoss.toFixed(4),
      subtitle: getStatusLabel(currentLoss),
      color: getStatusColor(currentLoss)
    },
    {
      icon: Clock,
      label: 'Training Time',
      value: formatTime(trainingTime),
      subtitle: isTraining ? 'Running' : 'Stopped',
      color: 'text-green-400'
    },
    {
      icon: Cpu,
      label: 'Status',
      value: isTraining ? (
        <motion.span
          className="text-green-400"
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          Training
        </motion.span>
      ) : (
        <span className="text-gray-400">Idle</span>
      ),
      subtitle: 'System Status',
      color: 'text-purple-400'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        
        return (
          <motion.div
            key={index}
            className="bg-gray-700 p-4 rounded-lg"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center space-x-2 mb-2">
              <Icon className={`w-4 h-4 ${card.color}`} />
              <span className="text-sm text-gray-400">{card.label}</span>
            </div>
            
            <div className={`text-2xl font-bold ${card.color}`}>
              {card.value}
            </div>
            
            <div className="text-xs text-gray-400 mt-1">
              {card.subtitle}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default TrainingStatusCards;