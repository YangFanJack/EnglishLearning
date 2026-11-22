#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
  echo "未找到 Node.js。请先安装 Node.js 20 或更高版本：https://nodejs.org/"
  exit 1
fi

NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]")"
if [ "${NODE_MAJOR}" -lt 20 ]; then
  echo "当前 Node.js 版本为 $(node -v)，请升级到 20 或更高版本。"
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "首次运行，正在安装依赖…"
  npm install
fi

if [ ! -f public/data/manifest.json ]; then
  echo "正在生成题库…"
  npm run bank:build
fi

echo ""
echo "启动开发服务器…"
echo "浏览器打开终端中显示的地址（默认 http://localhost:5173）。按 Ctrl+C 停止。"
echo ""

exec npm run dev -- --host 0.0.0.0
