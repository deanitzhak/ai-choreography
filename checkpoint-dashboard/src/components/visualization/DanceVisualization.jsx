import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Pause, RotateCcw, Database, Brain, Activity,
  CheckCircle, Circle, ChevronDown, ChevronUp, PlayCircle
} from 'lucide-react';

// Joint definitions for SMPL skeleton
const JOINTS = {
  PELVIS: 0, LEFT_HIP: 1, RIGHT_HIP: 2, SPINE1: 3, LEFT_KNEE: 4, RIGHT_KNEE: 5,
  SPINE2: 6, LEFT_ANKLE: 7, RIGHT_ANKLE: 8, SPINE3: 9, LEFT_FOOT: 10, RIGHT_FOOT: 11,
  NECK: 12, LEFT_COLLAR: 13, RIGHT_COLLAR: 14, HEAD: 15, LEFT_SHOULDER: 16, RIGHT_SHOULDER: 17,
  LEFT_ELBOW: 18, RIGHT_ELBOW: 19, LEFT_WRIST: 20, RIGHT_WRIST: 21, LEFT_HAND: 22, RIGHT_HAND: 23
};

// Bone connections for stick figure
const BONE_CONNECTIONS = [
  [0, 3], [3, 6], [6, 9], [9, 12], [12, 15], // Spine
  [6, 16], [16, 18], [18, 20], [20, 22], // Left arm
  [6, 17], [17, 19], [19, 21], [21, 23], // Right arm
  [0, 1], [1, 4], [4, 7], [7, 10], // Left leg
  [0, 2], [2, 5], [5, 8], [8, 11]  // Right leg
];

// Base skeleton proportions
const SKELETON_BASE = {
  0: [0, 0, 0], 3: [0, 0.15, 0], 6: [0, 0.35, 0], 9: [0, 0.55, 0], 12: [0, 0.65, 0], 15: [0, 0.8, 0],
  16: [-0.2, 0.55, 0], 17: [0.2, 0.55, 0], 18: [-0.35, 0.35, 0], 19: [0.35, 0.35, 0],
  20: [-0.5, 0.15, 0], 21: [0.5, 0.15, 0], 22: [-0.55, 0.1, 0], 23: [0.55, 0.1, 0],
  1: [-0.1, 0, 0], 2: [0.1, 0, 0], 4: [-0.1, -0.3, 0], 5: [0.1, -0.3, 0],
  7: [-0.1, -0.6, 0], 8: [0.1, -0.6, 0], 10: [-0.1, -0.65, 0.1], 11: [0.1, -0.65, 0.1],
  13: [-0.15, 0.6, 0], 14: [0.15, 0.6, 0]
};

// Style transformation functions
const transformBasic = (x, y, z, t, jointIndex) => {
  const sway = Math.sin(t * Math.PI * 2) * 0.05;
  const bounce = Math.sin(t * Math.PI * 4) * 0.02;
  return [x + sway * 0.5, y + bounce, z];
};

const transformRhythmic = (x, y, z, t, jointIndex) => {
  const beat = Math.sin(t * Math.PI * 8);
  const sideStep = Math.sin(t * Math.PI * 4) * 0.1;
  
  if (jointIndex === 16 || jointIndex === 17) { // Shoulders
    const side = jointIndex === 16 ? -1 : 1;
    return [x + side * beat * 0.15, y + Math.abs(beat) * 0.08, z + beat * 0.05];
  }
  return [x + sideStep * 0.3, y + Math.abs(beat) * 0.03, z];
};

const transformAdvanced = (x, y, z, t, jointIndex) => {
  const wave1 = Math.sin(t * Math.PI * 6);
  const wave2 = Math.cos(t * Math.PI * 4);
  const wave3 = Math.sin(t * Math.PI * 10);
  
  if (jointIndex === 16 || jointIndex === 17) { // Shoulders
    const side = jointIndex === 16 ? -1 : 1;
    return [x + side * (wave1 * 0.2 + wave3 * 0.08), y + wave2 * 0.12, z + (wave1 + wave2) * 0.1];
  }
  return [x + (wave1 + wave3) * 0.08, y + wave2 * 0.05, z + (wave2 + wave3) * 0.06];
};

const transformBreakdance = (x, y, z, t, jointIndex) => {
  const phase = Math.floor(t * 4) % 2;
  const spin = t * Math.PI * 12;
  
  if (phase === 1) { // Freeze
    if (jointIndex === 0) return [x, y - 0.3, z]; // Lower pelvis
    if (jointIndex === 22 || jointIndex === 23) return [x * 1.5, y - 0.3, z]; // Hands on ground
    return [x * 1.2, y - 0.15, z * 1.2];
  } else { // Spin
    const radius = 0.25;
    return [x + Math.sin(spin + jointIndex) * radius, y + Math.abs(Math.sin(spin)) * 0.15, z + Math.cos(spin + jointIndex) * radius];
  }
};

const transformBallet = (x, y, z, t, jointIndex) => {
  const grace = Math.sin(t * Math.PI * 2);
  const extension = Math.cos(t * Math.PI * 3);
  
  if (jointIndex === 16 || jointIndex === 17) { // Shoulders - extended arms
    const side = jointIndex === 16 ? -1 : 1;
    return [x + side * (0.15 + extension * 0.25), y + 0.12 + grace * 0.08, z + extension * 0.12];
  }
  if (jointIndex === 0) return [x + grace * 0.06, y + 0.08 + Math.abs(grace) * 0.03, z]; // Elevated pelvis
  if (jointIndex === 15) return [x + grace * 0.03, y + Math.abs(grace) * 0.02, z + extension * 0.03]; // Head
  return [x + grace * 0.04, y + Math.abs(extension) * 0.03, z + extension * 0.04];
};

// Generate stick figure frame
const generateStickFigureFrame = (frame, totalFrames, style = 'basic') => {
  const t = frame / totalFrames;
  const positions = [];
  
  Object.keys(SKELETON_BASE).forEach(jointIndex => {
    const [baseX, baseY, baseZ] = SKELETON_BASE[jointIndex];
    let styledPos;
    
    switch (style) {
      case 'basic': styledPos = transformBasic(baseX, baseY, baseZ, t, parseInt(jointIndex)); break;
      case 'rhythmic': styledPos = transformRhythmic(baseX, baseY, baseZ, t, parseInt(jointIndex)); break;
      case 'advanced': styledPos = transformAdvanced(baseX, baseY, baseZ, t, parseInt(jointIndex)); break;
      case 'breakdance': styledPos = transformBreakdance(baseX, baseY, baseZ, t, parseInt(jointIndex)); break;
      case 'ballet': styledPos = transformBallet(baseX, baseY, baseZ, t, parseInt(jointIndex)); break;
      default: styledPos = [baseX, baseY, baseZ];
    }
    
    positions[parseInt(jointIndex)] = styledPos;
  });
  
  return positions;
};

// Stick Figure Canvas Component
const StickFigureCanvas = ({ positions, style, frame, totalFrames, isPlaying }) => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !positions) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const scale = 120;
    const centerX = width / 2;
    const centerY = height * 0.75;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw background
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid
    ctx.strokeStyle = 'rgba(75, 85, 99, 0.2)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= width; i += 30) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }
    for (let i = 0; i <= height; i += 30) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(width, i);
      ctx.stroke();
    }
    
    // Style colors
    const colors = {
      basic: '#4ade80', rhythmic: '#3b82f6', advanced: '#8b5cf6',
      breakdance: '#ef4444', ballet: '#ec4899'
    };
    const color = colors[style] || colors.basic;
    
    // Draw bones
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    
    BONE_CONNECTIONS.forEach(([startJoint, endJoint]) => {
      if (positions[startJoint] && positions[endJoint]) {
        const [x1, y1] = [centerX + positions[startJoint][0] * scale, centerY - positions[startJoint][1] * scale];
        const [x2, y2] = [centerX + positions[endJoint][0] * scale, centerY - positions[endJoint][1] * scale];
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    });
    
    // Draw joints
    ctx.fillStyle = color;
    [0, 15, 16, 17, 22, 23, 10, 11].forEach(jointIndex => { // Key joints
      if (positions[jointIndex]) {
        const [x, y] = [centerX + positions[jointIndex][0] * scale, centerY - positions[jointIndex][1] * scale];
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    
    // Draw info
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(width - 110, height - 50, 105, 45);
    ctx.fillStyle = '#ffffff';
    ctx.font = '11px monospace';
    ctx.fillText(`${frame}/${totalFrames}`, width - 105, height - 30);
    ctx.fillText(isPlaying ? 'PLAYING' : 'PAUSED', width - 105, height - 15);
    
    // Style indicator
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(15, 25, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px monospace';
    ctx.fillText(style.toUpperCase(), 30, 29);
    
  }, [positions, style, frame, totalFrames, isPlaying]);
  
  return <canvas ref={canvasRef} width={350} height={300} className="border border-gray-600 rounded" />;
};

// Main Component
const DancingStickFigure = () => {
  const [selectedCheckpoint, setSelectedCheckpoint] = useState(null);
  const [showCheckpointPanel, setShowCheckpointPanel] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [totalFrames] = useState(120);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [positions, setPositions] = useState(null);

  // State for checkpoints
  const [checkpoints, setCheckpoints] = useState([]);
  const [isLoadingCheckpoints, setIsLoadingCheckpoints] = useState(false);
  const [checkpointError, setCheckpointError] = useState('');

  // Load checkpoints from your API
  useEffect(() => {
    loadCheckpointsFromAPI();
  }, []);

  const loadCheckpointsFromAPI = async () => {
    setIsLoadingCheckpoints(true);
    setCheckpointError('');
    
    try {
      const response = await fetch('http://localhost:8000/api/checkpoints');
      
      if (response.ok) {
        const data = await response.json();
        
        // Transform your API data to include dance styles
        const transformedCheckpoints = data.map(checkpoint => ({
          ...checkpoint,
          danceStyle: getDanceStyleFromCheckpoint(checkpoint),
          color: getColorFromStage(checkpoint.stage),
          description: getDescriptionFromCheckpoint(checkpoint),
          characteristics: getCharacteristicsFromCheckpoint(checkpoint)
        }));
        
        setCheckpoints(transformedCheckpoints);
        console.log(`✅ Loaded ${transformedCheckpoints.length} real checkpoints`);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.warn('⚠️ Server not available, using fallback data:', error.message);
      setCheckpointError('Unable to load real checkpoints from server');
      
      // Fallback to mock data
      setCheckpoints([
        {
          id: 'fallback_basic', name: 'Fallback - Basic Motion', stage: 1, epoch: 50, loss: 0.12,
          description: 'Simple swaying and bouncing movements', danceStyle: 'basic', color: 'blue',
          characteristics: ['Basic motion encoding', 'Simple movements', 'Foundation layer'],
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      setIsLoadingCheckpoints(false);
    }
  };

  // Helper functions to map your checkpoint data to dance styles
  const getDanceStyleFromCheckpoint = (checkpoint) => {
    const { stage, epoch, loss } = checkpoint;
    
    // Map based on training characteristics
    if (stage === 1) return 'basic';
    if (stage === 2) return 'rhythmic';
    if (stage === 3) {
      if (loss < 0.06) return 'ballet';      // Well-trained = graceful
      if (loss < 0.08) return 'advanced';    // Good training = complex
      return 'breakdance';                   // Higher loss = dynamic
    }
    
    // Special cases based on epoch
    if (epoch > 100) return 'advanced';
    if (epoch > 80) return 'rhythmic';
    return 'basic';
  };

  const getColorFromStage = (stage) => {
    const colors = { 1: 'blue', 2: 'green', 3: 'purple' };
    return colors[stage] || 'gray';
  };

  const getDescriptionFromCheckpoint = (checkpoint) => {
    const descriptions = {
      basic: 'Simple swaying and bouncing movements',
      rhythmic: 'Beat-synchronized arm and body movements', 
      advanced: 'Multi-wave complex movement patterns',
      breakdance: 'Dynamic spins and freeze positions',
      ballet: 'Graceful extended movements'
    };
    return descriptions[getDanceStyleFromCheckpoint(checkpoint)] || 'AI-generated dance movements';
  };

  const getCharacteristicsFromCheckpoint = (checkpoint) => {
    const { stage, epoch, loss } = checkpoint;
    const chars = [];
    
    if (stage >= 1) chars.push('Motion encoding');
    if (stage >= 2) chars.push('Sequence generation');
    if (stage >= 3) chars.push('Advanced choreography');
    if (epoch > 50) chars.push('Extended training');
    if (loss < 0.1) chars.push('Low loss');
    if (loss > 0.1) chars.push('High variance');
    
    return chars.length > 0 ? chars : ['Basic movement'];
  };

  // Generate positions when checkpoint changes
  useEffect(() => {
    if (selectedCheckpoint) {
      const newPositions = generateStickFigureFrame(currentFrame, totalFrames, selectedCheckpoint.danceStyle);
      setPositions(newPositions);
    }
  }, [selectedCheckpoint, currentFrame, totalFrames]);

  // Animation loop
  useEffect(() => {
    if (!isPlaying || !selectedCheckpoint) return;
    
    const interval = setInterval(() => {
      setCurrentFrame(prev => {
        const nextFrame = prev + Math.ceil(playbackSpeed);
        return nextFrame >= totalFrames ? 0 : nextFrame;
      });
    }, 50);
    
    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, totalFrames, selectedCheckpoint]);

  const handleCheckpointSelect = (checkpoint) => {
    setSelectedCheckpoint(checkpoint);
    setCurrentFrame(0);
  };

  const togglePlayback = () => setIsPlaying(!isPlaying);
  const resetAnimation = () => { setCurrentFrame(0); setIsPlaying(false); };

  const getCheckpointStyling = (color) => {
    const styles = {
      blue: { bg: 'bg-blue-900/30', border: 'border-blue-500', text: 'text-blue-400' },
      green: { bg: 'bg-green-900/30', border: 'border-green-500', text: 'text-green-400' },
      purple: { bg: 'bg-purple-900/30', border: 'border-purple-500', text: 'text-purple-400' },
      red: { bg: 'bg-red-900/30', border: 'border-red-500', text: 'text-red-400' },
      pink: { bg: 'bg-pink-900/30', border: 'border-pink-500', text: 'text-pink-400' }
    };
    return styles[color] || styles.blue;
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4 bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <Brain className="w-6 h-6 text-purple-400" />
            <div>
              <h1 className="text-xl font-bold text-white">AI Dance Stick Figure</h1>
              <p className="text-gray-400 text-sm">
                Watch how AI learns different dance styles
                {checkpoints.length > 0 && ` • ${checkpoints.length} checkpoints loaded`}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {isLoadingCheckpoints && (
              <div className="flex items-center space-x-2 text-blue-400">
                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">Loading...</span>
              </div>
            )}
            
            <button
              onClick={loadCheckpointsFromAPI}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
            >
              Refresh
            </button>
            <button
              onClick={() => setShowCheckpointPanel(!showCheckpointPanel)}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              {showCheckpointPanel ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              <span className="text-sm text-white">Checkpoints</span>
            </button>
          </div>
        </div>

        {selectedCheckpoint && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-lg p-3 border border-purple-700/50"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <PlayCircle className="w-5 h-5 text-purple-400" />
                <div>
                  <h3 className="text-white font-semibold text-sm">{selectedCheckpoint.name}</h3>
                  <p className="text-purple-200 text-xs">{selectedCheckpoint.description}</p>
                </div>
              </div>
              <div className="text-right text-xs">
                <div className="text-gray-300">Stage {selectedCheckpoint.stage}</div>
                <div className="text-purple-300">Loss: {selectedCheckpoint.loss}</div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Checkpoint Selection */}
      <AnimatePresence>
        {showCheckpointPanel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-800 rounded-lg p-4 border border-gray-700"
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <Database className="w-4 h-4" />
                <span>Your Training Checkpoints</span>
              </h2>
              
              {checkpointError && (
                <div className="text-amber-400 text-sm flex items-center space-x-1">
                  <span>⚠️</span>
                  <span>Using fallback data</span>
                </div>
              )}
            </div>
            
            {isLoadingCheckpoints ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                <span className="ml-3 text-gray-400">Loading your checkpoints...</span>
              </div>
            ) : checkpoints.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <div className="text-4xl mb-2">📁</div>
                <div>No checkpoints found</div>
                <div className="text-sm mt-1">Make sure your server is running on localhost:8000</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {checkpoints.map((checkpoint) => {
                  const styling = getCheckpointStyling(checkpoint.color);
                  const isSelected = selectedCheckpoint?.id === checkpoint.id;
                  
                  return (
                    <motion.button
                      key={checkpoint.id}
                      onClick={() => handleCheckpointSelect(checkpoint)}
                      className={`p-3 rounded-lg border-2 text-left transition-all transform hover:scale-105 ${
                        isSelected 
                          ? `${styling.bg} ${styling.border} ring-2 ring-offset-2 ring-offset-gray-800 ring-purple-500` 
                          : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                      }`}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className={`font-semibold text-sm ${isSelected ? styling.text : 'text-white'}`}>
                          {checkpoint.name}
                        </h3>
                        {isSelected ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <Circle className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                      
                      <p className="text-xs text-gray-400 mb-2">{checkpoint.description}</p>
                      
                      <div className="grid grid-cols-3 gap-1 text-xs mb-2">
                        <div><span className="text-gray-400">Stage:</span> <span className="text-white">{checkpoint.stage}</span></div>
                        <div><span className="text-gray-400">Loss:</span> <span className="text-white">{checkpoint.loss?.toFixed(3) || 'N/A'}</span></div>
                        <div><span className="text-gray-400">Epoch:</span> <span className="text-white">{checkpoint.epoch}</span></div>
                      </div>
                      
                      {/* Real checkpoint metadata */}
                      {checkpoint.timestamp && (
                        <div className="text-xs text-gray-500 mb-2">
                          {new Date(checkpoint.timestamp).toLocaleDateString()}
                        </div>
                      )}
                      
                      <div className="flex flex-wrap gap-1">
                        {checkpoint.characteristics.slice(0, 2).map((char, index) => (
                          <span key={index} className="px-1 py-0.5 bg-gray-600 text-xs text-gray-300 rounded">
                            {char}
                          </span>
                        ))}
                      </div>
                      
                      {/* File path indicator for real checkpoints */}
                      {checkpoint.file_path && (
                        <div className="text-xs text-blue-400 mt-1 truncate" title={checkpoint.file_path}>
                          📁 {checkpoint.file_path.split('/').pop()}
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dance Visualization */}
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <div className="flex items-center justify-between p-3 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
            <h3 className="text-white font-semibold text-sm">Live Stick Figure Animation</h3>
            {selectedCheckpoint && (
              <span className="text-xs text-gray-400">Style: {selectedCheckpoint.danceStyle}</span>
            )}
          </div>
        </div>

        <div className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Canvas */}
            <div className="flex-1 flex justify-center">
              {selectedCheckpoint && positions ? (
                <StickFigureCanvas
                  positions={positions}
                  style={selectedCheckpoint.danceStyle}
                  frame={currentFrame}
                  totalFrames={totalFrames}
                  isPlaying={isPlaying}
                />
              ) : (
                <div className="w-[350px] h-[300px] border border-gray-600 rounded flex items-center justify-center bg-gray-900">
                  <div className="text-center text-gray-400">
                    <div className="text-4xl mb-2">🎭</div>
                    <div className="text-sm">Select a checkpoint to see the dance</div>
                  </div>
                </div>
              )}
            </div>

            {/* Controls */}
            {selectedCheckpoint && (
              <div className="lg:w-64 space-y-3">
                <div className="bg-gray-700 p-3 rounded-lg">
                  <h4 className="text-white font-semibold mb-2 text-sm">Playback Controls</h4>
                  <div className="flex items-center space-x-2 mb-3">
                    <button
                      onClick={togglePlayback}
                      className="p-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={resetAnimation}
                      className="p-2 bg-gray-600 hover:bg-gray-500 rounded transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <div className="text-white text-xs">
                      {currentFrame}/{totalFrames}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-white text-xs">Speed: {playbackSpeed.toFixed(1)}x</label>
                    <input
                      type="range"
                      min="0.1"
                      max="3"
                      step="0.1"
                      value={playbackSpeed}
                      onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="w-full bg-gray-600 rounded-full h-1 mt-3">
                    <div
                      className="bg-blue-500 h-1 rounded-full transition-all duration-200"
                      style={{ width: `${totalFrames > 0 ? (currentFrame / totalFrames) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* Model Info */}
                <div className="bg-gray-700 p-3 rounded-lg">
                  <h4 className="text-white font-semibold mb-2 text-sm">Model Analysis</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Training Loss:</span>
                      <span className="text-white">{selectedCheckpoint.loss}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Epochs:</span>
                      <span className="text-white">{selectedCheckpoint.epoch}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Stage:</span>
                      <span className="text-white">{selectedCheckpoint.stage}/3</span>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <div className="text-xs text-gray-400 mb-1">Capabilities:</div>
                    {selectedCheckpoint.characteristics.map((capability, index) => (
                      <div key={index} className="flex items-center space-x-1 mb-1">
                        <CheckCircle className="w-3 h-3 text-green-400" />
                        <span className="text-xs text-gray-300">{capability}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <h2 className="text-lg font-bold text-white mb-3 flex items-center space-x-2">
          <Activity className="w-4 h-4 text-blue-400" />
          <span>How It Works</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-white font-bold text-sm">1</span>
            </div>
            <h3 className="text-white font-semibold mb-1 text-sm">Select Checkpoint</h3>
            <p className="text-xs text-gray-400">
              Choose from different training stages to see how AI evolves from basic motion to complex choreography
            </p>
          </div>
          
          <div>
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-white font-bold text-sm">2</span>
            </div>
            <h3 className="text-white font-semibold mb-1 text-sm">Watch Animation</h3>
            <p className="text-xs text-gray-400">
              See real-time stick figure animation showing how each model generates different dance styles
            </p>
          </div>
          
          <div>
            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-white font-bold text-sm">3</span>
            </div>
            <h3 className="text-white font-semibold mb-1 text-sm">Compare Results</h3>
            <p className="text-xs text-gray-400">
              Compare different checkpoints to understand progression from simple movements to advanced choreography
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DancingStickFigure;