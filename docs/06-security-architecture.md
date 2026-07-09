# SyncForge — Security Architecture

## Security Principles

- Defense in depth — multiple layers of security controls
- Principle of least privilege — minimal permissions by default
- Fail securely — errors default to denial
- Never trust client input — validate everything server-side
- Never expose internal details — generic error messages for security failures

---

## OWASP Top 10 Mitigations

### A01: Broken Access Control

| Threat | Mitigation |
|---|---|
| Unauthorized resource access | RBAC with per-request workspace membership verification |
| IDOR (Insecure Direct Object Reference) | All resource access validates workspace membership; UUIDs prevent enumeration |
| Privilege escalation | Role hierarchy enforced; cannot promote above own role |
| Missing function-level access control | Every controller method checks required role before service invocation |
| CORS misconfiguration | Explicit allowed origins; no wildcard in production |

### A02: Cryptographic Failures

| Threat | Mitigation |
|---|---|
| Weak password hashing | BCrypt with cost factor 12 |
| Plaintext token storage | All tokens (refresh, verification, reset) stored as SHA-256 hashes |
| Weak JWT signing | HS384 with 256-bit secret key |
| Sensitive data in logs | Passwords, tokens, and secrets are never logged |
| Insecure data transmission | HTTPS enforced in production; HSTS header |

### A03: Injection

| Threat | Mitigation |
|---|---|
| SQL Injection | Parameterized queries via JPA/Hibernate; no raw SQL concatenation |
| NoSQL Injection | N/A — PostgreSQL only |
| XSS | Output encoding via Jackson; Content-Type headers; CSP header |
| Log Injection | Structured logging with parameterized messages (SLF4J `{}` placeholders) |

### A04: Insecure Design

| Threat | Mitigation |
|---|---|
| Missing rate limiting | Redis-backed rate limiting on auth endpoints |
| Missing account lockout | Temporary lockout after 10 failed login attempts |
| Unlimited resource creation | Business rule limits (50 members, 50 labels, 12 columns) |
| Missing input validation | Three-layer validation: DTO, business, database |

### A05: Security Misconfiguration

| Threat | Mitigation |
|---|---|
| Default credentials | No default admin accounts; all credentials user-provided |
| Verbose error messages | Generic error responses in production; detailed errors only in dev |
| Missing security headers | Comprehensive security headers (see below) |
| Open actuator endpoints | Only `/health` and `/info` are public; others require authentication |
| Debug mode in production | Spring profiles control configuration; production profile disables debug |

### A06: Vulnerable and Outdated Components

| Threat | Mitigation |
|---|---|
| Known CVEs | Dependabot enabled; Maven dependency check in CI |
| Outdated dependencies | Quarterly dependency update cadence |

### A07: Identification and Authentication Failures

| Threat | Mitigation |
|---|---|
| Brute force | Rate limiting + account lockout |
| Credential stuffing | Rate limiting per IP and per email |
| Session fixation | N/A — stateless JWT; no server sessions |
| Weak passwords | Password policy enforcement (see below) |
| Token replay | Refresh token rotation with family-based replay detection |

### A08: Software and Data Integrity Failures

| Threat | Mitigation |
|---|---|
| JWT tampering | HS384 signature verification on every request |
| Deserialization attacks | Jackson with default typing disabled; explicit DTOs |
| CI/CD pipeline compromise | GitHub Actions with pinned action versions |

### A09: Security Logging and Monitoring Failures

| Threat | Mitigation |
|---|---|
| Missing audit trail | All security events logged (see Security Logging below) |
| Missing alerting | Prometheus metrics + Grafana alerts for anomalous patterns |
| Insufficient logging | Structured logging with correlation IDs |

### A10: Server-Side Request Forgery (SSRF)

| Threat | Mitigation |
|---|---|
| SSRF | Application makes no outbound HTTP requests to user-supplied URLs. Only outbound connections: SMTP (hardcoded), Gravatar (template URL with hash). |

---

## Password Security

### Hashing

| Property | Value | Justification |
|---|---|---|
| Algorithm | BCrypt | Industry standard; designed for password hashing; adaptive cost |
| Cost Factor | 12 | ~250ms per hash on modern hardware; good balance of security and latency |
| Implementation | `BCryptPasswordEncoder` (Spring Security) | Well-tested, maintained |

### Password Policy

| Rule | Value |
|---|---|
| Minimum length | 8 characters |
| Maximum length | 128 characters |
| Uppercase required | At least 1 |
| Lowercase required | At least 1 |
| Digit required | At least 1 |
| Special character required | At least 1 |
| Common password check | Reject top 10,000 common passwords (embedded list) |

### Implementation

```java
@Component
public class PasswordStrengthValidator {
    private static final Set<String> COMMON_PASSWORDS = loadCommonPasswords();
    private static final int MIN_LENGTH = 8;
    private static final int MAX_LENGTH = 128;

    public List<String> validate(String password) {
        List<String> errors = new ArrayList<>();
        if (password.length() < MIN_LENGTH) errors.add("Password must be at least 8 characters");
        if (password.length() > MAX_LENGTH) errors.add("Password must be at most 128 characters");
        if (!password.matches(".*[A-Z].*")) errors.add("Password must contain an uppercase letter");
        if (!password.matches(".*[a-z].*")) errors.add("Password must contain a lowercase letter");
        if (!password.matches(".*\\d.*")) errors.add("Password must contain a digit");
        if (!password.matches(".*[!@#$%^&*()_+\\-=\\[\\]{}|;:,.<>?].*"))
            errors.add("Password must contain a special character");
        if (COMMON_PASSWORDS.contains(password.toLowerCase()))
            errors.add("Password is too common");
        return errors;
    }
}
```

### Credential Storage Rules
- Never store plaintext passwords
- Never log passwords (even partially)
- Never include password in API responses
- Never compare passwords using `String.equals()` (use BCrypt's constant-time comparison)
- Password history is NOT tracked in MVP

---

## CORS & CSRF

### CORS Configuration

```java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(List.of(
        "http://localhost:5173",    // Vite dev server
        "http://localhost:3000"     // Alternative dev port
    ));
    config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
    config.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Request-ID"));
    config.setExposedHeaders(List.of("X-Request-ID", "X-RateLimit-Remaining"));
    config.setAllowCredentials(true);
    config.setMaxAge(3600L);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/api/**", config);
    source.registerCorsConfiguration("/ws/**", config);
    return source;
}
```

**Production**: `allowedOrigins` is configured via environment variable `SYNCFORGE_CORS_ALLOWED_ORIGINS`.

### Why CSRF Is Disabled

CSRF protection is unnecessary because:
1. Authentication uses `Authorization: Bearer {token}` header, not cookies
2. Browsers do not automatically attach Authorization headers to cross-origin requests
3. CSRF attacks exploit automatic cookie transmission — which does not apply here
4. The CORS policy restricts which origins can make requests

---

## Rate Limiting

### Algorithm: Sliding Window Counter

Redis-backed sliding window counter that approximates a true sliding window by weighting the previous window and current window counts.

### Implementation

```java
@Component
public class RateLimiter {

    public boolean isAllowed(String key, int limit, Duration window) {
        long now = Instant.now().getEpochSecond();
        long windowSize = window.getSeconds();
        long currentWindow = now / windowSize;
        long previousWindow = currentWindow - 1;
        long elapsedInWindow = now % windowSize;
        double weight = 1.0 - ((double) elapsedInWindow / windowSize);

        String currentKey = "rate_limit:" + key + ":" + currentWindow;
        String previousKey = "rate_limit:" + key + ":" + previousWindow;

        // Redis pipeline: GET previous, INCR current, EXPIRE current
        Long previousCount = redisTemplate.opsForValue().get(previousKey);  // may be null
        Long currentCount = redisTemplate.opsForValue().increment(currentKey);
        redisTemplate.expire(currentKey, window.multipliedBy(2));  // TTL = 2x window for overlap

        double weightedCount = (previousCount != null ? previousCount * weight : 0) + currentCount;
        return weightedCount <= limit;
    }
}
```

### Rate Limits

| Endpoint | Limit | Window | Key |
|---|---|---|---|
| `POST /api/auth/login` | 5 | 1 minute | `login:{email}` |
| `POST /api/auth/login` (per IP) | 20 | 1 minute | `login:ip:{ip}` |
| `POST /api/auth/register` | 3 | 10 minutes | `register:ip:{ip}` |
| `POST /api/auth/forgot-password` | 3 | 1 hour | `forgot:{email}` |
| `POST /api/auth/resend-verification` | 3 | 1 hour | `verify:{email}` |
| `POST /api/auth/refresh` | 10 | 1 minute | `refresh:{userId}` |
| General API (authenticated) | 100 | 1 minute | `api:{userId}` |
| General API (per IP) | 200 | 1 minute | `api:ip:{ip}` |

### Response Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1700000060
```

### Failure Behavior
- **Redis unavailable**: Rate limiting is bypassed (fail open); warning is logged
- **Rationale**: Blocking all requests when Redis is down causes a service outage, which is worse than temporarily allowing unlimited requests. The short JWT lifetime and account lockout provide secondary protection.

---

## Secure Headers

```java
@Component
public class SecurityHeaderFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain) {
        res.setHeader("X-Content-Type-Options", "nosniff");
        res.setHeader("X-Frame-Options", "DENY");
        res.setHeader("X-XSS-Protection", "0");  // Disabled; rely on CSP instead
        res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
        res.setHeader("Cache-Control", "no-store");
        res.setHeader("Content-Security-Policy",
            "default-src 'none'; frame-ancestors 'none'");
        res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
        res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
        chain.doFilter(req, res);
    }
}
```

---

## Security Logging

### Events to Log

| Event | Logged Information |
|---|---|
| Registration | email (masked), timestamp, IP, success/failure |
| Login success | userId, timestamp, IP |
| Login failure | email (masked), timestamp, IP, reason |
| Logout | userId, timestamp |
| Password change | userId, timestamp |
| Password reset request | email (masked), timestamp, IP |
| Password reset completion | userId, timestamp |
| Email verification | userId, timestamp |
| Role change | workspaceId, targetUserId, oldRole, newRole, changedBy |
| Invitation acceptance | workspaceId, userId, timestamp |
| Permission denied | userId, resource, requiredRole, actualRole |
| Rate limit exceeded | key, limit, IP |
| JWT validation failure | reason, IP |
| Refresh token replay | userId, familyId, IP |

### Information NEVER Logged
- Passwords (including hashes)
- JWT tokens (including partial)
- Refresh tokens
- Verification tokens
- Reset tokens
- Full email addresses (use masking: `j***@example.com`)
- Full IP addresses in GDPR regions (hash or truncate)

### Log Format

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "WARN",
  "logger": "com.syncforge.security",
  "message": "Login failed: invalid credentials",
  "requestId": "req-uuid",
  "correlationId": "corr-uuid",
  "userId": null,
  "email": "j***@example.com",
  "ip": "192.168.1.x",
  "operation": "LOGIN",
  "outcome": "FAILURE",
  "reason": "INVALID_CREDENTIALS"
}
```

---

## Security Failure Scenarios

### Expired JWT

| Property | Value |
|---|---|
| **Detection** | JWT filter checks `exp` claim |
| **Response** | `401 Unauthorized` with `error: "token_expired"` |
| **Recovery** | Client uses refresh token to get new access token |
| **UX** | Transparent — intercepted by client's refresh logic |
| **Audit** | Not logged (expected behavior, high volume) |

### Expired Refresh Token

| Property | Value |
|---|---|
| **Detection** | `expires_at < NOW()` in database |
| **Response** | `401 Unauthorized` with `error: "refresh_token_expired"` |
| **Recovery** | User must re-authenticate (login) |
| **UX** | Redirect to login page with "Session expired" message |
| **Audit** | Logged at INFO level |

### Refresh Token Replay Attack

| Property | Value |
|---|---|
| **Detection** | Token found with `used = true` |
| **Response** | `401 Unauthorized`; ALL tokens in family revoked |
| **Recovery** | User must re-authenticate on all devices |
| **UX** | Redirect to login; "Security alert" notification |
| **Audit** | Logged at WARN level with familyId, userId, IP |

### Invalid JWT Signature

| Property | Value |
|---|---|
| **Detection** | HS384 signature verification fails |
| **Response** | `401 Unauthorized` with `error: "invalid_token"` |
| **Recovery** | None — client has a forged or corrupted token |
| **UX** | Redirect to login |
| **Audit** | Logged at WARN level with IP |

### Redis Unavailable

| Property | Value |
|---|---|
| **Detection** | `RedisConnectionException` caught |
| **Response** | Degraded mode — continue without cache/rate limiting |
| **Recovery** | Automatic reconnection via Lettuce (Spring default) |
| **UX** | No visible impact (slight latency increase) |
| **Audit** | Logged at ERROR level; alert triggered |

### Database Unavailable

| Property | Value |
|---|---|
| **Detection** | `DataAccessException` caught |
| **Response** | `503 Service Unavailable` |
| **Recovery** | HikariCP automatic reconnection |
| **UX** | Error page with "Service temporarily unavailable" |
| **Audit** | Logged at ERROR level; alert triggered |

### Brute-Force Attack

| Property | Value |
|---|---|
| **Detection** | Rate limiter triggers (>5 login attempts/min per email) |
| **Response** | `429 Too Many Requests` with `Retry-After` header |
| **Recovery** | Automatic — wait for window to reset |
| **UX** | "Too many attempts. Please try again in X seconds." |
| **Audit** | Logged at WARN level with email (masked) and IP |

### Account Lockout (10+ Failed Attempts)

| Property | Value |
|---|---|
| **Detection** | Redis counter `login:failed:{email}` exceeds 10 within 30 minutes |
| **Response** | `423 Locked` with message |
| **Recovery** | Automatic unlock after 15 minutes; or password reset |
| **UX** | "Account temporarily locked. Try again later or reset your password." |
| **Audit** | Logged at WARN level |

### Permission Denied

| Property | Value |
|---|---|
| **Detection** | `WorkspaceAuthorizationService.checkPermission()` fails |
| **Response** | `403 Forbidden` |
| **Recovery** | User requests elevated role from workspace admin |
| **UX** | "You don't have permission to perform this action." |
| **Audit** | Logged at WARN level with userId, resource, required/actual role |

### Expired Verification Token

| Property | Value |
|---|---|
| **Detection** | `expires_at < NOW()` or `status != PENDING` |
| **Response** | `400 Bad Request` with `error: "token_expired"` |
| **Recovery** | User requests resend verification email |
| **UX** | "Verification link expired. Click here to resend." |
| **Audit** | Logged at INFO level |

### Expired Password Reset Token

| Property | Value |
|---|---|
| **Detection** | `expires_at < NOW()` or `status != PENDING` |
| **Response** | `400 Bad Request` with `error: "token_expired"` |
| **Recovery** | User requests new password reset email |
| **UX** | "Reset link expired. Click here to request a new one." |
| **Audit** | Logged at INFO level |

### Duplicate Registration

| Property | Value |
|---|---|
| **Detection** | `existsByEmail()` returns true |
| **Response** | `409 Conflict` |
| **Recovery** | User logs in or resets password |
| **UX** | "An account with this email already exists." |
| **Audit** | Logged at INFO level |

### Duplicate Invitation

| Property | Value |
|---|---|
| **Detection** | Pending invitation exists for `(workspace_id, email)` |
| **Response** | `409 Conflict` |
| **Recovery** | Revoke existing invitation and create new one, or wait for existing |
| **UX** | "An invitation has already been sent to this email." |
| **Audit** | Not logged (business logic, not security) |
