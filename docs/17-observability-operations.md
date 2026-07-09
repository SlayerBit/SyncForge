# SyncForge — Observability & Operations

## Structured Logging

### Configuration

Use **SLF4J + Logback** with JSON output in production and human-readable output in development.

**Production** (`logback-spring.xml`):
```xml
<appender name="JSON" class="ch.qos.logback.core.ConsoleAppender">
    <encoder class="net.logstash.logback.encoder.LogstashEncoder">
        <includeMdcKeyName>requestId</includeMdcKeyName>
        <includeMdcKeyName>correlationId</includeMdcKeyName>
        <includeMdcKeyName>userId</includeMdcKeyName>
        <includeMdcKeyName>workspaceId</includeMdcKeyName>
    </encoder>
</appender>
```

**Development**: Standard pattern `%d{HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n`

### MDC (Mapped Diagnostic Context)

Every request populates MDC via a filter:

```java
@Component
public class RequestContextFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain) {
        String requestId = Optional.ofNullable(req.getHeader("X-Request-ID"))
            .orElse(UUID.randomUUID().toString());
        MDC.put("requestId", requestId);
        MDC.put("correlationId", requestId);  // Same as requestId for initial request
        res.setHeader("X-Request-ID", requestId);

        try {
            chain.doFilter(req, res);
        } finally {
            MDC.clear();
        }
    }
}
```

After authentication, add `userId`:
```java
MDC.put("userId", principal.getId().toString());
```

### Log Levels

| Level | Usage |
|---|---|
| `ERROR` | Unexpected failures requiring investigation (DB down, unhandled exception) |
| `WARN` | Expected but notable events (rate limit exceeded, invalid token, Redis unavailable) |
| `INFO` | Business events (user registered, task created, workspace joined) |
| `DEBUG` | Detailed diagnostic info (query execution, cache hit/miss, event published) |
| `TRACE` | Never in production; fine-grained debugging |

### Production Level: `INFO` (override per-package as needed)

### What to Log

| Category | Level | Examples |
|---|---|---|
| Request lifecycle | INFO | Method, URI, status, duration |
| Authentication | INFO/WARN | Login success, login failure, token refresh |
| Business operations | INFO | Task created, member invited, board archived |
| Cache operations | DEBUG | Cache hit, cache miss, cache invalidation |
| Domain events | DEBUG | Event published, event consumed |
| Performance | WARN | Slow queries (> 500ms), slow requests (> 1s) |
| Errors | ERROR | Unhandled exceptions, infrastructure failures |

### What NEVER to Log
- Passwords (including hashes)
- JWT tokens
- Refresh tokens
- Verification/reset tokens
- Full email addresses (mask: `j***@example.com`)
- Request bodies containing credentials
- Personal health or financial information

### Request Logging

```java
@Component
public class RequestLoggingFilter extends OncePerRequestFilter {
    private static final Logger log = LoggerFactory.getLogger("http.access");

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain) {
        long start = System.currentTimeMillis();
        try {
            chain.doFilter(req, res);
        } finally {
            long duration = System.currentTimeMillis() - start;
            log.info("{} {} {} {}ms", req.getMethod(), req.getRequestURI(), res.getStatus(), duration);
            if (duration > 1000) {
                log.warn("Slow request: {} {} took {}ms", req.getMethod(), req.getRequestURI(), duration);
            }
        }
    }
}
```

---

## Metrics (Micrometer + Prometheus)

### Spring Boot Actuator Configuration

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health, info, metrics, prometheus
  endpoint:
    health:
      show-details: when_authorized
      probes:
        enabled: true
  metrics:
    tags:
      application: syncforge
```

### Custom Business Metrics

```java
@Component
public class SyncForgeMetrics {
    private final MeterRegistry registry;

    // Counters
    private final Counter registrations;
    private final Counter logins;
    private final Counter tasksCreated;
    private final Counter wsConnections;

    // Gauges
    private final AtomicInteger activeWsConnections = new AtomicInteger(0);

    // Timers
    private final Timer boardLoadTimer;

    public SyncForgeMetrics(MeterRegistry registry) {
        this.registry = registry;
        this.registrations = Counter.builder("syncforge.users.registrations").register(registry);
        this.logins = Counter.builder("syncforge.auth.logins")
            .tag("status", "success").register(registry);
        this.tasksCreated = Counter.builder("syncforge.tasks.created").register(registry);
        this.wsConnections = Counter.builder("syncforge.websocket.connections").register(registry);
        this.boardLoadTimer = Timer.builder("syncforge.boards.load").register(registry);

        Gauge.builder("syncforge.websocket.active_connections", activeWsConnections, AtomicInteger::get)
            .register(registry);
    }
}
```

### Key Metrics

| Metric | Type | Description |
|---|---|---|
| `syncforge.users.registrations` | Counter | Total user registrations |
| `syncforge.auth.logins` | Counter (tagged: status) | Login attempts by outcome |
| `syncforge.auth.token_refreshes` | Counter | Token refresh requests |
| `syncforge.tasks.created` | Counter | Tasks created |
| `syncforge.tasks.moved` | Counter | Task movements |
| `syncforge.boards.load` | Timer | Board load time distribution |
| `syncforge.search.queries` | Timer | Search query time distribution |
| `syncforge.websocket.active_connections` | Gauge | Current WebSocket connections |
| `syncforge.websocket.messages_sent` | Counter | WebSocket messages broadcast |
| `syncforge.notifications.created` | Counter | Notifications created |
| `syncforge.cache.hits` | Counter (tagged: cache) | Cache hits by cache name |
| `syncforge.cache.misses` | Counter (tagged: cache) | Cache misses by cache name |
| `syncforge.rate_limit.exceeded` | Counter (tagged: endpoint) | Rate limit violations |

### JVM & Infrastructure Metrics (auto-collected)
- `jvm.memory.used`, `jvm.memory.max`
- `jvm.threads.live`, `jvm.threads.peak`
- `hikaricp.connections.active`, `hikaricp.connections.idle`
- `http.server.requests` (duration, count, by URI + status)
- `system.cpu.usage`, `process.cpu.usage`

---

## Health Checks

### Endpoints

| Endpoint | Purpose | Authentication |
|---|---|---|
| `GET /actuator/health` | Overall health | Public |
| `GET /actuator/health/liveness` | JVM alive | Public |
| `GET /actuator/health/readiness` | Ready to serve requests | Public |
| `GET /actuator/info` | Application info | Public |
| `GET /actuator/prometheus` | Prometheus metrics | Internal |

### Health Check Components

```java
@Component
public class DatabaseHealthIndicator implements HealthIndicator {
    @Override
    public Health health() {
        try {
            jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            return Health.up().withDetail("database", "PostgreSQL").build();
        } catch (Exception e) {
            return Health.down(e).withDetail("database", "PostgreSQL").build();
        }
    }
}

@Component
public class RedisHealthIndicator implements HealthIndicator {
    @Override
    public Health health() {
        try {
            redisTemplate.getConnectionFactory().getConnection().ping();
            return Health.up().withDetail("cache", "Redis").build();
        } catch (Exception e) {
            return Health.down(e).withDetail("cache", "Redis").build();
        }
    }
}
```

### Health Response

```json
{
  "status": "UP",
  "components": {
    "db": { "status": "UP", "details": { "database": "PostgreSQL" } },
    "redis": { "status": "UP", "details": { "cache": "Redis" } },
    "diskSpace": { "status": "UP" }
  }
}
```

---

## Monitoring Stack

### Prometheus

Scrapes `/actuator/prometheus` every 15 seconds.

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'syncforge'
    metrics_path: '/actuator/prometheus'
    scrape_interval: 15s
    static_configs:
      - targets: ['syncforge-backend:8080']
```

### Grafana Dashboards

**Dashboard 1: Application Overview**
- Request rate (req/sec)
- Response time percentiles (p50, p95, p99)
- Error rate (4xx, 5xx)
- Active WebSocket connections
- JVM heap usage
- Thread pool utilization

**Dashboard 2: Business Metrics**
- User registrations (daily)
- Active users (concurrent)
- Tasks created (hourly)
- Board loads (hourly)
- Search queries (hourly)
- Notification delivery rate

**Dashboard 3: Infrastructure**
- PostgreSQL connection pool (active/idle/waiting)
- Redis memory usage
- Redis operations/sec
- Cache hit ratio
- Rate limit violations

### Alerting Rules

| Alert | Condition | Severity |
|---|---|---|
| High error rate | 5xx rate > 5% for 5 minutes | Critical |
| Slow responses | p95 latency > 2s for 5 minutes | Warning |
| Database connection pool exhausted | Active connections = max for 2 minutes | Critical |
| Redis unavailable | Health check DOWN for 1 minute | Warning |
| High rate limit violations | > 100/min on login endpoint | Warning |
| WebSocket connection spike | Active connections > 80% capacity | Warning |
| JVM heap pressure | Heap usage > 90% for 10 minutes | Warning |
| Disk space low | Available < 10% | Critical |

---

## Production Issue Investigation

### Workflow
1. **Detect**: Alert fires or user reports issue
2. **Identify**: Check Grafana dashboards for anomalies
3. **Diagnose**: Search structured logs by `requestId`, `correlationId`, or `userId`
4. **Resolve**: Apply fix, deploy, verify metrics return to normal

### Log Search Examples
```bash
# Find all requests from a specific user
grep '"userId":"uuid-123"' /var/log/syncforge/*.log

# Find all errors in the last hour
grep '"level":"ERROR"' /var/log/syncforge/*.log | jq '.timestamp, .message'

# Trace a specific request
grep '"requestId":"req-uuid"' /var/log/syncforge/*.log

# Find slow requests
grep '"duration"' /var/log/syncforge/*.log | jq 'select(.duration > 1000)'
```
