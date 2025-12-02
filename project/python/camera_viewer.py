#!/usr/bin/env python3
"""
Standalone Camera Viewer for Pose Tracking
This script shows the camera feed with pose landmarks overlay.
Run this in a separate terminal to see what the camera is capturing.
"""

import cv2
import mediapipe as mp
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("CameraViewer")

def main():
    # Initialize MediaPipe Pose
    mp_pose = mp.solutions.pose
    mp_drawing = mp.solutions.drawing_utils
    mp_drawing_styles = mp.solutions.drawing_styles
    
    pose = mp_pose.Pose(
        static_image_mode=False,
        model_complexity=1,
        smooth_landmarks=True,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5
    )
    
    # Open camera
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        logger.error("Cannot open camera")
        return
    
    # Create window
    cv2.namedWindow('Pose Tracking - Camera Feed', cv2.WINDOW_NORMAL)
    cv2.resizeWindow('Pose Tracking - Camera Feed', 800, 600)
    
    logger.info("Camera viewer started. Press 'q' to quit.")
    
    try:
        while True:
            success, image = cap.read()
            if not success:
                logger.warning("Ignoring empty camera frame.")
                continue
            
            # Flip the image horizontally for selfie-view
            # Convert BGR to RGB
            image = cv2.cvtColor(cv2.flip(image, 1), cv2.COLOR_BGR2RGB)
            
            # Process the image
            image.flags.writeable = False
            results = pose.process(image)
            
            # Draw the pose annotation on the image
            image.flags.writeable = True
            image_bgr = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
            
            if results.pose_landmarks:
                # Draw pose landmarks
                mp_drawing.draw_landmarks(
                    image_bgr,
                    results.pose_landmarks,
                    mp_pose.POSE_CONNECTIONS,
                    landmark_drawing_spec=mp_drawing_styles.get_default_pose_landmarks_style()
                )
                
                # Add status text
                cv2.putText(
                    image_bgr,
                    'Pose Detected - Tracking Active',
                    (10, 30),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.7,
                    (0, 255, 0),
                    2
                )
            else:
                # No pose detected
                cv2.putText(
                    image_bgr,
                    'No Pose Detected - Move into camera view',
                    (10, 30),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.7,
                    (0, 0, 255),
                    2
                )
            
            # Display FPS
            fps = cap.get(cv2.CAP_PROP_FPS)
            cv2.putText(
                image_bgr,
                f'FPS: {fps:.1f}',
                (10, 60),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                (255, 255, 255),
                1
            )
            
            # Display the image
            cv2.imshow('Pose Tracking - Camera Feed', image_bgr)
            
            # Check for 'q' key to quit
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
    
    except KeyboardInterrupt:
        logger.info("Interrupted by user")
    finally:
        cap.release()
        cv2.destroyAllWindows()
        logger.info("Camera viewer stopped")

if __name__ == "__main__":
    main()
