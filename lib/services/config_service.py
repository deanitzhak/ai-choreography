#!/usr/bin/env python3
"""
Configuration Service
# Loads YAML config files and provides easy access to parameters
# Mathematical notation: Config = {θ_model, θ_train, θ_data}
"""

import yaml
import argparse
from pathlib import Path

class ConfigService:
    """Service for configuration management"""
    
    @staticmethod
    def load_config(config_path: str) -> dict:
        """Load YAML configuration file"""
        try:
            with open(config_path, 'r') as f:
                config = yaml.safe_load(f)
            return config
        except Exception as e:
            print(f"Error loading config {config_path}: {e}")
            # Return basic fallback config
            return {
                'model': {
                    'motion_dim': 72,
                    'latent_dim': 256,
                    'codebook_size': 1024,
                    'gpt_layers': 12,
                    'embed_dim': 512
                },
                'training': {
                    'learning_rate': 1e-4,
                    'batch_size': 16
                },
                'device': 'cpu',
                'paths': {
                    'logs': 'outputs/logs',
                    'checkpoints': 'outputs/checkpoints'
                }
            }
        
    @staticmethod
    def parse_training_args():
        """Parse training script arguments"""
        parser = argparse.ArgumentParser(description="Enhanced Bailando Training")
        parser.add_argument('--config', type=str, required=True, help='Config file path')
        parser.add_argument('--stage', type=int, default=1, help='Training stage (1, 2, or 3)')
        parser.add_argument('--resume', type=str, help='Resume mode: "latest", "select", or specific checkpoint path')
        parser.add_argument('--run-name', type=str, help='Custom name for this training run')
        parser.add_argument('--preserve-logs', action='store_true', help='Use timestamped log directory')
        return parser.parse_args()  
  
    @staticmethod
    def parse_validation_args():
        """Parse validation script arguments"""
        parser = argparse.ArgumentParser(description="Validate Bailando model")
        parser.add_argument('--config', type=str, required=True, help='Config file path')
        parser.add_argument('--checkpoint', type=str, required=True, help='Checkpoint file path')
        parser.add_argument('--output', type=str, default='outputs/reports', help='Output directory')
        return parser.parse_args()