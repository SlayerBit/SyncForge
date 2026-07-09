# SyncForge — Repository Structure

## Root Layout

```
SyncForge/
├── backend/                       # Java Spring Boot application
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/syncforge/
│   │   │   │   ├── SyncForgeApplication.java
│   │   │   │   ├── module/
│   │   │   │   │   ├── auth/
│   │   │   │   │   ├── user/
│   │   │   │   │   ├── workspace/
│   │   │   │   │   ├── board/
│   │   │   │   │   ├── task/
│   │   │   │   │   ├── comment/
│   │   │   │   │   ├── notification/
│   │   │   │   │   ├── presence/
│   │   │   │   │   ├── search/
│   │   │   │   │   └── activity/
│   │   │   │   ├── common/
│   │   │   │   │   ├── exception/
│   │   │   │   │   │   ├── BusinessException.java
│   │   │   │   │   │   ├── ResourceNotFoundException.java
│   │   │   │   │   │   └── GlobalExceptionHandler.java
│   │   │   │   │   ├── response/
│   │   │   │   │   │   ├── ApiResponse.java
│   │   │   │   │   │   ├── PagedResponse.java
│   │   │   │   │   │   ├── CursorResponse.java
│   │   │   │   │   │   └── ErrorResponse.java
│   │   │   │   │   ├── validation/
│   │   │   │   │   │   └── ValidEnum.java
│   │   │   │   │   ├── util/
│   │   │   │   │   │   ├── FractionalIndex.java
│   │   │   │   │   │   ├── SlugUtils.java
│   │   │   │   │   │   └── GravatarUtils.java
│   │   │   │   │   └── constant/
│   │   │   │   │       └── SyncForgeConstants.java
│   │   │   │   ├── security/
│   │   │   │   │   ├── jwt/
│   │   │   │   │   │   ├── JwtTokenProvider.java
│   │   │   │   │   │   └── JwtProperties.java
│   │   │   │   │   ├── filter/
│   │   │   │   │   │   ├── JwtAuthenticationFilter.java
│   │   │   │   │   │   ├── RateLimitFilter.java
│   │   │   │   │   │   ├── RequestContextFilter.java
│   │   │   │   │   │   └── SecurityHeaderFilter.java
│   │   │   │   │   ├── service/
│   │   │   │   │   │   ├── CustomUserDetailsService.java
│   │   │   │   │   │   └── WorkspaceAuthorizationService.java
│   │   │   │   │   └── config/
│   │   │   │   │       └── SecurityConfig.java
│   │   │   │   └── config/
│   │   │   │       ├── RedisConfig.java
│   │   │   │       ├── JacksonConfig.java
│   │   │   │       ├── WebSocketConfig.java
│   │   │   │       ├── AsyncConfig.java
│   │   │   │       ├── OpenApiConfig.java
│   │   │   │       └── WebConfig.java
│   │   │   └── resources/
│   │   │       ├── application.yml
│   │   │       ├── application-dev.yml
│   │   │       ├── application-test.yml
│   │   │       ├── application-prod.yml
│   │   │       ├── db/migration/
│   │   │       │   ├── V001__create_users_table.sql
│   │   │       │   ├── V002__create_workspaces_table.sql
│   │   │       │   └── ...
│   │   │       ├── logback-spring.xml
│   │   │       └── common-passwords.txt
│   │   └── test/
│   │       └── java/com/syncforge/
│   │           ├── module/
│   │           │   ├── auth/
│   │           │   │   ├── service/AuthServiceImplTest.java
│   │           │   │   └── controller/AuthControllerIT.java
│   │           │   ├── task/
│   │           │   │   ├── service/TaskServiceImplTest.java
│   │           │   │   └── controller/TaskControllerIT.java
│   │           │   └── ...
│   │           ├── security/SecurityIT.java
│   │           ├── common/
│   │           │   ├── FractionalIndexTest.java
│   │           │   └── SlugUtilsTest.java
│   │           └── support/
│   │               ├── IntegrationTestBase.java
│   │               └── TestDataFactory.java
│   ├── pom.xml
│   └── Dockerfile
│
├── frontend/                      # React TypeScript SPA
│   ├── src/
│   │   ├── app/
│   │   ├── features/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── stores/
│   │   ├── types/
│   │   └── styles/
│   ├── public/
│   │   └── favicon.svg
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── postcss.config.js
│   ├── components.json            # shadcn/ui config
│   ├── package.json
│   ├── package-lock.json
│   └── Dockerfile
│
├── docker/                        # Docker configuration
│   ├── prometheus/
│   │   └── prometheus.yml
│   └── grafana/
│       ├── dashboards/
│       │   └── syncforge-overview.json
│       └── datasources/
│           └── prometheus.yml
│
├── docs/                          # Engineering documentation
│   ├── 00-executive-summary.md
│   ├── 01-architecture-overview.md
│   ├── ...
│   └── 25-appendix-diagrams.md
│
├── scripts/                       # Development scripts
│   ├── setup.sh                   # Initial setup (install deps, start Docker)
│   ├── dev.sh                     # Start dev environment
│   └── seed.sh                    # Seed development data
│
├── .github/
│   ├── workflows/
│   │   ├── ci.yml
│   │   └── dependencies.yml
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── ISSUE_TEMPLATE/
│       ├── bug_report.md
│       └── feature_request.md
│
├── docker-compose.yml
├── .gitignore
├── .editorconfig
├── README.md
└── LICENSE
```

---

## Directory Ownership

| Directory | Owner | Responsibility |
|---|---|---|
| `backend/` | Backend engineer | Java source, tests, build config |
| `frontend/` | Frontend engineer | React source, styles, build config |
| `docker/` | DevOps | Container configs, monitoring |
| `docs/` | Architecture | Engineering documentation |
| `scripts/` | DevOps | Development automation |
| `.github/` | DevOps | CI/CD, templates |

---

## Maven Configuration (pom.xml)

```xml
<project>
    <groupId>com.syncforge</groupId>
    <artifactId>syncforge</artifactId>
    <version>0.1.0-SNAPSHOT</version>
    <name>SyncForge</name>
    <description>Collaborative Kanban Platform</description>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.3.0</version>
    </parent>

    <properties>
        <java.version>21</java.version>
        <mapstruct.version>1.6.0</mapstruct.version>
        <jjwt.version>0.12.6</jjwt.version>
        <testcontainers.version>1.20.0</testcontainers.version>
    </properties>
</project>
```

---

## .gitignore

```gitignore
# Java
backend/target/
*.class
*.jar
*.log

# Node
frontend/node_modules/
frontend/dist/

# IDE
.idea/
.vscode/
*.iml
.DS_Store

# Environment
.env
.env.local
*.env

# Docker volumes
postgres_data/
redis_data/
prometheus_data/
grafana_data/
```

---

## README.md Structure

```markdown
# ⚡ SyncForge

A modern collaborative Kanban platform built with Java 21, Spring Boot, React, and TypeScript.

## Quick Start
## Architecture
## Tech Stack
## Development
## Testing
## Documentation
## License
```
