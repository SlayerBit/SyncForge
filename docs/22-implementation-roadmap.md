# SyncForge — Implementation Roadmap

## Overview

10 phases, each leaving the project in a working state. Total estimated time: **10–14 weeks** for a single developer.

---

## Phase 1: Project Foundation

**Objective**: Set up the project skeleton, build tooling, Docker infrastructure, and CI pipeline.

**Duration**: 3–4 days | **Difficulty**: Low

### Backend Tasks
- [ ] Initialize Spring Boot project with Maven
- [ ] Configure `pom.xml` with all dependencies
- [ ] Create package structure (`module/`, `common/`, `security/`, `config/`)
- [ ] Implement `BaseEntity` with audit fields
- [ ] Implement `ApiResponse`, `PagedResponse`, `CursorResponse`, `ErrorResponse`
- [ ] Implement `GlobalExceptionHandler`
- [ ] Implement `BusinessException` hierarchy
- [ ] Configure `application.yml`, `application-dev.yml`, `application-test.yml`
- [ ] Configure Jackson (`JacksonConfig`)
- [ ] Configure OpenAPI (`OpenApiConfig`)
- [ ] Create `FractionalIndex` utility with unit tests
- [ ] Create `SlugUtils` utility with unit tests
- [ ] Create `GravatarUtils` utility

### Frontend Tasks
- [ ] Initialize Vite + React + TypeScript project
- [ ] Configure Tailwind CSS
- [ ] Install and configure shadcn/ui
- [ ] Create folder structure (`features/`, `components/`, `hooks/`, `lib/`, `stores/`)
- [ ] Set up API client (Axios with interceptors)
- [ ] Set up React Router with layout components
- [ ] Set up TanStack Query provider
- [ ] Create `AuthLayout` and `AppLayout` components
- [ ] Create base UI components (Button, Input, etc.)

### Infrastructure Tasks
- [ ] Create `docker-compose.yml` with PostgreSQL, Redis, Mailhog
- [ ] Create backend `Dockerfile` (multi-stage)
- [ ] Create frontend `Dockerfile` with Nginx
- [ ] Create Prometheus config
- [ ] Create GitHub Actions CI workflow
- [ ] Create `.gitignore`, `.editorconfig`
- [ ] Write initial `README.md`

### Database Tasks
- [ ] Create `V001__create_users_table.sql`

### Acceptance Criteria
- `docker compose up` starts all services
- Backend starts and serves `/actuator/health`
- Frontend starts and displays a placeholder page
- CI pipeline passes
- OpenAPI docs accessible at `/swagger-ui.html`

### Suggested Commits
```
chore: initialize Spring Boot project with dependencies
chore: configure Docker Compose with PostgreSQL, Redis, Mailhog
feat(common): add BaseEntity, ApiResponse, GlobalExceptionHandler
feat(common): add FractionalIndex and SlugUtils utilities
chore(frontend): initialize Vite + React + TypeScript + Tailwind
chore(ci): add GitHub Actions CI pipeline
docs: add initial README
```

---

## Phase 2: Authentication

**Objective**: Complete authentication system with JWT, refresh tokens, email verification, and password reset.

**Duration**: 7–10 days | **Difficulty**: High

### Backend Tasks
- [ ] Create `User` entity and `UserRepository`
- [ ] Implement `JwtTokenProvider` (generate, validate, claims extraction)
- [ ] Implement `JwtAuthenticationFilter`
- [ ] Implement `CustomUserDetailsService`
- [ ] Configure `SecurityConfig` (filter chain, CORS, CSRF)
- [ ] Implement `AuthService` (register, login, refresh, logout)
- [ ] Implement `TokenService` (refresh token rotation, family-based replay detection)
- [ ] Implement `EmailService` (Mailhog integration)
- [ ] Implement email verification flow
- [ ] Implement forgot password / reset password flow
- [ ] Implement `PasswordStrengthValidator`
- [ ] Implement `RateLimitFilter` (sliding window counter)
- [ ] Implement `RequestContextFilter` (MDC)
- [ ] Implement `SecurityHeaderFilter`
- [ ] Implement `AuthController`
- [ ] Implement `UserController` (profile, preferences)
- [ ] Create `UserMapper`
- [ ] Publish `UserRegistered`, `EmailVerified`, `PasswordResetCompleted` events

### Frontend Tasks
- [ ] Create `LoginPage` with form
- [ ] Create `RegisterPage` with password strength
- [ ] Create `ForgotPasswordPage`
- [ ] Create `ResetPasswordPage`
- [ ] Create `VerifyEmailPage`
- [ ] Implement auth store (Zustand)
- [ ] Implement API interceptors (token refresh, 401 redirect)
- [ ] Implement `ProtectedRoute` component
- [ ] Create `UserSettingsPage` (profile, preferences)

### Database Tasks
- [ ] `V002__create_refresh_tokens_table.sql`
- [ ] `V003__create_verification_tokens_table.sql`
- [ ] `V004__create_password_reset_tokens_table.sql`

### Tests
- [ ] Unit: `AuthServiceImpl`, `JwtTokenProvider`, `PasswordStrengthValidator`
- [ ] Integration: Registration flow, login flow, token refresh, replay detection
- [ ] Security: Unauthenticated access, rate limiting

### Acceptance Criteria
- User can register, verify email (via Mailhog), and login
- JWT authentication works on protected endpoints
- Refresh token rotation works correctly
- Replay attack detection works
- Password reset flow works end-to-end
- Rate limiting blocks excessive login attempts

### Suggested Commits
```
feat(auth): implement JWT token generation and validation
feat(auth): implement user registration with email verification
feat(auth): implement login with refresh token rotation
feat(auth): implement password reset flow
feat(security): implement rate limiting with sliding window counter
feat(frontend): implement login and registration pages
test(auth): add unit and integration tests for auth flows
```

---

## Phase 3: Workspace

**Objective**: Workspace CRUD, member management, and invitations.

**Duration**: 5–7 days | **Difficulty**: Medium

### Backend Tasks
- [ ] Create `Workspace`, `WorkspaceMember`, `WorkspaceInvitation` entities
- [ ] Implement `WorkspaceService` (create, update, delete, list)
- [ ] Implement member management (add, remove, update role)
- [ ] Implement invitation flow (create, accept, revoke, expire)
- [ ] Implement ownership transfer
- [ ] Implement `WorkspaceAuthorizationService` (RBAC)
- [ ] Implement workspace membership caching (Redis)
- [ ] Create `WorkspaceController`
- [ ] Publish workspace events

### Frontend Tasks
- [ ] Create `DashboardPage` with workspace list
- [ ] Create workspace creation dialog
- [ ] Create `WorkspacePage`
- [ ] Create `WorkspaceSettingsPage`
- [ ] Create `MembersPage` with role management
- [ ] Create invitation dialog

### Database Tasks
- [ ] `V005__create_workspaces_table.sql`
- [ ] `V006__create_workspace_members_table.sql`
- [ ] `V007__create_workspace_invitations_table.sql`

### Tests
- [ ] Unit: `WorkspaceServiceImpl`, `WorkspaceAuthorizationService`
- [ ] Integration: Workspace CRUD, member management, invitation acceptance
- [ ] Security: RBAC enforcement, ownership transfer

### Suggested Commits
```
feat(workspace): implement workspace CRUD with slug generation
feat(workspace): implement member management with RBAC
feat(workspace): implement invitation flow with email notification
feat(frontend): implement dashboard and workspace pages
test(workspace): add integration tests for workspace operations
```

---

## Phase 4: Boards

**Objective**: Board and column management with fractional indexing.

**Duration**: 4–5 days | **Difficulty**: Medium

### Backend Tasks
- [ ] Create `Board`, `BoardColumn` entities
- [ ] Implement `BoardService` (create with default columns, update, archive, delete)
- [ ] Implement column management (create, update, delete, reorder)
- [ ] Implement fractional indexing for column ordering
- [ ] Implement board caching (Redis)
- [ ] Create `BoardController`
- [ ] Implement task sequence counter on boards
- [ ] Publish board events

### Frontend Tasks
- [ ] Create `BoardPage` with column layout
- [ ] Create `Column` component
- [ ] Create board creation dialog
- [ ] Create column management (add, rename, delete)
- [ ] Create board header with navigation

### Database Tasks
- [ ] `V008__create_boards_table.sql`
- [ ] `V009__create_board_columns_table.sql`

### Tests
- [ ] Unit: `BoardServiceImpl`, `FractionalIndex`
- [ ] Integration: Board CRUD, column reordering, default column creation

### Suggested Commits
```
feat(board): implement board CRUD with default columns
feat(board): implement column management with fractional indexing
feat(frontend): implement board page with column layout
test(board): add integration tests for board and column operations
```

---

## Phase 5: Tasks

**Objective**: Task CRUD, assignments, labels, and drag-and-drop.

**Duration**: 7–10 days | **Difficulty**: High

### Backend Tasks
- [ ] Create `Task`, `TaskAssignment`, `Label`, `TaskLabel` entities
- [ ] Implement `TaskService` (create, update, archive, move, reorder)
- [ ] Implement task identifier generation (`SF-42`)
- [ ] Implement assignment management
- [ ] Implement label management (workspace-scoped)
- [ ] Implement task filtering and sorting
- [ ] Implement optimistic locking on task updates
- [ ] Create `TaskController`, `LabelController`
- [ ] Publish task events

### Frontend Tasks
- [ ] Create `TaskCard` component
- [ ] Create `TaskDetailPanel` (slide-over)
- [ ] Implement drag-and-drop with dnd-kit
- [ ] Create task creation form (inline + dialog)
- [ ] Create assignment selector
- [ ] Create label selector with color picker
- [ ] Implement task filtering UI
- [ ] Implement optimistic updates for drag-and-drop

### Database Tasks
- [ ] `V010__create_tasks_table.sql`
- [ ] `V011__create_task_assignments_table.sql`
- [ ] `V012__create_labels_table.sql`
- [ ] `V013__create_task_labels_table.sql`

### Tests
- [ ] Unit: `TaskServiceImpl`, identifier generation, optimistic locking
- [ ] Integration: Task CRUD, movement, assignment, labeling
- [ ] Security: Permission checks on task operations

### Suggested Commits
```
feat(task): implement task CRUD with identifier generation
feat(task): implement drag-and-drop movement with fractional indexing
feat(task): implement assignments and labels
feat(frontend): implement board view with drag-and-drop
feat(frontend): implement task detail panel
test(task): add comprehensive task operation tests
```

---

## Phase 6: Comments & Activity

**Objective**: Comments with mentions, activity timeline.

**Duration**: 4–5 days | **Difficulty**: Medium

### Backend Tasks
- [ ] Create `Comment`, `Mention`, `ActivityLog` entities
- [ ] Implement `CommentService` (create, update, soft-delete)
- [ ] Implement mention parsing and resolution
- [ ] Implement `ActivityService` (record, query by entity, query by workspace)
- [ ] Implement activity event consumers
- [ ] Create `CommentController`, `ActivityController`
- [ ] Publish comment and mention events

### Frontend Tasks
- [ ] Create comment list in task detail panel
- [ ] Create comment input with @mention autocomplete
- [ ] Create activity timeline in task detail panel
- [ ] Create workspace activity feed

### Database Tasks
- [ ] `V014__create_comments_table.sql`
- [ ] `V015__create_mentions_table.sql`
- [ ] `V016__create_activity_logs_table.sql`

### Tests
- [ ] Unit: Mention parsing, comment edit window, activity recording
- [ ] Integration: Comment CRUD, mention resolution, activity timeline

### Suggested Commits
```
feat(comment): implement comments with soft delete
feat(comment): implement @mention parsing and notifications
feat(activity): implement activity logging via domain events
feat(frontend): implement comment thread and activity timeline
```

---

## Phase 7: Notifications

**Objective**: In-app notifications with real-time delivery.

**Duration**: 3–4 days | **Difficulty**: Medium

### Backend Tasks
- [ ] Create `Notification` entity
- [ ] Implement `NotificationService`
- [ ] Implement notification event consumers (all event types)
- [ ] Implement notification listing with cursor pagination
- [ ] Implement read/unread management
- [ ] Implement unread count caching (Redis)
- [ ] Create `NotificationController`

### Frontend Tasks
- [ ] Create `NotificationsPage`
- [ ] Create notification bell with unread badge
- [ ] Create notification dropdown in header
- [ ] Implement notification click → navigate to reference

### Database Tasks
- [ ] `V017__create_notifications_table.sql`

### Tests
- [ ] Unit: Notification creation, deduplication
- [ ] Integration: Event → notification pipeline, read/unread management

---

## Phase 8: Real-Time Collaboration

**Objective**: WebSocket integration, presence, multi-instance broadcast.

**Duration**: 5–7 days | **Difficulty**: High

### Backend Tasks
- [ ] Configure Spring WebSocket with STOMP
- [ ] Implement `WebSocketAuthInterceptor`
- [ ] Implement `WebSocketSubscriptionInterceptor`
- [ ] Implement `WebSocketRedisRelay` (event → Redis Pub/Sub → local broadcast)
- [ ] Implement `PresenceService` (Redis-backed)
- [ ] Implement heartbeat processing
- [ ] Implement session cleanup on disconnect
- [ ] Configure Redis Pub/Sub listeners

### Frontend Tasks
- [ ] Create `WebSocketManager` client
- [ ] Implement `useBoardSubscription` hook
- [ ] Implement `useNotificationSubscription` hook
- [ ] Implement `usePresence` hook
- [ ] Display online presence indicators
- [ ] Implement reconnection with exponential backoff
- [ ] Implement optimistic UI reconciliation

### Tests
- [ ] Integration: WebSocket connection, subscription, message delivery
- [ ] Security: WebSocket authentication, subscription authorization

### Suggested Commits
```
feat(websocket): implement STOMP WebSocket with authentication
feat(presence): implement Redis-backed presence with heartbeats
feat(websocket): implement Redis Pub/Sub relay for multi-instance
feat(frontend): implement WebSocket client with reconnection
feat(frontend): implement real-time board updates
```

---

## Phase 9: Search

**Objective**: PostgreSQL full-text search across tasks, boards, comments.

**Duration**: 3–4 days | **Difficulty**: Medium

### Backend Tasks
- [ ] Create search vector triggers on tasks and comments tables
- [ ] Implement `SearchService` (multi-entity search with ranking)
- [ ] Implement recent searches (Redis LIST)
- [ ] Implement search filtering by entity type
- [ ] Create `SearchController`

### Frontend Tasks
- [ ] Create command palette (`Cmd+K`)
- [ ] Implement search results display (grouped by type)
- [ ] Implement recent searches
- [ ] Implement search result navigation

### Database Tasks
- [ ] `V018__create_search_vectors_and_triggers.sql`

### Tests
- [ ] Integration: Full-text search accuracy, ranking, filtering

---

## Phase 10: Production Readiness

**Objective**: Monitoring, cleanup jobs, documentation, final polish.

**Duration**: 4–5 days | **Difficulty**: Medium

### Backend Tasks
- [ ] Implement custom Micrometer metrics
- [ ] Implement health check indicators
- [ ] Implement scheduled cleanup jobs (tokens, notifications, invitations)
- [ ] Implement ShedLock for distributed job locking
- [ ] Configure structured JSON logging for production
- [ ] Implement `application-prod.yml`
- [ ] Review and harden all security configurations
- [ ] Generate OpenAPI documentation

### Frontend Tasks
- [ ] Implement dark/light mode toggle
- [ ] Implement keyboard shortcuts help dialog
- [ ] Implement error boundaries
- [ ] Implement loading skeletons for all views
- [ ] Implement empty states for all views
- [ ] Performance optimization (code splitting, memoization)
- [ ] Accessibility audit and fixes

### Infrastructure Tasks
- [ ] Create Grafana dashboards
- [ ] Configure alerting rules
- [ ] Create `scripts/setup.sh` and `scripts/dev.sh`
- [ ] Update `README.md` with complete documentation
- [ ] Create production `docker-compose.prod.yml`

### Tests
- [ ] Run full test suite and fix failures
- [ ] Verify all performance targets
- [ ] Security audit (check OWASP mitigations)

### Suggested Commits
```
feat(ops): implement Prometheus metrics and health checks
feat(ops): implement scheduled cleanup jobs with ShedLock
feat(frontend): implement dark mode and keyboard shortcuts
feat(frontend): add loading skeletons and empty states
chore: configure production Docker Compose
docs: finalize README and deployment documentation
```

---

## Phase Summary

| Phase | Duration | Difficulty | Cumulative |
|---|---|---|---|
| 1. Foundation | 3–4 days | Low | Week 1 |
| 2. Authentication | 7–10 days | High | Week 2–3 |
| 3. Workspace | 5–7 days | Medium | Week 4 |
| 4. Boards | 4–5 days | Medium | Week 5 |
| 5. Tasks | 7–10 days | High | Week 6–7 |
| 6. Comments & Activity | 4–5 days | Medium | Week 8 |
| 7. Notifications | 3–4 days | Medium | Week 9 |
| 8. Real-Time | 5–7 days | High | Week 10–11 |
| 9. Search | 3–4 days | Medium | Week 12 |
| 10. Production | 4–5 days | Medium | Week 13–14 |
| **Total** | **10–14 weeks** | | |
