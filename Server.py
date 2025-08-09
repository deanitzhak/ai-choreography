from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from websocket_manager import manager
from routes import (
    status_routes,
    training_routes,
    checkpoint_routes,
    config_routes,
    conclusion_routes,
    file_routes
)

app = FastAPI(title="Bailando Training Server", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(status_routes.router)
app.include_router(training_routes.router)
app.include_router(checkpoint_routes.router)
app.include_router(config_routes.router)
app.include_router(conclusion_routes.router)
app.include_router(file_routes.router)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.handle_connection(websocket)

if __name__ == "__main__":
    print("🚀 Starting Complete Bailando Training Server...")
    print("📊 Dashboard: http://localhost:3000")
    print("🔌 API: http://localhost:8000")
    print("📡 WebSocket: ws://localhost:8000/ws")
    print("📖 API Docs: http://localhost:8000/docs")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info", reload=False)