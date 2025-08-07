import torch
from lib.services.config_service import ConfigService
from lib.models.bailando import BailandoModel
from pathlib import Path
import json

# Load config
config = ConfigService.load_config('config/bailando_config.yaml')

# Create model (it will have random weights, but good for testing)
model = BailandoModel(config['model']).to(config['device'])

# Create checkpoint
checkpoint = {
    'epoch': 59,
    'stage': 1,
    'model_state_dict': model.state_dict(),
    'loss': 293.67,
    'config': config
}

# Save checkpoint
checkpoints_dir = Path('outputs/checkpoints')
checkpoints_dir.mkdir(parents=True, exist_ok=True)

checkpoint_file = checkpoints_dir / 'model.pth'
torch.save(checkpoint, checkpoint_file)

print(f"✅ Manual checkpoint created: {checkpoint_file}")
