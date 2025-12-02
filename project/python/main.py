import asyncio
import logging
import json
import os
import time
from websocket_server import WebSocketServer
from pose_tracking import PoseTracker
from hand_tracking import HandTracker
from visual_logic import VisualLogic
from ai_visual_generation import AIVisualGenerator

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("Main")

async def main():
    # Initialize components
    server = WebSocketServer(port=8765)
    tracker = PoseTracker()
    hand_tracker = HandTracker(show_window=False)  # Disable window to avoid conflicts
    logic = VisualLogic()
    ai_gen = AIVisualGenerator(output_dir="../web/visuals/textures")

    # Start components
    tracker.start()
    hand_tracker.start()  # Start hand tracking
    ai_gen.start()
    
    # Start WebSocket server in background
    server_task = asyncio.create_task(server.start())

    logger.info("System initialized. Loop starting...")

    last_gen_time = 0
    gen_interval = 10.0 # Generate every 10 seconds

    try:
        while True:
            # 1. Get Pose Data
            pose_data = tracker.get_pose_data()
            hands_data = hand_tracker.get_hands_data()  # Get hand gestures
            current_time = time.time()
            
            if pose_data:
                # 2. Process Logic
                commands = logic.process(pose_data)
                
                # 3. Handle AI Generation Commands (Manual Trigger)
                for cmd in commands:
                    if cmd["command"] == "generate_texture":
                        prompt = cmd["params"]["prompt"]
                        prefix = cmd["params"]["type"]
                        ai_gen.request_generation(prompt, prefix)

                # 4. Prepare Message with gesture data
                message = {
                    "type": "update",
                    "pose": pose_data,
                    "hands": hands_data,  # Include hand gesture data
                    "commands": commands
                }
                
                # 5. Broadcast to Clients
                await server.broadcast(message)

            # Control loop rate (approx 60 FPS)
            await asyncio.sleep(0.016)

    except asyncio.CancelledError:
        logger.info("Main loop cancelled.")
    finally:
        tracker.stop()
        hand_tracker.stop()  # Stop hand tracking
        ai_gen.stop()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
