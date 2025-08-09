from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import asyncio
from datetime import datetime

# Import your existing WebSocket manager
from websocket_manager import manager

# Import all your existing route modules
from routes import (
    status_routes,
    training_routes,
    checkpoint_routes,
    config_routes,
    conclusion_routes,
    file_routes,
    DanceGenerationAPI
)

# Connect the WebSocket manager to training routes
try:
    training_routes.set_websocket_manager(manager)
    print("✅ WebSocket manager connected to training routes")
except AttributeError:
    print("⚠️ Training routes don't have WebSocket integration yet")

# Create the FastAPI app
app = FastAPI(title="Bailando Training Server", version="2.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all your existing routers
app.include_router(status_routes.router)
app.include_router(training_routes.router)
app.include_router(checkpoint_routes.router)
app.include_router(config_routes.router)
app.include_router(conclusion_routes.router)
app.include_router(file_routes.router)
app.include_router(DanceGenerationAPI.router)

# WebSocket endpoint
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.handle_connection(websocket)

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with server info"""
    return {
        "message": "Bailando Training Server",
        "version": "2.0.0",
        "status": "running",
        "endpoints": {
            "training": "/api/training/*",
            "checkpoints": "/api/checkpoints/*", 
            "configs": "/api/configs/*",
            "conclusions": "/api/conclusions/*",
            "status": "/api/status",
            "websocket": "/ws"
        },
        "websocket_connections": len(manager.active_connections),
        "timestamp": datetime.now().isoformat()
    }

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "websocket_connections": len(manager.active_connections),
        "server": "Bailando Training Server",
        "timestamp": datetime.now().isoformat()
    }

# Background task to send periodic heartbeats
async def heartbeat_task():
    """Send periodic heartbeats to keep connections alive"""
    while True:
        try:
            if manager.active_connections:
                await manager.broadcast({
                    'type': 'heartbeat',
                    'timestamp': datetime.now().isoformat(),
                    'connections': len(manager.active_connections)
                })
            await asyncio.sleep(30)  # Every 30 seconds
        except Exception as e:
            print(f"❌ Heartbeat error: {e}")
            await asyncio.sleep(5)

# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize on startup"""
    print("🚀 Starting Complete Bailando Training Server...")
    print("📊 Dashboard: http://localhost:3000")
    print("🔌 API: http://localhost:8000")
    print("📡 WebSocket: ws://localhost:8000/ws")
    print("📖 API Docs: http://localhost:8000/docs")
    
    # Start heartbeat task
    asyncio.create_task(heartbeat_task())

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    print("🛑 Shutting down Bailando Training API server...")
    
    # Close all WebSocket connections
    for conn_data in manager.active_connections.values():
        try:
            await conn_data['websocket'].close(code=1001, reason="Server shutdown")
        except:
            pass

if __name__ == "__main__":
    print("🎭 Starting Bailando Training Server...")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info", reload=False)