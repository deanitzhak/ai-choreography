from fastapi import APIRouter, BackgroundTasks, HTTPException
from models.training_models import TrainingConfig
from state import training_state
from training_runner import run_training_async
from pathlib import Path

router = APIRouter()

@router.post("/api/training/start")
async def start_training(config: TrainingConfig, background_tasks: BackgroundTasks):
    if training_state.is_training:
        raise HTTPException(status_code=400, detail="Training is already running")
    if not Path(config.config_path).exists():
        raise HTTPException(status_code=404, detail=f"Config file not found: {config.config_path}")
    background_tasks.add_task(run_training_async, config)
    return {
        "status": "training_started",
        "config": config.dict(),
        "message": f"Training started with resume mode: {config.resume_mode}"
    }

@router.post("/api/training/stop")
async def stop_training():
    if not training_state.is_training:
        raise HTTPException(status_code=400, detail="No training is currently running")
    try:
        if training_state.current_process:
            training_state.current_process.terminate()
            training_state.current_process.wait(timeout=10)
        training_state.is_training = False
        stop_message = {
            "type": "training_stopped",
            "data": {
                "timestamp": datetime.now().isoformat(),
                "final_epoch": training_state.current_epoch,
                "final_loss": training_state.current_loss
            }
        }
        await manager.broadcast(stop_message)
        return {"status": "training_stopped", "message": "Training stopped successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error stopping training: {str(e)}")