import cv2
import time
from hand_tracking import HandTracker

def main():
    # Initialize hand tracker with window enabled
    tracker = HandTracker(source=0, show_window=True)
    tracker.start()
    
    print("Hand Gesture Viewer started.")
    print("Press 'q' in the window to quit.")
    print("\nGestures:")
    print("  - Fist: All fingers closed")
    print("  - Pointing: Only index finger extended")
    print("  - Open Palm: 3+ fingers extended")
    
    try:
        while tracker.running:
            hands_data = tracker.get_hands_data()
            
            if hands_data and hands_data.get('hands'):
                for hand in hands_data['hands']:
                    hand_label = hand['hand']
                    gesture = hand['gesture']
                    confidence = hand['confidence']
                    
                    print(f"\r{hand_label} Hand: {gesture.upper()} (confidence: {confidence:.2f})    ", end='', flush=True)
            
            time.sleep(0.1)
            
    except KeyboardInterrupt:
        print("\nInterrupted by user")
    finally:
        tracker.stop()
        print("\nHand gesture viewer stopped")

if __name__ == "__main__":
    main()
