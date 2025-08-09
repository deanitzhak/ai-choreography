

set -e 

echo "🎭 Setting up Bailando AI Choreography Environment..."
echo "=================================================="

# Check Python version
echo "🐍 Checking Python version..."
  python_version=$(python3 --version 2>&1 | grep -o '[0-9]\+\.[0-9]\+' | head -1)
required_version="3.8"

if ! python3 -c "import sys; exit(0 if sys.version_info >= (3, 8) else 1)" 2>/dev/null; then
    echo "❌ Python 3.8+ required. Found: $python_version"
    echo "Please install Python 3.8 or higher and try again."
    exit 1
fi
echo "✅ Python $python_version detected"

# Check Node.js version
echo "📦 Checking Node.js version..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 16+ from https://nodejs.org/"
    exit 1
fi

node_version=$(node --version | grep -o '[0-9]\+' | head -1)
if [ "$node_version" -lt 16 ]; then
    echo "❌ Node.js 16+ required. Found: $(node --version)"
    echo "Please upgrade Node.js and try again."
    exit 1
fi
echo "✅ Node.js $(node --version) detected"

# Create virtual environment
echo "🔧 Creating Python virtual environment..."
if [ -d "bailando_env" ]; then
    echo "⚠️  Virtual environment already exists. Removing old one..."
    rm -rf bailando_env
fi

python3 -m venv bailando_env
echo "✅ Virtual environment created: bailando_env"

# Activate virtual environment
echo "🚀 Activating virtual environment..."
source bailando_env/bin/activate

# Upgrade pip
echo "📦 Upgrading pip..."
python -m pip install --upgrade pip setuptools wheel

# Detect system and install PyTorch accordingly
echo "🔍 Detecting system for PyTorch installation..."
  OS=$(uname -s)
ARCH=$(uname -m)

if [[ "$OS" == "Darwin" ]]; then
    if [[ "$ARCH" == "arm64" ]]; then
        echo "🍎 Apple Silicon Mac detected"
        pip install torch torchvision torchaudio
    else
        echo "🍎 Intel Mac detected"
        pip install torch torchvision torchaudio
    fi
elif [[ "$OS" == "Linux" ]]; then
    echo "🐧 Linux detected"
    if command -v nvidia-smi &> /dev/null; then
        echo "🎮 NVIDIA GPU detected, installing CUDA version..."
        pip install torch torchvision torchaudio --index-url https: //download.pytorch.org/whl/cu118
    else
        echo "💻 No NVIDIA GPU detected, installing CPU version..."
        pip install torch torchvision torchaudio --index-url https: //download.pytorch.org/whl/cpu
    fi
else
    echo "🪟 Windows or other OS detected, installing default PyTorch..."
    pip install torch torchvision torchaudio
fi

# Install other Python dependencies
echo "📚 Installing Python dependencies..."
pip install -r requirements.txt

# Test PyTorch installation
echo "🧪 Testing PyTorch installation..."
python -c "import torch; print(f'✅ PyTorch {torch.__version__} installed successfully')"
if command -v nvidia-smi &> /dev/null; then
    python -c "import torch; print(f'✅ CUDA available: {torch.cuda.is_available()}')"
fi

# Install Node.js dependencies
echo "🎨 Installing frontend dependencies..."
if [ -d "frontend" ]; then
    cd frontend
    npm install
    echo "✅ Frontend dependencies installed"
    cd ..
else
    echo "⚠️  Frontend directory not found, skipping Node.js setup"
fi

# Create necessary directories
echo "📁 Creating project directories..."
mkdir -p data/AIST_PLUS_PLUS
mkdir -p outputs/{checkpoints,checkpoints_stable,logs,logs_stable,reports,reports_stable,videos,videos_stable,conclusions}
mkdir -p config
echo "✅ Project directories created"

# Test configuration system
echo "🔧 Testing configuration system..."
if [ -f "config/bailando_config_stable.yaml" ]; then
    python -c "
from lib.services.config_service import ConfigService
try: 
    config=ConfigService.load_config('config/bailando_config_stable.yaml')
    print('✅ Configuration system working')
except Exception as e: 
    print(f'⚠️  Config test warning: {e}')
    print('This is normal if configs are not yet created')
"
else
    echo "⚠️  bailando_config_stable.yaml not found - will be created during first run"
fi

# Create activation script
echo "📜 Creating activation script..."
cat > activate_bailando.sh << 'EOF'
#!/bin/bash
# Activate Bailando environment
echo "🎭 Activating Bailando environment..."
source bailando_env/bin/activate
echo "✅ Environment activated!"
echo "💡 Run 'python scripts/train_bailando.py --config config/bailando_config_stable.yaml --stage 1' to start training"
EOF

chmod +x activate_bailando.sh

# Create Windows activation script
cat > activate_bailando.bat << 'EOF'
@echo off
echo 🎭 Activating Bailando environment...
call bailando_env\Scripts\activate.bat
echo ✅ Environment activated!
echo 💡 Run 'python scripts/train_bailando.py --config config/bailando_config_stable.yaml --stage 1' to start training
EOF

echo ""
echo "🎉 INSTALLATION COMPLETE!"
echo "========================"
echo ""
echo "📋 Next Steps:"
echo "1. Activate environment:"
echo "   • Linux/Mac: source bailando_env/bin/activate"
echo "   • Windows:   bailando_env\\Scripts\\activate"
echo "   • Or use:    ./activate_bailando.sh"
echo ""
echo "2. Download AIST++ dataset and place in data/AIST_PLUS_PLUS/"
echo ""
echo "3. Start training:"
echo "   python scripts/train_bailando.py --config config/bailando_config_stable.yaml --stage 1"
echo ""
echo "4. Start dashboard (optional):"
echo "   cd frontend && npm run dev  # http://localhost:3000"
echo "   python Server.py           # http://localhost:8000"
echo ""
echo "🔧 Configuration files will be auto-generated on first run"
echo "📚 See README.md for complete documentation"
echo "🚨 Use commands.txt for full command reference"
echo ""
echo "✅ Ready to start your AI choreography journey!"