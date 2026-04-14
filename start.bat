@echo off
REM ─────────────────────────────────────────────────────
REM E-WASP Quick Start — Windows
REM ─────────────────────────────────────────────────────

echo.
echo  ████████╗      ██╗    ██╗ █████╗ ███████╗██████╗
echo  ██╔════╝      ██║    ██║██╔══██╗██╔════╝██╔══██╗
echo  █████╗  █████╗██║ █╗ ██║███████║███████╗██████╔╝
echo  ██╔══╝  ╚════╝██║███╗██║██╔══██║╚════██║██╔═══╝
echo  ███████╗      ╚███╔███╔╝██║  ██║███████║██║
echo  ╚══════╝       ╚══╝╚══╝ ╚═╝  ╚═╝╚══════╝╚═╝
echo.
echo  Enterprise Early-Warning ^& Signal Detection Platform
echo  ──────────────────────────────────────────────────
echo.

SET MODE=%1
IF "%MODE%"=="" SET MODE=html

REM ── Standalone HTML (no install) ──────────────────────
IF "%MODE%"=="html" (
    echo [INFO] Opening standalone E-WASP analyzer...
    start ewasp_analyzer.html
    exit /b 0
)

REM ── Docker ────────────────────────────────────────────
IF "%MODE%"=="docker" (
    echo [INFO] Starting with Docker Compose...
    IF NOT EXIST ".env" COPY .env.example .env
    docker compose up -d --build
    echo.
    echo [OK] E-WASP running at http://localhost:3000
    exit /b 0
)

REM ── Manual start ──────────────────────────────────────
echo [1/2] Starting Python backend...
cd backend
IF NOT EXIST ".venv" python -m venv .venv
CALL .venv\Scripts\activate
pip install -r requirements.txt -q
START "E-WASP Backend" cmd /k "uvicorn main:app --host 0.0.0.0 --port 8000 --reload"
cd ..

echo [2/2] Starting Next.js frontend...
cd frontend
IF NOT EXIST "node_modules" npm install -q
START "E-WASP Frontend" cmd /k "npm run dev"
cd ..

echo.
echo [OK] E-WASP is running!
echo      Frontend:  http://localhost:3000
echo      API Docs:  http://localhost:8000/docs
echo      Standalone: Open ewasp_analyzer.html
echo.
pause
