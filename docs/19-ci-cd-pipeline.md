# SyncForge — CI/CD Pipeline

## Branch Strategy

**Trunk-Based Development** with short-lived feature branches.

| Branch | Purpose | Protection |
|---|---|---|
| `main` | Production-ready code | Protected: require PR, CI pass, 1 review |
| `feature/*` | Feature development | Short-lived (< 3 days) |
| `fix/*` | Bug fixes | Short-lived |
| `release/*` | Release preparation (future) | Created from main |

### Workflow
1. Create `feature/task-crud` branch from `main`
2. Develop, commit with conventional commits
3. Push and open Pull Request
4. CI runs: lint, build, test
5. Review and approve
6. Squash merge to `main`
7. Delete feature branch

---

## Conventional Commits

```
<type>(<scope>): <description>

[optional body]
[optional footer]
```

| Type | Description |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `refactor` | Code change that neither fixes nor adds |
| `docs` | Documentation |
| `test` | Adding or correcting tests |
| `chore` | Build, CI, dependencies |
| `perf` | Performance improvement |
| `style` | Formatting (no logic change) |

**Scopes**: `auth`, `user`, `workspace`, `board`, `task`, `comment`, `notification`, `presence`, `search`, `activity`, `security`, `config`, `frontend`, `docker`, `ci`

**Examples**:
```
feat(auth): implement JWT refresh token rotation
fix(task): prevent concurrent update race condition
test(workspace): add integration tests for invitation acceptance
chore(docker): update PostgreSQL to 16.2
docs: add API specification for task endpoints
```

---

## GitHub Actions

### CI Pipeline (`.github/workflows/ci.yml`)

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  backend-build:
    name: Backend Build & Test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
          cache: 'maven'

      - name: Build
        run: mvn compile -B
        working-directory: backend

      - name: Unit Tests
        run: mvn test -B
        working-directory: backend

      - name: Integration Tests
        run: mvn verify -B -Pintegration
        working-directory: backend

      - name: Upload Coverage
        uses: codecov/codecov-action@v4
        with:
          directory: backend/target/site/jacoco

  frontend-build:
    name: Frontend Build & Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install Dependencies
        run: npm ci
        working-directory: frontend

      - name: Type Check
        run: npm run typecheck
        working-directory: frontend

      - name: Lint
        run: npm run lint
        working-directory: frontend

      - name: Build
        run: npm run build
        working-directory: frontend

  docker-build:
    name: Docker Build
    runs-on: ubuntu-latest
    needs: [backend-build, frontend-build]
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4

      - name: Build Backend Image
        run: docker build -t syncforge-backend:${{ github.sha }} ./backend

      - name: Build Frontend Image
        run: docker build -t syncforge-frontend:${{ github.sha }} ./frontend
```

### Dependency Check (`.github/workflows/dependencies.yml`)

```yaml
name: Dependency Check

on:
  schedule:
    - cron: '0 8 * * 1'  # Every Monday at 8 AM
  workflow_dispatch:

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Maven Dependency Check
        run: mvn dependency-check:check -B
        working-directory: backend
      - name: npm Audit
        run: npm audit --production
        working-directory: frontend
```

---

## Versioning

**Semantic Versioning**: `MAJOR.MINOR.PATCH`

- `MAJOR`: Breaking API changes (future — when public API exists)
- `MINOR`: New features
- `PATCH`: Bug fixes

Current: `0.x.y` (pre-1.0, API may change)

Version is managed in `pom.xml` and `package.json`. Tags: `v0.1.0`, `v0.2.0`, etc.

---

## Deployment Philosophy

- **For MVP**: Manual Docker Compose deployment to a single server
- **Future**: Automated deployment via GitHub Actions to staging/production
- **Database migrations**: Flyway runs on application startup; always forward-migrate
- **Zero-downtime**: Achievable with health checks and graceful shutdown (when running multiple instances behind a load balancer)
