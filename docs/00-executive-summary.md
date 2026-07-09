# SyncForge — Executive Summary

## Project Overview

**SyncForge** is a modern collaborative Kanban platform built to demonstrate production-quality software engineering. It draws inspiration from Linear, Trello, GitHub Projects, and Notion — but establishes its own identity in branding, terminology, UI/UX, and architecture.

The primary objective is to showcase production-grade backend engineering — clean architecture, distributed systems thinking, real-time collaboration, and operational reliability — while remaining realistic for a single developer to complete within approximately 2–3 months.

---

## Core Value Proposition

SyncForge provides workspace-based collaborative task management with real-time board synchronization, an activity timeline, and a presence system. It prioritizes engineering quality over feature quantity.

---

## Technology Stack

### Backend

| Technology | Purpose | Version |
|---|---|---|
| Java | Language | 21 (LTS) |
| Spring Boot | Framework | 3.x |
| Spring Security | Authentication & Authorization | 6.x |
| Spring Data JPA | Persistence | 3.x |
| Hibernate | ORM | 6.x |
| PostgreSQL | Primary Database | 16 |
| Flyway | Schema Migration | 10.x |
| Redis | Caching, Presence, Rate Limiting | 7.x |
| Spring WebSocket + STOMP | Real-Time Communication | — |
| JWT (jjwt) | Stateless Authentication | 0.12.x |
| MapStruct | Object Mapping | 1.6.x |
| Jakarta Bean Validation | Input Validation | 3.x |
| Lombok | Boilerplate Reduction (minimal) | — |
| SpringDoc OpenAPI | API Documentation | 2.x |
| Docker / Docker Compose | Containerization | — |
| JUnit 5 | Unit Testing | 5.x |
| Mockito | Mocking | 5.x |
| Testcontainers | Integration Testing | 1.x |
| Maven | Build Tool | 3.9.x |

### Frontend

| Technology | Purpose |
|---|---|
| React 18 | UI Framework |
| TypeScript 5 | Type Safety |
| Vite 5 | Build Tool |
| Tailwind CSS 3 | Utility-First Styling |
| shadcn/ui | Component Primitives |
| TanStack Query v5 | Server State Management |
| Zustand | Client State Management |
| React Router v6 | Routing |
| React Hook Form | Form Management |
| Zod | Schema Validation |
| dnd-kit | Drag & Drop |
| Framer Motion | Animations (minimal) |
| Lucide Icons | Iconography |

### Infrastructure

| Technology | Purpose |
|---|---|
| Docker Compose | Local Development & Deployment |
| Mailhog | Email Testing (Development) |
| Spring Boot Actuator | Health Checks & Metrics |
| Micrometer + Prometheus | Metrics Collection |
| Grafana | Metrics Visualization |
| GitHub Actions | CI/CD |

---

## Excluded Technologies

The following are intentionally excluded from the initial implementation:

| Technology | Reason |
|---|---|
| Microservices | Unnecessary complexity for this scale |
| Kafka / RabbitMQ | No external messaging needed; Spring Events suffice |
| Kubernetes | Docker Compose is sufficient for deployment |
| GraphQL | REST provides simpler, well-understood patterns |
| Elasticsearch | PostgreSQL Full-Text Search is adequate |
| CQRS / Event Sourcing | Over-engineering for the domain complexity |
| gRPC | No inter-service communication needed |
| AWS S3 / MinIO | Avatars use Gravatar; no file uploads |
| OAuth Login | Password-based auth is sufficient for MVP |

---

## Capacity Targets

| Metric | Target |
|---|---|
| Registered Users | 10,000 |
| Workspaces | 1,000 |
| Tasks | 100,000 |
| Concurrent Users | 2,000 |
| Concurrent WebSocket Connections | 500 |
| Task Updates per Second | 100 |
| Notification Events per Second | 50 |

---

## Performance Targets

| Operation | Target Latency |
|---|---|
| Login | < 300 ms |
| Task CRUD | < 200 ms |
| Board Load | < 500 ms |
| Search | < 500 ms |
| Notification Delivery | < 500 ms |
| Presence Update | < 150 ms |
| WebSocket Broadcast | < 150 ms |
| Dashboard | < 1 second |

---

## Non-Functional Requirements Summary

### Performance
- API p95 latency under targets above
- Database queries optimized with proper indexing
- Redis caching for hot paths (workspace membership, user profiles, board data)
- Connection pooling (HikariCP, default 10 connections)

### Scalability
- Stateless backend behind a load balancer
- Multiple application instances sharing PostgreSQL and Redis
- No sticky sessions
- Horizontal scaling without code changes

### Reliability
- Optimistic locking for concurrent updates
- Idempotent operations where applicable
- Graceful degradation when Redis is unavailable
- Transactional consistency for all write operations

### Security
- OWASP Top 10 mitigations
- BCrypt password hashing (cost factor 12)
- JWT with short-lived access tokens (15 min) and rotated refresh tokens (7 days)
- Redis-backed rate limiting (Sliding Window Counter)
- Input validation at transport, business, and database layers

### Maintainability
- Package-by-Feature with Clean Architecture principles
- Consistent naming conventions and coding standards
- Comprehensive OpenAPI documentation
- Structured logging with correlation IDs

### Observability
- Structured JSON logging
- Prometheus metrics via Micrometer
- Grafana dashboards
- Health, readiness, and liveness endpoints
- Business metrics (active users, tasks created, boards loaded)

### Accessibility
- WCAG 2.1 AA compliance
- Full keyboard navigation
- Screen reader support
- Minimum 4.5:1 contrast ratio

### Testability
- Testing pyramid: unit > integration > E2E
- Testcontainers for real PostgreSQL and Redis in integration tests
- 80%+ line coverage target for business logic
- Security-specific test suite

---

## Initial Implementation Scope

### Core Features

| Domain | Features |
|---|---|
| **Authentication** | Registration, Login, Logout, JWT, Refresh Token Rotation, Email Verification, Forgot Password, Password Reset |
| **User Management** | User Profile, Preferences, Gravatar Avatar, Account Status |
| **Workspace** | Create, Member Management, Invitations, Settings, Ownership Transfer |
| **Board** | Create, Columns, Drag-and-Drop Ordering, Archive |
| **Task** | Create, Update, Archive, Labels, Assignments, Activity Timeline |
| **Comment** | Create, Edit, Soft Delete, Mentions |
| **Notification** | In-App Notifications, Real-Time Delivery, Read/Unread, Preferences |
| **Presence** | Online/Offline/Away, Active Board, Heartbeats |
| **Search** | PostgreSQL Full-Text Search across Tasks, Boards, Comments |
| **Platform** | Docker, OpenAPI, Testing, Structured Logging, Monitoring |

### Explicitly Out of Scope (MVP)
- Teams, Sprints, Milestones, Releases
- Burndown charts, velocity tracking
- Feature flags, advanced analytics
- Offline support, AI assistance
- Public APIs, plugin system
- Mobile applications
- Multi-region deployment, microservice extraction
- OAuth/social login
- File uploads

---

## Architecture Summary

- **Style**: Modular Monolith with Package-by-Feature
- **Architecture**: Clean Architecture principles (controller → service → repository layering within each module)
- **Communication**: Synchronous in-process; Spring Application Events for cross-module decoupling
- **Persistence**: PostgreSQL (primary), Redis (caching, presence, rate limiting)
- **Real-Time**: Spring WebSocket with STOMP, Redis Pub/Sub for multi-instance broadcast
- **Auth**: Stateless JWT with Redis-backed refresh token rotation and JWT blacklist
- **Deployment**: Docker Compose with PostgreSQL, Redis, Mailhog, Prometheus, Grafana

---

## Document Index

| # | Document | Description |
|---|---|---|
| 00 | Executive Summary | This document |
| 01 | Architecture Overview | Modular monolith, Clean Architecture, distributed readiness |
| 02 | Domain Model | Entities, relationships, ER diagram |
| 03 | Module Architecture | All modules with documentation standard, dependency matrix |
| 04 | Business Rules & State Machines | Rules, state machines, Mermaid diagrams |
| 05 | Authentication & Authorization | Auth flows, JWT, RBAC, permission matrix |
| 06 | Security Architecture | OWASP, rate limiting, security logging |
| 07 | Database Design | All tables, indexes, Flyway, transactions |
| 08 | Redis & Caching Strategy | Cache-aside, key standards, TTLs |
| 09 | Real-Time Collaboration | WebSocket, STOMP, presence, distributed sync |
| 10 | REST API Specification | All endpoints, validation, error handling |
| 11 | Domain Events | Event catalog, publishers, consumers |
| 12 | Concurrency & Distributed Systems | Optimistic locking, ordering, race conditions |
| 13 | Frontend Architecture | React, state, routing, WebSocket integration |
| 14 | Design System | Typography, colors, components |
| 15 | Screen Specifications | All screens with states and interactions |
| 16 | Testing Strategy | Pyramid, Testcontainers, coverage |
| 17 | Observability & Operations | Logging, metrics, monitoring, alerting |
| 18 | Docker & Deployment | Dockerfiles, Compose, networking |
| 19 | CI/CD Pipeline | GitHub Actions, branching, versioning |
| 20 | Coding Standards | Naming, conventions, principles |
| 21 | Repository Structure | Full layout with ownership |
| 22 | Implementation Roadmap | 10 phases with estimates |
| 23 | Future Enhancements | Migration strategies for future features |
| 24 | Architecture Decision Records | All major ADRs |
| 25 | Appendix — Diagrams | Consolidated Mermaid diagrams |
