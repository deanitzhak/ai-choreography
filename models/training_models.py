from pydantic import BaseModel
from typing import Optional, List

class TrainingConfig(BaseModel): 
      config_path              : str
      stage                    : int = 1
      resume_mode              : str = "fresh"
      resume_checkpoint        : Optional[str] = None
      auto_optimize            : bool = False
      auto_analyze             : bool = True
      target_loss              : float = 30.0
      max_epochs               : Optional[int] = None
      use_stable_config        : bool = True

class OptimizationRequest(BaseModel): 
      config_path                   : str
      target_device                 : str = "cpu_optimized"
      max_parameters                : Optional[float] = 15e6
      optimization_goals            : List[str] = ["stability", "speed"]

class CheckpointSelectionRequest(BaseModel): 
      stage                                : int = 1
      logs_directory                       : str = "outputs/logs"