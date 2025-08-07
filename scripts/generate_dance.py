#!/usr/bin/env python3
"""
Bailando Dance Generation Script
# Generates dance videos/GIFs from trained model
# Uses services for all visualization logic
"""

import os
import sys
import torch
import numpy as np
from pathlib import Path

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from lib.services.config_service import ConfigService
from lib.services.dance_generation_service import DanceGenerationService
from lib.models.bailando import BailandoModel

def generate_dances(model, config, num_dances=5):
    """
    # Generate multiple dance sequences using the model
    # Input: trained model, config, number of dances
    # Output: list of generated motion sequences
    """
    print(f"🎨 Generating {num_dances} dance sequences...")
    
    model.eval()
    generated_dances = []
    
    with torch.no_grad():
        for i in range(num_dances):
            print(f"   Generating dance {i+1}/{num_dances}")
            
            # Generate random music features (placeholder)
            music_features = torch.randn(config['data']['sequence_length'], 438).to(config['device'])
            
            # Generate dance using model
            dance_sequence = model.generate_dance(music_features)
            generated_dances.append({
                'dance_id': i+1,
                'motion': dance_sequence.cpu().numpy(),
                'style': f'Generated_Style_{i+1}'
            })
    
    print("✅ Dance generation complete")
    return generated_dances

def main():
    """
    # Main generation function - delegates to services
    """
    # Parse arguments using service
    import argparse
    parser = argparse.ArgumentParser(description="Generate Bailando Dances")
    parser.add_argument('--config', type=str, required=True, help='Config file path')
    parser.add_argument('--checkpoint', type=str, required=True, help='Model checkpoint')
    parser.add_argument('--num_dances', type=int, default=5, help='Number of dances to generate')
    parser.add_argument('--output', type=str, default='outputs/videos', help='Output directory')
    args = parser.parse_args()
    
    # Load config using service
    config = ConfigService.load_config(args.config)
    
    print("🎭 Bailando Dance Generation Started")
    print(f"   Checkpoint: {args.checkpoint}")
    print(f"   Generating: {args.num_dances} dances")
    
    # Load model (simplified - would load actual checkpoint)
    model = BailandoModel(config['model']).to(config['device'])
    
    # Generate dances
    generated_dances = generate_dances(model, config, args.num_dances)
    
    # Create videos/GIFs using generation service
    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    video_files = DanceGenerationService.create_dance_videos(
        generated_dances, output_dir, config
    )
    
    print("🎉 Dance generation complete!")
    print(f"📁 Videos saved to: {output_dir}")
    for video_file in video_files:
        print(f"   - {video_file}")

if __name__ == "__main__":
    main()