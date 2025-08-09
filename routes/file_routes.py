from fastapi import APIRouter, HTTPException
from pathlib import Path
import urllib.parse
import traceback

router = APIRouter()

@router.get("/api/debug/test")
async def debug_test():
    """Simple test endpoint to verify the router is working"""
    from datetime import datetime
    print("🔍 Debug test endpoint called")
    return {
        'status': 'success',
        'message': 'File routes are working perfectly!',
        'timestamp': datetime.now().isoformat(),
        'server': 'Bailando Training Server'
    }

@router.get("/api/debug/list")
async def debug_list_files():
    """Debug endpoint to list all Python files - returns JSON"""
    try:
        print("🔍 Debug: Starting file scan...")
        
        file_structure = {}
        current_dir = Path.cwd()
        
        print(f"📁 Current directory: {current_dir}")
        
        # Exclude these directories
        excluded_dirs = {'env', '__pycache__', '.git', 'node_modules', '.vscode', 'venv', '.pytest_cache', 'checkpoint-dashboard/node_modules'}
        
        def scan_directory(dir_path: Path, relative_to: Path):
            """Recursively scan directory for code files"""
            files = []
            try:
                for item in dir_path.iterdir():
                    # Skip hidden files and excluded directories
                    if item.name.startswith('.') or item.name in excluded_dirs:
                        continue
                    
                    if item.is_file():
                        # Include code and config files
                        if item.suffix.lower() in ['.py', '.yaml', '.yml', '.json', '.md', '.txt', '.js', '.jsx']:
                            try:
                                relative_path = str(item.relative_to(relative_to))
                                file_info = {
                                    'path': relative_path.replace('\\', '/'),
                                    'name': item.name,
                                    'size': item.stat().st_size,
                                    'extension': item.suffix,
                                    'type': 'file'
                                }
                                files.append(file_info)
                                print(f"  📄 Found: {relative_path}")
                            except Exception as e:
                                print(f"  ❌ Error processing file {item}: {e}")
                    
                    elif item.is_dir() and item.name not in excluded_dirs:
                        # Recursively scan subdirectories
                        try:
                            subdirectory_files = scan_directory(item, relative_to)
                            files.extend(subdirectory_files)
                        except Exception as e:
                            print(f"  ❌ Error scanning directory {item}: {e}")
                        
            except PermissionError:
                print(f"❌ Permission denied: {dir_path}")
            except Exception as e:
                print(f"❌ Error scanning {dir_path}: {e}")
            
            return files
        
        # Get all code files from the entire project
        print("🔍 Starting recursive scan...")
        all_files = scan_directory(current_dir, current_dir)
        print(f"📊 Found {len(all_files)} total files")
        
        # Group files by their top-level directory
        for file_info in all_files:
            file_path = file_info['path']
            if '/' in file_path:
                top_dir = file_path.split('/')[0]
            else:
                top_dir = 'root'
            
            if top_dir not in file_structure:
                file_structure[top_dir] = []
            
            file_structure[top_dir].append(file_info)
        
        # Sort files within each directory
        for dir_name in file_structure:
            file_structure[dir_name].sort(key=lambda x: x['name'])
        
        result = {
            'status': 'success',
            'current_directory': str(current_dir),
            'files': file_structure,
            'total_directories': len(file_structure),
            'total_files': len(all_files),
            'message': f'Successfully scanned {len(all_files)} files in {len(file_structure)} directories'
        }
        
        print(f"✅ File scan complete: {len(all_files)} files in {len(file_structure)} directories")
        return result
        
    except Exception as e:
        print(f"💥 Error in debug_list_files: {e}")
        traceback.print_exc()
        
        # Return error as JSON
        return {
            'status': 'error',
            'error': str(e),
            'files': {},
            'current_directory': str(Path.cwd()) if Path.cwd() else 'unknown',
            'total_files': 0,
            'total_directories': 0
        }

@router.get("/api/files/{file_path:path}")
async def get_file_content(file_path: str):
    """Get content of a specific file"""
    try:
        # Security: prevent path traversal
        file_path = urllib.parse.unquote(file_path)
        file_path = file_path.replace('\\', '/')
        
        print(f"🔍 Requesting file: {file_path}")
        
        if '..' in file_path or file_path.startswith('/'):
            raise HTTPException(status_code=403, detail="Invalid file path")
        
        # Check if path contains excluded directories
        excluded_dirs = {'env', '__pycache__', '.git', 'node_modules', '.vscode', 'venv'}
        path_parts = file_path.split('/')
        if any(part in excluded_dirs for part in path_parts):
            raise HTTPException(status_code=403, detail="Access to this directory is not allowed")
        
        # Allowed extensions for security
        allowed_extensions = {'.py', '.yaml', '.yml', '.js', '.jsx', '.json', '.md', '.txt'}
        file_extension = Path(file_path).suffix.lower()
        
        if file_extension not in allowed_extensions:
            raise HTTPException(status_code=403, detail=f"File type {file_extension} not allowed")
        
        # Construct full path
        full_path = Path(file_path)
        
        # Check if file exists
        if not full_path.exists():
            print(f"❌ File not found: {file_path}")
            print(f"📁 Looking in: {full_path.absolute()}")
            raise HTTPException(status_code=404, detail=f"File not found: {file_path}")
        
        # Read and return file content
        try:
            with open(full_path, 'r', encoding='utf-8') as f:
                content = f.read()
            print(f"✅ Successfully served file: {file_path} ({len(content)} chars)")
            return content
        except UnicodeDecodeError:
            # Try different encodings
            encodings = ['latin-1', 'cp1252', 'iso-8859-1']
            for encoding in encodings:
                try:
                    with open(full_path, 'r', encoding=encoding) as f:
                        content = f.read()
                    print(f"✅ Successfully served file with {encoding}: {file_path}")
                    return content
                except UnicodeDecodeError:
                    continue
            raise HTTPException(status_code=400, detail="File is not text-readable")
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"💥 Error serving file {file_path}: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error reading file: {str(e)}")