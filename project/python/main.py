import asyncio
import logging
import json
import os
import time
from websocket_server import WebSocketServer
from pose_tracking import PoseTracker
from visual_logic import VisualLogic
from ai_visual_generation import AIVisualGenerator

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("Main")

async def main():
    # Initialize components
    server = WebSocketServer(port=8765)
    tracker = PoseTracker()
    logic = VisualLogic()
    ai_gen = AIVisualGenerator(output_dir="../web/visuals/textures")

    # Start components
    tracker.start()
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

                # 4. Auto-Generate Artistic Background (Periodic) - DISABLED
                # if current_time - last_gen_time > gen_interval:
                #     frame = tracker.get_current_frame()
                #     if frame is not None:
                #         # Convert numpy array (RGB) to PIL Image
                #         from PIL import Image
                #         pil_image = Image.fromarray(frame)
                #         
                #         # Request generation
                #         prompt = "abstract artistic masterpiece, neon colors, flowing lines, cyberpunk style, high contrast, 8k"
                #         ai_gen.request_generation(prompt, "art_bg", source_image=pil_image)
                #         
                #         last_gen_time = current_time
                #         
                #         # Notify client that we are processing
                #         await server.broadcast({
                #             "type": "status",
                #             "message": "Capturing reality..."
                #         })

                # 5. Check for completed generations - DISABLED
                # try:
                #     while True:
                #         result = ai_gen.result_queue.get_nowait()
                #         if result["type"] == "texture_ready":
                #             await server.broadcast({
                #                 "type": "texture_ready",
                #                 "url": f"visuals/textures/{result['filename']}",
                #                 "prefix": result["prefix"]
                #             })
                # except:
                #     pass

                # 6. Prepare Message
                message = {
                    "type": "update",
                    "pose": pose_data,
                    "commands": commands
                }
                
                # 7. Broadcast to Clients
                await server.broadcast(message)

            # Control loop rate (approx 60 FPS)
            await asyncio.sleep(0.016)

    except asyncio.CancelledError:
        logger.info("Main loop cancelled.")
    finally:
        tracker.stop()
        ai_gen.stop()
        # server_task.cancel() # Server handles its own cleanup usually

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
