# SyncForge Backend

SyncForge is a high-performance, real-time project management and team collaboration platform built as a **Modular Monolith** using **Java 21**, **Spring Boot 3.3**, **PostgreSQL 16**, and **Redis 7**.

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
*   Docker & Docker Compose (for running DB, Redis, and Mailhog)

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

### 1. Start Services via Docker Compose
To spin up PostgreSQL, Redis, Mailhog (for sandbox emails), and Prometheus, run:
```bash
docker compose up -d
```

### 2. Database Migrations
Database versioning is handled automatically via Flyway on startup. Schema migration files are located in [db/migration](file:///Users/slayer/SyncForge/backend/src/main/resources/db/migration).

### 3. Local Development Run
To build and start the Spring Boot backend locally, run:
```bash
cd backend
mvn spring-boot:run
```

### 4. Build Commands
To compile the project and build the fat jar, run:
```bash
mvn clean package -DskipTests
```

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
