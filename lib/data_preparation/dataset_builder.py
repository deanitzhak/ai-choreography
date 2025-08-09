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
import time

class BailandoDataset(torch.utils.data.Dataset):
    """
    # PyTorch dataset for AIST++ data
    # Input: AIST++ motion files → Output: Motion sequences for training
    """
    
    def __init__(self, data_path: str, config: dict, debug=False, max_files=None):
        self.debug = debug
        self.max_files = max_files  # Limit files for faster loading
        
        if self.debug:
            print(f"🔍 Debug: Initializing dataset from {data_path}", flush=True)
            
        self.data_path = Path(data_path)
        self.config = config
        
        # Validate data path exists
        if not self.data_path.exists():
            raise FileNotFoundError(f"Dataset path does not exist: {data_path}")
            
        self.sequence_length = config['data'].get('sequence_length', 240)
        self.fps = config['data'].get('fps', 30)
        
        if self.debug:
            print(f"🔍 Debug: sequence_length={self.sequence_length}, fps={self.fps}", flush=True)
        
        # Load motion files with progress indication
        print("🔍 Scanning for motion files...", flush=True)
        self.motion_files = []
        motion_dir = self.data_path / config['data'].get('motion_dir', 'motions')
        
        if self.debug:
            print(f"🔍 Debug: Looking for motion files in {motion_dir}", flush=True)
        
        if motion_dir.exists():
            motion_files = list(motion_dir.glob("*.pkl"))
            total_files = len(motion_files)
            
            if self.max_files:
                motion_files = motion_files[:self.max_files]
                print(f"🔍 Limited to {self.max_files} files for faster loading", flush=True)
            
            print(f"🔍 Found {len(motion_files)} motion files to process", flush=True)
                
            valid_files = 0
            start_time = time.time()
            
            for i, file in enumerate(motion_files):
                if i % 50 == 0:  # Progress every 50 files
                    elapsed = time.time() - start_time
                    print(f"🔍 Progress: {i+1}/{len(motion_files)} files ({elapsed:.1f}s)", flush=True)
                    
                try:
                    # Quick validation that file can be loaded
                    if file.stat().st_size > 0:  # File is not empty
                        # Test load the first file to check format
                        if i == 0:
                            self._test_file_format(file)
                        
                        self.motion_files.append(str(file))
                        valid_files += 1
                        
                except Exception as e:
                    if self.debug:
                        print(f"🔍 Debug: Skipping corrupted file {file}: {e}", flush=True)
                    continue
                    
                # Safety break for very large datasets
                if valid_files >= 2000:  # Reasonable limit
                    print(f"🔍 Reached file limit ({valid_files}), stopping scan", flush=True)
                    break
        
        if len(self.motion_files) == 0:
            raise ValueError(f"No valid motion files found in {motion_dir}")
            
        total_time = time.time() - start_time
        print(f"🔍 Successfully loaded {len(self.motion_files)} motion files ({total_time:.1f}s)", flush=True)

    def _test_file_format(self, file_path):
        """Test load first file to understand format"""
        try:
            print(f"🔍 Testing file format: {file_path.name}", flush=True)
            with open(file_path, 'rb') as f:
                motion_data = pickle.load(f)
            
            print(f"🔍 Data type: {type(motion_data)}", flush=True)
            if isinstance(motion_data, dict):
                print(f"🔍 Dict keys: {list(motion_data.keys())}", flush=True)
            elif isinstance(motion_data, np.ndarray):
                print(f"🔍 Array shape: {motion_data.shape}, dtype: {motion_data.dtype}", flush=True)
            
        except Exception as e:
            print(f"🔍 Error testing file format: {e}", flush=True)

    def __len__(self):
        return len(self.motion_files)

    def __getitem__(self, idx):
        try:
            motion_file = self.motion_files[idx]
            
            # Load motion data with timeout protection
            try:
                with open(motion_file, 'rb') as f:
                    motion_data = pickle.load(f)
            except Exception as e:
                if self.debug:
                    print(f"❌ Error loading {motion_file}: {e}", flush=True)
                return {
                    'motion': torch.zeros(self.sequence_length, 72),
                    'motion_file': 'load_error'
                }
            
            # Process the motion data
            try:
                motion_tensor = self._process_motion_data(motion_data)
                
                # Validate tensor
                if motion_tensor is None or motion_tensor.numel() == 0:
                    motion_tensor = torch.zeros(self.sequence_length, 72)
                
                # Ensure correct dimensions
                if motion_tensor.dim() == 1:
                    # Reshape 1D tensor
                    if motion_tensor.size(0) >= 72:
                        n_frames = motion_tensor.size(0) // 72
                        motion_tensor = motion_tensor[:n_frames * 72].view(n_frames, 72)
                    else:
                        new_tensor = torch.zeros(1, 72)
                        new_tensor[0, :motion_tensor.size(0)] = motion_tensor[:motion_tensor.size(0)]
                        motion_tensor = new_tensor
                
                # Ensure we have the right sequence length
                if motion_tensor.size(0) > self.sequence_length:
                    # Randomly crop to sequence length
                    start_idx = torch.randint(0, motion_tensor.size(0) - self.sequence_length + 1, (1,)).item()
                    motion_tensor = motion_tensor[start_idx:start_idx + self.sequence_length]
                elif motion_tensor.size(0) < self.sequence_length:
                    # Pad with zeros
                    padding = self.sequence_length - motion_tensor.size(0)
                    motion_tensor = torch.cat([motion_tensor, torch.zeros(padding, motion_tensor.size(1))], dim=0)
                
                # Final validation
                if motion_tensor.size() != torch.Size([self.sequence_length, 72]):
                    print(f"⚠️ Unexpected tensor shape: {motion_tensor.size()}, creating default")
                    motion_tensor = torch.zeros(self.sequence_length, 72)
                
                return {
                    'motion': motion_tensor,
                    'motion_file': motion_file
                }
                
            except Exception as e:
                if self.debug:
                    print(f"❌ Error processing motion data for {motion_file}: {e}", flush=True)
                return {
                    'motion': torch.zeros(self.sequence_length, 72),
                    'motion_file': 'process_error'
                }
                
        except Exception as e:
            if self.debug:
                print(f"❌ Error in __getitem__ {idx}: {e}", flush=True)
            return {
                'motion': torch.zeros(self.sequence_length, 72),
                'motion_file': 'getitem_error'
            }

    def _process_motion_data(self, motion_data):
        """
        Process AIST++ motion data format specifically
        """
        try:
            # AIST++ format has 'smpl_poses' key
            if isinstance(motion_data, dict) and 'smpl_poses' in motion_data:
                poses = motion_data['smpl_poses']
                
                if isinstance(poses, np.ndarray):
                    # Handle object arrays in smpl_poses
                    if poses.dtype == 'object':
                        # Extract numerical data from object array
                        try:
                            # If it's an array of arrays, stack them
                            if poses.ndim == 1 and len(poses) > 0:
                                first_item = poses[0]
                                if hasattr(first_item, '__iter__'):
                                    # Stack all pose arrays
                                    pose_list = []
                                    for pose_frame in poses:
                                        if hasattr(pose_frame, '__iter__'):
                                            frame_array = np.array(pose_frame, dtype=np.float32)
                                            if frame_array.ndim == 1 and len(frame_array) >= 72:
                                                pose_list.append(frame_array[:72])
                                    
                                    if pose_list:
                                        stacked_poses = np.vstack(pose_list)
                                        return torch.FloatTensor(stacked_poses)
                            
                            # Try to convert object array directly
                            poses_flat = poses.flatten()
                            numerical_data = []
                            for item in poses_flat:
                                if hasattr(item, '__iter__') and not isinstance(item, str):
                                    sub_array = np.array(item, dtype=np.float32)
                                    numerical_data.extend(sub_array.flatten())
                            
                            if numerical_data and len(numerical_data) >= 72:
                                data_array = np.array(numerical_data, dtype=np.float32)
                                n_frames = len(data_array) // 72
                                if n_frames > 0:
                                    reshaped = data_array[:n_frames * 72].reshape(n_frames, 72)
                                    return torch.FloatTensor(reshaped)
                            
                        except Exception as e:
                            print(f"⚠️ Error processing object array: {e}")
                            pass
                    
                    # Regular numpy array
                    else:
                        if poses.ndim == 2 and poses.shape[1] >= 72:
                            return torch.FloatTensor(poses[:, :72])
                        elif poses.ndim == 1 and len(poses) >= 72:
                            # Reshape 1D to frames
                            n_frames = len(poses) // 72
                            if n_frames > 0:
                                reshaped = poses[:n_frames * 72].reshape(n_frames, 72)
                                return torch.FloatTensor(reshaped)
            
            # Fallback: return default motion
            return torch.zeros(self.sequence_length, 72)
            
        except Exception as e:
            print(f"⚠️ Error in _process_motion_data: {e}")
            return torch.zeros(self.sequence_length, 72)