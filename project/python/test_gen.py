import time
import os
from ai_visual_generation import AIVisualGenerator

def test_generation():
    print("Initializing Generator...")
    gen = AIVisualGenerator(output_dir="../web/visuals/textures")
    gen.start()
    
    print("Requesting 'nano banana' generation...")
    # We pass None as source_image to test text-to-image if supported, 
    # or we can pass a dummy image if we want to test the style transfer path.
    # Since the user said "gen", let's try a direct generation if possible, 
    # but our code is set up for image-to-image mostly.
    # Let's try to force a text generation path if we can, or just pass a dummy image.
    
    # Create a dummy black image to test the "style transfer" or "description" path
    from PIL import Image
    dummy_image = Image.new('RGB', (512, 512), color='black')
    
    gen.request_generation("nano banana, cyberpunk, neon, high quality", "test_nano_banana", source_image=dummy_image)
    
    print("Waiting for generation...")
    for i in range(15):
        time.sleep(1)
        print(f"Tick {i+1}...")
        
    gen.stop()
    print("Done.")

if __name__ == "__main__":
    test_generation()
