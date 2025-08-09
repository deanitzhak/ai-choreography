import json
import time
from datetime import datetime
from fastapi import WebSocket, WebSocketDisconnect

class ConnectionManager:
    def __init__(self):
        self.active_connections = {}
        self.connection_id_counter = 0

    async def connect(self, websocket: WebSocket, client_identifier=None):
        await websocket.accept()
        self.connection_id_counter += 1
        connection_id = f"conn_{self.connection_id_counter}_{int(time.time())}"
        if client_identifier:
            to_remove = []
            for conn_id, conn_data in self.active_connections.items():
                if conn_data.get('client_identifier') == client_identifier:
                    try:
                        await conn_data['websocket'].close(code=1001, reason="Replaced by new connection")
                    except:
                        pass
                    to_remove.append(conn_id)
            for conn_id in to_remove:
                if conn_id in self.active_connections:
                    del self.active_connections[conn_id]
                    print(f"📡 Replaced connection for client: {client_identifier}")
        self.active_connections[connection_id] = {
            'websocket': websocket,
            'client_identifier': client_identifier or 'anonymous',
            'connected_at': datetime.now(),
            'last_ping': time.time(),
            'connection_id': connection_id
        }
        print(f"📡 WebSocket connected: {connection_id} ({client_identifier}). Total: {len(self.active_connections)}")
        return connection_id

    def disconnect(self, websocket: WebSocket):
        connection_id = None
        for conn_id, conn_data in self.active_connections.items():
            if conn_data['websocket'] == websocket:
                connection_id = conn_id
                break
        if connection_id:
            client_id = self.active_connections[connection_id].get('client_identifier', 'unknown')
            del self.active_connections[connection_id]
            print(f"📡 WebSocket disconnected: {connection_id} ({client_id}). Total: {len(self.active_connections)}")

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        try:
            await websocket.send_text(json.dumps(message))
            return True
        except Exception as e:
            print(f"❌ Error sending personal message: {e}")
            return False

    async def broadcast(self, message: dict):
        if not self.active_connections:
            return
        failed_connections = []
        for connection_id, conn_data in self.active_connections.items():
            try:
                websocket = conn_data['websocket']
                await websocket.send_text(json.dumps(message))
            except Exception as e:
                failed_connections.append(connection_id)
        for conn_id in failed_connections:
            if conn_id in self.active_connections:
                del self.active_connections[conn_id]

    # ✅ This was missing — now added
    async def handle_connection(self, websocket: WebSocket):
        client_id = websocket.query_params.get('client_id', 'anonymous')
        connection_id = await self.connect(websocket, client_id)
        try:
            while True:
                data = await websocket.receive_text()
                message = json.loads(data)
                if message.get('type') == 'ping':
                    pong = {"type": "pong", "timestamp": datetime.now().isoformat()}
                    await self.send_personal_message(pong, websocket)
        except WebSocketDisconnect:
            self.disconnect(websocket)
        except Exception as e:
            print(f"❌ WebSocket error: {e}")
            self.disconnect(websocket)

manager = ConnectionManager()