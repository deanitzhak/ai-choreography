#!/usr/bin/env python3
"""
Dance Generation Service
# Creates dance videos and GIFs from motion sequences
# Handles stick figure animation and video export
"""

import numpy as np
import matplotlib.pyplot as plt
import matplotlib.animation as animation
from mpl_toolkits.mplot3d import Axes3D
from pathlib import Path
from typing import List, Dict

# Set matplotlib backend for headless generation
import matplotlib
matplotlib.use('Agg')

class DanceGenerationService:
    """
    # Service for converting motion sequences to video files
    # Input: Motion sequences → Output: GIF/MP4 files
    """
    
    @staticmethod
    def smpl_to_stick_figure(motion_sequence, scale=10.0):
        """
        # Convert SMPL motion to 3D stick figure coordinates
        # Formula: Joint_pos = f(SMPL_pose) * scale_factor
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
        """
        # Create animated GIF from stick figure sequence
        # Input: stick figure coordinates, output path
        # Output: GIF file
        """
        print(f"🎬 Creating GIF: {output_path}")
        
        fig = plt.figure(figsize=(8, 8))
        ax = fig.add_subplot(111, projection='3d')
        
        # Set plot limits
        ax.set_xlim([-2, 2])
        ax.set_ylim([-2, 2])
        ax.set_zlim([-2, 2])
        ax.set_title(title)
        
        # Initialize lines
        body_lines = []
        colors = ['blue', 'red', 'green', 'orange', 'purple']
        
        for i in range(5):  # 5 body segments
            line, = ax.plot([], [], [], color=colors[i], linewidth=3)
            body_lines.append(line)
        
        head_point, = ax.plot([], [], [], 'ko', markersize=10)
        
        def animate(frame):
            sf = stick_figures[frame]
            
            # Update body segments
            # Torso
            body_lines[0].set_data([sf['pelvis'][0], sf['spine'][0]], 
                                  [sf['pelvis'][1], sf['spine'][1]])
            body_lines[0].set_3d_properties([sf['pelvis'][2], sf['spine'][2]])
            
            # Left arm
            body_lines[1].set_data([sf['left_shoulder'][0], sf['left_hand'][0]], 
                                  [sf['left_shoulder'][1], sf['left_hand'][1]])
            body_lines[1].set_3d_properties([sf['left_shoulder'][2], sf['left_hand'][2]])
            
            # Right arm
            body_lines[2].set_data([sf['right_shoulder'][0], sf['right_hand'][0]], 
                                  [sf['right_shoulder'][1], sf['right_hand'][1]])
            body_lines[2].set_3d_properties([sf['right_shoulder'][2], sf['right_hand'][2]])
            
            # Left leg
            body_lines[3].set_data([sf['left_hip'][0], sf['left_foot'][0]], 
                                  [sf['left_hip'][1], sf['left_foot'][1]])
            body_lines[3].set_3d_properties([sf['left_hip'][2], sf['left_foot'][2]])
            
            # Right leg
            body_lines[4].set_data([sf['right_hip'][0], sf['right_foot'][0]], 
                                  [sf['right_hip'][1], sf['right_foot'][1]])
            body_lines[4].set_3d_properties([sf['right_hip'][2], sf['right_foot'][2]])
            
            # Head
            head_point.set_data([sf['head'][0]], [sf['head'][1]])
            head_point.set_3d_properties([sf['head'][2]])
            
            return body_lines + [head_point]
        
        # Create animation
        anim = animation.FuncAnimation(
            fig, animate, frames=len(stick_figures),
            interval=50, blit=False, repeat=True
        )
        
        # Save GIF
        anim.save(output_path, writer='pillow', fps=20)
        plt.close(fig)
        
        return str(output_path)
    
    @staticmethod
    def create_dance_videos(generated_dances: List[Dict], output_dir: Path, config: Dict) -> List[str]:
        """
        # Create video files for all generated dances
        # Input: List of dance dictionaries with motion data
        # Output: List of created video file paths
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