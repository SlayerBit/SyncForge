# SyncForge — Future Enhancements

## Overview

These features are intentionally excluded from the initial implementation. This document describes their architectural impact and migration strategies so the initial architecture doesn't preclude them.

---

## Teams

### Description
Group workspace members into teams for bulk assignment and access control.

### Architectural Impact
- New `teams` and `team_members` tables
- Task assignment extends to support team assignment
- RBAC may need team-level permissions

### Migration Strategy
1. Add `teams` and `team_members` tables via Flyway migration
2. Add `TeamService` module
3. Extend `TaskAssignment` to support `team_id` (nullable FK)
4. No breaking changes to existing APIs — team assignment is additive

---

## Sprints

### Description
Time-boxed iterations for grouping and tracking work.

### Architectural Impact
- New `sprints` table (workspace-scoped, with start/end dates)
- `tasks` table gets nullable `sprint_id` FK
- New Sprint CRUD APIs
- Sprint view alongside Board view

### Migration Strategy
1. Add `sprints` table and `sprint_id` column to `tasks`
2. Add `SprintService` module
3. Extend task filtering to support sprint filter
4. No breaking changes — `sprint_id` is nullable

---

## Milestones & Releases

### Description
Track progress toward milestones and group completed work into releases.

### Architectural Impact
- New `milestones` and `releases` tables
- Tasks linked to milestones
- Release notes generation from activity logs

### Migration Strategy
- New tables with FK to workspaces
- Optional FK from tasks to milestones
- New API endpoints; no changes to existing APIs

---

## Burndown Charts & Velocity Tracking

### Description
Visual charts showing sprint progress and team velocity.

### Architectural Impact
- Requires historical snapshot data (task status at each point in time)
- `activity_logs` already captures status changes — can be used for reconstruction
- New aggregation queries and charting API

### Migration Strategy
- No schema changes needed — reconstruct from activity logs
- Add read-only analytics endpoints
- Frontend charting library (Recharts or Chart.js)

---

## Feature Flags

### Description
Control feature availability per workspace or user.

### Architectural Impact
- New `feature_flags` table
- Flag evaluation middleware
- Admin API for flag management

### Migration Strategy
1. Add `feature_flags` and `feature_flag_overrides` tables
2. Add `FeatureFlagService` with evaluation logic
3. Inject flag checks at service layer where needed
4. No breaking changes — features default to enabled

---

## Advanced Analytics

### Description
Usage analytics, task completion trends, member activity metrics.

### Architectural Impact
- Heavy read queries on activity_logs
- Potential need for materialized views or pre-aggregated tables
- Dashboard API endpoints

### Migration Strategy
- Add materialized views for common aggregations
- Refresh materialized views on a schedule (e.g., hourly)
- New analytics module with read-only endpoints

---

## Offline Support

### Description
Allow users to work offline and sync when reconnecting.

### Architectural Impact
- **Major** — requires client-side persistence and conflict resolution
- Service workers for caching
- Client-side database (IndexedDB)
- Conflict resolution strategy (last-write-wins or CRDT)
- Queue of offline operations to replay on reconnect

### Migration Strategy
- This is a significant frontend rearchitecture
- Backend APIs need idempotency keys for operation replay
- Consider CRDT for collaborative fields (description)
- Phased rollout: read-only offline first, then write support

---

## AI Assistance

### Description
AI-powered features: task summarization, priority suggestion, duplicate detection.

### Architectural Impact
- External API integration (OpenAI, etc.)
- Async processing for AI responses
- New configuration for API keys and rate limits

### Migration Strategy
- Add `AiService` module with external API client
- Expose as optional API endpoints
- Feature-flagged for opt-in

---

## Plugin System

### Description
Allow third-party integrations (Slack, GitHub, etc.).

### Architectural Impact
- Webhook system for external notifications
- Plugin registration and configuration
- Plugin-specific event consumers

### Migration Strategy
- Add `plugins` and `webhooks` tables
- Add webhook delivery service
- Domain events are already in place — extend event consumers to include webhook delivery

---

## Public APIs

### Description
Stable, versioned APIs for external consumers.

### Architectural Impact
- API versioning (`/api/v1/...`)
- API key authentication
- Rate limiting per API key
- OpenAPI documentation per version

### Migration Strategy
- Introduce versioned API controllers alongside existing ones
- Add API key management (new `api_keys` table)
- Add per-key rate limiting

---

## Mobile Applications

### Description
Native iOS and Android apps.

### Architectural Impact
- REST APIs already support mobile clients
- Push notification delivery (APNs, FCM)
- OAuth token management for mobile
- Responsive API responses (mobile-friendly payloads)

### Migration Strategy
- Backend APIs are already stateless and mobile-ready
- Add push notification provider (Firebase Cloud Messaging)
- Add device registration endpoint
- Notification module extended to deliver via push

---

## OAuth / Social Login

### Description
Login via Google, GitHub, Microsoft.

### Architectural Impact
- Spring Security OAuth2 client integration
- User account linking (multiple auth providers)
- Account creation from OAuth profile

### Migration Strategy
1. Add `user_auth_providers` table (userId, provider, providerId)
2. Configure Spring Security OAuth2 client
3. Add OAuth login endpoints (`/api/auth/oauth/google`, etc.)
4. Link or create user account on first OAuth login
5. Existing password-based auth remains unchanged

---

## File Uploads (S3/MinIO)

### Description
Upload attachments to tasks and custom user avatars.

### Architectural Impact
- Object storage integration (S3, MinIO)
- New `attachments` table
- Upload/download endpoints
- Presigned URL generation

### Migration Strategy
1. Add MinIO to Docker Compose
2. Add `FileStorageService` module
3. Add `attachments` table (task_id, filename, size, content_type, storage_key)
4. Presigned URL upload flow (client → presigned URL → direct upload to MinIO)
5. Replace Gravatar with user-uploaded avatars (optional)

---

## Microservice Extraction

### Description
Extract high-load modules into independent microservices.

### Architectural Impact
- **Major** — requires service mesh, API gateway, message broker
- Each module becomes a separate deployment
- Inter-service communication via REST/gRPC + message broker

### Migration Strategy (per module)
1. Extract module into separate Spring Boot application
2. Replace direct service calls with REST client
3. Replace Spring Application Events with Kafka/RabbitMQ
4. Give module its own database
5. Set up service discovery and API gateway
6. Deploy independently

**Priority extraction candidates** (by load and independence):
1. Notification module — highest event volume, most independent
2. Search module — read-only, can scale independently
3. Presence module — Redis-centric, minimal DB dependency

### When to Extract
Extract only when:
- Single module's resource needs exceed what vertical scaling can handle
- A module needs independent scaling (e.g., 10x notification volume)
- Team growth requires independent deployment cycles

**Do not extract prematurely.** The modular monolith handles the capacity targets (10,000 users, 100 updates/sec) without extraction.

---

## Multi-Region Deployment

### Description
Deploy to multiple geographic regions for latency and availability.

### Architectural Impact
- PostgreSQL read replicas per region
- Redis per region (with cross-region invalidation)
- CDN for frontend assets
- Region-aware routing

### Migration Strategy
- This requires significant infrastructure investment
- Evaluate only when user base spans continents
- Start with CDN for static assets (immediate win)
- Then add read replicas for read-heavy regions
- Full multi-region requires distributed database (CockroachDB/Citus)
