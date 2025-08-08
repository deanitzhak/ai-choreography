#!/usr/bin/env python3
"""
Bailando Training Script
# Simple training script that uses services for all logic
# Keeps script under 100 lines by delegating to services
"""

import os
import sys
import json
import torch
from pathlib import Path

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from lib.services.config_service import ConfigService
from lib.services.math_service import MathService
from lib.models.bailando import BailandoModel
from lib.data_preparation.dataset_builder import BailandoDataset

def train_stage(model, data_loader, config, stage):
    """
    # Train single stage using math service for loss calculations
    # Input: model, data, config, stage_number
    # Output: training metrics dictionary
    """
    print(f"🚀 Training Stage {stage}")
    
    # Setup optimizer based on stage
    if stage == 1:
        optimizer = torch.optim.Adam(model.vq_vae.parameters(), lr=config['training']['learning_rate'])
        epochs = config['training']['vq_vae_epochs']
    elif stage == 2:
        optimizer = torch.optim.Adam(model.gpt.parameters(), lr=config['training']['learning_rate'])
        epochs = config['training']['gpt_epochs']
    else:
        optimizer = torch.optim.Adam(model.parameters(), lr=config['training']['learning_rate'])
        epochs = config['training']['actor_critic_epochs']
    
    # Training loop
    for epoch in range(epochs):
        epoch_loss = 0.0
        
        for batch in data_loader:
            motion = batch['motion'].to(config['device'])
            music = batch.get('music', None)
            
            # Forward pass based on stage
            if stage == 1:
                # VQ-VAE training
                x_recon, z_e, z_q, vq_loss, indices = model.vq_vae(motion)
                loss, losses = MathService.vq_vae_loss(x_recon, motion, z_e, z_q)
            elif stage == 2:
                # GPT training  
                logits = model.gpt(motion, music)
                loss = MathService.gpt_loss(logits, motion)
            else:
                # Actor-Critic training
                advantages, log_probs, values, returns, entropy = model.actor_critic_forward(motion, music)
                actor_loss, critic_loss = MathService.actor_critic_loss(advantages, log_probs, values, returns, entropy)
                loss = actor_loss + critic_loss
            
            # Backward pass
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
            
            epoch_loss += loss.item()
        
        print(f"  Epoch {epoch+1}/{epochs}, Loss: {epoch_loss/len(data_loader):.4f}")
        
        # Save training state every save_every epochs
        if (epoch + 1) % config['training']['save_every'] == 0:
            save_training_state(stage, epoch, epoch_loss/len(data_loader), config)
            save_model_checkpoint(model, optimizer, stage, epoch, epoch_loss/len(data_loader), config)
    
    return {'stage': stage, 'final_loss': epoch_loss/len(data_loader)}

def save_model_checkpoint(model, optimizer, stage, epoch, loss, config):
    """
    Save model checkpoint (overwrite previous one)
    """
    import torch
    from datetime import datetime
    
    checkpoint = {
        'epoch': epoch,
        'stage': stage,
        'model_state_dict': model.state_dict(),
        'optimizer_state_dict': optimizer.state_dict(),
        'loss': loss,
        'config': config,
        'timestamp': datetime.now().isoformat()
    }
    
    # Create checkpoints directory
    checkpoints_dir = Path(config['paths']['checkpoints'])
    checkpoints_dir.mkdir(parents=True, exist_ok=True)
    
    # Always overwrite the same file
    checkpoint_file = checkpoints_dir / "model_latest.pth"
    torch.save(checkpoint, checkpoint_file)
    
    print(f"💾 Checkpoint saved (overwritten): {checkpoint_file}")
    
def save_training_state(stage, epoch, loss, config):
    """
    # Save training state to JSON file for validation script
    # Formula: State = {stage, epoch, loss, timestamp, config}
    """
    from datetime import datetime
    
    training_state = {
        'stage': stage,
        'epoch': epoch,
        'loss': loss,
        'timestamp': datetime.now().isoformat(),
        'config': config
    }
    
    # Save to logs directory
    logs_dir = Path(config['paths']['logs'])
    logs_dir.mkdir(parents=True, exist_ok=True)
    
    state_file = logs_dir / f"training_state_stage_{stage}_epoch_{epoch}.json"
    with open(state_file, 'w') as f:
        json.dump(training_state, f, indent=2)

def main():
    """
    # Main training function - delegates everything to services
    """
    # Parse arguments using service
    args = ConfigService.parse_training_args()
    
    # Load config using service
    config = ConfigService.load_config(args.config)
    
    print("🎭 Bailando Training Started")
    print(f"   Config: {args.config}")
    print(f"   Device: {config['device']}")
    
    # Load data using dataset builder
    dataset = BailandoDataset(config['data']['dataset_path'], config)
    data_loader = torch.utils.data.DataLoader(dataset, batch_size=config['training']['batch_size'])
    
    # Initialize model
    model = BailandoModel(config['model']).to(config['device'])
    
    # Run 3-stage training
    for stage in range(1, 4):
        metrics = train_stage(model, data_loader, config, stage)
        print(f"✅ Stage {stage} complete: {metrics}")
    
    print("🎉 Training Complete!")

if __name__ == "__main__":
    main()#!/usr/bin/env python3
"""
Bailando Training Script
# Simple training script that uses services for all logic
# Keeps script under 100 lines by delegating to services
"""

import os
import sys
import json
import torch
from pathlib import Path

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from lib.services.config_service import ConfigService
from lib.services.math_service import MathService
from lib.models.bailando import BailandoModel
from lib.data_preparation.dataset_builder import BailandoDataset

def train_stage(model, data_loader, config, stage):
    """
    # Train single stage using math service for loss calculations
    # Input: model, data, config, stage_number
    # Output: training metrics dictionary
    """
    print(f"🚀 Training Stage {stage}")
    
    # Setup optimizer based on stage
    if stage == 1:
        optimizer = torch.optim.Adam(model.vq_vae.parameters(), lr=config['training']['learning_rate'])
        epochs = config['training']['vq_vae_epochs']
    elif stage == 2:
        optimizer = torch.optim.Adam(model.gpt.parameters(), lr=config['training']['learning_rate'])
        epochs = config['training']['gpt_epochs']
    else:
        optimizer = torch.optim.Adam(model.parameters(), lr=config['training']['learning_rate'])
        epochs = config['training']['actor_critic_epochs']
    
    # Training loop
    for epoch in range(epochs):
        epoch_loss = 0.0
        
        for batch in data_loader:
            motion = batch['motion'].to(config['device'])
            music = batch.get('music', None)
            
            # Forward pass based on stage
            if stage == 1:
                # VQ-VAE training
                x_recon, z_e, z_q, vq_loss, indices = model.vq_vae(motion)
                loss, losses = MathService.vq_vae_loss(x_recon, motion, z_e, z_q)
            elif stage == 2:
                # GPT training  
                logits = model.gpt(motion, music)
                loss = MathService.gpt_loss(logits, motion)
            else:
                # Actor-Critic training
                advantages, log_probs, values, returns, entropy = model.actor_critic_forward(motion, music)
                actor_loss, critic_loss = MathService.actor_critic_loss(advantages, log_probs, values, returns, entropy)
                loss = actor_loss + critic_loss
            
            # Backward pass
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
            
            epoch_loss += loss.item()
        
        print(f"  Epoch {epoch+1}/{epochs}, Loss: {epoch_loss/len(data_loader):.4f}")
        
        # Save training state every save_every epochs
        if (epoch + 1) % config['training']['save_every'] == 0:
            save_training_state(stage, epoch, epoch_loss/len(data_loader), config)
            save_model_checkpoint(model, optimizer, stage, epoch, epoch_loss/len(data_loader), config)
    
    return {'stage': stage, 'final_loss': epoch_loss/len(data_loader)}

def save_model_checkpoint(model, optimizer, stage, epoch, loss, config):
    """
    # Save model checkpoint for resuming training and inference
    # Format: {model_state_dict, optimizer_state_dict, epoch, stage, loss}
    """
    import torch
    from datetime import datetime
    
    checkpoint = {
        'epoch': epoch,
        'stage': stage,
        'model_state_dict': model.state_dict(),
        'optimizer_state_dict': optimizer.state_dict(),
        'loss': loss,
        'config': config,
        'timestamp': datetime.now().isoformat()
    }
    
    # Create checkpoints directory
    checkpoints_dir = Path(config['paths']['checkpoints'])
    checkpoints_dir.mkdir(parents=True, exist_ok=True)
    
    # Save checkpoint
    checkpoint_file = checkpoints_dir / f"model_stage_{stage}_epoch_{epoch+1}.pth"
    torch.save(checkpoint, checkpoint_file)
    
    print(f"💾 Checkpoint saved: {checkpoint_file}")

def save_training_state(stage, epoch, loss, config):
    """
    # Save training state to JSON file for validation script
    # Formula: State = {stage, epoch, loss, timestamp, config}
    """
    from datetime import datetime
    
    training_state = {
        'stage': stage,
        'epoch': epoch,
        'loss': loss,
        'timestamp': datetime.now().isoformat(),
        'config': config
    }
    
    # Save to logs directory
    logs_dir = Path(config['paths']['logs'])
    logs_dir.mkdir(parents=True, exist_ok=True)
    
    state_file = logs_dir / f"training_state_stage_{stage}_epoch_{epoch}.json"
    with open(state_file, 'w') as f:
        json.dump(training_state, f, indent=2)

def main():
    """
    # Main training function - delegates everything to services
    """
    # Parse arguments using service
    args = ConfigService.parse_training_args()
    
    # Load config using service
    config = ConfigService.load_config(args.config)
    
    print("🎭 Bailando Training Started")
    print(f"   Config: {args.config}")
    print(f"   Device: {config['device']}")
    
    # Load data using dataset builder
    dataset = BailandoDataset(config['data']['dataset_path'], config)
    data_loader = torch.utils.data.DataLoader(dataset, batch_size=config['training']['batch_size'])
    
    # Initialize model
    model = BailandoModel(config['model']).to(config['device'])
    
    # Run 3-stage training
    for stage in range(1, 4):
        metrics = train_stage(model, data_loader, config, stage)
        print(f"✅ Stage {stage} complete: {metrics}")
    
    print("🎉 Training Complete!")

if __name__ == "__main__":
    main()