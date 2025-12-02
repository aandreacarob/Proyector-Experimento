#!/usr/bin/env python3
"""
Combined Camera Viewer for Pose and Hand Tracking
Shows camera feed with both pose landmarks and hand gestures overlay.
"""

import cv2
import mediapipe as mp
import logging
import math

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("CameraViewer")

def detect_gesture(hand_landmarks, mp_hands):
    """Detect hand gesture based on finger positions"""
    landmarks = hand_landmarks.landmark
    
    # Get key points
    wrist = landmarks[mp_hands.HandLandmark.WRIST]
    index_tip = landmarks[mp_hands.HandLandmark.INDEX_FINGER_TIP]
    middle_tip = landmarks[mp_hands.HandLandmark.MIDDLE_FINGER_TIP]
    ring_tip = landmarks[mp_hands.HandLandmark.RING_FINGER_TIP]
    pinky_tip = landmarks[mp_hands.HandLandmark.PINKY_TIP]
    
    index_mcp = landmarks[mp_hands.HandLandmark.INDEX_FINGER_MCP]
    middle_mcp = landmarks[mp_hands.HandLandmark.MIDDLE_FINGER_MCP]
    ring_mcp = landmarks[mp_hands.HandLandmark.RING_FINGER_MCP]
    pinky_mcp = landmarks[mp_hands.HandLandmark.PINKY_MCP]
    
    # Calculate if fingers are extended
    def is_extended(tip, mcp, wrist):
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
        return "FIST"
    elif extended_count == 2 and index_extended and middle_extended:
        return "BUNNY"  # Bunny ears - index and middle extended
    elif extended_count == 1 and index_extended:
        return "POINTING"
    elif extended_count >= 3:
        return "OPEN_PALM"
    else:
        return "PARTIAL"

def main():
    # Initialize MediaPipe Pose and Hands
    mp_pose = mp.solutions.pose
    mp_hands = mp.solutions.hands
    mp_drawing = mp.solutions.drawing_utils
    mp_drawing_styles = mp.solutions.drawing_styles
    
    pose = mp_pose.Pose(
        static_image_mode=False,
        model_complexity=1,
        smooth_landmarks=True,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5
    )
    
    hands = mp_hands.Hands(
        static_image_mode=False,
        max_num_hands=2,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5
    )
    
    # Open camera
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        logger.error("Cannot open camera")
        return
    
    # Create window
    cv2.namedWindow('Pose & Hand Tracking - Camera Feed', cv2.WINDOW_NORMAL)
    cv2.resizeWindow('Pose & Hand Tracking - Camera Feed', 1024, 768)
    
    logger.info("Camera viewer started. Press 'q' to quit.")
    logger.info("Gestures: FIST (red), POINTING (yellow), OPEN_PALM (green)")
    
    try:
        while True:
            success, image = cap.read()
            if not success:
                logger.warning("Ignoring empty camera frame.")
                continue
            
            # Flip the image horizontally for selfie-view
            image = cv2.cvtColor(cv2.flip(image, 1), cv2.COLOR_BGR2RGB)
            
            # Process the image
            image.flags.writeable = False
            pose_results = pose.process(image)
            hand_results = hands.process(image)
            
            # Draw annotations
            image.flags.writeable = True
            image_bgr = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
            
            # Draw pose landmarks
            if pose_results.pose_landmarks:
                mp_drawing.draw_landmarks(
                    image_bgr,
                    pose_results.pose_landmarks,
                    mp_pose.POSE_CONNECTIONS,
                    landmark_drawing_spec=mp_drawing_styles.get_default_pose_landmarks_style()
                )
            
            # Draw hand landmarks and gestures
            gesture_info = []
            if hand_results.multi_hand_landmarks and hand_results.multi_handedness:
                for hand_landmarks, handedness in zip(hand_results.multi_hand_landmarks, hand_results.multi_handedness):
                    # Draw hand landmarks
                    mp_drawing.draw_landmarks(
                        image_bgr,
                        hand_landmarks,
                        mp_hands.HAND_CONNECTIONS,
                        mp_drawing_styles.get_default_hand_landmarks_style(),
                        mp_drawing_styles.get_default_hand_connections_style()
                    )
                    
                    # Detect gesture
                    gesture = detect_gesture(hand_landmarks, mp_hands)
                    hand_label = handedness.classification[0].label
                    
                    # Store gesture info
                    gesture_info.append(f"{hand_label}: {gesture}")
                    
                    # Draw gesture text near wrist
                    wrist = hand_landmarks.landmark[mp_hands.HandLandmark.WRIST]
                    h, w, _ = image_bgr.shape
                    text_x = int(wrist.x * w)
                    text_y = int(wrist.y * h) - 20
                    
                    # Color based on gesture
                    if gesture == 'FIST':
                        color = (0, 0, 255)  # Red
                    elif gesture == 'POINTING':
                        color = (0, 255, 255)  # Yellow
                    elif gesture == 'OPEN_PALM':
                        color = (0, 255, 0)  # Green
                    elif gesture == 'BUNNY':
                        color = (255, 0, 255)  # Pink/Magenta
                    else:
                        color = (255, 255, 255)  # White
                    
                    # Draw text
                    text = f"{hand_label}: {gesture}"
                    cv2.putText(image_bgr, text, (text_x, text_y),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2, cv2.LINE_AA)
            
            # Add status overlay
            y_offset = 30
            if pose_results.pose_landmarks:
                cv2.putText(image_bgr, 'Pose: DETECTED', (10, y_offset),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
            else:
                cv2.putText(image_bgr, 'Pose: NOT DETECTED', (10, y_offset),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
            
            y_offset += 30
            if gesture_info:
                for info in gesture_info:
                    cv2.putText(image_bgr, info, (10, y_offset),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 0), 2)
                    y_offset += 30
            else:
                cv2.putText(image_bgr, 'Hands: NOT DETECTED', (10, y_offset),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (128, 128, 128), 2)
            
            # Display FPS
            fps = cap.get(cv2.CAP_PROP_FPS)
            cv2.putText(image_bgr, f'FPS: {fps:.1f}', (10, image_bgr.shape[0] - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
            
            # Display the image
            cv2.imshow('Pose & Hand Tracking - Camera Feed', image_bgr)
            
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
