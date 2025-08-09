from fastapi import APIRouter, HTTPException
from models.training_models import OptimizationRequest
from pathlib import Path
import yaml
from lib.services.config_service import ConfigService
from lib.analysis.neuralink_optimizer import NeuralOptimizer

router = APIRouter()

@router.post("/api/config/optimize")
async def optimize_config(request: OptimizationRequest):
    try:
        optimizer = NeuralOptimizer()
        if not ConfigService:
            raise HTTPException(status_code=500, detail="ConfigService not available")
        config = ConfigService.load_config(request.config_path)
        constraints = {}
        if request.max_parameters:
            constraints['max_parameters'] = request.max_parameters
        result = optimizer.optimize_for_hardware(config, request.target_device, constraints)
        if result.get('status') == 'optimization_complete':
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            optimized_path = f"config/bailando_config_optimized_{timestamp}.yaml"
            full_config = config.copy()
            full_config['model'] = result['optimized_config']
            with open(optimized_path, 'w') as f:
                yaml.dump(full_config, f, default_flow_style=False)
            result['optimized_config_path'] = optimized_path
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Optimization failed: {str(e)}")

@router.get("/api/configs/available")
async def list_available_configs():
    config_dir = Path("config")
    configs = []
    if not ConfigService:
        return [
            {
                "name": "bailando_config_stable.yaml",
                "path": "config/bailando_config_stable.yaml",
                "description": "Stable CPU configuration",
                "device": "cpu"
            }
        ]
    for config_file in config_dir.glob("*.yaml"):
        try:
            config_data = ConfigService.load_config(str(config_file))
            if config_data and isinstance(config_data, dict):
                model_config = config_data.get('model', {})
                latent_dim = model_config.get('latent_dim', 256)
                codebook_size = model_config.get('codebook_size', 1024)
                gpt_layers = model_config.get('gpt_layers', 12)
                model_params = latent_dim * codebook_size * gpt_layers
                configs.append({
                    "name": config_file.name,
                    "path": str(config_file),
                    "description": f"Model with {model_params/1e6:.1f}M parameters",
                    "device": config_data.get('device', 'unknown'),
                    "last_modified": datetime.fromtimestamp(config_file.stat().st_mtime).isoformat()
                })
        except Exception as e:
            print(f"Error reading config {config_file}: {e}")
            configs.append({
                "name": config_file.name,
                "path": str(config_file),
                "description": "Configuration file (details unavailable)",
                "device": "unknown",
                "last_modified": datetime.fromtimestamp(config_file.stat().st_mtime).isoformat()
            })
    return configs