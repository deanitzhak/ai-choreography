from fastapi import APIRouter, HTTPException
from pathlib import Path
import urllib.parse

router = APIRouter()

@router.get("/api/files/{file_path:path}")
async def get_file_content(file_path: str):
    try:
        # Security: prevent path traversal
        file_path = urllib.parse.unquote(file_path)
        file_path = file_path.replace('\\', '/')
        
        if '..' in file_path or file_path.startswith('/'):
            raise HTTPException(status_code=403, detail="Invalid file path")
        
        # Construct full path
        full_path = Path(file_path)
        
        # Check if file exists
        if not full_path.exists():
            # Try alternative paths
            alternative_paths = [
                Path(f"./{file_path}"),
                Path(f"../{file_path}"),
                Path(f"../../{file_path}")
            ]
            
            found_path = None
            for alt_path in alternative_paths:
                if alt_path.exists():
                    found_path = alt_path
                    break
            
            if found_path:
                full_path = found_path
            else:
                raise HTTPException(status_code=404, detail=f"File not found: {file_path}")
        
        # Read and return file content
        try:
            with open(full_path, 'r', encoding='utf-8') as f:
                content = f.read()
            return content
        except UnicodeDecodeError:
            raise HTTPException(status_code=400, detail="File is not text-readable")
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading file: {str(e)}")

@router.get("/api/files/debug/list")
async def debug_list_files():
    try:
        file_structure = {}
        current_dir = Path.cwd()
        
        # Scan common directories
        directories_to_scan = ['scripts', 'lib', 'config', 'models', 'routes', 'utils']
        
        for directory in directories_to_scan:
            dir_path = Path(directory)
            if dir_path.exists() and dir_path.is_dir():
                file_structure[directory] = []
                
                # Recursively list files
                try:
                    for file_path in dir_path.rglob('*'):
                        if file_path.is_file() and not file_path.name.startswith('.') and not file_path.name.endswith('.pyc'):
                            relative_path = str(file_path.relative_to(current_dir))
                            file_info = {
                                'path': relative_path.replace('\\', '/'),
                                'name': file_path.name,
                                'size': file_path.stat().st_size,
                                'extension': file_path.suffix,
                            }
                            file_structure[directory].append(file_info)
                except Exception as e:
                    file_structure[directory] = f"Error: {str(e)}"
            else:
                file_structure[directory] = f"Directory not found: {str(dir_path.absolute())}"
        
        # Also scan root files
        root_files = []
        for item in current_dir.iterdir():
            if item.is_file() and item.suffix in ['.py', '.md', '.txt', '.yaml', '.yml', '.json']:
                root_files.append({
                    'path': item.name,
                    'name': item.name,
                    'size': item.stat().st_size,
                    'extension': item.suffix,
                })
        
        file_structure['root'] = root_files
        
        return {
            'files': file_structure
        }
        
    except Exception as e:
        return {
            'error': str(e),
            'files': {}
        }