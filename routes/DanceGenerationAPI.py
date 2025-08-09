from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import torch
import numpy as np
from pathlib import Path
import json

router = APIRouter()

class DanceGenerationRequest(BaseModel):
    checkpoint_path: str
    num_sequences: int = 1
    sequence_length: int = 240
    style: str = "smooth"  # smooth, energetic, classical
    music_features: Optional[List[float]] = None

@router.post("/api/generate/dance")
async def generate_dance_from_checkpoint(request: DanceGenerationRequest):
    """Generate dance sequences from a trained checkpoint"""
    try:
        checkpoint_path = Path(request.checkpoint_path)
        
        if not checkpoint_path.exists():
            raise HTTPException(status_code=404, detail=f"Checkpoint not found: {request.checkpoint_path}")
        
        print(f"🎭 Generating dance from checkpoint: {checkpoint_path}")
        
        # For now, generate synthetic dance data based on the checkpoint
        # In a real implementation, you would load the actual model and generate
        dance_data = generate_synthetic_dance_sequence(
            sequence_length=request.sequence_length,
            style=request.style,
            checkpoint_info=str(checkpoint_path)
        )
        
        return {
            "success": True,
            "dance_data": dance_data,
            "metadata": {
                "checkpoint": str(checkpoint_path),
                "sequence_length": request.sequence_length,
                "style": request.style,
                "num_joints": 24,
                "fps": 30
            }
        }
        
    except Exception as e:
        print(f"❌ Error generating dance: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def generate_synthetic_dance_sequence(sequence_length: int = 240, style: str = "smooth", checkpoint_info: str = ""):
    """Generate synthetic dance data for visualization"""
    
    # SMPL joint names (24 joints)
    joint_names = [
        'pelvis', 'left_hip', 'right_hip', 'spine1', 'left_knee', 'right_knee',
        'spine2', 'left_ankle', 'right_ankle', 'spine3', 'left_foot', 'right_foot',
        'neck', 'left_collar', 'right_collar', 'head', 'left_shoulder', 'right_shoulder',
        'left_elbow', 'right_elbow', 'left_wrist', 'right_wrist', 'left_hand', 'right_hand'
    ]
    
    frames = []
    
    # Style parameters
    if style == "energetic":
        amplitude_multiplier = 1.5
        frequency_multiplier = 2.0
        vertical_motion = 0.3
    elif style == "classical":
        amplitude_multiplier = 0.8
        frequency_multiplier = 0.7
        vertical_motion = 0.1
    else:  # smooth
        amplitude_multiplier = 1.0
        frequency_multiplier = 1.0
        vertical_motion = 0.15
    
    for frame in range(sequence_length):
        t = frame / sequence_length
        frame_data = []
        
        for joint_idx, joint_name in enumerate(joint_names):
            # Base positions and motion patterns
            x, y, z = get_joint_motion(joint_name, t, amplitude_multiplier, frequency_multiplier, vertical_motion)
            frame_data.extend([x, y, z])
        
        frames.append(frame_data)
    
    return frames

def get_joint_motion(joint_name: str, t: float, amp_mult: float, freq_mult: float, vert_motion: float):
    """Get position for a specific joint at time t"""
    
    # Base sine wave with joint-specific parameters
    base_freq = 2 * np.pi * freq_mult
    
    if joint_name == 'pelvis':
        # Central body movement
        x = np.sin(t * base_freq * 2) * 0.2 * amp_mult
        y = 1.0 + np.sin(t * base_freq * 4) * vert_motion
        z = np.cos(t * base_freq * 1.5) * 0.1 * amp_mult
        
    elif 'hip' in joint_name:
        side = 1 if 'left' in joint_name else -1
        x = side * 0.1 + np.sin(t * base_freq * 2) * 0.15 * amp_mult
        y = 0.9 + np.sin(t * base_freq * 4) * vert_motion * 0.5
        z = np.cos(t * base_freq * 2) * 0.05 * amp_mult
        
    elif 'knee' in joint_name:
        side = 1 if 'left' in joint_name else -1
        x = side * 0.1 + np.sin(t * base_freq * 2) * 0.1 * amp_mult
        y = 0.5 + np.abs(np.sin(t * base_freq * 4)) * 0.2 * amp_mult
        z = np.sin(t * base_freq * 4 + np.pi * (1 if 'left' in joint_name else 0)) * 0.3 * amp_mult
        
    elif 'ankle' in joint_name or 'foot' in joint_name:
        side = 1 if 'left' in joint_name else -1
        x = side * 0.1 + np.sin(t * base_freq * 2) * 0.05 * amp_mult
        y = 0.05 if 'foot' in joint_name else 0.1
        z = np.sin(t * base_freq * 4 + np.pi * (1 if 'left' in joint_name else 0)) * 0.4 * amp_mult
        
    elif 'shoulder' in joint_name:
        side = 1 if 'left' in joint_name else -1
        x = side * (0.2 + np.sin(t * base_freq * 3) * 0.3 * amp_mult)
        y = 1.4 + np.cos(t * base_freq * 2) * 0.2 * amp_mult
        z = np.sin(t * base_freq * 2.5) * 0.15 * amp_mult
        
    elif 'elbow' in joint_name:
        side = 1 if 'left' in joint_name else -1
        x = side * (0.4 + np.sin(t * base_freq * 4) * 0.25 * amp_mult)
        y = 1.2 + np.cos(t * base_freq * 3) * 0.3 * amp_mult
        z = np.sin(t * base_freq * 3.5) * 0.2 * amp_mult
        
    elif 'wrist' in joint_name or 'hand' in joint_name:
        side = 1 if 'left' in joint_name else -1
        x = side * (0.5 + np.sin(t * base_freq * 5) * 0.2 * amp_mult)
        y = 1.0 + np.cos(t * base_freq * 4) * 0.4 * amp_mult
        z = np.sin(t * base_freq * 4.5) * 0.25 * amp_mult
        
    elif joint_name == 'head':
        x = np.sin(t * base_freq * 1.5) * 0.1 * amp_mult
        y = 1.7 + np.sin(t * base_freq * 6) * 0.05 * amp_mult
        z = np.cos(t * base_freq * 1.2) * 0.08 * amp_mult
        
    elif joint_name == 'neck':
        x = np.sin(t * base_freq * 1.5) * 0.08 * amp_mult
        y = 1.6 + np.sin(t * base_freq * 6) * 0.03 * amp_mult
        z = np.cos(t * base_freq * 1.2) * 0.06 * amp_mult
        
    elif 'spine' in joint_name:
        spine_level = float(joint_name[-1]) if joint_name[-1].isdigit() else 1
        x = np.sin(t * base_freq * 1.8) * (0.05 + spine_level * 0.02) * amp_mult
        y = 1.0 + spine_level * 0.15 + np.sin(t * base_freq * 3) * 0.08 * amp_mult
        z = np.cos(t * base_freq * 1.5) * 0.04 * amp_mult
        
    elif 'collar' in joint_name:
        side = 1 if 'left' in joint_name else -1
        x = side * 0.15 + np.sin(t * base_freq * 2) * 0.05 * amp_mult
        y = 1.45 + np.cos(t * base_freq * 2.5) * 0.1 * amp_mult
        z = np.sin(t * base_freq * 2.2) * 0.08 * amp_mult
        
    else:
        # Default motion for any unspecified joints
        x = np.sin(t * base_freq + hash(joint_name) % 100) * 0.1 * amp_mult
        y = 1.0 + np.cos(t * base_freq * 2) * 0.1 * amp_mult
        z = np.sin(t * base_freq * 1.5) * 0.05 * amp_mult
    
    return x, y, z

@router.get("/api/generate/styles")
async def get_available_dance_styles():
    """Get available dance styles"""
    return {
        "success": True,
        "styles": [
            {
                "name": "smooth",
                "description": "Fluid, graceful movements with gentle transitions",
                "characteristics": ["flowing", "elegant", "controlled"]
            },
            {
                "name": "energetic", 
                "description": "High-energy, dynamic movements with strong beats",
                "characteristics": ["powerful", "rhythmic", "explosive"]
            },
            {
                "name": "classical",
                "description": "Traditional, refined movements with precise form",
                "characteristics": ["structured", "balanced", "formal"]
            }
        ]
    }

@router.post("/api/generate/music-to-dance")
async def generate_dance_from_music(music_file: str, checkpoint_path: str):
    """Generate dance from music file using trained checkpoint"""
    try:
        # This would be the real implementation using your trained model
        # For now, return synthetic data
        return {
            "success": True,
            "message": "Music-to-dance generation would be implemented here",
            "dance_data": generate_synthetic_dance_sequence(240, "smooth", checkpoint_path)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))