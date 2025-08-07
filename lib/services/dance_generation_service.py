#!/usr/bin/env python3
"""
Final Optimized Dance Generation Service
- Clearer lines with better visibility
- Smaller joint markers that don't obstruct
- Slightly zoomed-in view
"""

import numpy as np
import matplotlib.pyplot as plt
import matplotlib.animation as animation
from mpl_toolkits.mplot3d import Axes3D
from pathlib import Path
from typing import List, Dict
from matplotlib import colors as mcolors

# Set matplotlib backend for headless generation
import matplotlib
matplotlib.use('Agg')

class DanceGenerationService:
    """
    Service for converting motion sequences to video files
    Input: Motion sequences → Output: GIF/MP4 files
    """
    
    @staticmethod
    def smpl_to_stick_figure(motion_sequence, scale=10.0):
        """
        Convert SMPL motion to 3D stick figure coordinates
        """
        num_frames, motion_dim = motion_sequence.shape
        poses = motion_sequence.reshape(num_frames, 24, 3) * scale
        
        stick_figures = []
        
        for frame in range(num_frames):
            # Basic skeleton structure (simplified)
            pelvis = np.array([0, 0, 0])
            spine = pelvis + poses[frame, 3] * 0.5
            head = spine + np.array([0, 0, 0.3]) + poses[frame, 12] * 0.2
            
            # Arms
            left_shoulder = spine + np.array([-0.2, 0, 0])
            right_shoulder = spine + np.array([0.2, 0, 0])
            left_hand = left_shoulder + poses[frame, 13] * 0.4
            right_hand = right_shoulder + poses[frame, 14] * 0.4
            
            # Legs
            left_hip = pelvis + np.array([-0.1, 0, 0])
            right_hip = pelvis + np.array([0.1, 0, 0])
            left_foot = left_hip + poses[frame, 1] * 0.6
            right_foot = right_hip + poses[frame, 2] * 0.6
            
            stick_figure = {
                'head': head, 'spine': spine, 'pelvis': pelvis,
                'left_shoulder': left_shoulder, 'right_shoulder': right_shoulder,
                'left_hand': left_hand, 'right_hand': right_hand,
                'left_hip': left_hip, 'right_hip': right_hip,
                'left_foot': left_foot, 'right_foot': right_foot
            }
            
            stick_figures.append(stick_figure)
        
        return stick_figures
    
    @staticmethod
    def create_dance_gif(stick_figures, output_path, title="AI Dance"):
        print(f"🎬 Creating final optimized GIF: {output_path}")
        
        fig = plt.figure(figsize=(10, 8), facecolor='white')
        ax = fig.add_subplot(111, projection='3d', facecolor='white')
        
        # Set zoomed-in plot limits and viewing angle
        ax.set_xlim([-1.5, 1.5])
        ax.set_ylim([-1.5, 1.5])
        ax.set_zlim([-1.5, 1.5])
        ax.set_title(title, fontsize=14, pad=20)
        ax.view_init(elev=20, azim=60)
        
        # Configure transparent panes and grid
        ax.xaxis.pane.set_alpha(0.05)
        ax.yaxis.pane.set_alpha(0.05)
        ax.zaxis.pane.set_alpha(0.05)
        ax.grid(True, linestyle='--', color='gray', alpha=0.3)
        
        # Define body connections with more visible colors
        BODY_CONNECTIONS = [
            # (joints, color, linewidth)
            (['pelvis', 'spine', 'head'], 'navy', 3.0),  # Darker blue
            (['left_shoulder', 'left_hand'], 'crimson', 2.5),  # Stronger red
            (['right_shoulder', 'right_hand'], 'forestgreen', 2.5),  # Stronger green
            (['left_hip', 'left_foot'], 'darkviolet', 2.5),  # Stronger purple
            (['right_hip', 'right_foot'], 'darkorange', 2.5),  # Stronger orange
            (['left_shoulder', 'right_shoulder'], 'dimgray', 2.0),
            (['left_hip', 'right_hip'], 'dimgray', 2.0),
            (['spine', 'left_shoulder'], 'royalblue', 2.0),  # Brighter blue
            (['spine', 'right_shoulder'], 'limegreen', 2.0)  # Brighter green
        ]

        # Initialize line objects with thicker lines
        lines = []
        for joints, color, lw in BODY_CONNECTIONS:
            line, = ax.plot([], [], [], color=color, linewidth=lw, alpha=0.9)
            lines.append(line)
        
        # Initialize smaller joint markers
        joint_scatter = ax.scatter([], [], [], s=10, c='black', alpha=0.5, depthshade=True)
        keypoint_scatter = ax.scatter([], [], [], s=40, c='gold', alpha=0.8, 
                                    edgecolors='black', linewidths=0.5, depthshade=True)

        def animate(frame):
            sf = stick_figures[frame]
            
            # Update line segments with more visible colors
            for i, (joints, color, lw) in enumerate(BODY_CONNECTIONS):
                x = [sf[j][0] for j in joints]
                y = [sf[j][1] for j in joints]
                z = [sf[j][2] for j in joints]
                lines[i].set_data(x, y)
                lines[i].set_3d_properties(z)
            
            # Update joint positions with smaller markers
            all_joints = np.array([sf[j] for j in [
                'left_shoulder', 'right_shoulder', 'left_hip', 'right_hip',
                'left_hand', 'right_hand', 'left_foot', 'right_foot'
            ]])
            key_joints = np.array([sf[j] for j in ['head', 'spine', 'pelvis']])
            
            if all_joints.size > 0:
                joint_scatter._offsets3d = (all_joints[:,0], all_joints[:,1], all_joints[:,2])
            if key_joints.size > 0:
                keypoint_scatter._offsets3d = (key_joints[:,0], key_joints[:,1], key_joints[:,2])
            
            return lines + [joint_scatter, keypoint_scatter]
        
        # Create animation
        anim = animation.FuncAnimation(
            fig, animate, frames=len(stick_figures),
            interval=50, blit=False, repeat=True
        )
        
        # Save GIF with higher quality
        anim.save(output_path, writer='pillow', fps=20, dpi=100)
        plt.close(fig)
        
        return str(output_path)
    
    @staticmethod
    def create_dance_videos(generated_dances: List[Dict], output_dir: Path, config: Dict) -> List[str]:
        """
        Create video files for all generated dances
        """
        video_files = []
        
        for dance in generated_dances:
            print(f"🎭 Processing dance {dance['dance_id']}: {dance['style']}")
            
            # Convert motion to stick figure
            stick_figures = DanceGenerationService.smpl_to_stick_figure(
                dance['motion'], scale=8.0
            )
            
            # Create GIF
            gif_filename = f"dance_{dance['style'].lower()}_{dance['dance_id']:03d}.gif"
            gif_path = output_dir / gif_filename
            
            video_file = DanceGenerationService.create_dance_gif(
                stick_figures, gif_path, f"AI {dance['style']} Dance"
            )
            
            video_files.append(video_file)
            print(f"   ✅ Created: {gif_filename}")
        
        return video_files