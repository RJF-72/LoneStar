#!/bin/bash

# LoneStar IDE - Qwen3:4B Setup Script
# This script helps you download and configure Qwen3:4B model

echo "🌟 LoneStar IDE - Qwen3:4B Model Setup"
echo "======================================="

# Create models directory if it doesn't exist
mkdir -p models

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the qwen-ide directory"
    exit 1
fi

echo ""
echo "📋 Qwen3:4B Model Options:"
echo "1. Qwen2-4B-Instruct (GGUF format) - Recommended"
echo "2. Qwen2-4B-Chat (GGUF format) - Alternative"
echo "3. Manual download (you provide the URL)"
echo "4. Skip download (use existing model)"

read -p "Choose an option (1-4): " choice

case $choice in
    1)
        MODEL_NAME="qwen2-4b-instruct-q4_0.gguf"
        MODEL_URL="https://huggingface.co/Qwen/Qwen2-4B-Instruct-GGUF/resolve/main/qwen2-4b-instruct-q4_0.gguf"
        ;;
    2)
        MODEL_NAME="qwen2-4b-chat-q4_0.gguf"
        MODEL_URL="https://huggingface.co/Qwen/Qwen2-4B-Chat-GGUF/resolve/main/qwen2-4b-chat-q4_0.gguf"
        ;;
    3)
        read -p "Enter the model download URL: " MODEL_URL
        read -p "Enter the model filename: " MODEL_NAME
        ;;
    4)
        echo "⏭️  Skipping model download"
        MODEL_NAME=""
        ;;
    *)
        echo "❌ Invalid option"
        exit 1
        ;;
esac

if [ ! -z "$MODEL_NAME" ] && [ ! -z "$MODEL_URL" ]; then
    echo ""
    echo "📥 Downloading $MODEL_NAME..."
    echo "This may take a while (model is ~2.5GB)"
    
    # Check if curl is available
    if command -v curl &> /dev/null; then
        curl -L -o "models/$MODEL_NAME" "$MODEL_URL"
    elif command -v wget &> /dev/null; then
        wget -O "models/$MODEL_NAME" "$MODEL_URL"
    else
        echo "❌ Neither curl nor wget is available. Please install one of them."
        exit 1
    fi
    
    if [ $? -eq 0 ]; then
        echo "✅ Model downloaded successfully to models/$MODEL_NAME"
    else
        echo "❌ Failed to download model"
        exit 1
    fi
fi

# Create/update environment file
ENV_FILE="backend/.env"
echo ""
echo "⚙️  Configuring environment..."

# Create backend directory if it doesn't exist
mkdir -p backend

# Create or update .env file
cat > "$ENV_FILE" << EOF
# LoneStar IDE Configuration
PORT=8000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Qwen3:4B Model Configuration
QWEN_MODEL_PATH=../models/$MODEL_NAME
MODEL_TEMPERATURE=0.7
MODEL_MAX_TOKENS=2048
MODEL_TOP_P=0.9
MODEL_TOP_K=50
MODEL_REPEAT_PENALTY=1.1

# Security
CORS_ORIGIN=http://localhost:3000
EOF

if [ ! -z "$MODEL_NAME" ]; then
    echo "✅ Environment configured with model: $MODEL_NAME"
else
    echo "⚠️  Environment configured without model path"
    echo "   Please set QWEN_MODEL_PATH in backend/.env manually"
fi

echo ""
echo "🚀 Setup Instructions:"
echo "1. Install dependencies: npm run install:all"
echo "2. Start development servers: npm run dev"
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo "💡 Tips:"
echo "- Model will be loaded when the backend starts"
echo "- Check the header status indicator for model connection"
echo "- Use the Chat panel to interact with Qwen3:4B"
echo ""
echo "🔧 Troubleshooting:"
echo "- If model loading fails, check the file path in backend/.env"
echo "- Ensure you have enough RAM (8GB+ recommended)"
echo "- Check backend logs for detailed error messages"

echo ""
echo "✨ Happy coding with LoneStar IDE and Qwen3:4B!"