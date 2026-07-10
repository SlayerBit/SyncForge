#!/bin/bash
set -e

# SyncForge Local Development Shutdown Script

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${ROOT_DIR}"

echo "=================================================="
echo "🛑 Stopping SyncForge Local Environment..."
echo "=================================================="

# Check if volumes need to be cleaned up
WIPE_ALL=false
if [ "$1" == "--reset" ] || [ "$1" == "-r" ]; then
    WIPE_ALL=true
fi

if [ "$WIPE_ALL" = true ]; then
    echo "⚠️  Hard reset requested. Stopping containers and wiping volumes/data..."
    docker compose down -v
    echo "✅ Containers stopped and all persistent volumes wiped."
else
    echo "🧹 Gracefully stopping docker compose infrastructure containers..."
    docker compose down
    echo "✅ Containers stopped. Local persistent volumes retained."
fi

echo "=================================================="
echo "👋 SyncForge environment is clean and stopped."
echo "=================================================="
