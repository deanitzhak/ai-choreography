
import os
import sys
import json
import torch
from pathlib import Path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from lib.services.config_service import ConfigService
from lib.services.math_service import MathService
from lib.models.bailando import BailandoModel
from lib.data_preparation.dataset_builder import BailandoDataset



# Note the trainstage is for 
def train_stage(model, data_loader, config, stage, start_epoch=0):
    print(f"🚀 Training Stage {stage} (starting from epoch {start_epoch + 1})")

        # Setup optimizer based on stage 
    if stage == 1:
        optimizer = torch.optim.Adam(model.vq_vae.parameters(),
                                     lr=config['training']['vq_vae_lr'])
        epochs = config['training']['vq_vae_epochs']
    elif stage == 2:
        optimizer = torch.optim.Adam(model.gpt.parameters(),
                                     lr=config['training']['gpt_lr'])
        epochs = config['training']['gpt_epochs']
    else:
        optimizer = torch.optim.Adam(model.parameters(),
                                     lr=config['training']['critic_lr'])
        epochs = config['training']['critic_epochs']

    # Initialize avg_loss to prevent UnboundLocalError
    avg_loss = 0.0
    
    # Check if we've already completed training
    if start_epoch >= epochs:
        print(f"✅ Training already complete for stage {stage} (epoch {start_epoch}/{epochs})")
        # Load the final loss from the latest checkpoint if available
        checkpoints_dir = Path(config['paths']['checkpoints'])
        latest_file = checkpoints_dir / f"model_stage_{stage}_latest.pth"
        
        if latest_file.exists():
            try:
                checkpoint = torch.load(latest_file, map_location=config['device'])
                avg_loss = checkpoint.get('loss', 0.0)
                print(f"📊 Final loss from checkpoint: {avg_loss:.4f}")
            except Exception as e:
                print(f"⚠️ Could not load final loss from checkpoint: {e}")
        
        return {'stage': stage, 'final_loss': avg_loss, 'epochs_completed': start_epoch}

    # Validate data loader
    if len(data_loader) == 0:
        print("❌ Error: Data loader is empty. Check your dataset configuration.")
        return {'stage': stage, 'final_loss': avg_loss, 'error': 'empty_dataloader'}

    print(f"📊 Training {epochs - start_epoch} epochs with {len(data_loader)} batches each")

    # Training loop
    for epoch in range(start_epoch, epochs):
        epoch_loss = 0.0
        batch_count = 0

        print(f"🔄 Epoch {epoch + 1}/{epochs} - Processing {len(data_loader)} batches...")

        for batch_idx, batch in enumerate(data_loader):
            try:
                motion = batch['motion'].to(config['device'])
                music = batch.get('music', None)

                # Forward pass based on stage
                if stage == 1:
                    # Stage 1: VQ-VAE training
                    x_recon, z_e, z_q, vq_loss, indices = model.vq_vae(motion)
                    loss, losses = MathService.vq_vae_loss(x_recon, motion, z_e, z_q)
                    
                elif stage == 2:
                    # Stage 2: GPT training - FIXED
                    # First, get VQ codes from the trained VQ-VAE (frozen)
                    with torch.no_grad():
                        model.vq_vae.eval()  # Set to eval mode
                        # Get VQ codes without gradients
                        try:
                            _, _, _, _, indices = model.vq_vae(motion)
                        except ValueError as e:
                            # Handle unpacking error
                            print(f"⚠️ VQ-VAE output error: {e}")
                            vq_output = model.vq_vae(motion)
                            if isinstance(vq_output, tuple) and len(vq_output) >= 5:
                                indices = vq_output[4]  # Get the indices (last element)
                            else:
                                print(f"❌ Unexpected VQ-VAE output format: {type(vq_output)}")
                                continue
                    
                    model.gpt.train()  # Set GPT to train mode
                    
                    # Create input (all tokens except last) and target (all tokens except first)
                    if indices.dim() > 2:
                        # Flatten spatial dimensions if needed
                        indices = indices.view(indices.size(0), -1)
                    
                    if indices.size(1) <= 1:
                        print("⚠️ Sequence too short for GPT training")
                        continue
                        
                    input_indices = indices[:, :-1]  # Remove last token
                    target_indices = indices[:, 1:]  # Remove first token
                    
                    # Forward pass through GPT
                    try:
                        logits = model.gpt(input_indices, music)
                        
                        # Compute cross-entropy loss
                        loss = torch.nn.functional.cross_entropy(
                            logits.reshape(-1, logits.size(-1)),
                            target_indices.reshape(-1)
                        )
                    except Exception as e:
                        print(f"❌ GPT forward pass error: {e}")
                        continue
                    
                else:
                    # Stage 3: Actor-Critic training
                    advantages, log_probs, values, returns, entropy = model.actor_critic_forward(motion, music)
                    actor_loss, critic_loss = MathService.actor_critic_loss(
                        advantages, log_probs, values, returns, entropy
                    )
                    loss = actor_loss + critic_loss

                # Backward pass
                optimizer.zero_grad()
                loss.backward()
                
                # Gradient clipping
                if 'gradient_clip' in config['training']:
                    torch.nn.utils.clip_grad_norm_(
                        model.parameters(), 
                        config['training']['gradient_clip']
                    )
                
                optimizer.step()

                epoch_loss += loss.item()
                batch_count += 1

                # Progress indicator for long epochs
                if batch_count % max(1, len(data_loader) // 4) == 0:
                    progress = (batch_count / len(data_loader)) * 100
                    current_avg = epoch_loss / batch_count
                    print(f"   Progress: {progress:.1f}% - Current avg loss: {current_avg:.4f}")

            except Exception as e:
                print(f"❌ Error in batch {batch_idx}: {e}")
                import traceback
                traceback.print_exc()
                continue

        # Calculate average loss for this epoch
        if batch_count > 0:
            avg_loss = epoch_loss / batch_count
            print(f"  ✅ Epoch {epoch + 1}/{epochs} Complete - Loss: {avg_loss:.4f}")
        else:
            print(f"  ⚠️ Epoch {epoch + 1}/{epochs} - No valid batches processed")
            avg_loss = float('inf')

        # Save training state & checkpoint every save_every epochs
        save_every = config['training'].get('save_every', 10)
        if (epoch + 1) % save_every == 0:
            print(f"💾 Saving checkpoint at epoch {epoch + 1}...")
            save_training_state(stage, epoch, avg_loss, config)
            save_model_checkpoint(model, optimizer, stage, epoch, avg_loss, config)

        # Early stopping check
        if avg_loss == float('inf'):
            print("❌ Training failed - infinite loss detected")
            break

    print(f"🏁 Stage {stage} training complete. Final loss: {avg_loss:.4f}")
    return {'stage': stage, 'final_loss': avg_loss, 'epochs_completed': epochs}

def save_model_checkpoint(model, optimizer, stage, epoch, loss, config):
    """
    Save model checkpoint - BOTH latest AND timestamped versions
    """
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

    checkpoints_dir = Path(config['paths']['checkpoints'])
    checkpoints_dir.mkdir(parents=True, exist_ok=True)

    try:
        # Save timestamped version (NEVER overwrites)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        timestamped_file = checkpoints_dir / f"model_stage_{stage}_epoch_{epoch+1}_{timestamp}.pth"
        torch.save(checkpoint, timestamped_file)
        print(f"💾 Checkpoint saved: {timestamped_file}")

        # ALSO save latest version (for easy resuming)
        latest_file = checkpoints_dir / f"model_stage_{stage}_latest.pth"
        torch.save(checkpoint, latest_file)
        print(f"🔄 Latest updated: {latest_file}")
        
    except Exception as e:
        print(f"❌ Error saving checkpoint: {e}")

def select_checkpoint_interactive(checkpoints_dir, stage):
    """
    Let user choose which checkpoint to resume from
    """
    checkpoint_files = list(checkpoints_dir.glob(f"model_stage_{stage}_*.pth"))
    
    if not checkpoint_files:
        print(f"❌ No checkpoints found for stage {stage}")
        return None
    
    # Sort by modification time (newest first)
    checkpoint_files.sort(key=lambda x: x.stat().st_mtime, reverse=True)
    
    print(f"\n📋 Available checkpoints for Stage {stage}:")
    print("0. Start fresh (no checkpoint)")
    
    for i, ckpt_file in enumerate(checkpoint_files, 1):
        try:
            # Load checkpoint to get metadata
            ckpt = torch.load(ckpt_file, map_location='cpu')
            epoch = ckpt.get('epoch', 'unknown')
            loss = ckpt.get('loss', 'unknown')
            timestamp = ckpt.get('timestamp', 'unknown')
            
            print(f"{i}. {ckpt_file.name}")
            print(f"   Epoch: {epoch}, Loss: {loss:.4f if isinstance(loss, (int, float)) else loss}")
            print(f"   Time: {timestamp}")
            print()
        except:
            print(f"{i}. {ckpt_file.name} (metadata unavailable)")
    
    while True:
        try:
            choice = input("Select checkpoint (0 for fresh start): ")

            # Check for empty input
            if choice.strip() == "":
                print("❌ Invalid input. Please enter a number.")
                continue
            
            choice = int(choice)
            
            if choice == 0:
                return None
            elif 1 <= choice <= len(checkpoint_files):
                selected = checkpoint_files[choice - 1]
                print(f"✅ Selected: {selected}")
                return selected
            else:
                print("❌ Invalid choice. Please try again.")
        except (ValueError, KeyboardInterrupt):
            print("❌ Invalid input. Please enter a number.")

def save_training_state(stage, epoch, loss, config):
    """
    Save training state to JSON file (keep all logs, no overwrite)
    """
    from datetime import datetime

    training_state = {
        'stage': stage,
        'epoch': epoch,
        'loss': loss,
        'timestamp': datetime.now().isoformat(),
        'config_path': getattr(config, 'config_path', 'unknown'),
        'device': config.get('device', 'unknown')
    }

    logs_dir = Path(config['paths']['logs'])
    logs_dir.mkdir(parents=True, exist_ok=True)

    try:
        # Keep all logs (unique filename per epoch)
        state_file = logs_dir / f"training_state_stage_{stage}_epoch_{epoch + 1}.json"
        with open(state_file, 'w') as f:
            json.dump(training_state, f, indent=2)

        print(f"📝 Training state saved: {state_file}")
        
    except Exception as e:
        print(f"❌ Error saving training state: {e}")

def load_checkpoint_if_needed(model, config, args):
    """
    Load checkpoint based on resume argument and stage dependencies
    Returns: start_epoch
    """
    if not args.resume and args.stage > 1:
        # For Stage 2+, we MUST load previous stage checkpoint
        print(f"🔗 Stage {args.stage} requires loading Stage {args.stage - 1} checkpoint...")
        checkpoints_dir = Path(config['paths']['checkpoints'])
        prev_stage_ckpt = checkpoints_dir / f"model_stage_{args.stage - 1}_latest.pth"
        
        if prev_stage_ckpt.exists():
            try:
                print(f"📥 Loading prerequisite checkpoint: {prev_stage_ckpt}")
                checkpoint = torch.load(prev_stage_ckpt, map_location=config['device'])
                
                # Load only the components that exist (partial loading)
                model_state = checkpoint['model_state_dict']
                current_model_state = model.state_dict()
                
                # Update only matching keys
                for key in model_state:
                    if key in current_model_state:
                        current_model_state[key] = model_state[key]
                        
                model.load_state_dict(current_model_state)
                print(f"✅ Loaded prerequisite Stage {args.stage - 1} weights")
                
            except Exception as e:
                print(f"❌ Error loading prerequisite checkpoint: {e}")
                print("🆕 Starting with random weights instead.")
        else:
            print(f"⚠️ No Stage {args.stage - 1} checkpoint found. Training may not work properly.")
        
        return 0  # Start Stage 2 from epoch 0
    
    if not args.resume:
        print("🆕 Starting training from scratch.")
        return 0

    checkpoints_dir = Path(config['paths']['checkpoints'])
    
    if args.resume == 'latest':
        ckpt_path = checkpoints_dir / f"model_stage_{args.stage}_latest.pth"
        if ckpt_path.exists():
            print(f"🔄 Resuming from latest checkpoint: {ckpt_path}")
        else:
            print(f"⚠️ No latest checkpoint found for stage {args.stage}, starting fresh.")
            return 0
            
    elif args.resume == 'select':
        ckpt_path = select_checkpoint_interactive(checkpoints_dir, args.stage)
        if ckpt_path is None:
            print("🆕 Starting fresh training.")
            return 0
    else:
        ckpt_path = Path(args.resume)
        if not ckpt_path.exists():
            raise FileNotFoundError(f"Checkpoint not found: {ckpt_path}")

    try:
        print(f"📥 Loading checkpoint: {ckpt_path}")
        checkpoint = torch.load(ckpt_path, map_location=config['device'])
        
        # Safety check: stage match
        if checkpoint.get('stage', args.stage) != args.stage:
            print(f"⚠️ Warning: Checkpoint stage ({checkpoint.get('stage')}) "
                  f"does not match current stage ({args.stage}).")

        model.load_state_dict(checkpoint['model_state_dict'])
        
        epoch = checkpoint.get('epoch', 0)
        loss = checkpoint.get('loss', 0.0)
        
        print(f"✅ Loaded checkpoint - Epoch: {epoch + 1}, Loss: {loss:.4f}")
        
        return epoch + 1
        
    except Exception as e:
        print(f"❌ Error loading checkpoint: {e}")
        print("🆕 Starting fresh training instead.")
        return 0

def main():
    """
    Main training function with better error handling
    """
    try:
        # Force unbuffered output for subprocess
        import sys
        sys.stdout.reconfigure(line_buffering=True)
        sys.stderr.reconfigure(line_buffering=True)
        
        # Parse arguments
        args = ConfigService.parse_training_args()

        # Load config
        config = ConfigService.load_config(args.config)
        config['config_path'] = args.config

        print("🎭 Bailando Training Started", flush=True)
        print(f"   Config: {args.config}", flush=True)
        print(f"   Device: {config['device']}", flush=True)
        print(f"   Stage: {args.stage}", flush=True)

        # Load dataset with debug output and file limit
        try:
            print("📊 Loading dataset...", flush=True)
            
            # Use smaller dataset for initial testing
            max_files = 500  # Limit to 500 files for faster loading
            
            dataset = BailandoDataset(
                config['data']['dataset_path'], 
                config, 
                debug=True,
                max_files=max_files
            )
            print(f"📊 Dataset loaded: {len(dataset)} sequences", flush=True)
            
            data_loader = torch.utils.data.DataLoader(
                dataset, 
                batch_size=config['training']['batch_size'],
                shuffle=True,
                num_workers=0,  # Important: Use 0 for subprocess stability
                pin_memory=False,  # Disable pin_memory for CPU training
                drop_last=False
            )
            print(f"📊 DataLoader created: {len(data_loader)} batches", flush=True)
            
        except Exception as e:
            print(f"❌ Error loading dataset: {e}", flush=True)
            import traceback
            traceback.print_exc()
            return

        # Test first batch with better error handling
        try:
            print("🧪 Testing first batch...", flush=True)
            data_iter = iter(data_loader)
            first_batch = next(data_iter)
            print(f"✅ First batch shape: {first_batch['motion'].shape}", flush=True)
            print(f"✅ First batch type: {type(first_batch['motion'])}", flush=True)
            print(f"✅ Batch size: {first_batch['motion'].size(0)}", flush=True)
            
        except Exception as e:
            print(f"❌ Error with first batch: {e}", flush=True)
            import traceback
            traceback.print_exc()
            return

        # Initialize model
        try:
            print("🤖 Initializing model...", flush=True)
            model = BailandoModel(config['model']).to(config['device'])
            print(f"🤖 Model initialized on {config['device']}", flush=True)
            
        except Exception as e:
            print(f"❌ Error initializing model: {e}", flush=True)
            import traceback
            traceback.print_exc()
            return

        # Resume logic
        print("🔄 Checking for checkpoints...", flush=True)
        start_epoch = load_checkpoint_if_needed(model, config, args)
        print(f"📍 Starting from epoch: {start_epoch}", flush=True)

        # Train only the selected stage
        print(f"🎯 Starting training for stage {args.stage}...", flush=True)
        metrics = train_stage(model, data_loader, config, args.stage, start_epoch)
        
        print(f"✅ Stage {args.stage} complete: {metrics}", flush=True)
        print("🎉 Training Complete!", flush=True)
        
    except KeyboardInterrupt:
        print("\n⏹️ Training interrupted by user", flush=True)
    except Exception as e:
        print(f"❌ Training failed with error: {e}", flush=True)
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()