from fastapi import APIRouter, HTTPException
from pathlib import Path
from datetime import datetime
import yaml
import traceback
from typing import Dict, Any, Optional


try:
    from lib.services.config_service import ConfigService
    HAS_CONFIG_SERVICE = True
except ImportError:
    ConfigService = None
    HAS_CONFIG_SERVICE = False
    print("⚠️ ConfigService not available, using basic YAML loading")

try:
    from lib.analysis.neuralink_optimizer import NeuralOptimizer
    HAS_OPTIMIZER = True
except ImportError:
    NeuralOptimizer = None
    HAS_OPTIMIZER = False
    print("⚠️ NeuralOptimizer not available")

router = APIRouter()

def load_yaml_safely(file_path: Path) -> Optional[Dict[str, Any]]:
    """Safely load YAML file with proper error handling"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read().strip()
        
        if not content:
            print(f"⚠️ Empty YAML file: {file_path}")
            return {}
        
        data = yaml.safe_load(content)
        
        if data is None:
            print(f"⚠️ YAML loaded as None: {file_path}")
            return {}
        
        return data
        
    except yaml.YAMLError as e:
        print(f"❌ YAML parsing error in {file_path}: {e}")
        return None
    except Exception as e:
        print(f"❌ Error loading {file_path}: {e}")
        return None

def validate_config_structure(config_data: Dict[str, Any], filename: str) -> Dict[str, Any]:
    """Validate and fix config structure"""
    if not isinstance(config_data, dict):
        print(f"⚠️ Config {filename} is not a dictionary")
        return {}
    
    # Ensure required sections exist
    required_sections = ['model', 'training', 'data', 'paths']
    for section in required_sections:
        if section not in config_data:
            print(f"⚠️ Missing {section} section in {filename}")
            config_data[section] = {}
        elif config_data[section] is None:
            print(f"⚠️ {section} section is None in {filename}")
            config_data[section] = {}
    
    # Set default values for model section
    model_defaults = {
        'motion_dim': 72,
        'latent_dim': 256,
        'codebook_size': 512,
        'gpt_layers': 6,
        'embed_dim': 256
    }
    
    for key, default_value in model_defaults.items():
        if key not in config_data['model']:
            config_data['model'][key] = default_value
    
    # Set default values for training section
    training_defaults = {
        'batch_size': 8,
        'learning_rate': 0.0001,
        'vq_vae_epochs': 50,
        'gpt_epochs': 25
    }
    
    for key, default_value in training_defaults.items():
        if key not in config_data['training']:
            config_data['training'][key] = default_value
    
    return config_data

@router.get("/api/configs/available")
async def list_available_configs():
    """List all available configuration files with enhanced error handling"""
    try:
        config_dir = Path("config")
        
        if not config_dir.exists():
            print(f"⚠️ Config directory not found: {config_dir}")
            # Return empty array instead of object
            return []
        
        configs = []
        config_files = list(config_dir.glob("*.yaml")) + list(config_dir.glob("*.yml"))
        
        print(f"🔍 Found {len(config_files)} config files in {config_dir}")
        
        for config_file in config_files:
            try:
                print(f"📄 Processing config: {config_file.name}")
                
                # Load config data
                if HAS_CONFIG_SERVICE and ConfigService:
                    try:
                        config_data = ConfigService.load_config(str(config_file))
                    except Exception as e:
                        print(f"⚠️ ConfigService failed for {config_file.name}: {e}")
                        config_data = load_yaml_safely(config_file)
                else:
                    config_data = load_yaml_safely(config_file)
                
                if config_data is None:
                    # Handle completely broken files
                    configs.append({
                        "name": config_file.name,
                        "path": str(config_file),
                        "size": config_file.stat().st_size,
                        "is_stable": "stable" in config_file.name.lower(),
                        "status": "error",
                        "error": "Failed to parse YAML",
                        "parameters": {},
                        "sections": [],
                        "last_modified": datetime.fromtimestamp(config_file.stat().st_mtime).isoformat()
                    })
                    continue
                
                # Validate and fix structure
                config_data = validate_config_structure(config_data, config_file.name)
                
                # Extract configuration details
                model_config = config_data.get('model', {})
                training_config = config_data.get('training', {})
                
                # Calculate model parameters
                latent_dim = model_config.get('latent_dim', 256)
                codebook_size = model_config.get('codebook_size', 512)
                gpt_layers = model_config.get('gpt_layers', 6)
                motion_dim = model_config.get('motion_dim', 72)
                
                # Rough parameter estimation
                model_params = (latent_dim * codebook_size) + (gpt_layers * latent_dim * latent_dim)
                
                # Extract training parameters
                batch_size = training_config.get('batch_size', 8)
                learning_rate = training_config.get('learning_rate', 0.0001)
                device = config_data.get('device', 'cpu')
                
                config_info = {
                    "name": config_file.name,
                    "path": str(config_file),
                    "size": config_file.stat().st_size,
                    "is_stable": "stable" in config_file.name.lower(),
                    "status": "ok",
                    "parameters": {
                        "latent_dim": latent_dim,
                        "motion_dim": motion_dim,
                        "codebook_size": codebook_size,
                        "gpt_layers": gpt_layers,
                        "batch_size": batch_size,
                        "learning_rate": learning_rate,
                        "device": device,
                        "estimated_params": f"{model_params/1e6:.1f}M"
                    },
                    "sections": list(config_data.keys()),
                    "warnings": [],
                    "last_modified": datetime.fromtimestamp(config_file.stat().st_mtime).isoformat()
                }
                
                configs.append(config_info)
                print(f"✅ Successfully processed: {config_file.name}")
                
            except Exception as e:
                print(f"❌ Error processing config {config_file.name}: {e}")
                traceback.print_exc()
                
                # Add error entry
                configs.append({
                    "name": config_file.name,
                    "path": str(config_file),
                    "size": config_file.stat().st_size if config_file.exists() else 0,
                    "is_stable": False,
                    "status": "error",
                    "error": f"Processing error: {str(e)}",
                    "parameters": {},
                    "sections": [],
                    "warnings": [],
                    "last_modified": datetime.fromtimestamp(config_file.stat().st_mtime).isoformat() if config_file.exists() else ""
                })
        
        print(f"✅ Successfully processed {len(configs)} config files")
        
        # Return just the array, not an object containing the array
        return sorted(configs, key=lambda x: x["name"])
        
    except Exception as e:
        print(f"💥 Error in list_available_configs: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error listing configs: {str(e)}")

@router.get("/api/configs/{config_name}")
async def get_config_content(config_name: str):
    """Get the content of a specific config file"""
    try:
        config_path = Path("config") / config_name
        
        if not config_path.exists():
            raise HTTPException(status_code=404, detail=f"Config file {config_name} not found")
        
        # Security check
        if not config_path.suffix.lower() in ['.yaml', '.yml']:
            raise HTTPException(status_code=400, detail="Invalid config file type")
        
        with open(config_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Parse and validate
        try:
            parsed = yaml.safe_load(content)
            if parsed is None:
                parsed = {}
            
            # Validate structure
            validated = validate_config_structure(parsed, config_name)
            is_valid = True
            validation_error = None
            
            # Check if we had to fix anything
            has_fixes = (parsed != validated)
            
        except yaml.YAMLError as e:
            is_valid = False
            validation_error = str(e)
            has_fixes = False
        
        return {
            "name": config_name,
            "content": content,
            "is_valid": is_valid,
            "validation_error": validation_error,
            "has_fixes_available": has_fixes,
            "size": len(content),
            "lines": len(content.splitlines())
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"💥 Error getting config {config_name}: {e}")
        raise HTTPException(status_code=500, detail=f"Error reading config: {str(e)}")

# Keep your optimization endpoint if you have the dependencies
if HAS_OPTIMIZER and HAS_CONFIG_SERVICE:
    @router.post("/api/config/optimize")
    async def optimize_config(request: dict):  # Use dict instead of OptimizationRequest for now
        try:
            optimizer = NeuralOptimizer()
            config = ConfigService.load_config(request.get('config_path'))
            constraints = {}
            if request.get('max_parameters'):
                constraints['max_parameters'] = request['max_parameters']
            
            result = optimizer.optimize_for_hardware(
                config, 
                request.get('target_device', 'cpu'), 
                constraints
            )
            
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