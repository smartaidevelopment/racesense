#!/bin/bash

# RaceSense Backend Setup Script
echo "🚗 RaceSense Backend Setup"
echo "=========================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version 16+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "🔧 Creating .env file..."
    cat > .env << EOF
PORT=3001
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
LOG_LEVEL=debug
EOF
    echo "✅ .env file created"
else
    echo "✅ .env file already exists"
fi

# Create data directory
mkdir -p data/logs
mkdir -p data/exports
echo "✅ Data directories created"

# Set permissions (Linux/macOS)
if [[ "$OSTYPE" == "linux-gnu"* ]] || [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🔐 Setting up permissions..."
    
    # Add user to dialout group (Linux)
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if ! groups $USER | grep -q dialout; then
            echo "⚠️  You may need to add your user to the dialout group:"
            echo "   sudo usermod -a -G dialout $USER"
            echo "   Then log out and log back in"
        fi
    fi
    
    # Set USB permissions (macOS)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "⚠️  On macOS, you may need to grant USB permissions in System Preferences"
    fi
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Start the backend server: npm run dev"
echo "2. Test the API: curl http://localhost:3001/api/health"
echo "3. Connect your hardware devices"
echo "4. Open the frontend at http://localhost:5173"
echo ""
echo "For more information, see HARDWARE_TESTING_GUIDE.md" 