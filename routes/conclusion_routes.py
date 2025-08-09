from fastapi import APIRouter, HTTPException
from pathlib import Path
import json
from datetime import datetime
from utils.filename_utils import extract_stage_from_filename, extract_epoch_from_filename

router = APIRouter()

@router.get("/api/conclusions")
async def get_conclusions():
    try:
        conclusions_dir = Path("outputs/conclusions")
        if not conclusions_dir.exists():
            print("📁 Creating conclusions directory...")
            conclusions_dir.mkdir(parents=True, exist_ok=True)
            return {"conclusions": []}
        conclusions = []
        json_files = list(conclusions_dir.glob("*.json"))
        print(f"🔍 Found {len(json_files)} JSON files in conclusions directory")
        for file in json_files:
            try:
                print(f"📄 Processing file: {file.name}")
                with open(file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                analysis_metadata = data.get("analysis_metadata", {})
                executive_summary = data.get("executive_summary", {})
                detailed_analysis = data.get("detailed_analysis", {})
                recommendations = data.get("recommendations", {})
                conclusion = {
                    "filename": file.name,
                    "generated_at": analysis_metadata.get("generated_at", "unknown"),
                    "checkpoint": (analysis_metadata.get("checkpoint_analyzed", "") or "").split("/")[-1] or "unknown",
                    "stage": extract_stage_from_filename(file.name),
                    "epoch": extract_epoch_from_filename(file.name),
                    "confidence_level": executive_summary.get("confidence_level", 0.0),
                    "health_score": detailed_analysis.get("training_health", {}).get("overall_score", 0.0),
                    "status": executive_summary.get("status", "unknown"),
                    "final_loss": detailed_analysis.get("loss_analysis", {}).get("final_loss", 0.0),
                    "recommendations": recommendations,
                    "full_data": data
                }
                conclusions.append(conclusion)
                print(f"✅ Successfully processed: {file.name}")
            except json.JSONDecodeError as e:
                print(f"❌ JSON decode error in {file}: {e}")
                continue
            except Exception as e:
                print(f"❌ Error processing {file}: {e}")
                continue
        def safe_sort_key(x):
            generated_at = x.get("generated_at", "")
            if generated_at is None or generated_at == "unknown":
                return "0000-00-00T00:00:00"
            return str(generated_at)
        conclusions.sort(key=safe_sort_key, reverse=True)
        print(f"📊 Returning {len(conclusions)} conclusions")
        return {"conclusions": conclusions}
    except Exception as e:
        print(f"💥 Critical error in get_conclusions: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/api/conclusions/{filename}")
async def get_conclusion_detail(filename: str):
    try:
        if ".." in filename or "/" in filename or "\\" in filename:
            raise HTTPException(status_code=400, detail="Invalid filename")
        file_path = Path("outputs/conclusions") / filename
        if not file_path.exists():
            raise HTTPException(status_code=404, detail=f"Conclusion file '{filename}' not found")
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return data
    except HTTPException:
        raise
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=400, detail=f"Invalid JSON in file: {str(e)}")
    except Exception as e:
        print(f"💥 Error in get_conclusion_detail: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/api/conclusions/generate-sample")
async def generate_sample_conclusion():
    try:
        conclusions_dir = Path("outputs/conclusions")
        conclusions_dir.mkdir(parents=True, exist_ok=True)
        sample_data = {
            "analysis_metadata": {
                "generated_at": datetime.now().isoformat(),
                "checkpoint_analyzed": "outputs/checkpoints/model_stage_1_epoch_10.pth",
                "analysis_version": "1.0"
            },
            "executive_summary": {
                "status": "good",
                "confidence_level": 0.85,
                "key_findings": [
                    "Training is progressing normally",
                    "Loss is decreasing steadily",
                    "No signs of overfitting detected"
                ]
            },
            "detailed_analysis": {
                "training_health": {
                    "overall_score": 0.8
                },
                "loss_analysis": {
                    "final_loss": 0.1234
                }
            },
            "recommendations": {
                "priority_actions": [
                    "Continue training with current configuration",
                    "Monitor for overfitting in next 10 epochs"
                ]
            },
            "next_actions": [
                "Proceed to next training stage",
                "Generate validation metrics"
            ]
        }
        sample_file = conclusions_dir / f"sample_analysis_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(sample_file, 'w') as f:
            json.dump(sample_data, f, indent=2)
        return {"message": f"Sample conclusion generated: {sample_file.name}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))