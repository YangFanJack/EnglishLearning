@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo 未找到 Node.js。请先安装 Node.js 20 或更高版本：https://nodejs.org/
  pause
  exit /b 1
)

if not exist node_modules (
  echo 首次运行，正在安装依赖...
  call npm install
  if errorlevel 1 (
    pause
    exit /b 1
  )
)

if not exist public\data\manifest.json (
  echo 正在生成题库...
  call npm run bank:build
  if errorlevel 1 (
    pause
    exit /b 1
  )
)

echo.
echo 启动开发服务器...
echo 浏览器打开终端中显示的地址（默认 http://localhost:5173）。按 Ctrl+C 停止。
echo.
call npm run dev -- --host 0.0.0.0
pause
