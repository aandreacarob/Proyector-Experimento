import asyncio
import websockets
import json
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("WebSocketServer")

class WebSocketServer:
    def __init__(self, host="localhost", port=8765):
        self.host = host
        self.port = port
        self.clients = set()

    async def register(self, websocket):
        self.clients.add(websocket)
        logger.info(f"Client connected. Total clients: {len(self.clients)}")

    async def unregister(self, websocket):
        self.clients.remove(websocket)
        logger.info(f"Client disconnected. Total clients: {len(self.clients)}")

    async def handler(self, websocket):
        await self.register(websocket)
        try:
            async for message in websocket:
                # Handle incoming messages from client if needed
                # For now, we mostly push data TO the client
                pass
        except websockets.exceptions.ConnectionClosed:
            pass
        finally:
            await self.unregister(websocket)

    async def broadcast(self, message):
        if not self.clients:
            return
        
        # Create a list of tasks to send the message to all clients
        tasks = [asyncio.create_task(client.send(json.dumps(message))) for client in self.clients]
        await asyncio.gather(*tasks, return_exceptions=True)

    async def start(self):
        logger.info(f"Starting WebSocket server on ws://{self.host}:{self.port}")
        async with websockets.serve(self.handler, self.host, self.port):
            await asyncio.Future()  # run forever

if __name__ == "__main__":
    server = WebSocketServer()
    asyncio.run(server.start())
