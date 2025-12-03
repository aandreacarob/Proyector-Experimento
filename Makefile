.PHONY: start stop restart clean help backend web viewer status all

# Default target
all: start

# Start all servers in background
start:
	@echo "🚀 Starting AI Projection Mapping System..."
	@echo "Starting Python backend..."
	@cd project/python && OPENCV_AVFOUNDATION_SKIP_AUTH=1 .venv/bin/python main.py > ../../logs/backend.log 2>&1 & echo $$! > ../../.backend.pid
	@sleep 2
	@echo "Starting web server..."
	@cd project/web && python3 -m http.server 8000 > ../../logs/web.log 2>&1 & echo $$! > ../../.web.pid
	@sleep 1
	@echo "Starting camera viewer..."
	@cd project/python && OPENCV_AVFOUNDATION_SKIP_AUTH=1 .venv/bin/python camera_viewer.py > ../../logs/viewer.log 2>&1 & echo $$! > ../../.viewer.pid
	@echo ""
	@echo "✅ All servers started!"
	@echo "   - Backend: http://localhost:8765 (WebSocket)"
	@echo "   - Web: http://localhost:8000"
	@echo "   - Camera viewer window should appear"
	@echo ""
	@echo "📝 Logs are in ./logs/"
	@echo "🛑 To stop: make stop"

# Start only backend
backend:
	@echo "Starting Python backend..."
	@mkdir -p logs
	@cd project/python && OPENCV_AVFOUNDATION_SKIP_AUTH=1 .venv/bin/python main.py

# Start only web server
web:
	@echo "Starting web server..."
	@cd project/web && python3 -m http.server 8000

# Start only camera viewer
viewer:
	@echo "Starting camera viewer..."
	@cd project/python && OPENCV_AVFOUNDATION_SKIP_AUTH=1 .venv/bin/python camera_viewer.py

# Stop all servers (aggressive multi-strategy approach)
stop:
	@echo "🛑 Stopping all servers..."
	@# Strategy 1: Stop processes started by make (using PID files)
	@if [ -f .backend.pid ]; then \
		kill -9 `cat .backend.pid` 2>/dev/null || true; \
		rm .backend.pid; \
		echo "   ✓ Backend (from make) stopped"; \
	fi
	@if [ -f .web.pid ]; then \
		kill -9 `cat .web.pid` 2>/dev/null || true; \
		rm .web.pid; \
		echo "   ✓ Web server (from make) stopped"; \
	fi
	@if [ -f .viewer.pid ]; then \
		kill -9 `cat .viewer.pid` 2>/dev/null || true; \
		rm .viewer.pid; \
		echo "   ✓ Camera viewer (from make) stopped"; \
	fi
	@# Strategy 2: Kill by process name pattern
	@pkill -9 -f "Proyector-Experimento.*main.py" 2>/dev/null && echo "   ✓ Killed main.py processes" || true
	@pkill -9 -f "Proyector-Experimento.*camera_viewer.py" 2>/dev/null && echo "   ✓ Killed camera_viewer.py processes" || true
	@# Strategy 3: Kill by port
	@lsof -ti:8000 | xargs kill -9 2>/dev/null && echo "   ✓ Killed process on port 8000" || true
	@lsof -ti:8765 | xargs kill -9 2>/dev/null && echo "   ✓ Killed process on port 8765" || true
	@# Strategy 4: Killall as last resort
	@killall -9 Python 2>/dev/null && echo "   ✓ Killed all Python processes" || true
	@sleep 1
	@echo "✅ All servers stopped"
	@echo "💡 Run 'make status' to verify"

# Restart all servers
restart: stop
	@echo ""
	@echo "🔄 Restarting servers..."
	@sleep 2
	@$(MAKE) start

# Check status of servers
status:
	@echo "📊 Server Status Check"
	@echo ""
	@echo "Processes on port 8000 (web server):"
	@lsof -ti:8000 && lsof -i:8000 || echo "   No process found"
	@echo ""
	@echo "Processes on port 8765 (backend):"
	@lsof -ti:8765 && lsof -i:8765 || echo "   No process found"
	@echo ""
	@echo "Python processes matching project:"
	@pgrep -fl "Proyector-Experimento" || echo "   No processes found"
	@echo ""
	@echo "PID files:"
	@ls -la .*.pid 2>/dev/null || echo "   No PID files found"

# Clean logs and pid files
clean:
	@echo "🧹 Cleaning up..."
	@rm -rf logs
	@rm -f .backend.pid .web.pid .viewer.pid
	@echo "✅ Cleanup complete"

# Show help
help:
	@echo "AI Projection Mapping System - Makefile Commands"
	@echo ""
	@echo "Usage:"
	@echo "  make start    - Start all three servers (backend, web, viewer)"
	@echo "  make stop     - Stop all running servers (aggressive)"
	@echo "  make restart  - Restart all servers (stop + start)"
	@echo "  make status   - Check which servers are running"
	@echo "  make backend  - Start only Python backend (foreground)"
	@echo "  make web      - Start only web server (foreground)"
	@echo "  make viewer   - Start only camera viewer (foreground)"
	@echo "  make clean    - Remove logs and pid files"
	@echo "  make help     - Show this help message"
	@echo ""
	@echo "Quick Start:"
	@echo "  1. make start   # Start everything"
	@echo "  2. Open http://localhost:8000 in your browser"
	@echo "  3. make status  # Check if servers are running"
	@echo "  4. make restart # Restart if you made changes"
	@echo "  5. make stop    # When you're done"
