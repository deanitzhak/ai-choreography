#!/usr/bin/env python3
"""Debug config requirements"""

import os
import sys
from pathlib import Path

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from lib.services.config_service import ConfigService

def debug_config_access():
    """Debug what config keys are being accessed"""
    config_path = "config/bailando_config_stable.yaml"
    config = ConfigService.load_config(config_path)
    
    print("🔍 Debugging config access patterns...")
    
    # Common patterns the training script might be looking for
    test_keys = [
        "training.learning_rate",
        "training.vq_vae_epochs", 
        "training.gpt_epochs",
        "training.batch_size",
        "training.save_interval",
        "model.motion_dim",
        "model.latent_dim",
        "data.dataset_path",
        "device"
    ]
    
    for key_path in test_keys:
        try:
            parts = key_path.split('.')
            value = config
            for part in parts:
                value = value[part]
            print(f"✅ {key_path}: {value}")
        except (KeyError, TypeError) as e:
            print(f"❌ {key_path}: Missing - {e}")
    
    print(f"\n📋 Full config structure:")
    import json
    print(json.dumps(config, indent=2))

if __name__ == "__main__":
    debug_config_access()