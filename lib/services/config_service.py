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
    """
    # Service for loading and managing configuration parameters
    # Input: YAML file path → Output: Dictionary of parameters
    """
    
    @staticmethod
    def load_config(config_path: str) -> dict: 
        """
        # Load configuration from YAML file
        # Formula: Config = YAML.parse(file_path)
        """
        config_path = Path(config_path)
        if not config_path.exists(): 
            raise FileNotFoundError(f"Config file not found: {config_path}")
            
        with open(config_path, 'r') as f: 
            config = yaml.safe_load(f)
        
        return config
    
    @staticmethod
    def parse_training_args() -> argparse.Namespace: 
        """
        # Parse command line arguments for training
        # Returns: Parsed arguments namespace
        """
        parser = argparse.ArgumentParser(description="Bailando Training")
        parser.add_argument('--config', type=str, default='config/bailando_config.yaml',
                           help='Configuration file path')
        parser.add_argument('--resume', type=str, default=None,
                           help='Resume from checkpoint')
        parser.add_argument('--stage', type=int, choices=[1,2,3], default=1,
                           help='Training stage (1=VQ-VAE, 2=GPT, 3=Actor-Critic)')
        
        return parser.parse_args()
    
    @staticmethod
    def parse_validation_args() -> argparse.Namespace: 
        """
        # Parse command line arguments for validation
        # Returns: Parsed arguments namespace
        """
        parser = argparse.ArgumentParser(description="Bailando Validation")
        parser.add_argument('--config', type=str, required=True,
                           help='Configuration file path')
        parser.add_argument('--checkpoint', type=str, required=True,
                           help='Model checkpoint path')
        parser.add_argument('--output', type=str, default='outputs/reports',
                           help='Output directory for reports')
        
        return parser.parse_args()