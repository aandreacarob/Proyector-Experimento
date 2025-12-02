# AI Projection Mapping System (p5.js + MediaPipe + OpenAI)

## Prerequisites

1.  **Python 3.8+**
2.  **Node.js** (optional, for serving the web folder, or use Python's http.server)
3.  **Webcam** connected to your computer.
4.  **Projector** connected as a second display (extended mode).
5.  **OpenAI API Key** (optional, for AI texture generation).

## Installation

1.  Navigate to the project directory:
    ```bash
    cd project/python
    ```

2.  Install Python dependencies:
    ```bash
    pip install -r requirements.txt
    ```

3.  (Optional) Set up your OpenAI API Key:
    -   Create a `.env` file in `project/python`.
    -   Add: `AI_API_KEY=sk-your-key-here`
    -   Add: `AI_PROVIDER=openai`
    -   If skipped, the system will use a "Mock" generator (colored squares).

## Running the System

### 1. Start the Python Backend
This handles pose tracking, AI generation, and the WebSocket server.

```bash
cd project/python
python main.py
```

You should see logs indicating the server started on port 8765 and the camera is active.

### 2. Start the Web Client
You need to serve the `project/web` directory. You can use Python for this too.

Open a **new terminal**:
```bash
cd project/web
python -m http.server 8000
```

### 3. Open in Browser
1.  Open Chrome or Firefox.
2.  Go to `http://localhost:8000`.
3.  Move the browser window to your **Projector** screen and press **F11** (or Ctrl+Cmd+F on Mac) to go Fullscreen.

## Usage

-   **Calibration**: The system assumes the camera sees the person. Stand in front of the camera.
-   **Visuals**:
    -   **Trails**: Move your right hand/index finger.
    -   **Particles**: Move your hand quickly to trigger bursts.
    -   **Aura**: Raise both hands above your head to boost the aura.
    -   **AI Generation**: Bring your hands close together to trigger a texture generation.

## Debugging
-   Press **'d'** on the keyboard to toggle the debug panel.
-   Check the Python terminal for errors.
