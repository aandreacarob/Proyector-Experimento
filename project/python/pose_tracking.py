import cv2
import mediapipe as mp
import time
import threading
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("PoseTracking")

class PoseTracker:
    def __init__(self, source=0, show_window=True):
        self.source = source
        self.show_window = show_window
        self.mp_pose = mp.solutions.pose
        self.pose = self.mp_pose.Pose(
            static_image_mode=False,
            model_complexity=1,
            smooth_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        self.running = False
        self.latest_pose = None
        self.latest_image = None
        self.lock = threading.Lock()
        self.window_created = False

    def start(self):
        self.running = True
        self.thread = threading.Thread(target=self._run_loop)
        self.thread.daemon = True
        self.thread.start()
        logger.info("Pose tracking started.")

    def stop(self):
        self.running = False
        if self.thread.is_alive():
            self.thread.join()
        logger.info("Pose tracking stopped.")

    def _run_loop(self):
        cap = cv2.VideoCapture(self.source)
        if not cap.isOpened():
            logger.error(f"Cannot open camera source {self.source}")
            self.running = False
            return

        # MediaPipe drawing utilities (only if showing window)
        if self.show_window:
            mp_drawing = mp.solutions.drawing_utils
            mp_drawing_styles = mp.solutions.drawing_styles
            
            # Try to create window for visual feedback
            try:
                cv2.namedWindow('Pose Tracking - Camera Feed', cv2.WINDOW_NORMAL)
                cv2.resizeWindow('Pose Tracking - Camera Feed', 800, 600)
                self.window_created = True
                logger.info("Visual feedback window created successfully")
            except Exception as e:
                logger.warning(f"Could not create window (this is normal on some systems): {e}")
                self.show_window = False

        while self.running:
            success, image = cap.read()
            if not success:
                logger.warning("Ignoring empty camera frame.")
                continue

            # Flip the image horizontally for a later selfie-view display
            # Convert the BGR image to RGB.
            image = cv2.cvtColor(cv2.flip(image, 1), cv2.COLOR_BGR2RGB)
            
            # To improve performance, optionally mark the image as not writeable to
            # pass by reference.
            image.flags.writeable = False
            results = self.pose.process(image)

            # Draw the pose annotation on the image.
            image.flags.writeable = True
            image_bgr = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)

            if results.pose_landmarks:
                landmarks = results.pose_landmarks.landmark
                
                # Draw pose landmarks on the image (only if showing window)
                if self.show_window and self.window_created:
                    mp_drawing.draw_landmarks(
                        image_bgr,
                        results.pose_landmarks,
                        self.mp_pose.POSE_CONNECTIONS,
                        landmark_drawing_spec=mp_drawing_styles.get_default_pose_landmarks_style()
                    )
                
                # Extract keypoints of interest
                # MediaPipe landmarks are normalized [0.0, 1.0]
                keypoints = {
                    "timestamp": time.time(),
                    "nose": [landmarks[self.mp_pose.PoseLandmark.NOSE].x, landmarks[self.mp_pose.PoseLandmark.NOSE].y],
                    "left_wrist": [landmarks[self.mp_pose.PoseLandmark.LEFT_WRIST].x, landmarks[self.mp_pose.PoseLandmark.LEFT_WRIST].y],
                    "right_wrist": [landmarks[self.mp_pose.PoseLandmark.RIGHT_WRIST].x, landmarks[self.mp_pose.PoseLandmark.RIGHT_WRIST].y],
                    "left_index": [landmarks[self.mp_pose.PoseLandmark.LEFT_INDEX].x, landmarks[self.mp_pose.PoseLandmark.LEFT_INDEX].y],
                    "right_index": [landmarks[self.mp_pose.PoseLandmark.RIGHT_INDEX].x, landmarks[self.mp_pose.PoseLandmark.RIGHT_INDEX].y],
                    "left_shoulder": [landmarks[self.mp_pose.PoseLandmark.LEFT_SHOULDER].x, landmarks[self.mp_pose.PoseLandmark.LEFT_SHOULDER].y],
                    "right_shoulder": [landmarks[self.mp_pose.PoseLandmark.RIGHT_SHOULDER].x, landmarks[self.mp_pose.PoseLandmark.RIGHT_SHOULDER].y],
                }

                with self.lock:
                    self.latest_pose = keypoints
                    self.latest_image = image # Store RGB image

            # Display the image with pose landmarks (only if window was created)
            if self.show_window and self.window_created:
                try:
                    cv2.imshow('Pose Tracking - Camera Feed', image_bgr)
                    
                    # Check for 'q' key to quit (optional)
                    if cv2.waitKey(1) & 0xFF == ord('q'):
                        self.running = False
                        break
                except Exception as e:
                    logger.warning(f"Error displaying window: {e}")
                    self.show_window = False
                    self.window_created = False

            # Optional: Sleep slightly to limit CPU usage if needed, but we want high FPS
            # time.sleep(0.001)

        cap.release()
        if self.window_created:
            try:
                cv2.destroyAllWindows()
            except:
                pass


    def get_current_frame(self):
        """Returns the latest captured frame (RGB) or None."""
        with self.lock:
            # Return a copy to avoid race conditions if possible, or just the ref
            if self.latest_pose and hasattr(self, 'latest_image') and self.latest_image is not None:
                return self.latest_image.copy()
            return None

    def get_pose_data(self):
        """Returns the latest pose keypoints data."""
        with self.lock:
            return self.latest_pose


if __name__ == "__main__":
    tracker = PoseTracker()
    tracker.start()
    try:
        while True:
            data = tracker.get_pose_data()
            if data:
                print(data)
            time.sleep(0.1)
    except KeyboardInterrupt:
        tracker.stop()
