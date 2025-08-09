# NOTE : we want to run fresh start staging checkpoint 
import subprocess
import threading
import asyncio
import time
import os
import sys
from datetime import datetime
from pathlib import Path
from state import training_state
from websocket_manager import manager
from log_monitor import monitor_training_logs, message_queue

async def run_training_async(config):
    try:
        training_state.is_training = True
        training_state.start_time = time.time()
        training_state.training_config = config
        python_path = sys.executable
        script_path = "scripts/train_bailando.py"
        cmd = [
            python_path, script_path,
            "--config", config.config_path,
            "--stage", str(config.stage)
        ]
        if config.resume_checkpoint:
            cmd.extend(["--resume", config.resume_checkpoint])
        print(f"🚀 Starting training: {' '.join(cmd)}")
        env = os.environ.copy()
        env['PYTHONPATH'] = str(Path.cwd())
        env['PYTHONUNBUFFERED'] = '1'
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=0,
            universal_newlines=True,
            env=env,
            cwd=str(Path.cwd())
        )
        training_state.current_process = process
        monitor_thread = threading.Thread(
            target=monitor_training_logs,
            args=(config.config_path,),
            daemon=True
        )
        monitor_thread.start()
        output_timeout = 0
        max_timeout = 300
        while process.poll() is None and training_state.is_training:
            try:
                while True:
                    message = message_queue.get_nowait()
                    await manager.broadcast(message)
            except queue.Empty:
                pass
            try:
                import select
                if select.select([process.stdout], [], [], 0.5)[0]:
                    output = process.stdout.readline()
                    if output and output.strip():
                        print(f"Training: {output.strip()}")
                        output_timeout = 0
                        console_message = {
                            "type": "console_output",
                            "data": {
                                "message": output.strip(),
                                "timestamp": datetime.now().isoformat()
                            }
                        }
                        await manager.broadcast(console_message)
                    else:
                        output_timeout += 0.5
                else:
                    output_timeout += 0.5
            except Exception as e:
                print(f"⚠️ Error reading process output: {e}")
                output_timeout += 1
            if output_timeout > max_timeout:
                print("❌ Training process appears to be hanging. Terminating...")
                process.terminate()
                alert_message = {
                    "type": "training_alert",
                    "data": {
                        "level": "error",
                        "message": "Training process hung and was terminated",
                        "suggestion": "Try reducing batch size or check dataset",
                        "timestamp": datetime.now().isoformat()
                    }
                }
                await manager.broadcast(alert_message)
                break
            await asyncio.sleep(0.1)
        return_code = process.poll()
        if return_code is None:
            process.terminate()
            return_code = -1
        training_state.is_training = False
        try:
            while True:
                message = message_queue.get_nowait()
                await manager.broadcast(message)
        except queue.Empty:
            pass
        completion_message = {
            "type": "training_completed",
            "data": {
                "return_code": return_code,
                "success": return_code == 0,
                "final_epoch": training_state.current_epoch,
                "final_loss": training_state.current_loss,
                "total_time": time.time() - training_state.start_time
            }
        }
        await manager.broadcast(completion_message)
    except Exception as e:
        training_state.is_training = False
        error_message = {
            "type": "training_error",
            "data": {
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
        }
        await manager.broadcast(error_message)
        print(f"❌ Training error: {e}")