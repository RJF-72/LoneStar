#!/bin/bash

# LoneStar IDE Startup Script
echo "🌟 Starting LoneStar IDE..."

# Kill any existing processes on these ports
echo "🔄 Cleaning up existing processes..."
pkill -f "tsx --watch src/index.ts" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true

# Wait a moment for processes to clean up
sleep 2

# Create log directories
mkdir -p logs

# Start backend
echo "🚀 Starting backend server..."
cd backend
npm run dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait for backend to start
echo "⏳ Waiting for backend to initialize..."
sleep 5

# Start frontend
echo "🎨 Starting frontend server..."
cd ../frontend
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

# Wait for frontend to start
echo "⏳ Waiting for frontend to initialize..."
sleep 3

# Check if both servers are running
echo "🔍 Checking server status..."
if curl -s http://localhost:8000/health > /dev/null; then
    echo "✅ Backend is running on http://localhost:8000"
else
    echo "❌ Backend failed to start"
fi

if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Frontend is running on http://localhost:3000"
else
    echo "❌ Frontend failed to start"
fi

echo ""
echo "🎉 LoneStar IDE is ready!"
echo "📖 Backend logs: tail -f logs/backend.log"
echo "📖 Frontend logs: tail -f logs/frontend.log"
echo "🌐 Backend API: http://localhost:8000"
echo "🌐 Frontend App: http://localhost:3000 (or next available port)"
echo ""
echo "Press Ctrl+C to stop both servers"

# Create a trap to clean up on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    pkill -f "tsx --watch src/index.ts" 2>/dev/null || true
    pkill -f "vite" 2>/dev/null || true
    echo "✅ Servers stopped"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Keep the script running
while true; do
    sleep 1
done