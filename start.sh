#!/bin/bash
# ─────────────────────────────────────────────────────
# E-WASP Quick Start Script
# Starts backend + frontend with one command
# ─────────────────────────────────────────────────────

set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; AMBER='\033[0;33m'; NC='\033[0m'

echo ""
echo -e "${AMBER}  ███████╗       ██╗    ██╗ █████╗ ███████╗██████╗ ${NC}"
echo -e "${AMBER}  ██╔════╝      ██║    ██║██╔══██╗██╔════╝██╔══██╗${NC}"
echo -e "${AMBER}  █████╗  █████╗██║ █╗ ██║███████║███████╗██████╔╝${NC}"
echo -e "${AMBER}  ██╔══╝  ╚════╝██║███╗██║██╔══██║╚════██║██╔═══╝ ${NC}"
echo -e "${AMBER}  ███████╗      ╚███╔███╔╝██║  ██║███████║██║     ${NC}"
echo -e "${AMBER}  ╚══════╝       ╚══╝╚══╝ ╚═╝  ╚═╝╚══════╝╚═╝     ${NC}"
echo ""
echo -e "${GREEN}  Enterprise Early-Warning & Signal Detection Platform${NC}"
echo -e "  ──────────────────────────────────────────────────"
echo ""

MODE=${1:-"full"}

# ── OPTION 1: Standalone HTML (no install needed) ──────────────
if [ "$MODE" = "html" ]; then
    echo -e "${GREEN}✓ Opening E-WASP standalone analyzer (no setup needed)...${NC}"
    if command -v xdg-open &>/dev/null; then xdg-open ewasp_analyzer.html
    elif command -v open &>/dev/null; then open ewasp_analyzer.html
    else echo -e "${YELLOW}Open ewasp_analyzer.html in your browser${NC}"; fi
    exit 0
fi

# ── OPTION 2: Docker Compose (recommended) ─────────────────────
if [ "$MODE" = "docker" ] || ([ "$MODE" = "full" ] && command -v docker &>/dev/null); then
    echo -e "${GREEN}🐳 Starting with Docker Compose...${NC}"
    if [ ! -f ".env" ]; then cp .env.example .env; echo -e "${YELLOW}  Created .env from template — add your API keys${NC}"; fi
    docker compose up -d --build
    echo ""
    echo -e "${GREEN}✅ E-WASP is running!${NC}"
    echo -e "  Frontend:  ${AMBER}http://localhost:3000${NC}"
    echo -e "  API Docs:  ${AMBER}http://localhost:8000/docs${NC}"
    echo -e "  Upload API: ${AMBER}http://localhost:8000/api/upload/analyze${NC}"
    exit 0
fi

# ── OPTION 3: Manual (Python + Node) ───────────────────────────
echo -e "${GREEN}🚀 Starting E-WASP manually...${NC}"

# Backend
echo -e "\n${AMBER}[1/3] Setting up Python backend...${NC}"
cd backend
if [ ! -d ".venv" ]; then
    python3 -m venv .venv
    echo -e "  ${GREEN}✓ Virtual environment created${NC}"
fi
source .venv/bin/activate
pip install -r requirements.txt -q
echo -e "  ${GREEN}✓ Dependencies installed${NC}"

# Generate sample dataset
python -c "
import os; os.makedirs('data/raw', exist_ok=True)
try:
    from data.dataset_generator import generate_all_datasets
    generate_all_datasets()
    print('  ✓ Sample dataset generated')
except Exception as e:
    print(f'  ⚠ Dataset gen skipped: {e}')
"

# Start backend in background
uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
echo -e "  ${GREEN}✓ Backend started (PID: $BACKEND_PID)${NC}"
cd ..

# Frontend
echo -e "\n${AMBER}[2/3] Setting up Next.js frontend...${NC}"
cd frontend
if [ ! -d "node_modules" ]; then
    npm install -q
    echo -e "  ${GREEN}✓ Node modules installed${NC}"
fi
npm run dev &
FRONTEND_PID=$!
echo -e "  ${GREEN}✓ Frontend started (PID: $FRONTEND_PID)${NC}"
cd ..

echo -e "\n${AMBER}[3/3] E-WASP is ready!${NC}"
echo ""
echo -e "  ${GREEN}✅ RUNNING:${NC}"
echo -e "  ┌─────────────────────────────────────────────┐"
echo -e "  │  Frontend:       ${AMBER}http://localhost:3000${NC}       │"
echo -e "  │  API:            ${AMBER}http://localhost:8000${NC}       │"
echo -e "  │  Docs:           ${AMBER}http://localhost:8000/docs${NC}  │"
echo -e "  │  Upload API:     POST /api/upload/analyze   │"
echo -e "  │  Standalone:     ewasp_analyzer.html        │"
echo -e "  └─────────────────────────────────────────────┘"
echo ""
echo -e "  Press ${RED}Ctrl+C${NC} to stop all services"

# Cleanup on exit
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Stopped'" EXIT
wait
