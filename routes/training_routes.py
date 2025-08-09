from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, Dict, Any
import subprocess
import asyncio
import logging
from pathlib import Path
import json
import uuid
from datetime import datetime

# Import queue properly
import queue
import threading
import torch
import re

router = APIRouter()
logger = logging.getLogger(__name__)

# Global training process and status
training_process = None
training_status = {
    'is_training': False,
    'stage': None,
    'config_path': None,
    'start_time': None,
    'current_epoch': 0,
    'current_loss': 0.0,
    'process_id': None,
    'error': None
}

# Message queue for real-time updates
message_queue = queue.Queue()

# WebSocket manager (will be set from Server.py)
websocket_manager = None

# Threading control
monitor_thread = None
stop_monitoring = threading.Event()

class TrainingRequest(BaseModel):
    config_path: str = "config/bailando_config_stable.yaml"
    stage: int = 1
    resume_mode: str = "fresh"  # fresh, latest, specific
    resume_checkpoint: Optional[str] = None
    run_name: Optional[str] = None
    preserve_logs: bool = False

def set_websocket_manager(manager):
    """Set the WebSocket manager for real-time broadcasting"""
    global websocket_manager
    websocket_manager = manager
    print("✅ WebSocket manager connected to training routes")

def threaded_monitor_training_process():
    """Monitor training process in a separate thread (non-blocking)"""
    global training_process, training_status, message_queue, websocket_manager
    
    if not training_process:
        return
    
    try:
        print("🔍 Starting threaded training monitor...")
        
        # Read output line by line in the thread
        while training_process.poll() is None and not stop_monitoring.is_set():
            try:
                line = training_process.stdout.readline()
                
                if line:
                    line = line.strip()
                    print(f"📋 Training output: {line}")
                    
                    # Put message in queue for HTTP polling
                    try:
                        message_queue.put({
                            'type': 'training_log',
                            'message': line,
                            'timestamp': datetime.now().isoformat()
                        }, block=False)
                    except queue.Full:
                        pass
                    
                    # Broadcast to WebSocket clients (thread-safe approach)
                    if websocket_manager:
                        try:
                            # Create a new event loop for this thread
                            loop = asyncio.new_event_loop()
                            asyncio.set_event_loop(loop)
                            
                            # Run the broadcast coroutine
                            loop.run_until_complete(websocket_manager.broadcast({
                                'type': 'training_log',
                                'message': line,
                                'timestamp': datetime.now().isoformat()
                            }))
                            
                            loop.close()
                        except Exception as e:
                            # WebSocket broadcast failed, but continue monitoring
                            pass
                    
                    # Parse specific patterns for status updates
                    if "Epoch" in line and "Loss" in line:
                        try:
                            match = re.search(r"Epoch[:\s]*(\d+).*Loss[:\s]*([0-9.]+)", line)
                            if match:
                                epoch = int(match.group(1))
                                loss = float(match.group(2))
                                
                                training_status.update({
                                    'current_epoch': epoch,
                                    'current_loss': loss
                                })
                                
                                # Broadcast status update
                                if websocket_manager:
                                    try:
                                        loop = asyncio.new_event_loop()
                                        asyncio.set_event_loop(loop)
                                        loop.run_until_complete(websocket_manager.broadcast({
                                            'type': 'training_status',
                                            'status': training_status.copy(),
                                            'timestamp': datetime.now().isoformat()
                                        }))
                                        loop.close()
                                    except:
                                        pass
                        except (ValueError, AttributeError):
                            pass
                    
                    # Parse stage information
                    if "Training Stage" in line:
                        try:
                            match = re.search(r"Training Stage (\d+)", line)
                            if match:
                                stage = int(match.group(1))
                                training_status.update({'stage': stage})
                                
                                if websocket_manager:
                                    try:
                                        loop = asyncio.new_event_loop()
                                        asyncio.set_event_loop(loop)
                                        loop.run_until_complete(websocket_manager.broadcast({
                                            'type': 'training_status',
                                            'status': training_status.copy(),
                                            'timestamp': datetime.now().isoformat()
                                        }))
                                        loop.close()
                                    except:
                                        pass
                        except (ValueError, AttributeError):
                            pass
                
            except Exception as e:
                if not stop_monitoring.is_set():
                    print(f"⚠️ Error reading training output: {e}")
                break
        
        # Process has ended
        if training_process:
            return_code = training_process.wait()
            
            completion_message = {
                'type': 'training_complete',
                'return_code': return_code,
                'timestamp': datetime.now().isoformat()
            }
            
            if return_code == 0:
                print("✅ Training completed successfully")
                training_status.update({
                    'is_training': False,
                    'process_id': None,
                    'error': None
                })
                completion_message['success'] = True
                completion_message['message'] = "Training completed successfully"
            else:
                print(f"❌ Training ended with error code: {return_code}")
                training_status.update({
                    'is_training': False,
                    'process_id': None,
                    'error': f"Process ended with code {return_code}"
                })
                completion_message['success'] = False
                completion_message['message'] = f"Training ended with error code: {return_code}"
            
            # Broadcast completion
            if websocket_manager:
                try:
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)
                    loop.run_until_complete(websocket_manager.broadcast(completion_message))
                    loop.close()
                except:
                    pass
        
    except Exception as e:
        error_msg = str(e)
        print(f"❌ Error monitoring training: {error_msg}")
        training_status.update({
            'is_training': False,
            'process_id': None,
            'error': error_msg
        })
        
        if websocket_manager:
            try:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                loop.run_until_complete(websocket_manager.broadcast({
                    'type': 'training_error',
                    'error': error_msg,
                    'timestamp': datetime.now().isoformat()
                }))
                loop.close()
            except:
                pass
    finally:
        training_process = None
        print("🔍 Training monitor thread ended")

@router.post("/api/training/start")
async def start_training(request: TrainingRequest):
    """Start training with proper command line arguments"""
    global training_process, training_status, message_queue, monitor_thread, stop_monitoring
    
    try:
        # Check if already training
        if training_status['is_training']:
            return {
                "success": False,
                "error": "Training is already in progress",
                "status": training_status
            }
        
        # Validate config file exists
        config_path = Path(request.config_path)
        if not config_path.exists():
            return {
                "success": False,
                "error": f"Configuration file not found: {request.config_path}"
            }
        
        # Build command with only supported arguments
        cmd = [
            "python", "scripts/train_bailando.py",
            "--config", request.config_path,
            "--stage", str(request.stage)
        ]
        
        # Add resume options (only supported modes)
        if request.resume_mode == "latest":
            cmd.extend(["--resume", "latest"])
        elif request.resume_mode == "specific" and request.resume_checkpoint:
            # Validate checkpoint exists
            checkpoint_path = Path(request.resume_checkpoint)
            if not checkpoint_path.exists():
                return {
                    "success": False,
                    "error": f"Checkpoint file not found: {request.resume_checkpoint}"
                }
            cmd.extend(["--resume", request.resume_checkpoint])
        
        # Add optional arguments if provided
        if request.run_name:
            cmd.extend(["--run-name", request.run_name])
        
        if request.preserve_logs:
            cmd.append("--preserve-logs")
        
        print(f"🚀 Starting training: {' '.join(cmd)}")
        
        # Start training process
        training_process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            universal_newlines=True,
            cwd=Path.cwd()
        )
        
        # Update status
        training_status.update({
            'is_training': True,
            'stage': request.stage,
            'config_path': request.config_path,
            'start_time': datetime.now().isoformat(),
            'current_epoch': 0,
            'current_loss': 0.0,
            'process_id': training_process.pid,
            'error': None,
            'resume_mode': request.resume_mode,
            'run_name': request.run_name
        })
        
        # Start monitoring in a separate thread (non-blocking!)
        stop_monitoring.clear()
        monitor_thread = threading.Thread(
            target=threaded_monitor_training_process,
            daemon=True  # Dies when main thread dies
        )
        monitor_thread.start()
        
        # Broadcast training start
        if websocket_manager:
            await websocket_manager.broadcast({
                'type': 'training_started',
                'status': training_status.copy(),
                'command': ' '.join(cmd),
                'timestamp': datetime.now().isoformat()
            })
        
        return {
            "success": True,
            "message": "Training started successfully",
            "process_id": training_process.pid,
            "command": ' '.join(cmd),
            "status": training_status
        }
        
    except Exception as e:
        error_msg = str(e)
        print(f"❌ Training error: {error_msg}")
        
        training_status.update({
            'is_training': False,
            'error': error_msg
        })
        
        return {
            "success": False,
            "error": error_msg,
            "status": training_status
        }

@router.post("/api/training/stop")
async def stop_training():
    """Stop the current training process"""
    global training_process, training_status, monitor_thread, stop_monitoring
    
    try:
        if not training_process or not training_status['is_training']:
            return {
                "success": False,
                "error": "No training process is currently running"
            }
        
        # Signal the monitor thread to stop
        stop_monitoring.set()
        
        # Terminate the process
        training_process.terminate()
        
        # Wait a bit for graceful shutdown
        try:
            training_process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            # Force kill if needed
            training_process.kill()
            training_process.wait()
        
        # Update status
        training_status.update({
            'is_training': False,
            'process_id': None,
            'error': None
        })
        
        training_process = None
        
        # Wait for monitor thread to finish
        if monitor_thread and monitor_thread.is_alive():
            monitor_thread.join(timeout=2)
        
        print("🛑 Training stopped successfully")
        
        # Broadcast training stop
        if websocket_manager:
            await websocket_manager.broadcast({
                'type': 'training_stopped',
                'status': training_status.copy(),
                'timestamp': datetime.now().isoformat()
            })
        
        return {
            "success": True,
            "message": "Training stopped successfully",
            "status": training_status
        }
        
    except Exception as e:
        error_msg = str(e)
        print(f"❌ Error stopping training: {error_msg}")
        
        return {
            "success": False,
            "error": error_msg
        }

@router.get("/api/training/status")
async def get_training_status():
    """Get current training status"""
    global training_status, training_process
    
    # Check if process is still running
    if training_process and training_status['is_training']:
        if training_process.poll() is not None:
            # Process has ended
            return_code = training_process.returncode
            if return_code != 0:
                training_status.update({
                    'is_training': False,
                    'process_id': None,
                    'error': f"Process ended with exit code {return_code}"
                })
            else:
                training_status.update({
                    'is_training': False,
                    'process_id': None,
                    'error': None
                })
            training_process = None
    
    return {
        "success": True,
        "status": training_status
    }

@router.get("/api/training/logs")
async def get_training_logs(last_lines: int = 50):
    """Get recent training logs"""
    try:
        # Get messages from the queue (real-time logs from the thread)
        recent_logs = []
        temp_queue = []
        
        # Extract messages from queue
        try:
            while True:
                message = message_queue.get(block=False)
                temp_queue.append(message)
                if message.get('type') == 'training_log':
                    recent_logs.append(message['message'])
        except queue.Empty:
            pass
        
        # Put messages back in queue
        for msg in temp_queue:
            try:
                message_queue.put(msg, block=False)
            except queue.Full:
                break
        
        # If no recent logs from queue, try reading from files
        if not recent_logs:
            logs_dir = Path("outputs/logs")
            
            if logs_dir.exists():
                # Look for JSON training state files first
                json_files = list(logs_dir.glob("training_state_*.json"))
                if json_files:
                    json_files.sort(key=lambda x: x.stat().st_mtime, reverse=True)
                    
                    # Parse recent training states
                    recent_states = []
                    for json_file in json_files[:10]:  # Last 10 states
                        try:
                            with open(json_file, 'r') as f:
                                state = json.load(f)
                                recent_states.append(
                                    f"Stage {state.get('stage', '?')} - "
                                    f"Epoch {state.get('epoch', '?')} - "
                                    f"Loss: {state.get('loss', '?'):.4f if isinstance(state.get('loss'), (int, float)) else state.get('loss', '?')} - "
                                    f"{state.get('timestamp', 'Unknown time')}"
                                )
                        except Exception as e:
                            recent_states.append(f"Error reading {json_file.name}: {e}")
                    
                    return {
                        "success": True,
                        "logs": recent_states,
                        "log_type": "training_states",
                        "total_files": len(json_files)
                    }
                
                # Fallback to text log files
                log_files = list(logs_dir.glob("*.log")) + list(logs_dir.glob("*.txt"))
                if log_files:
                    log_files.sort(key=lambda x: x.stat().st_mtime, reverse=True)
                    latest_log = log_files[0]
                    with open(latest_log, 'r') as f:
                        lines = f.readlines()
                        recent_lines = lines[-last_lines:] if len(lines) > last_lines else lines
                        recent_logs = [line.strip() for line in recent_lines]
        
        return {
            "success": True,
            "logs": recent_logs[-last_lines:] if recent_logs else ["No log files found"],
            "log_type": "real_time" if recent_logs else "no_logs",
            "total_lines": len(recent_logs)
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "logs": []
        }

@router.get("/api/training/checkpoints")
async def get_available_checkpoints():
    """Get list of available checkpoints for resuming"""
    try:
        checkpoints = []
        checkpoints_dir = Path("outputs/checkpoints")
        stable_checkpoints_dir = Path("outputs/checkpoints_stable")
        
        # Check both checkpoint directories
        for ckpt_dir in [checkpoints_dir, stable_checkpoints_dir]:
            if ckpt_dir.exists():
                for ckpt_file in ckpt_dir.glob("*.pth"):
                    try:
                        # Try to load metadata
                        checkpoint_data = torch.load(ckpt_file, map_location='cpu')
                        
                        checkpoints.append({
                            'path': str(ckpt_file),
                            'name': ckpt_file.name,
                            'directory': ckpt_dir.name,
                            'size_mb': round(ckpt_file.stat().st_size / (1024*1024), 2),
                            'modified': ckpt_file.stat().st_mtime,
                            'stage': checkpoint_data.get('stage', 'unknown'),
                            'epoch': checkpoint_data.get('epoch', 'unknown'),
                            'loss': checkpoint_data.get('loss', 'unknown')
                        })
                    except Exception:
                        # If we can't load the checkpoint, still list it
                        checkpoints.append({
                            'path': str(ckpt_file),
                            'name': ckpt_file.name,
                            'directory': ckpt_dir.name,
                            'size_mb': round(ckpt_file.stat().st_size / (1024*1024), 2),
                            'modified': ckpt_file.stat().st_mtime,
                            'stage': 'unknown',
                            'epoch': 'unknown',
                            'loss': 'unknown'
                        })
        
        # Sort by modification time (newest first)
        checkpoints.sort(key=lambda x: x['modified'], reverse=True)
        
        return {
            "success": True,
            "checkpoints": checkpoints,
            "total_count": len(checkpoints)
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "checkpoints": []
        }

# Function to get messages for WebSocket broadcasting (kept for compatibility)
def get_training_messages():
    """Get messages from the training queue"""
    messages = []
    try:
        while True:
            message = message_queue.get(block=False)
            messages.append(message)
    except queue.Empty:
        pass
    return messages