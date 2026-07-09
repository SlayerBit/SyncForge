# SyncForge — Redis & Caching Strategy

## Redis Overview

Redis 7 serves as SyncForge's multi-purpose in-memory data store. It handles five distinct concerns:

| Concern | Purpose | Failure Impact |
|---|---|---|
| **Caching** | Reduce database load for hot paths | Increased DB latency; no data loss |
| **Presence** | Track user online status | Users shown as "unknown"; recovers on reconnect |
| **JWT Blacklist** | Revoke access tokens on logout | Blacklisted tokens accepted until expiration (max 15 min) |
| **Rate Limiting** | Protect auth endpoints | Rate limiting disabled; secondary protections remain |
| **Pub/Sub** | Multi-instance WebSocket broadcast | WebSocket broadcasts become instance-local |

### Redis Configuration

```java
@Configuration
public class RedisConfig {

    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory factory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(factory);
        template.setKeySerializer(new StringRedisSerializer());
        template.setValueSerializer(new GenericJackson2JsonRedisSerializer());
        template.setHashKeySerializer(new StringRedisSerializer());
        template.setHashValueSerializer(new GenericJackson2JsonRedisSerializer());
        return template;
    }

    @Bean
    public RedisMessageListenerContainer redisMessageListenerContainer(RedisConnectionFactory factory) {
        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(factory);
        return container;
    }
}
```

---

## Cache Strategy: Cache-Aside

All caching follows the **Cache-Aside** (Lazy Loading) pattern:

### Read Path
1. Check Redis for cached data
2. If cache hit → return cached data
3. If cache miss → read from PostgreSQL → write to Redis with TTL → return data

### Write Path
1. Write to PostgreSQL
2. **Delete** from Redis (invalidation)
3. Next read will repopulate the cache

**Why delete instead of update on write?**
- Simpler — no risk of cache/DB inconsistency from partial updates
- Avoids race conditions in concurrent write scenarios
- Cache naturally repopulates on the next read

---

## Redis Key Standard

### Naming Convention
```
{domain}:{entity}:{identifier}:{sub-resource}
```

All keys use colon (`:`) as separator. Lowercase throughout.

### Key Catalog

| Key Pattern | Type | TTL | Owner | Purpose |
|---|---|---|---|---|
| `user:{userId}` | STRING (JSON) | 10 min + jitter | User Module | Cached user profile |
| `workspace:{workspaceId}:member:{userId}` | STRING | 5 min | Workspace Module | Cached membership role (authorization hot path) |
| `workspace:{workspaceId}:members` | STRING (JSON) | 5 min | Workspace Module | Cached member list |
| `board:{boardId}` | STRING (JSON) | 5 min + jitter | Board Module | Cached board with columns |
| `notification:unread:{userId}` | STRING | 5 min | Notification Module | Unread notification count |
| `jwt:blacklist:{jti}` | STRING ("") | Token remaining lifetime | Auth Module | Blacklisted JWT |
| `rate_limit:{key}:{window}` | STRING (counter) | 2× window | Security | Rate limit counter |
| `login:failed:{email}` | STRING (counter) | 30 min | Security | Failed login attempts |
| `login:lockout:{email}` | STRING ("") | 15 min | Security | Account lockout flag |
| `presence:{workspaceId}:{userId}` | STRING ("online") | 30 sec | Presence Module | User online presence in workspace |
| `search:recent:{userId}` | LIST | 30 days | Search Module | Recent search queries |

### TTL Jitter

To prevent **cache stampede** (thundering herd), add random jitter to TTLs:

```java
private Duration withJitter(Duration baseTtl) {
    long jitterMs = ThreadLocalRandom.current().nextLong(0, baseTtl.toMillis() / 5); // 0-20% jitter
    return baseTtl.plusMillis(jitterMs);
}
```

Example: A 10-minute TTL becomes 10:00–12:00 minutes.

---

## Cache Specifications

### User Profile Cache

| Property | Value |
|---|---|
| **Key** | `user:{userId}` |
| **Value** | JSON: `{id, email, displayName, status, avatarUrl, preferences}` |
| **TTL** | 10 minutes + jitter |
| **Invalidation** | On profile update, preference update, status change |
| **Stampede Prevention** | TTL jitter |
| **Negative Caching** | No — user lookup miss is rare and should hit DB |

**Write behavior**: Profile update → delete `user:{userId}` → next read repopulates
**Delete behavior**: Account deactivation → delete `user:{userId}`

### Workspace Membership Cache (Authorization Hot Path)

| Property | Value |
|---|---|
| **Key** | `workspace:{workspaceId}:member:{userId}` |
| **Value** | STRING: role enum value (e.g., `"MEMBER"`) |
| **TTL** | 5 minutes |
| **Invalidation** | On role change, member removal, member addition |
| **Stampede Prevention** | TTL jitter |
| **Negative Caching** | Yes — `"NONE"` with 1-minute TTL for non-members |

**Why this is critical**: Every authenticated API request checks workspace membership. Without caching, this is a database query per request. With caching, it's an O(1) Redis GET.

**Write behavior**: Role change → delete `workspace:{wid}:member:{uid}` AND delete `workspace:{wid}:members`
**Delete behavior**: Member removal → delete both keys

### Workspace Members List Cache

| Property | Value |
|---|---|
| **Key** | `workspace:{workspaceId}:members` |
| **Value** | JSON array of `{userId, displayName, role, avatarUrl}` |
| **TTL** | 5 minutes |
| **Invalidation** | On member add, remove, or role change |

### Board Cache

| Property | Value |
|---|---|
| **Key** | `board:{boardId}` |
| **Value** | JSON: `{id, name, columns: [{id, name, position}], workspaceId}` |
| **TTL** | 5 minutes + jitter |
| **Invalidation** | On board update, column add/remove/reorder |

**Note**: Tasks are NOT cached at the board level — they are fetched from PostgreSQL on each board load. Task data changes frequently; caching would cause stale board views.

### Notification Unread Count

| Property | Value |
|---|---|
| **Key** | `notification:unread:{userId}` |
| **Value** | INTEGER count |
| **TTL** | 5 minutes |
| **Invalidation** | On notification create, mark as read, mark all as read, delete |

---

## JWT Blacklist

| Property | Value |
|---|---|
| **Key** | `jwt:blacklist:{jti}` |
| **Value** | Empty string `""` |
| **TTL** | Remaining lifetime of the JWT |
| **Update** | SET on logout |
| **Cleanup** | Automatic via TTL expiration |

### Implementation

```java
public void blacklistToken(String jti, Instant expiration) {
    Duration remaining = Duration.between(Instant.now(), expiration);
    if (remaining.isPositive()) {
        redisTemplate.opsForValue().set("jwt:blacklist:" + jti, "", remaining);
    }
}

public boolean isBlacklisted(String jti) {
    return Boolean.TRUE.equals(redisTemplate.hasKey("jwt:blacklist:" + jti));
}
```

---

## Presence Data

### User Presence Hash

| Property | Value |
|---|---|
| **Key** | `presence:{workspaceId}:{userId}` |
| **Type** | STRING |
| **Value** | `"online"` |
| **TTL** | 30 seconds (refreshed by heartbeat / user activity) |

### Presence Heartbeat Implementation

```java
@Override
public void markOnline(UUID workspaceId, UUID userId) {
    String key = String.format("presence:%s:%s", workspaceId, userId);
    redisTemplate.opsForValue().set(key, "online", Duration.ofSeconds(30));
    broadcastPresence(workspaceId);
}
```

---

## Rate Limiting Data

| Property | Value |
|---|---|
| **Key** | `rate_limit:{identifier}:{windowStart}` |
| **Type** | STRING (integer counter) |
| **TTL** | 2× window duration |
| **Update** | INCR on each request |
| **Cleanup** | Automatic via TTL |

See [06-security-architecture.md](file:///Users/slayer/SyncForge/docs/06-security-architecture.md) for the full sliding window counter implementation.

---

## Recent Searches

| Property | Value |
|---|---|
| **Key** | `search:recent:{userId}` |
| **Type** | LIST (capped at 10 entries) |
| **TTL** | 30 days |
| **Operations** | LPUSH + LTRIM (keep latest 10) |

```java
public void saveRecentSearch(UUID userId, String query) {
    String key = "search:recent:" + userId;
    redisTemplate.opsForList().leftPush(key, query);
    redisTemplate.opsForList().trim(key, 0, 9);  // Keep only 10
    redisTemplate.expire(key, Duration.ofDays(30));
}

public List<String> getRecentSearches(UUID userId) {
    String key = "search:recent:" + userId;
    return redisTemplate.opsForList().range(key, 0, 9);
}
```

---

## Cache Invalidation Summary

| Entity | Cache Key(s) | Invalidation Triggers |
|---|---|---|
| **User** | `user:{id}` | Profile update, preference update, status change |
| **Workspace Membership** | `workspace:{wid}:member:{uid}`, `workspace:{wid}:members` | Role change, member add/remove |
| **Board** | `board:{id}` | Board update, column add/remove/reorder |
| **Notification Count** | `notification:unread:{uid}` | Notification create, mark read, mark all read, delete |
| **Presence** | `presence:user:{uid}`, `presence:workspace:{wid}`, `presence:board:{bid}` | Heartbeat (refreshes TTL); automatic expiration on disconnect |

### What Should NOT Be Cached
- **Task data** — changes too frequently; stale data causes confusing UI
- **Comment data** — real-time; should always reflect latest
- **Activity logs** — append-only; no benefit to caching
- **Search results** — query-dependent; too many variations to cache effectively
- **Invitation data** — low-volume; not a hot path

---

## Redis Failure Behavior

| Concern | Failure Mode | Mitigation |
|---|---|---|
| Caching | Cache miss on every request | Increased DB load but functional; log warning |
| Presence | All users shown as offline/unknown | Display "presence unavailable" in UI |
| JWT Blacklist | Blacklisted tokens temporarily accepted | Mitigated by 15-minute access token lifetime |
| Rate Limiting | All requests allowed | Secondary protections: account lockout, password policy |
| Pub/Sub | WebSocket broadcasts instance-local | Clients on different instances miss real-time updates; next board load resolves |

### Detection

```java
@Component
public class RedisHealthIndicator implements HealthIndicator {

    @Override
    public Health health() {
        try {
            redisTemplate.getConnectionFactory().getConnection().ping();
            return Health.up().build();
        } catch (Exception e) {
            return Health.down(e).build();
        }
    }
}
```

### Recovery
- Lettuce (Spring's default Redis client) automatically reconnects
- No manual intervention required
- Cache naturally repopulates after reconnection via normal read patterns

---

## Redis Memory Estimation

| Data | Count | Size/Entry | Total |
|---|---|---|---|
| User cache | 2,000 active | ~500 bytes | ~1 MB |
| Membership cache | 10,000 entries | ~50 bytes | ~0.5 MB |
| Board cache | 500 active | ~2 KB | ~1 MB |
| Presence | 500 online | ~200 bytes | ~0.1 MB |
| JWT blacklist | ~100 concurrent | ~50 bytes | ~0.005 MB |
| Rate limit counters | ~5,000 active | ~50 bytes | ~0.25 MB |
| Recent searches | 2,000 users × 10 | ~100 bytes | ~2 MB |
| **Total** | | | **~5 MB** |

Redis memory requirement is minimal. The default 64MB Redis instance is more than sufficient.
