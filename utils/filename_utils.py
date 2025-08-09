import re

def extract_stage_from_filename(filename: str) -> int:
    try:
        filename_lower = filename.lower()
        if "stage_1" in filename_lower or "stage1" in filename_lower:
            return 1
        elif "stage_2" in filename_lower or "stage2" in filename_lower:
            return 2
        elif "stage_3" in filename_lower or "stage3" in filename_lower:
            return 3
        return 0
    except Exception:
        return 0

def extract_epoch_from_filename(filename: str) -> int:
    try:
        match = re.search(r"epoch[_-]?(\d+)", filename.lower())
        if match:
            return int(match.group(1))
        return 0
    except Exception:
        return 0