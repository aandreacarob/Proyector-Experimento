import cv2
import mediapipe as mp
import time
import threading
import logging
import math

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("HandTracking")

class HandTracker:
    def __init__(self, source=0, show_window=False):
        self.source = source
        self.show_window = show_window
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=2,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        self.running = False
        self.latest_hands = None
        self.lock = threading.Lock()
        self.window_created = False

    def start(self):
        self.running = True
        self.thread = threading.Thread(target=self._run_loop)
        self.thread.daemon = True
        self.thread.start()
        logger.info("Hand tracking started.")

    def stop(self):
        self.running = False
        if self.thread.is_alive():
            self.thread.join()
        logger.info("Hand tracking stopped.")

    def _detect_gesture(self, hand_landmarks):
        """Detect hand gesture based on finger positions"""
        landmarks = hand_landmarks.landmark
        
        # Get key points
        wrist = landmarks[self.mp_hands.HandLandmark.WRIST]
        thumb_tip = landmarks[self.mp_hands.HandLandmark.THUMB_TIP]
        index_tip = landmarks[self.mp_hands.HandLandmark.INDEX_FINGER_TIP]
        middle_tip = landmarks[self.mp_hands.HandLandmark.MIDDLE_FINGER_TIP]
        ring_tip = landmarks[self.mp_hands.HandLandmark.RING_FINGER_TIP]
        pinky_tip = landmarks[self.mp_hands.HandLandmark.PINKY_TIP]
        
        index_mcp = landmarks[self.mp_hands.HandLandmark.INDEX_FINGER_MCP]
        middle_mcp = landmarks[self.mp_hands.HandLandmark.MIDDLE_FINGER_MCP]
        ring_mcp = landmarks[self.mp_hands.HandLandmark.RING_FINGER_MCP]
        pinky_mcp = landmarks[self.mp_hands.HandLandmark.PINKY_MCP]
        
        # Calculate if fingers are extended
        def is_extended(tip, mcp, wrist):
            # Finger is extended if tip is further from wrist than mcp
            tip_dist = math.sqrt((tip.x - wrist.x)**2 + (tip.y - wrist.y)**2)
            mcp_dist = math.sqrt((mcp.x - wrist.x)**2 + (mcp.y - wrist.y)**2)
            return tip_dist > mcp_dist * 1.2
        
        index_extended = is_extended(index_tip, index_mcp, wrist)
        middle_extended = is_extended(middle_tip, middle_mcp, wrist)
        ring_extended = is_extended(ring_tip, ring_mcp, wrist)
        pinky_extended = is_extended(pinky_tip, pinky_mcp, wrist)
        
        # Count extended fingers
        extended_count = sum([index_extended, middle_extended, ring_extended, pinky_extended])
        
        # Detect gestures
        if extended_count == 0:
            return "fist"
        elif extended_count == 2 and index_extended and middle_extended:
            return "bunny"  # Bunny ears - index and middle extended
        elif extended_count == 1 and index_extended:
            return "pointing"
        elif extended_count >= 3:
            return "open_palm"
        else:
            return "partial"

    def _run_loop(self):
        cap = cv2.VideoCapture(self.source)
        if not cap.isOpened():
            logger.error(f"Cannot open camera source {self.source}")
            self.running = False
            return

        if self.show_window:
            mp_drawing = mp.solutions.drawing_utils
            mp_drawing_styles = mp.solutions.drawing_styles
            
            try:
                cv2.namedWindow('Hand Tracking', cv2.WINDOW_NORMAL)
                cv2.resizeWindow('Hand Tracking', 800, 600)
                self.window_created = True
                logger.info("Hand tracking window created")
            except Exception as e:
                logger.warning(f"Could not create window: {e}")
                self.show_window = False

        while self.running:
            success, image = cap.read()
            if not success:
                logger.warning("Ignoring empty camera frame.")
                continue

            image = cv2.cvtColor(cv2.flip(image, 1), cv2.COLOR_BGR2RGB)
            image.flags.writeable = False
            results = self.hands.process(image)

            image.flags.writeable = True
            image_bgr = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)

            hands_data = []
            
            if results.multi_hand_landmarks and results.multi_handedness:
                for hand_landmarks, handedness in zip(results.multi_hand_landmarks, results.multi_handedness):
                    # Draw hand landmarks
                    if self.show_window and self.window_created:
                        mp_drawing.draw_landmarks(
                            image_bgr,
                            hand_landmarks,
                            self.mp_hands.HAND_CONNECTIONS,
                            mp_drawing_styles.get_default_hand_landmarks_style(),
                            mp_drawing_styles.get_default_hand_connections_style()
                        )
                    
                    # Detect gesture
                    gesture = self._detect_gesture(hand_landmarks)
                    
                    # Get hand label (Left or Right)
                    hand_label = handedness.classification[0].label
                    
                    # Get index finger tip position
                    index_tip = hand_landmarks.landmark[self.mp_hands.HandLandmark.INDEX_FINGER_TIP]
                    
                    hands_data.append({
                        "hand": hand_label,
                        "gesture": gesture,
                        "index_tip": [index_tip.x, index_tip.y],
                        "confidence": handedness.classification[0].score
                    })
                    
                    # Draw gesture text on image
                    if self.show_window and self.window_created:
                        # Get wrist position for text placement
                        wrist = hand_landmarks.landmark[self.mp_hands.HandLandmark.WRIST]
                        h, w, _ = image_bgr.shape
                        text_x = int(wrist.x * w)
                        text_y = int(wrist.y * h) - 20
                        
                        # Color based on gesture
                        if gesture == 'fist':
                            color = (0, 0, 255)  # Red
                        elif gesture == 'pointing':
                            color = (0, 255, 255)  # Yellow
                        elif gesture == 'open_palm':
                            color = (0, 255, 0)  # Green
                        elif gesture == 'bunny':
                            color = (255, 0, 255)  # Pink/Magenta
                        else:
                            color = (255, 255, 255)  # White
                        
                        # Draw text
                        text = f"{hand_label}: {gesture.upper()}"
                        cv2.putText(image_bgr, text, (text_x, text_y),
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2, cv2.LINE_AA)

            with self.lock:
                self.latest_hands = {
                    "timestamp": time.time(),
                    "hands": hands_data
                }

            if self.show_window and self.window_created:
                try:
                    cv2.imshow('Hand Tracking', image_bgr)
                    if cv2.waitKey(1) & 0xFF == ord('q'):
                        self.running = False
                        break
                except Exception as e:
                    logger.warning(f"Error displaying window: {e}")
                    self.show_window = False
                    self.window_created = False

        cap.release()
        if self.window_created:
            try:
                cv2.destroyAllWindows()
            except:
                pass

    def get_hands_data(self):
        """Returns the latest hand tracking data with gestures"""
        with self.lock:
            return self.latest_hands


if __name__ == "__main__":
    tracker = HandTracker(show_window=True)
    tracker.start()
    try:
        while True:
            data = tracker.get_hands_data()
            if data:
                print(data)
            time.sleep(0.1)
    except KeyboardInterrupt:
        tracker.stop()
