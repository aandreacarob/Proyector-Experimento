import os
import threading
import queue
import logging
import time
import requests
from PIL import Image
from io import BytesIO
import google.generativeai as genai
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("AIGenerator")

class AIVisualGenerator:
    def __init__(self, output_dir="../web/visuals/textures"):
        self.output_dir = output_dir
        self.queue = queue.Queue()
        self.result_queue = queue.Queue() # For communicating back to main
        self.running = False
        
        # API Setup
        self.api_key = os.getenv("GOOGLE_API_KEY")
        if not self.api_key:
             # Try OpenAI as fallback if Google key missing but OpenAI present
             self.api_key = os.getenv("OPENAI_API_KEY")
             self.provider = "openai" if self.api_key else "mock"
        else:
            self.provider = "gemini"

        if self.provider == "gemini":
            genai.configure(api_key=self.api_key)
            # Use Gemini 2.5 Flash (Nano Banana) for speed and quality
            # Fallback to 1.5 if 2.5 not available in this specific call context, but we try 2.5 first
            try:
                self.model = genai.GenerativeModel('gemini-2.5-flash-preview-09-2025')
                logger.info("Using Gemini 2.5 Flash (Nano Banana)")
            except:
                self.model = genai.GenerativeModel('gemini-1.5-flash')
                logger.info("Using Gemini 1.5 Flash (Fallback)")

        elif self.provider == "openai":
            self.client = OpenAI(api_key=self.api_key)

        # Ensure output directory exists
        os.makedirs(self.output_dir, exist_ok=True)

    def start(self):
        self.running = True
        self.thread = threading.Thread(target=self._run_loop)
        self.thread.daemon = True
        self.thread.start()
        logger.info(f"AI Generator started using provider: {self.provider}")

    def stop(self):
        self.running = False
        if self.thread.is_alive():
            self.thread.join()
        logger.info("AI Generator stopped.")

    def request_generation(self, prompt, filename_prefix="gen", source_image=None):
        """
        source_image: Optional PIL Image for image-to-image transformation
        """
        self.queue.put((prompt, filename_prefix, source_image))

    def _generate_gemini_imagen(self, prompt, source_image):
        """
        Use Google's latest Imagen 4.0 via Vertex AI or the generativeai library.
        """
        try:
            if source_image:
                # 1. Use Gemini 2.5 Flash (Nano Banana) to create the artistic prompt
                # This model is much faster and better at visual understanding
                vision_model_name = 'gemini-2.5-flash-preview-09-2025' 
                # Fallback to 1.5 if 2.5 not found, but list_models confirmed it exists
                
                try:
                    vision_model = genai.GenerativeModel(vision_model_name)
                except:
                    vision_model = self.model # Fallback to initialized model (1.5)

                vision_prompt = """You are an AI art director. Analyze this image and create a detailed, vivid prompt for Imagen 4.0 to transform this scene into a stunning cyberpunk/neon artistic masterpiece. 

Include specific details about:
- Neon color palette (cyan, magenta, purple, electric blue)
- Cyberpunk aesthetic elements
- Dramatic lighting and glow effects
- Abstract or stylized interpretation
- High contrast and vibrant saturation

Keep the prompt under 100 words and make it extremely visual and specific."""

                response = vision_model.generate_content([vision_prompt, source_image])
                art_prompt = response.text.strip()
                
                logger.info(f"Generated art prompt: {art_prompt[:100]}...")
                
                # 2. Use Imagen 4.0 for generation
                # Based on list_models, we have 'imagen-4.0-generate-001'
                try:
                    from google.generativeai import ImageGenerationModel
                    
                    # Try Imagen 4.0 first
                    model_names = [
                        "imagen-4.0-generate-001",
                        "imagen-4.0-fast-generate-001", # Faster?
                        "imagen-3.0-generate-001"       # Fallback
                    ]
                    
                    result = None
                    for name in model_names:
                        try:
                            logger.info(f"Attempting generation with {name}...")
                            imagen_model = ImageGenerationModel(name)
                            result = imagen_model.generate_images(
                                prompt=art_prompt,
                                number_of_images=1,
                                aspect_ratio="1:1" # or "16:9" if supported
                            )
                            if result:
                                break
                        except Exception as e:
                            logger.warning(f"Failed with {name}: {e}")
                            continue

                    if result and result.images:
                        # Convert to bytes
                        img_bytes = result.images[0]._pil_image
                        buf = BytesIO()
                        img_bytes.save(buf, format="PNG")
                        return buf.getvalue()
                        
                except (ImportError, AttributeError, Exception) as e:
                    logger.warning(f"Imagen generation failed: {e}")
                    # Fallback to style transfer
                    return self._generate_enhanced_style_transfer(source_image, art_prompt)

            return None
        except Exception as e:
            logger.error(f"Gemini Imagen Error: {e}")
            return None

    def _generate_enhanced_style_transfer(self, source_image, prompt):
        """
        Enhanced style transfer using OpenCV with better artistic effects
        """
        import numpy as np
        import cv2
        
        img_np = np.array(source_image)
        img_bgr = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)
        
        # Apply multiple artistic filters
        # 1. Edge detection for cyberpunk lines
        edges = cv2.Canny(img_bgr, 100, 200)
        
        # 2. Apply colormap for neon effect
        img_color = cv2.applyColorMap(img_bgr, cv2.COLORMAP_TWILIGHT_SHIFTED)
        
        # 3. Increase saturation and contrast
        img_hsv = cv2.cvtColor(img_color, cv2.COLOR_BGR2HSV)
        img_hsv[:,:,1] = np.clip(img_hsv[:,:,1] * 1.5, 0, 255)  # Saturation
        img_hsv[:,:,2] = np.clip(img_hsv[:,:,2] * 1.2, 0, 255)  # Value
        img_enhanced = cv2.cvtColor(img_hsv, cv2.COLOR_HSV2BGR)
        
        # 4. Add edge overlay for cyberpunk effect
        edges_colored = cv2.cvtColor(edges, cv2.COLOR_GRAY2BGR)
        edges_colored = cv2.applyColorMap(edges_colored, cv2.COLORMAP_HOT)
        img_final = cv2.addWeighted(img_enhanced, 0.7, edges_colored, 0.3, 0)
        
        is_success, buffer = cv2.imencode(".png", img_final)
        if is_success:
            return buffer.tobytes()
        return None

    def _generate_openai(self, prompt):
        try:
            # DALL-E 3
            client = OpenAI(api_key=os.getenv("OPENAI_API_KEY") or self.api_key)
            response = client.images.generate(
                model="dall-e-3",
                prompt=prompt,
                size="1024x1024",
                quality="standard",
                n=1,
            )
            image_url = response.data[0].url
            return requests.get(image_url).content
        except Exception as e:
            logger.error(f"OpenAI Generation Error: {e}")
            return None

    def _generate_mock(self, prompt, source_image=None):
        # Mock style transfer: just invert colors or apply colormap
        if source_image:
            import numpy as np
            import cv2
            img_np = np.array(source_image)
            # Apply a "heatmap" style
            img_bgr = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)
            img_color = cv2.applyColorMap(img_bgr, cv2.COLORMAP_JET)
            
            is_success, buffer = cv2.imencode(".png", img_color)
            if is_success:
                return buffer.tobytes()
        
        # Fallback
        img = Image.new('RGB', (512, 512), color=(100, 50, 150))
        buf = BytesIO()
        img.save(buf, format="PNG")
        return buf.getvalue()

    def _run_loop(self):
        while self.running:
            try:
                prompt, prefix, source_image = self.queue.get(timeout=1)
                logger.info(f"Processing generation request: {prefix}")
                
                timestamp = int(time.time())
                filename = f"{prefix}_{timestamp}.png"
                filepath = os.path.join(self.output_dir, filename)

                image_data = None
                
                if self.provider == "gemini":
                    # Use Gemini + Imagen pipeline
                    image_data = self._generate_gemini_imagen(prompt, source_image)
                    
                    if not image_data:
                        # If Imagen fails, use enhanced style transfer
                        logger.warning("Imagen generation failed. Using enhanced style transfer.")
                        image_data = self._generate_enhanced_style_transfer(source_image, prompt)

                elif self.provider == "openai":
                    if source_image:
                         # OpenAI doesn't do img2img in DALL-E 3 API directly (it does in DALL-E 2 but 3 is better).
                         # We can describe it first or just use text.
                         # Let's use Mock for img2img or DALL-E 2 variations if needed.
                         # For now, simple text gen.
                         image_data = self._generate_openai(prompt)
                    else:
                         image_data = self._generate_openai(prompt)
                else:
                    image_data = self._generate_mock(prompt, source_image)

                if image_data:
                    with open(filepath, "wb") as f:
                        f.write(image_data)
                    logger.info(f"Image saved to {filepath}")
                    
                    # Notify via a queue or callback that main.py can pick up?
                    # Or just return it? This runs in a thread.
                    # We need a way to tell the main loop.
                    # Let's put it in a "result_queue"
                    if not hasattr(self, 'result_queue'):
                        self.result_queue = queue.Queue()
                    self.result_queue.put({
                        "type": "texture_ready",
                        "filename": filename,
                        "prefix": prefix
                    })
                
            except queue.Empty:
                continue
            except Exception as e:
                logger.error(f"Error during generation loop: {e}")

if __name__ == "__main__":
    # Test
    gen = AIVisualGenerator()
    gen.start()
    gen.request_generation("fireball texture", "test")
    time.sleep(5)
    gen.stop()
