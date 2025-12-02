import time
import math

class VisualLogic:
    def __init__(self):
        self.last_pose = None
        self.last_trigger_time = 0
        self.trigger_cooldown = 2.0  # Seconds between major AI generation events

    def process(self, pose_data):
        """
        Analyzes pose data and returns a list of commands to send to the client.
        """
        commands = []
        if not pose_data:
            return commands

        current_time = time.time()
        
        # Calculate velocity of the right index finger (wand tip)
        if self.last_pose:
            prev_idx = self.last_pose["right_index"]
            curr_idx = pose_data["right_index"]
            
            dx = curr_idx[0] - prev_idx[0]
            dy = curr_idx[1] - prev_idx[1]
            dist = math.sqrt(dx*dx + dy*dy)
            velocity = dist / (current_time - self.last_pose["timestamp"])
            
            # Logic 1: High velocity triggers particle burst
            if velocity > 1.5:  # Threshold needs tuning
                commands.append({
                    "command": "burst",
                    "params": {
                        "x": curr_idx[0],
                        "y": curr_idx[1],
                        "intensity": min(velocity, 5.0)
                    }
                })

            # Logic 2: Hands above head triggers "aura_boost"
            # Y coordinate is 0 at top, 1 at bottom in MediaPipe (usually)
            # Check if wrists are above nose
            rw_y = pose_data["right_wrist"][1]
            lw_y = pose_data["left_wrist"][1]
            nose_y = pose_data["nose"][1]
            
            if rw_y < nose_y and lw_y < nose_y:
                 commands.append({
                    "command": "aura_boost",
                    "params": {
                        "active": True
                    }
                })
            else:
                 commands.append({
                    "command": "aura_boost",
                    "params": {
                        "active": False
                    }
                })

            # Logic 3: Occasional AI Texture Generation
            # Triggered by specific gesture or random chance when active
            # For prototype: Trigger if hands are brought close together
            rw_x = pose_data["right_wrist"][0]
            lw_x = pose_data["left_wrist"][0]
            hand_dist = math.sqrt((rw_x - lw_x)**2 + (rw_y - lw_y)**2)
            
            if hand_dist < 0.1 and (current_time - self.last_trigger_time > self.trigger_cooldown):
                self.last_trigger_time = current_time
                commands.append({
                    "command": "generate_texture",
                    "params": {
                        "prompt": "glowing magical rune symbol, cyan and purple, black background, 8k",
                        "type": "rune"
                    }
                })

        self.last_pose = pose_data
        return commands
