import json
import time
from pathlib import Path
from datetime import datetime
from state import training_state
from websocket_manager import manager
import queue

message_queue = queue.Queue()

def monitor_training_logs(config_path: str):
    try:
        from lib.services.config_service import ConfigService
        config = ConfigService.load_config(config_path)
        logs_dir = Path(config.get('paths', {}).get('logs', 'outputs/logs'))
    except:
        logs_dir = Path('outputs/logs')
    last_modified = 0
    while training_state.is_training:
        try:
            if logs_dir.exists():
                log_files = list(logs_dir.glob("training_state_*.json"))
                if log_files:
                    latest_log = max(log_files, key=lambda p: p.stat().st_mtime)
                    current_modified = latest_log.stat().st_mtime
                    if current_modified > last_modified:
                        with open(latest_log, 'r') as f:
                            log_data = json.load(f)
                        training_state.current_epoch = log_data.get('epoch', 0)
                        training_state.current_loss = log_data.get('loss', 0.0)
                        training_state.current_stage = log_data.get('stage', 1)
                        training_state.last_update = datetime.now().isoformat()
                        update_message = {
                            "type": "training_update",
                            "data": {
                                "epoch": training_state.current_epoch,
                                "loss": training_state.current_loss,
                                "stage": training_state.current_stage,
                                "timestamp": training_state.last_update,
                                "is_training": training_state.is_training,
                                "elapsed_time": time.time() - training_state.start_time if training_state.start_time else 0
                            }
                        }
                        message_queue.put(update_message)
                        last_modified = current_modified
                        if log_data.get('loss', 0) > 500:
                            alert_message = {
                                "type": "training_alert",
                                "data": {
                                    "level": "critical",
                                    "message": f"Loss explosion detected: {log_data.get('loss', 0):.2f}",
                                    "suggestion": "Consider stopping training and applying stable config",
                                    "epoch": log_data.get('epoch', 0)
                                }
                            }
                            message_queue.put(alert_message)
            time.sleep(5)
        except Exception as e:
            print(f"❌ Error monitoring logs: {e}")
            time.sleep(10)