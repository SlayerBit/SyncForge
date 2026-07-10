#!/bin/bash
set -e

# SyncForge Local Development Startup Script

# Navigate to the root directory (where script resides parent)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${ROOT_DIR}"

echo "=================================================="
echo "🚀 Starting SyncForge Local Environment Setup..."
echo "=================================================="

# 1. Check for .env file
if [ ! -f ".env" ]; then
    echo "⚠️ .env file not found. Copying from .env.example..."
    cp .env.example .env
    echo "✅ Created .env with default values."
else
    echo "✅ .env file exists."
fi

# 2. Spin up Docker containers
echo "🐳 Spinning up infrastructure containers via Docker Compose..."
docker compose up -d postgres redis mailhog prometheus
echo "✅ Docker infrastructure containers are up!"

# 3. Wait for PostgreSQL to be healthy
echo "⏳ Waiting for PostgreSQL container to be healthy..."
until [ "$(docker inspect --format='{{.State.Health.Status}}' syncforge-postgres)" == "healthy" ]; do
    echo "   ...waiting for postgres container health status..."
    sleep 2
done
echo "✅ PostgreSQL is ready and healthy."

# 4. Wait for Redis to be healthy
echo "⏳ Waiting for Redis container to be healthy..."
until [ "$(docker inspect --format='{{.State.Health.Status}}' syncforge-redis)" == "healthy" ]; do
    echo "   ...waiting for redis container health status..."
    sleep 2
done
echo "✅ Redis is ready and healthy."

echo "=================================================="
echo "🎉 Infrastructure ready!"
echo "--------------------------------------------------"
echo "💻 Next steps to run the application components:"
echo "1. Run the Spring Boot Backend API:"
echo "   cd backend && ./mvnw spring-boot:run"
echo "2. Run the React Frontend SPA:"
echo "   cd frontend && npm install && npm run dev"
echo "=================================================="
