/**
 * StickFigureMathService.js
 * Mathematical calculations for stick figure motion generation
 * Keeps each dance style under 150 lines
 */

// Joint definitions for SMPL skeleton
export const JOINTS = {
  PELVIS: 0, LEFT_HIP: 1, RIGHT_HIP: 2, SPINE1: 3, LEFT_KNEE: 4, RIGHT_KNEE: 5,
  SPINE2: 6, LEFT_ANKLE: 7, RIGHT_ANKLE: 8, SPINE3: 9, LEFT_FOOT: 10, RIGHT_FOOT: 11,
  NECK: 12, LEFT_COLLAR: 13, RIGHT_COLLAR: 14, HEAD: 15, LEFT_SHOULDER: 16, RIGHT_SHOULDER: 17,
  LEFT_ELBOW: 18, RIGHT_ELBOW: 19, LEFT_WRIST: 20, RIGHT_WRIST: 21, LEFT_HAND: 22, RIGHT_HAND: 23
};

// Bone connections for stick figure lines
export const BONE_CONNECTIONS = [
  // Spine chain
  [JOINTS.PELVIS, JOINTS.SPINE1],
  [JOINTS.SPINE1, JOINTS.SPINE2],
  [JOINTS.SPINE2, JOINTS.SPINE3],
  [JOINTS.SPINE3, JOINTS.NECK],
  [JOINTS.NECK, JOINTS.HEAD],
  
  // Left arm
  [JOINTS.SPINE2, JOINTS.LEFT_SHOULDER],
  [JOINTS.LEFT_SHOULDER, JOINTS.LEFT_ELBOW],
  [JOINTS.LEFT_ELBOW, JOINTS.LEFT_WRIST],
  [JOINTS.LEFT_WRIST, JOINTS.LEFT_HAND],
  
  // Right arm
  [JOINTS.SPINE2, JOINTS.RIGHT_SHOULDER],
  [JOINTS.RIGHT_SHOULDER, JOINTS.RIGHT_ELBOW],
  [JOINTS.RIGHT_ELBOW, JOINTS.RIGHT_WRIST],
  [JOINTS.RIGHT_WRIST, JOINTS.RIGHT_HAND],
  
  // Left leg
  [JOINTS.PELVIS, JOINTS.LEFT_HIP],
  [JOINTS.LEFT_HIP, JOINTS.LEFT_KNEE],
  [JOINTS.LEFT_KNEE, JOINTS.LEFT_ANKLE],
  [JOINTS.LEFT_ANKLE, JOINTS.LEFT_FOOT],
  
  // Right leg
  [JOINTS.PELVIS, JOINTS.RIGHT_HIP],
  [JOINTS.RIGHT_HIP, JOINTS.RIGHT_KNEE],
  [JOINTS.RIGHT_KNEE, JOINTS.RIGHT_ANKLE],
  [JOINTS.RIGHT_ANKLE, JOINTS.RIGHT_FOOT]
];

// Base skeleton proportions
export const SKELETON_PROPORTIONS = {
  [JOINTS.PELVIS]: [0, 0, 0],
  [JOINTS.SPINE1]: [0, 0.15, 0],
  [JOINTS.SPINE2]: [0, 0.35, 0],
  [JOINTS.SPINE3]: [0, 0.55, 0],
  [JOINTS.NECK]: [0, 0.65, 0],
  [JOINTS.HEAD]: [0, 0.8, 0],
  
  [JOINTS.LEFT_SHOULDER]: [-0.2, 0.55, 0],
  [JOINTS.RIGHT_SHOULDER]: [0.2, 0.55, 0],
  [JOINTS.LEFT_ELBOW]: [-0.35, 0.35, 0],
  [JOINTS.RIGHT_ELBOW]: [0.35, 0.35, 0],
  [JOINTS.LEFT_WRIST]: [-0.5, 0.15, 0],
  [JOINTS.RIGHT_WRIST]: [0.5, 0.15, 0],
  [JOINTS.LEFT_HAND]: [-0.55, 0.1, 0],
  [JOINTS.RIGHT_HAND]: [0.55, 0.1, 0],
  
  [JOINTS.LEFT_HIP]: [-0.1, 0, 0],
  [JOINTS.RIGHT_HIP]: [0.1, 0, 0],
  [JOINTS.LEFT_KNEE]: [-0.1, -0.3, 0],
  [JOINTS.RIGHT_KNEE]: [0.1, -0.3, 0],
  [JOINTS.LEFT_ANKLE]: [-0.1, -0.6, 0],
  [JOINTS.RIGHT_ANKLE]: [0.1, -0.6, 0],
  [JOINTS.LEFT_FOOT]: [-0.1, -0.65, 0.1],
  [JOINTS.RIGHT_FOOT]: [0.1, -0.65, 0.1]
};

/**
 * Generate stick figure positions for a frame
 * @param {number} frame - Current frame number
 * @param {number} totalFrames - Total frames in sequence
 * @param {string} style - Dance style (basic, rhythmic, advanced, breakdance, ballet)
 * @returns {Array} Array of [x, y, z] positions for each joint
 */
export const generateStickFigureFrame = (frame, totalFrames, style = 'basic') => {
  const t = frame / totalFrames;
  const positions = [];
  
  // Get base skeleton and apply style-specific transformations
  Object.keys(SKELETON_PROPORTIONS).forEach(jointIndex => {
    const basePos = [...SKELETON_PROPORTIONS[jointIndex]];
    const styledPos = applyStyleTransformation(basePos, t, parseInt(jointIndex), style);
    positions[jointIndex] = styledPos;
  });
  
  return positions;
};

/**
 * Apply style-specific transformations to joint positions
 */
const applyStyleTransformation = (basePos, t, jointIndex, style) => {
  const [baseX, baseY, baseZ] = basePos;
  
  switch (style) {
    case 'basic': return transformBasic(baseX, baseY, baseZ, t, jointIndex);
    case 'rhythmic': return transformRhythmic(baseX, baseY, baseZ, t, jointIndex);
    case 'advanced': return transformAdvanced(baseX, baseY, baseZ, t, jointIndex);
    case 'breakdance': return transformBreakdance(baseX, baseY, baseZ, t, jointIndex);
    case 'ballet': return transformBallet(baseX, baseY, baseZ, t, jointIndex);
    default: return [baseX, baseY, baseZ];
  }
};

// Style transformation functions
const transformBasic = (x, y, z, t, jointIndex) => {
  const sway = Math.sin(t * Math.PI * 2) * 0.05;
  const bounce = Math.sin(t * Math.PI * 4) * 0.02;
  
  if (jointIndex === JOINTS.PELVIS) {
    return [x + sway, y + bounce, z];
  }
  
  return [x + sway * 0.5, y + bounce, z];
};

const transformRhythmic = (x, y, z, t, jointIndex) => {
  const beat = Math.sin(t * Math.PI * 8);
  const sideStep = Math.sin(t * Math.PI * 4) * 0.1;
  
  if (jointIndex === JOINTS.LEFT_SHOULDER || jointIndex === JOINTS.RIGHT_SHOULDER) {
    const side = jointIndex === JOINTS.LEFT_SHOULDER ? -1 : 1;
    return [x + side * beat * 0.1, y + Math.abs(beat) * 0.05, z + beat * 0.05];
  }
  
  if (jointIndex === JOINTS.PELVIS) {
    return [x + sideStep, y + Math.abs(beat) * 0.03, z];
  }
  
  return [x + sideStep * 0.3, y + Math.abs(beat) * 0.02, z];
};

const transformAdvanced = (x, y, z, t, jointIndex) => {
  const wave1 = Math.sin(t * Math.PI * 6);
  const wave2 = Math.cos(t * Math.PI * 4);
  const wave3 = Math.sin(t * Math.PI * 10);
  
  if (jointIndex === JOINTS.LEFT_SHOULDER || jointIndex === JOINTS.RIGHT_SHOULDER) {
    const side = jointIndex === JOINTS.LEFT_SHOULDER ? -1 : 1;
    return [
      x + side * (wave1 * 0.15 + wave3 * 0.05),
      y + wave2 * 0.1 + wave3 * 0.03,
      z + (wave1 + wave2) * 0.08
    ];
  }
  
  if (jointIndex === JOINTS.PELVIS) {
    return [
      x + wave1 * 0.12,
      y + wave2 * 0.04 + wave3 * 0.02,
      z + wave2 * 0.05
    ];
  }
  
  return [
    x + (wave1 + wave3) * 0.06,
    y + wave2 * 0.03,
    z + (wave2 + wave3) * 0.04
  ];
};

const transformBreakdance = (x, y, z, t, jointIndex) => {
  const phase = Math.floor(t * 4) % 2;
  const spin = t * Math.PI * 12;
  
  if (phase === 1) { // Freeze
    if (jointIndex === JOINTS.PELVIS) return [x, y - 0.3, z];
    if (jointIndex === JOINTS.LEFT_HAND) return [x - 0.2, y - 0.4, z];
    if (jointIndex === JOINTS.RIGHT_HAND) return [x + 0.2, y - 0.4, z];
    return [x * 1.2, y - 0.2, z * 1.2];
  } else { // Spin
    const radius = 0.3;
    return [
      x + Math.sin(spin + jointIndex) * radius,
      y + Math.abs(Math.sin(spin)) * 0.2,
      z + Math.cos(spin + jointIndex) * radius
    ];
  }
};

const transformBallet = (x, y, z, t, jointIndex) => {
  const grace = Math.sin(t * Math.PI * 2);
  const extension = Math.cos(t * Math.PI * 3);
  
  if (jointIndex === JOINTS.LEFT_SHOULDER || jointIndex === JOINTS.RIGHT_SHOULDER) {
    const side = jointIndex === JOINTS.LEFT_SHOULDER ? -1 : 1;
    return [
      x + side * (0.1 + extension * 0.2), // Extended arms
      y + grace * 0.05 + 0.1, // Raised arms
      z + extension * 0.1
    ];
  }
  
  if (jointIndex === JOINTS.PELVIS) {
    return [
      x + grace * 0.05,
      y + 0.05 + Math.abs(grace) * 0.02, // Slight elevation
      z
    ];
  }
  
  if (jointIndex === JOINTS.HEAD) {
    return [
      x + grace * 0.02,
      y + Math.abs(grace) * 0.01,
      z + extension * 0.02
    ];
  }
  
  return [
    x + grace * 0.03,
    y + Math.abs(extension) * 0.02,
    z + extension * 0.03
  ];
};

/**
 * Convert positions to line segments for drawing
 * @param {Array} positions - Joint positions
 * @returns {Array} Array of line segments [[x1,y1,z1], [x2,y2,z2]]
 */
export const positionsToLines = (positions) => {
  return BONE_CONNECTIONS.map(([startJoint, endJoint]) => [
    positions[startJoint],
    positions[endJoint]
  ]);
};