from fastapi import APIRouter
from datetime import datetime
from state import training_state
from websocket_manager import manager
from lib.services.config_service import ConfigService
from scripts.analyze_checkpoint import CheckpointAnalyzer
from lib.analysis.neuralink_optimizer import NeuralOptimizer

router = APIRouter()

@router.get("/api/status")
async def get_server_status():
    return {
        "server_status": "running",
        "training_status": {
            "is_training": training_state.is_training,
            "current_stage": training_state.current_stage,
            "current_epoch": training_state.current_epoch,
            "current_loss": training_state.current_loss,
            "last_update": training_state.last_update,
            "connected_clients": len(manager.active_connections)
        },
        "available_features": {
            "config_service": ConfigService is not None,
            "neural_optimizer": hasattr(NeuralOptimizer, 'optimize_for_hardware'),
            "checkpoint_analyzer": CheckpointAnalyzer is not None
        },
        "timestamp": datetime.now().isoformat()
    }

@router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}