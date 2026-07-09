# SyncForge

SyncForge is a high-performance, real-time project management and team collaboration platform built as a **Modular Monolith** using **Java 21**, **Spring Boot 3.3**, **PostgreSQL 16**, **Redis 7**, and **React 18 + TypeScript 5**.

---

## 🚀 Features

*   **Secure Authentication**: JWT with refresh token rotation (family-based replay protection), lockout brute-force protection, and sign-up email verification.
*   **Workspace Management**: Dedicated tenant workspaces with member limits (max 50) and Role-Based Access Control (OWNER, ADMIN, MEMBER, VIEWER).
*   **Board & Task Lifecycle**: Columns reordered using Base-62 Fractional Indexing, WIP limits, WIP lockout counters, and task assignees limits.
*   **Real-time Synchronization**: STOMP over WebSockets messaging with subscription guards, user presence indicators, and Redis Pub/Sub multi-instance relay.
*   **Rich Collaboration**: Task comments with @mention parsers and a 15-minute editing timeframe restriction.
*   **Global Auditing**: Asynchronous system-wide activity timeline logs captured via transaction listeners.
*   **Native Search**: Postgres Full-Text indexing triggers for tasks and comments, with search histories cached in Redis.

---

## 🏛️ Architecture Overview

The backend uses a **Package-by-Feature** directory layout structure under a modular monolith paradigm. Services inside modules are isolated, enforcing inward dependency rules. Cross-module operations are decoupled using Spring Application Events.

```
com.syncforge/
├── SyncForgeApplication.java          # Application entry point
├── module/                            # Encapsulated feature modules
│   ├── auth/                          # Authentication lifecycle
│   ├── user/                          # User profile & preferences
│   ├── workspace/                     # Workspaces & invitations
│   ├── board/                         # Boards & columns
│   ├── task/                          # Tasks & labels
│   ├── comment/                       # Comment feeds & mentions
│   ├── notification/                  # In-app push notifications
│   ├── realtime/                      # WebSockets, STOMP & presence
│   ├── search/                        # Full-text postgres search
│   └── activity/                      # Audit trails
├── common/                            # Shared non-business utilities
├── security/                          # Filter configurations & rates
└── config/                            # Core infrastructure beans
```

---

## 🛠️ Prerequisites

Ensure you have the following installed locally:
*   Java 21 (Temurin OpenJDK recommended)
*   Maven 3.9+
*   Node.js 20+ & npm 10+
*   Docker & Docker Compose (for running DB, Redis, Mailhog, and Prometheus)

---

## ⚙️ Environment Variables

A template file [`.env.example`](file:///.env.example) outlines all variable configurations:

| Variable | Description | Default (Local/Docker) |
|---|---|---|
| `SPRING_DATASOURCE_URL` | PostgreSQL JDBC Connection URL | `jdbc:postgresql://postgres:5432/syncforge` |
| `SPRING_DATASOURCE_USERNAME` | Postgres username | `syncforge` |
| `SPRING_DATASOURCE_PASSWORD` | Postgres password | `syncforge_dev` |
| `SPRING_DATA_REDIS_HOST` | Redis host server | `redis` |
| `SPRING_DATA_REDIS_PORT` | Redis port | `6379` |
| `SYNCFORGE_JWT_SECRET` | Secret key for JWT signing | (32+ character key) |
| `SYNCFORGE_CORS_ALLOWED_ORIGINS` | CORS configuration origins | `http://localhost:3000,http://localhost:5173` |

---

## 🚀 Setup & Execution

### Running Everything with Docker Compose
To build and spin up the complete stack (Backend, Frontend, PostgreSQL, Redis, Mailhog, and Prometheus) in Docker containers, run:
```bash
docker compose up --build -d
```
The services will be accessible at:
*   **Frontend SPA**: `http://localhost` (Port 80)
*   **Backend API**: `http://localhost:8080`
*   **Mailhog UI** (for sandbox emails): `http://localhost:8025`
*   **Prometheus**: `http://localhost:9090`

### Running Locally for Development

#### 1. Start Infrastructure Container Services
Spin up PostgreSQL, Redis, and Mailhog:
```bash
docker compose up -d postgres redis mailhog prometheus
```

#### 2. Run Backend API Server
Using the Maven wrapper, compile and start the Spring Boot server:
```bash
cd backend
./mvnw spring-boot:run
```

#### 3. Run Frontend SPA Server
Install packages and start the Vite development server:
```bash
cd frontend
npm install
npm run dev
```
The local dev server will be accessible at `http://localhost:5173`.

### 4. Build Commands
To compile and build production jars and static bundles manually:
*   **Backend**: `cd backend && ./mvnw clean package -DskipTests`
*   **Frontend**: `cd frontend && npm run build`

---

## 🧪 Testing

To run the complete test suite (unit tests and controller integration tests):
```bash
mvn test
```

---

## 📊 Operations & Observability

### Actuator Monitoring Endpoints
*   Liveness Probe: `http://localhost:8080/actuator/health/liveness`
*   Readiness Probe: `http://localhost:8080/actuator/health/readiness`
*   Prometheus Metrics: `http://localhost:8080/actuator/prometheus`

### Interactive API Documentation
*   Swagger UI: `http://localhost:8080/swagger-ui/index.html`
*   OpenAPI JSON: `http://localhost:8080/v3/api-docs`
