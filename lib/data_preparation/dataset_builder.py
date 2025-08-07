#!/usr/bin/env python3
"""
AIST++ Dataset Builder
# Loads and processes AIST++ dataset for Bailando training
"""

import os
import pickle
import torch
import numpy as np
from torch.utils.data import Dataset
from pathlib import Path

class BailandoDataset(Dataset):
    """
    # PyTorch dataset for AIST++ data
    # Input: AIST++ motion files → Output: Motion sequences for training
    """
    
    def __init__(self, data_path: str, config: dict):
        self.data_path = Path(data_path)
        self.config = config
        self.sequence_length = config['data']['sequence_length']
        
        # Load motion files
        self.motion_files = self._load_motion_files()
        print(f"📊 Loaded {len(self.motion_files)} motion sequences")
    
    def _load_motion_files(self):
        """
        # Load all motion file paths from AIST++ dataset
        # Returns: List of motion file paths
        """
        motions_dir = self.data_path / "motions"
        
        if not motions_dir.exists():
            raise FileNotFoundError(f"Motions directory not found: {motions_dir}")
        
        # Get all .pkl files
        motion_files = list(motions_dir.glob("*.pkl"))
        
        if len(motion_files) == 0:
            raise FileNotFoundError(f"No motion files found in: {motions_dir}")
        
        return motion_files
    
    def _load_motion_data(self, file_path: Path):
        """
        # Load motion data from pickle file
        # Input: File path → Output: Motion array (T, 72)
        """
        try:
            with open(file_path, 'rb') as f:
                data = pickle.load(f)
            
            # Extract SMPL poses
            if 'smpl_poses' in data:
                motion = data['smpl_poses']  # Shape: (T, 72)
            elif 'poses' in data:
                motion = data['poses']
            else:
                # Fallback: assume data is motion array
                motion = data
            
            # Convert to numpy if tensor
            if torch.is_tensor(motion):
                motion = motion.numpy()
            
            return motion
            
        except Exception as e:
            print(f"⚠️ Error loading {file_path}: {e}")
            return None
    
    def _process_motion_sequence(self, motion):
        """
        # Process motion sequence to fixed length
        # Input: Variable length motion → Output: Fixed length motion
        """
        if motion is None:
            return None
        
        # Ensure motion is 2D (T, motion_dim)
        if len(motion.shape) == 3:
            motion = motion.reshape(motion.shape[0], -1)
        
        # Handle sequence length
        if len(motion) >= self.sequence_length:
            # Take first sequence_length frames
            motion = motion[:self.sequence_length]
        else:
            # Pad with zeros if too short
            padding = np.zeros((self.sequence_length - len(motion), motion.shape[1]))
            motion = np.vstack([motion, padding])
        
        # Convert to float32
        motion = motion.astype(np.float32)
        
        return motion
    
    def __len__(self):
        return len(self.motion_files)
    
    def __getitem__(self, idx):
        """
        # Get single training sample
        # Returns: Dictionary with motion data
        """
        file_path = self.motion_files[idx]
        
        # Load and process motion
        motion = self._load_motion_data(file_path)
        motion = self._process_motion_sequence(motion)
        
        if motion is None:
            # Return dummy data if loading failed
            motion = np.zeros((self.sequence_length, 72), dtype=np.float32)
        
        # Convert to tensor
        motion_tensor = torch.from_numpy(motion)
        
        # Create sample dictionary
        sample = {
            'motion': motion_tensor,
            'sequence_name': file_path.stem,
            'file_path': str(file_path)
        }
        
        # Add dummy music features (for now)
        # In full implementation, this would load actual music features
        music_features = torch.randn(self.sequence_length, 438)  # 438 is typical music feature dim
        sample['music'] = music_features
        
        return sample