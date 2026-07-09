# SyncForge — Architecture Decision Records

## ADR Index

| ADR | Decision | Status |
|-----|----------|--------|
| ADR-001 | Modular Monolith Architecture | Accepted |
| ADR-002 | Package-by-Feature Organization | Accepted |
| ADR-003 | Clean Architecture Without Hexagonal Ports | Accepted |
| ADR-004 | Synchronous Domain Events | Accepted |
| ADR-005 | PostgreSQL as Primary Database | Accepted |
| ADR-006 | Redis for Caching, Presence, and Rate Limiting | Accepted |
| ADR-007 | Optimistic Locking for Concurrency | Accepted |
| ADR-008 | Fractional Indexing for Ordering | Accepted |
| ADR-009 | JWT with Redis-Backed Blacklist | Accepted |
| ADR-010 | Sliding Window Counter for Rate Limiting | Accepted |
| ADR-011 | STOMP over WebSocket for Real-Time | Accepted |
| ADR-012 | PostgreSQL Full-Text Search | Accepted |
| ADR-013 | Gravatar for Avatars | Accepted |
| ADR-014 | Offset + Cursor Pagination Strategy | Accepted |
| ADR-015 | Redis Pub/Sub for Multi-Instance Broadcast | Accepted |
| ADR-016 | Flyway for Schema Migrations | Accepted |
| ADR-017 | MapStruct for Object Mapping | Accepted |

---

## ADR-001: Modular Monolith Architecture

### Context
SyncForge is a collaborative Kanban platform built by a single developer. The architecture must balance production quality with development velocity.

### Problem
Choose between monolith, modular monolith, and microservices.

### Requirements
- Clear module boundaries for maintainability
- Strong data consistency
- Simple deployment and debugging
- Future microservice extraction path
- Realistic for one developer

### Alternatives Considered

| Approach | Pros | Cons |
|---|---|---|
| **Simple Monolith** | Fastest to build | No module boundaries; becomes unmaintainable |
| **Modular Monolith** | Clear boundaries, strong consistency, simple deployment | Requires discipline to enforce boundaries |
| **Microservices** | Independent deployment, team scaling | Massive operational overhead, distributed transactions, network complexity |

### Chosen Solution
**Modular Monolith** — module boundaries enforce separation of concerns while maintaining the simplicity of a single deployment unit and shared database transactions.

### Trade-offs
- (+) Strong transactional consistency across modules
- (+) Simple debugging — single process, single log stream
- (+) No network overhead between modules
- (+) Clear extraction path to microservices
- (-) Requires discipline to prevent module boundary violations
- (-) Vertical scaling limits (acceptable for capacity targets)

### Future Migration
Extract modules into microservices by replacing direct service calls with REST/gRPC and Spring Events with a message broker. Each module already owns its tables and has explicit dependencies.

---

## ADR-002: Package-by-Feature Organization

### Context
Code organization impacts discoverability, cohesion, and change isolation.

### Problem
Choose between package-by-layer and package-by-feature.

### Alternatives Considered

| Approach | Pros | Cons |
|---|---|---|
| **Package-by-Layer** (`controller/`, `service/`, `repository/`) | Familiar convention | High coupling across features; changes span multiple packages |
| **Package-by-Feature** (`task/`, `board/`, `workspace/`) | High cohesion; changes isolated to one package | Less familiar for some developers |

### Chosen Solution
**Package-by-Feature** — each module contains all its layers (controller, service, repository, DTOs, events) in a single package subtree.

### Advantages
- A change to "tasks" touches only the `task/` package
- Module boundaries are visible in the file system
- Natural unit for microservice extraction
- Easier code review — all related code in one place

---

## ADR-003: Clean Architecture Without Hexagonal Ports

### Context
The prompt mentions both Clean Architecture and Hexagonal Architecture. These overlap significantly.

### Problem
Determine the appropriate level of architectural abstraction.

### Alternatives Considered

| Approach | Pros | Cons |
|---|---|---|
| **Clean Architecture (layered within modules)** | Clear dependency flow; pragmatic | Less formal than Hexagonal |
| **Hexagonal Architecture (ports & adapters)** | Maximum decoupling | Doubles file count; interface-per-adapter adds ceremony without benefit at this scale |
| **No formal architecture** | Simplest | Boundaries degrade over time |

### Chosen Solution
**Clean Architecture principles** — enforce inward dependency flow (Controller → Service → Repository) within each module. Spring's built-in interfaces (JpaRepository, etc.) serve as natural port abstractions.

### Trade-offs
- (+) Pragmatic — fewer files, less ceremony
- (+) Testable — Mockito can mock concrete Spring beans
- (-) Less formal — no compile-time port enforcement
- Acceptable because: single developer, consistent discipline, code review by the developer themselves

---

## ADR-004: Synchronous Domain Events

### Context
Modules need to communicate without tight coupling (e.g., Task creation should trigger Notification creation).

### Problem
Choose between direct service calls, synchronous events, and asynchronous message brokers.

### Alternatives Considered

| Approach | Pros | Cons |
|---|---|---|
| **Direct service calls** | Simple, type-safe | Creates coupling; circular dependency risk |
| **Spring Application Events (synchronous)** | Decoupled, in-process, transactional | Single-threaded; event handler failures affect publisher |
| **Spring Application Events (async)** | Non-blocking | Loses transactional guarantees; harder to debug |
| **External broker (Kafka/RabbitMQ)** | Fully decoupled, scalable | Massive operational complexity; unnecessary at this scale |

### Chosen Solution
**Spring Application Events (synchronous, after-commit)**

- Events are published using `ApplicationEventPublisher`
- Critical events (notification creation, activity logging) use `@TransactionalEventListener(phase = AFTER_COMMIT)` to ensure they fire only after the originating transaction commits successfully
- This preserves data consistency: if the transaction rolls back, no events fire

### Trade-offs
- (+) No external infrastructure
- (+) Transactional consistency
- (+) Simple debugging — stack trace shows full event chain
- (-) Event handler failure does not roll back the originating transaction (acceptable — notifications are best-effort)
- (-) Not suitable for high-throughput event processing (acceptable — 100 updates/sec is within bounds)

### Future Migration
Replace `ApplicationEventPublisher` with a message broker adapter. Event classes remain unchanged; only the publishing mechanism changes.

---

## ADR-005: PostgreSQL as Primary Database

### Context
The application needs a relational database for structured data with ACID transactions.

### Problem
Choose the primary database.

### Alternatives Considered

| Database | Pros | Cons |
|---|---|---|
| **PostgreSQL** | ACID, Full-Text Search, JSONB, mature, excellent Java support | Slightly more complex setup than H2 |
| **MySQL** | Popular, mature | Weaker Full-Text Search, no JSONB |
| **MongoDB** | Flexible schema | No ACID across collections; not suitable for relational data |
| **H2** | Zero setup | Not production-grade |

### Chosen Solution
**PostgreSQL 16** — provides ACID transactions, excellent Full-Text Search (eliminating Elasticsearch), JSONB for semi-structured data (user preferences), strong indexing, and battle-tested production reliability.

### Key Benefits for SyncForge
- Full-Text Search with `tsvector`/`tsquery` eliminates Elasticsearch dependency
- JSONB for user preferences avoids a separate preferences table
- `FOR UPDATE SKIP LOCKED` for future background job processing
- Excellent Testcontainers support

---

## ADR-006: Redis for Caching, Presence, and Rate Limiting

### Context
The application needs caching, presence tracking, rate limiting, and multi-instance coordination.

### Problem
Choose an in-memory data store.

### Alternatives Considered

| Approach | Pros | Cons |
|---|---|---|
| **Redis** | Versatile (cache, pub/sub, rate limiting, presence), atomic operations, TTL | Additional infrastructure dependency |
| **In-memory (Caffeine/Guava)** | Zero infrastructure | Not shared across instances; no pub/sub |
| **Memcached** | Simple caching | No pub/sub, no data structures |
| **No caching** | Simplest | Cannot meet performance targets |

### Chosen Solution
**Redis 7** — provides caching (cache-aside), presence tracking (SETEX with TTL), rate limiting (INCR with EXPIRE), JWT blacklist (SET with TTL), and Pub/Sub for multi-instance WebSocket broadcast.

### Trade-offs
- (+) Single infrastructure component serves multiple needs
- (+) Atomic operations prevent race conditions
- (+) TTL-based expiration eliminates cleanup jobs for ephemeral data
- (-) Additional infrastructure dependency
- (-) Data loss on Redis restart (acceptable — all Redis data is ephemeral or reconstructable)

### Graceful Degradation
If Redis is unavailable:
- **Caching**: Bypass cache; read from PostgreSQL (slower but functional)
- **Rate limiting**: Disable rate limiting temporarily (log warning)
- **Presence**: Mark all users as "unknown"; recover on Redis reconnect
- **JWT blacklist**: Fall back to database check (slower)
- **Pub/Sub**: WebSocket broadcasts are instance-local only (acceptable temporary degradation)

---

## ADR-007: Optimistic Locking for Concurrency

### Context
Multiple users may update the same task, column, or board simultaneously.

### Problem
Choose a concurrency control strategy.

### Alternatives Considered

| Approach | Pros | Cons |
|---|---|---|
| **Optimistic locking (version column)** | No lock contention, high throughput | Requires conflict handling |
| **Pessimistic locking (SELECT FOR UPDATE)** | Simple conflict handling | Lock contention, deadlock risk, reduced throughput |
| **Last-write-wins** | Simplest | Silent data loss |

### Chosen Solution
**Optimistic locking** using JPA `@Version` annotation on entities that support concurrent updates (tasks, columns, boards, comments).

### Workflow
1. Client reads entity (receives `version` in response)
2. Client sends update (includes `version` in request)
3. Server issues `UPDATE ... SET version = version + 1 WHERE id = ? AND version = ?`
4. If 0 rows affected → `409 Conflict` response
5. Client displays conflict message and refreshes

### Trade-offs
- (+) No lock contention — reads never block
- (+) Natural fit for REST APIs — version travels in the DTO
- (+) Simple implementation with JPA `@Version`
- (-) Requires client-side conflict handling
- (-) High-contention scenarios may cause repeated retries (unlikely for Kanban at these capacity targets)

---

## ADR-008: Fractional Indexing for Drag-and-Drop Ordering

### Context
Columns and tasks need user-defined ordering that supports drag-and-drop reordering.

### Problem
Choose an ordering strategy for columns within a board and tasks within a column.

### Alternatives Considered

| Approach | Pros | Cons |
|---|---|---|
| **Sequential integers** (1, 2, 3) | Simple | Every reorder requires updating all subsequent items |
| **Gap buffer** (100, 200, 300) | Fewer updates | Gaps exhaust; requires periodic rebalancing |
| **Fractional indexing** (lexicographic strings) | Single-row update per reorder; no exhaustion | Slightly more complex key generation |

### Chosen Solution
**Fractional Indexing** using lexicographic string keys.

### How It Works
- Each item has a `position` column of type `VARCHAR(255)`
- Initial positions: `"a"`, `"b"`, `"c"`
- Insert between `"a"` and `"b"` → `"aV"` (midpoint in base-52 alphabet)
- Only the moved item's row is updated — O(1) database writes
- Keys are generated using a deterministic midpoint algorithm

### Implementation
Use a utility class that generates lexicographic midpoints between two strings. If two strings are adjacent (no midpoint possible), trigger a rebalancing operation that reassigns all positions in the column.

### Trade-offs
- (+) O(1) writes for most reorder operations
- (+) No cascade updates
- (+) Concurrent reorders on different items don't conflict
- (-) Rare rebalancing needed when keys become too long (> 50 chars)
- (-) Slightly more complex than integer positions

### Database Impact
- `position` column: `VARCHAR(255)` with index
- Sort query: `ORDER BY position ASC`
- Rebalancing: batch update within a transaction (< 100 items per column)

---

## ADR-009: JWT with Redis-Backed Blacklist

### Context
Stateless authentication requires JWT. Logout and token revocation require a blacklist mechanism.

### Problem
Choose between fully stateless JWT (no revocation), database-backed blacklist, and Redis-backed blacklist.

### Alternatives Considered

| Approach | Pros | Cons |
|---|---|---|
| **No blacklist** | Simplest | Cannot revoke tokens; security risk |
| **Database blacklist** | Persistent | Slow for every request; defeats stateless benefit |
| **Redis blacklist** | Fast (O(1) lookup), TTL-based cleanup | Depends on Redis availability |

### Chosen Solution
**Redis-backed JWT blacklist** with TTL matching the access token's remaining lifetime.

### Implementation
- On logout: `SET jwt:blacklist:{jti} "" EX {remaining_seconds}`
- On every request: JWT filter checks `EXISTS jwt:blacklist:{jti}`
- Redis TTL ensures automatic cleanup — no background jobs needed

### Trade-offs
- (+) O(1) blacklist check per request
- (+) Automatic cleanup via TTL
- (+) Shared across instances
- (-) If Redis is down, blacklisted tokens are temporarily accepted (mitigated by short access token lifetime of 15 minutes)

---

## ADR-010: Sliding Window Counter for Rate Limiting

### Context
Rate limiting protects authentication endpoints from brute-force attacks and prevents API abuse.

### Problem
Choose a rate limiting algorithm.

### Alternatives Considered

| Algorithm | Accuracy | Memory | Complexity | Redis Operations |
|---|---|---|---|---|
| **Fixed Window** | Low (boundary spikes) | Low | Simple | 2 ops |
| **Sliding Window Log** | High | High (stores every request) | Moderate | 2-3 ops |
| **Sliding Window Counter** | Good (weighted approximation) | Low | Moderate | 3-4 ops |
| **Token Bucket** | Good | Low | Higher | 3-4 ops |

### Chosen Solution
**Sliding Window Counter** — approximates a true sliding window by weighting the previous window's count and current window's count based on elapsed time.

### Implementation
- Two Redis keys per window: `rate_limit:{endpoint}:{userId}:{window_start}` for current and previous windows
- Weighted count = `(previous_count × overlap_percentage) + current_count`
- Compare against limit → allow or reject (429)

### Trade-offs
- (+) Good accuracy without storing individual request timestamps
- (+) Low memory usage (2 counters per endpoint per user)
- (+) Simple Redis operations (GET, INCR, EXPIRE)
- (-) Approximate — can theoretically allow a few extra requests at window boundaries
- Acceptable because: rate limits have safety margins; exact precision is unnecessary

---

## ADR-011: STOMP over WebSocket for Real-Time

### Context
The application needs real-time updates for board changes, comments, notifications, and presence.

### Problem
Choose a WebSocket protocol.

### Alternatives Considered

| Approach | Pros | Cons |
|---|---|---|
| **Raw WebSocket** | Flexible | Manual message routing, subscription management, error handling |
| **STOMP over WebSocket** | Built-in pub/sub, Spring integration, topic routing | Slight protocol overhead |
| **Server-Sent Events (SSE)** | Simpler | Unidirectional; no client-to-server messages |
| **Socket.IO** | Feature-rich | Not native to Spring; JavaScript-centric |

### Chosen Solution
**STOMP over WebSocket** — Spring's native STOMP support provides message routing, topic subscriptions, user destinations, and authentication integration out of the box.

### Trade-offs
- (+) Spring provides `SimpMessagingTemplate` for server-side broadcasting
- (+) Topic-based subscriptions (`/topic/board/{id}`) map naturally to Kanban channels
- (+) User-specific destinations (`/user/queue/notifications`) for private messages
- (+) Built-in heartbeat support
- (-) STOMP protocol adds a few bytes of overhead per message (negligible)

---

## ADR-012: PostgreSQL Full-Text Search

### Context
Search functionality is required for tasks, boards, comments, labels, and users.

### Problem
Choose a search implementation.

### Alternatives Considered

| Approach | Pros | Cons |
|---|---|---|
| **PostgreSQL Full-Text Search** | No additional infrastructure; ACID consistent; good enough for scale | Less feature-rich than Elasticsearch |
| **Elasticsearch** | Best-in-class search | Significant operational overhead; data synchronization complexity |
| **LIKE queries** | Simplest | No ranking; poor performance on large datasets |

### Chosen Solution
**PostgreSQL Full-Text Search** using `tsvector` columns and `GIN` indexes. For 100,000 tasks, PostgreSQL FTS provides sub-500ms search with proper indexing.

### Trade-offs
- (+) Zero additional infrastructure
- (+) Search results are always consistent (same transaction as writes)
- (+) Good enough for the capacity targets
- (-) Less sophisticated ranking than Elasticsearch
- (-) No fuzzy matching without `pg_trgm` extension (can be added later)

### Future Migration
If search requirements outgrow PostgreSQL FTS, add Elasticsearch with an event-driven indexing pipeline. The search module's public interface remains unchanged.

---

## ADR-013: Gravatar for Avatars

### Context
Users need profile images. The prompt excludes S3/MinIO.

### Problem
Provide avatar functionality without file storage infrastructure.

### Chosen Solution
**Gravatar** — generate avatar URLs from the MD5 hash of the user's email. No file uploads, no storage, no CDN.

### Implementation
```
https://www.gravatar.com/avatar/{md5(email)}?s=200&d=identicon
```

### Trade-offs
- (+) Zero infrastructure
- (+) Automatic fallback to generated identicons
- (-) Users cannot upload custom avatars (future enhancement)
- (-) Depends on external service (graceful degradation: show initials fallback)

---

## ADR-014: Offset + Cursor Pagination Strategy

### Context
Different API endpoints have different pagination characteristics.

### Problem
Choose pagination strategies.

### Chosen Solution
**Offset pagination** for most list endpoints; **cursor pagination** for append-heavy, time-ordered data.

| Endpoint Type | Strategy | Justification |
|---|---|---|
| Task lists, Board lists, Members | Offset (`?page=0&size=20`) | Random access needed; dataset size bounded by workspace |
| Activity timeline, Notifications | Cursor (`?cursor={id}&size=20`) | Append-heavy; offset pagination has O(n) skip cost |
| Search results | Offset | Random access for page navigation; bounded by query results |
| Comments | Cursor | Time-ordered; newest-first loading |

### Trade-offs
- Offset: simpler, supports "jump to page N", but O(n) skip cost for deep pages
- Cursor: O(1) performance regardless of depth, but no random access
- Hybrid approach adds some implementation complexity but optimizes each use case

---

## ADR-015: Redis Pub/Sub for Multi-Instance Broadcast

### Context
When running multiple application instances behind a load balancer, a WebSocket broadcast on one instance must reach clients connected to other instances.

### Problem
Synchronize WebSocket broadcasts across instances.

### Chosen Solution
**Redis Pub/Sub** — when a domain event triggers a WebSocket broadcast, the event is published to a Redis Pub/Sub channel. All instances subscribe to these channels and broadcast locally.

### Implementation
1. Domain event fires (e.g., `TaskUpdated`)
2. Event listener on the originating instance publishes to Redis channel `ws:board:{boardId}`
3. All instances (including originator) receive the Redis message
4. Each instance broadcasts to its locally connected WebSocket clients

### Trade-offs
- (+) Simple implementation — Redis Pub/Sub is fire-and-forget
- (+) No message persistence needed (WebSocket messages are ephemeral)
- (+) Low latency — Redis Pub/Sub is sub-millisecond
- (-) Messages are lost if no subscriber is listening (acceptable — clients reconnect and fetch state)
- (-) No delivery guarantees (acceptable — WebSocket updates are best-effort; UI fetches authoritative state)

---

## ADR-016: Flyway for Schema Migrations

### Context
Database schema changes must be versioned, repeatable, and auditable.

### Problem
Choose a schema migration tool.

### Alternatives Considered

| Tool | Pros | Cons |
|---|---|---|
| **Flyway** | Simple, SQL-based, excellent Spring Boot integration | No rollback generation |
| **Liquibase** | XML/YAML/JSON formats, rollback support | More complex; XML format is verbose |
| **JPA auto-DDL** | Zero config | Not production-safe; no versioning |

### Chosen Solution
**Flyway** — SQL-based migrations are transparent, reviewable, and simple. Rollback is handled by writing compensating migrations rather than automatic rollback.

---

## ADR-017: MapStruct for Object Mapping

### Context
The application needs to map between entities and DTOs frequently.

### Problem
Choose a mapping strategy.

### Alternatives Considered

| Approach | Pros | Cons |
|---|---|---|
| **MapStruct** | Compile-time, type-safe, zero reflection | Annotation processing setup |
| **ModelMapper** | Convention-based, less boilerplate | Runtime reflection, hard-to-debug mapping errors |
| **Manual mapping** | Full control | Repetitive boilerplate |

### Chosen Solution
**MapStruct** — compile-time code generation produces type-safe, debuggable mapping code with zero runtime overhead. Mapping errors are caught at compile time rather than runtime.
