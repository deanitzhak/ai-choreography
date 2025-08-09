/**
 * StickFigureRenderer.js
 * 2D Canvas renderer for stick figure visualization
 * Clean line-based figure drawing
 */

export class StickFigureRenderer {
  constructor(canvas, width = 400, height = 400) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = width;
    this.height = height;
    
    // Set canvas size
    canvas.width = width;
    canvas.height = height;
    
    // Rendering settings
    this.scale = 150; // Scale factor for coordinates
    this.centerX = width / 2;
    this.centerY = height * 0.7; // Position figure in lower portion
    
    // Style settings
    this.lineWidth = 3;
    this.jointRadius = 4;
    this.colors = {
      basic: '#4ade80',      // Green
      rhythmic: '#3b82f6',   // Blue  
      advanced: '#8b5cf6',   // Purple
      breakdance: '#ef4444', // Red
      ballet: '#ec4899'      // Pink
    };
  }

  /**
   * Clear the canvas
   */
  clear() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    
    // Draw background grid
    this.drawGrid();
  }

  /**
   * Draw background grid for reference
   */
  drawGrid() {
    this.ctx.strokeStyle = 'rgba(75, 85, 99, 0.3)';
    this.ctx.lineWidth = 1;
    
    const gridSize = 40;
    
    // Vertical lines
    for (let x = 0; x <= this.width; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.height);
      this.ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = 0; y <= this.height; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.width, y);
      this.ctx.stroke();
    }
  }

  /**
   * Convert 3D position to 2D screen coordinates
   */
  project3DTo2D(x, y, z) {
    // Simple orthographic projection (ignoring z for now)
    const screenX = this.centerX + (x * this.scale);
    const screenY = this.centerY - (y * this.scale); // Flip Y axis
    return [screenX, screenY];
  }

  /**
   * Draw stick figure from joint positions
   * @param {Array} positions - Array of [x,y,z] joint positions
   * @param {string} style - Dance style for coloring
   */
  drawStickFigure(positions, style = 'basic') {
    if (!positions || positions.length < 24) return;
    
    const color = this.colors[style] || this.colors.basic;
    
    // Draw bones (lines between joints)
    this.drawBones(positions, color);
    
    // Draw joints (circles at joint positions)
    this.drawJoints(positions, color);
    
    // Draw style indicator
    this.drawStyleIndicator(style);
  }

  /**
   * Draw bones as lines between connected joints
   */
  drawBones(positions, color) {
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = this.lineWidth;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    
    // Import bone connections from math service
    const boneConnections = [
      // Spine
      [0, 3], [3, 6], [6, 9], [9, 12], [12, 15],
      // Left arm
      [6, 16], [16, 18], [18, 20], [20, 22],
      // Right arm  
      [6, 17], [17, 19], [19, 21], [21, 23],
      // Left leg
      [0, 1], [1, 4], [4, 7], [7, 10],
      // Right leg
      [0, 2], [2, 5], [5, 8], [8, 11]
    ];
    
    boneConnections.forEach(([startJoint, endJoint]) => {
      if (positions[startJoint] && positions[endJoint]) {
        const [x1, y1] = this.project3DTo2D(...positions[startJoint]);
        const [x2, y2] = this.project3DTo2D(...positions[endJoint]);
        
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
      }
    });
  }

  /**
   * Draw joints as small circles
   */
  drawJoints(positions, color) {
    this.ctx.fillStyle = color;
    
    // Key joints to highlight
    const keyJoints = [0, 15, 16, 17, 22, 23, 10, 11]; // Pelvis, head, shoulders, hands, feet
    
    keyJoints.forEach(jointIndex => {
      if (positions[jointIndex]) {
        const [x, y] = this.project3DTo2D(...positions[jointIndex]);
        
        this.ctx.beginPath();
        this.ctx.arc(x, y, this.jointRadius, 0, Math.PI * 2);
        this.ctx.fill();
      }
    });
  }

  /**
   * Draw style indicator in corner
   */
  drawStyleIndicator(style) {
    const color = this.colors[style];
    const x = 20;
    const y = 30;
    
    // Style circle
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(x, y, 8, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Style text
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '14px monospace';
    this.ctx.fillText(style.toUpperCase(), x + 20, y + 5);
  }

  /**
   * Draw frame information
   */
  drawFrameInfo(frame, totalFrames, isPlaying) {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(this.width - 120, this.height - 50, 115, 45);
    
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '12px monospace';
    this.ctx.fillText(`Frame: ${frame}/${totalFrames}`, this.width - 115, this.height - 30);
    this.ctx.fillText(`Status: ${isPlaying ? 'PLAYING' : 'PAUSED'}`, this.width - 115, this.height - 15);
  }

  /**
   * Draw trajectory trail (optional)
   */
  drawTrajectory(trajectoryPoints, style = 'basic') {
    if (!trajectoryPoints || trajectoryPoints.length < 2) return;
    
    const color = this.colors[style];
    this.ctx.strokeStyle = color + '40'; // Add transparency
    this.ctx.lineWidth = 2;
    
    this.ctx.beginPath();
    trajectoryPoints.forEach((point, index) => {
      const [x, y] = this.project3DTo2D(...point);
      if (index === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    });
    this.ctx.stroke();
  }

  /**
   * Animate stick figure with smooth interpolation
   */
  animateFrame(fromPositions, toPositions, progress, style) {
    if (!fromPositions || !toPositions) return;
    
    // Interpolate between frames
    const interpolatedPositions = fromPositions.map((fromPos, index) => {
      const toPos = toPositions[index];
      if (!fromPos || !toPos) return fromPos || toPos;
      
      return [
        fromPos[0] + (toPos[0] - fromPos[0]) * progress,
        fromPos[1] + (toPos[1] - fromPos[1]) * progress,
        fromPos[2] + (toPos[2] - fromPos[2]) * progress
      ];
    });
    
    this.clear();
    this.drawStickFigure(interpolatedPositions, style);
  }

  /**
   * Update camera/view settings
   */
  updateView({ scale, centerX, centerY }) {
    if (scale !== undefined) this.scale = scale;
    if (centerX !== undefined) this.centerX = centerX;
    if (centerY !== undefined) this.centerY = centerY;
  }

  /**
   * Get current view settings
   */
  getViewSettings() {
    return {
      scale: this.scale,
      centerX: this.centerX,
      centerY: this.centerY,
      width: this.width,
      height: this.height
    };
  }
}