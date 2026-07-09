# SyncForge — Module Architecture

## Module Overview

SyncForge consists of 13 modules: 10 feature modules and 3 infrastructure modules.

| Module | Type | Purpose |
|---|---|---|
| Auth | Feature | Authentication lifecycle |
| User | Feature | User profile management |
| Workspace | Feature | Workspace & membership management |
| Board | Feature | Board & column management |
| Task | Feature | Task lifecycle & assignments |
| Comment | Feature | Comments & mentions |
| Notification | Feature | In-app notification delivery |
| Presence | Feature | Online status tracking |
| Search | Feature | Full-text search |
| Activity | Feature | Audit trail & timeline |
| Common | Infrastructure | Shared utilities (no business logic) |
| Security | Infrastructure | Spring Security configuration |
| Config | Infrastructure | Application configuration |

---

## Module Documentation

### Auth Module

#### Purpose
Manages the complete authentication lifecycle: registration, login, logout, JWT management, refresh tokens, email verification, and password reset.

#### Responsibilities
**Owns**:
- User registration flow
- Credential validation and login
- JWT generation and validation
- Refresh token creation, rotation, and revocation
- Email verification token lifecycle
- Password reset token lifecycle
- Logout (token blacklisting)

**Must never own**:
- User profile management (→ User module)
- Workspace membership (→ Workspace module)
- Business authorization (→ Security infrastructure uses RBAC from Workspace)

#### Public Interfaces
```java
public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    AuthResponse refreshToken(RefreshTokenRequest request);
    void logout(LogoutRequest request);
    void verifyEmail(String token);
    void resendVerification(String email);
    void forgotPassword(ForgotPasswordRequest request);
    void resetPassword(ResetPasswordRequest request);
}
```

#### Internal Components

| Component | Count | Examples |
|---|---|---|
| Controllers | 1 | `AuthController` |
| Services | 3 | `AuthService`, `TokenService`, `EmailService` |
| Repositories | 3 | `RefreshTokenRepository`, `VerificationTokenRepository`, `PasswordResetTokenRepository` |
| DTOs | 8 | `RegisterRequest`, `LoginRequest`, `AuthResponse`, etc. |
| Validators | 1 | `PasswordStrengthValidator` |
| Events | 3 | `UserRegistered`, `EmailVerified`, `PasswordResetRequested` |
| Exceptions | 5 | `InvalidCredentialsException`, `EmailAlreadyExistsException`, etc. |

#### Dependencies
- **Allowed**: User (to create user records), Common
- **Forbidden**: Workspace, Board, Task, Comment, Notification, Presence, Search, Activity

#### Persistence
- **Tables**: `refresh_tokens`, `verification_tokens`, `password_reset_tokens`
- **Redis**: JWT blacklist (`jwt:blacklist:{jti}`, TTL = token remaining lifetime)

#### Security
- Registration, login, forgot-password, reset-password: **Public** (no authentication)
- Email verification: **Public** (token-based)
- Refresh token: **Public** (token-based)
- Logout: **Authenticated**

#### Failure Handling
| Failure | Behavior | Recovery |
|---|---|---|
| Duplicate email | 409 Conflict | User retries with different email |
| Invalid credentials | 401 Unauthorized (generic message) | User retries; rate limited after 5 attempts |
| Expired verification token | 400 Bad Request | User requests resend |
| Expired refresh token | 401 Unauthorized | User re-authenticates |
| Redis unavailable | JWT blacklist check skipped (log warning) | Short token lifetime mitigates risk |

#### Testing
- **Unit**: Password validation, token generation, login logic
- **Integration**: Full registration flow, login flow, token rotation, email verification
- **Security**: Rate limiting, brute-force protection, token replay detection

#### Future Extension Points
- OAuth/social login: Add `AuthProvider` strategy pattern
- Multi-factor authentication: Add MFA step after credential validation
- SSO/SAML: Add federation endpoint

---

### User Module

#### Purpose
Manages user profiles, preferences, and account status.

#### Responsibilities
**Owns**:
- User profile CRUD
- Preferences (theme, locale, notification settings)
- Avatar URL generation (Gravatar)
- Account status management
- Display name updates

**Must never own**:
- Authentication (→ Auth module)
- Workspace membership (→ Workspace module)
- Password management (→ Auth module)

#### Public Interfaces
```java
public interface UserService {
    UserDto getUserById(UUID userId);
    UserDto getUserByEmail(String email);
    UserDto updateProfile(UUID userId, UpdateProfileRequest request);
    UserDto updatePreferences(UUID userId, UpdatePreferencesRequest request);
    boolean existsByEmail(String email);
    User createUser(String email, String passwordHash, String displayName);
    List<UserDto> getUsersByIds(Collection<UUID> userIds);
}
```

#### Internal Components

| Component | Count | Examples |
|---|---|---|
| Controllers | 1 | `UserController` |
| Services | 1 | `UserService` |
| Repositories | 1 | `UserRepository` |
| DTOs | 4 | `UserDto`, `UpdateProfileRequest`, `UpdatePreferencesRequest`, `UserSummaryDto` |
| Mappers | 1 | `UserMapper` |

#### Dependencies
- **Allowed**: Common
- **Forbidden**: Auth, Workspace, Board, Task, Comment, Notification

#### Persistence
- **Tables**: `users`
- **Redis**: User profile cache (`user:{id}`, TTL = 10 min with jitter)

#### Security
- Get own profile: **Authenticated**
- Update own profile: **Authenticated** (owner only)
- Get other user's public info: **Authenticated** (same workspace)

---

### Workspace Module

#### Purpose
Manages workspace lifecycle, membership, invitations, and workspace-level settings.

#### Responsibilities
**Owns**:
- Workspace CRUD
- Member management (add, remove, update role)
- Invitation lifecycle (create, accept, revoke, expire)
- Workspace settings
- Ownership transfer
- Slug generation and uniqueness

**Must never own**:
- Boards (→ Board module)
- Tasks (→ Task module)
- Authentication (→ Auth module)

#### Public Interfaces
```java
public interface WorkspaceService {
    WorkspaceDto createWorkspace(UUID userId, CreateWorkspaceRequest request);
    WorkspaceDto getWorkspace(UUID workspaceId);
    WorkspaceDto updateWorkspace(UUID workspaceId, UpdateWorkspaceRequest request);
    void deleteWorkspace(UUID workspaceId, UUID userId);
    List<WorkspaceDto> getUserWorkspaces(UUID userId);

    WorkspaceMemberDto addMember(UUID workspaceId, UUID userId, WorkspaceRole role);
    void removeMember(UUID workspaceId, UUID userId);
    void updateMemberRole(UUID workspaceId, UUID userId, WorkspaceRole role);
    List<WorkspaceMemberDto> getMembers(UUID workspaceId);
    WorkspaceRole getMemberRole(UUID workspaceId, UUID userId);
    boolean isMember(UUID workspaceId, UUID userId);

    InvitationDto createInvitation(UUID workspaceId, CreateInvitationRequest request);
    void acceptInvitation(String token);
    void revokeInvitation(UUID invitationId);
    List<InvitationDto> getPendingInvitations(UUID workspaceId);
}
```

#### Dependencies
- **Allowed**: User (to resolve user details), Common
- **Forbidden**: Auth, Board, Task, Comment

#### Persistence
- **Tables**: `workspaces`, `workspace_members`, `workspace_invitations`
- **Redis**: Workspace membership cache (`workspace:{id}:members`, TTL = 5 min)

#### Security
- Create workspace: **Authenticated**
- Read workspace: **VIEWER+** (workspace member)
- Update workspace: **ADMIN+**
- Delete workspace: **OWNER only**
- Manage members: **ADMIN+**
- Manage invitations: **ADMIN+**
- Accept invitation: **Authenticated** (matching email)
- Transfer ownership: **OWNER only**

#### Failure Handling
| Failure | Behavior |
|---|---|
| Duplicate slug | Append numeric suffix (`my-workspace-2`) |
| Owner tries to leave | 400 Bad Request — must transfer ownership first |
| Duplicate invitation | 409 Conflict |
| Expired invitation | 400 Bad Request |

---

### Board Module

#### Purpose
Manages board lifecycle and column management within workspaces.

#### Responsibilities
**Owns**:
- Board CRUD
- Column CRUD
- Column ordering (fractional indexing)
- Board archiving
- Default column creation
- Board-level task sequence counter

**Must never own**:
- Tasks (→ Task module)
- Workspace membership (→ Workspace module)

#### Public Interfaces
```java
public interface BoardService {
    BoardDto createBoard(UUID workspaceId, CreateBoardRequest request);
    BoardDto getBoard(UUID boardId);
    BoardDetailDto getBoardWithColumns(UUID boardId);
    BoardDto updateBoard(UUID boardId, UpdateBoardRequest request);
    void archiveBoard(UUID boardId);
    void deleteBoard(UUID boardId);
    List<BoardDto> getWorkspaceBoards(UUID workspaceId, boolean includeArchived);

    ColumnDto createColumn(UUID boardId, CreateColumnRequest request);
    ColumnDto updateColumn(UUID columnId, UpdateColumnRequest request);
    void deleteColumn(UUID columnId);
    void reorderColumn(UUID columnId, ReorderRequest request);
    int incrementTaskSequence(UUID boardId);
}
```

#### Dependencies
- **Allowed**: Workspace (for membership/authorization checks), Common
- **Forbidden**: Auth, User (direct), Task, Comment

#### Persistence
- **Tables**: `boards`, `board_columns`
- **Redis**: Board data cache (`board:{id}`, TTL = 5 min)

#### Security
- Create board: **MEMBER+** (workspace)
- Read board: **VIEWER+** (workspace)
- Update board: **MEMBER+**
- Archive/delete board: **ADMIN+**
- Manage columns: **MEMBER+**

#### Default Columns
When a board is created, three default columns are automatically created:
1. **To Do** (position: `"a"`)
2. **In Progress** (position: `"b"`)
3. **Done** (position: `"c"`)

---

### Task Module

#### Purpose
Manages task lifecycle, assignments, and labels within board columns.

#### Responsibilities
**Owns**:
- Task CRUD
- Task ordering within columns (fractional indexing)
- Task movement between columns
- Task assignments (assign/unassign users)
- Label management (workspace-scoped labels, task-label associations)
- Task archiving
- Task identifier generation

**Must never own**:
- Comments (→ Comment module)
- Board/column management (→ Board module)
- Activity logging (→ Activity module, via events)

#### Public Interfaces
```java
public interface TaskService {
    TaskDto createTask(UUID columnId, CreateTaskRequest request);
    TaskDto getTask(UUID taskId);
    TaskDto updateTask(UUID taskId, UpdateTaskRequest request);
    void archiveTask(UUID taskId);
    void moveTask(UUID taskId, MoveTaskRequest request);
    void reorderTask(UUID taskId, ReorderRequest request);
    Page<TaskDto> getBoardTasks(UUID boardId, TaskFilter filter, Pageable pageable);
    List<TaskDto> getColumnTasks(UUID columnId);

    void assignUser(UUID taskId, UUID userId);
    void unassignUser(UUID taskId, UUID userId);
    List<UserSummaryDto> getAssignees(UUID taskId);

    LabelDto createLabel(UUID workspaceId, CreateLabelRequest request);
    void deleteLabel(UUID labelId);
    void addLabel(UUID taskId, UUID labelId);
    void removeLabel(UUID taskId, UUID labelId);
    List<LabelDto> getWorkspaceLabels(UUID workspaceId);
}
```

#### Dependencies
- **Allowed**: Board (for column validation, sequence), Workspace (for membership), User (for assignee resolution), Common
- **Forbidden**: Auth, Comment

#### Persistence
- **Tables**: `tasks`, `task_assignments`, `labels`, `task_labels`
- **Redis**: No direct caching (tasks are read as part of board loads, which are cached at the board level)

#### Security
- Create task: **MEMBER+** (workspace)
- Read task: **VIEWER+** (workspace)
- Update task: **MEMBER+**
- Archive task: **MEMBER+** (creator or ADMIN+)
- Assign/unassign: **MEMBER+**
- Manage labels: **MEMBER+**

---

### Comment Module

#### Purpose
Manages comments on tasks, including editing, soft deletion, and mention extraction.

#### Responsibilities
**Owns**:
- Comment CRUD (create, read, update, soft-delete)
- Mention extraction and persistence
- Edit validation (time window)
- Comment content rendering

**Must never own**:
- Task management (→ Task module)
- Notification delivery (→ Notification module, via events)

#### Public Interfaces
```java
public interface CommentService {
    CommentDto createComment(UUID taskId, CreateCommentRequest request);
    CommentDto updateComment(UUID commentId, UpdateCommentRequest request);
    void deleteComment(UUID commentId);
    Page<CommentDto> getTaskComments(UUID taskId, Pageable pageable);
}
```

#### Dependencies
- **Allowed**: Task (for task existence validation), User (for mention resolution), Workspace (for membership), Common
- **Forbidden**: Auth, Board (direct)

#### Persistence
- **Tables**: `comments`, `mentions`

#### Security
- Create comment: **MEMBER+** (workspace)
- Read comments: **VIEWER+** (workspace)
- Update comment: **Author only** (within 15-minute edit window)
- Delete comment: **Author or ADMIN+**

#### Business Rules
- **Edit window**: Comments can only be edited within 15 minutes of creation
- **Soft delete**: Deleted comments display as "This comment has been deleted"
- **Mentions**: `@DisplayName` patterns are parsed and resolved to user IDs. Unresolvable mentions are ignored.

---

### Notification Module

#### Purpose
Manages in-app notification creation, delivery, and lifecycle.

#### Responsibilities
**Owns**:
- Notification creation (triggered by domain events)
- Notification storage
- Read/unread status management
- Real-time notification delivery (via WebSocket)
- Notification listing and pagination

**Must never own**:
- Business logic (never calls Task, Board, etc.)
- Email delivery (→ Auth module for auth emails; email notifications are future enhancement)

#### Public Interfaces
```java
public interface NotificationService {
    void createNotification(CreateNotificationCommand command);
    Page<NotificationDto> getUserNotifications(UUID userId, Pageable pageable);
    long getUnreadCount(UUID userId);
    void markAsRead(UUID notificationId);
    void markAllAsRead(UUID userId);
    void deleteNotification(UUID notificationId);
}
```

#### Dependencies
- **Allowed**: User (for recipient validation), Common
- **Forbidden**: Auth, Workspace, Board, Task, Comment (notifications react to events only)

#### Persistence
- **Tables**: `notifications`
- **Redis**: Unread count cache (`notification:unread:{userId}`, TTL = 5 min)

#### Event Consumers
| Event | Notification Created |
|---|---|
| `TaskAssigned` | "You were assigned to {task.identifier}" |
| `CommentAdded` | "New comment on {task.identifier}" |
| `MentionCreated` | "{actor} mentioned you in {task.identifier}" |
| `InvitationReceived` | "You've been invited to {workspace.name}" |
| `TaskUpdated` | "Task {task.identifier} was updated" (for assignees only) |

---

### Presence Module

#### Purpose
Tracks user online status across WebSocket connections.

#### Responsibilities
**Owns**:
- Online/Offline/Away status
- Active workspace and board tracking
- Heartbeat processing
- Session tracking
- Automatic expiration

**Must never own**:
- User profiles (→ User module)
- WebSocket connection management (→ WebSocket infrastructure)
- Business logic

#### Public Interfaces
```java
public interface PresenceService {
    void setOnline(UUID userId, UUID workspaceId, UUID boardId);
    void setAway(UUID userId);
    void setOffline(UUID userId);
    void heartbeat(UUID userId);
    PresenceDto getUserPresence(UUID userId);
    List<PresenceDto> getWorkspacePresence(UUID workspaceId);
    List<PresenceDto> getBoardPresence(UUID boardId);
}
```

#### Dependencies
- **Allowed**: User (for user display info), Common
- **Forbidden**: All business modules

#### Persistence
- **Tables**: None (presence is ephemeral)
- **Redis**: `presence:user:{userId}` (HASH with fields: status, workspaceId, boardId, lastSeen), TTL = 60 seconds (refreshed by heartbeats)

#### Heartbeat Strategy
- Client sends heartbeat every **30 seconds**
- Redis key TTL is **60 seconds**
- If heartbeat stops, key expires → user is offline
- Heartbeat also updates `lastSeen` timestamp

---

### Search Module

#### Purpose
Provides full-text search across tasks, boards, comments, labels, and users using PostgreSQL FTS.

#### Responsibilities
**Owns**:
- Search query execution
- Result ranking and formatting
- Search filtering
- Recent search tracking

**Must never own**:
- Business logic (search is read-only)
- Data modification

#### Public Interfaces
```java
public interface SearchService {
    SearchResultDto search(UUID workspaceId, String query, SearchFilter filter, Pageable pageable);
    List<RecentSearchDto> getRecentSearches(UUID userId);
    void saveRecentSearch(UUID userId, String query);
}
```

#### Dependencies
- **Allowed**: Common
- **Forbidden**: All business modules (search queries the database directly)

#### Persistence
- **Tables**: Queries `tasks`, `boards`, `comments`, `labels`, `users` (read-only)
- **Redis**: Recent searches (`search:recent:{userId}`, LIST, TTL = 30 days)

#### Security
- Search: **VIEWER+** (workspace) — results are scoped to the user's workspace membership

---

### Activity Module

#### Purpose
Records an audit trail of all significant business events for the activity timeline.

#### Responsibilities
**Owns**:
- Activity log creation (triggered by domain events)
- Activity timeline queries
- Change tracking (before/after values)

**Must never own**:
- Business logic (activity is a consumer, never a producer)

#### Public Interfaces
```java
public interface ActivityService {
    void recordActivity(RecordActivityCommand command);
    Page<ActivityDto> getEntityActivity(String entityType, UUID entityId, Pageable pageable);
    Page<ActivityDto> getWorkspaceActivity(UUID workspaceId, Pageable pageable);
}
```

#### Dependencies
- **Allowed**: Common
- **Forbidden**: All business modules (activity reacts to events only)

#### Persistence
- **Tables**: `activity_logs`

#### Event Consumers
| Event | Activity Recorded |
|---|---|
| `TaskCreated` | "{actor} created task {identifier}" |
| `TaskUpdated` | "{actor} updated {field} from {old} to {new}" |
| `TaskMoved` | "{actor} moved {identifier} to {column}" |
| `CommentAdded` | "{actor} commented on {identifier}" |
| `MemberInvited` | "{actor} invited {email}" |
| `InvitationAccepted` | "{user} joined the workspace" |
| `BoardCreated` | "{actor} created board {name}" |

---

### Common Module

#### Purpose
Contains shared infrastructure utilities. **No business logic.**

#### Contents
- `BaseEntity` — `@MappedSuperclass` with `createdAt`, `updatedAt`
- `ApiResponse<T>` — Standard API response wrapper
- `PagedResponse<T>` — Standard paginated response
- `ErrorResponse` — Standard error response
- `GlobalExceptionHandler` — `@RestControllerAdvice`
- `ValidationUtils` — Common validation helpers
- `SlugUtils` — Slug generation
- `FractionalIndex` — Lexicographic ordering utility
- `Constants` — Application-wide constants

#### Dependencies
- **Allowed**: None
- **Forbidden**: All modules

---

### Security Module

#### Purpose
Spring Security configuration, JWT filter chain, authentication providers.

#### Contents
- `SecurityConfig` — `SecurityFilterChain` bean
- `JwtAuthenticationFilter` — `OncePerRequestFilter`
- `JwtTokenProvider` — Token creation and validation
- `CustomUserDetailsService` — Loads user for authentication
- `WorkspaceAuthorizationService` — RBAC evaluation
- `SecurityConstants` — Security-related constants

#### Dependencies
- **Allowed**: User (for `UserDetailsService`), Auth (for token validation), Common
- **Forbidden**: Workspace, Board, Task, Comment

---

### Config Module

#### Purpose
Application configuration beans.

#### Contents
- `RedisConfig` — `RedisTemplate` and `RedisConnectionFactory`
- `JacksonConfig` — `ObjectMapper` customization
- `WebSocketConfig` — STOMP configuration
- `AsyncConfig` — `@Async` executor configuration
- `OpenApiConfig` — SpringDoc configuration
- `WebConfig` — CORS configuration, converters

#### Dependencies
- **Allowed**: Common
- **Forbidden**: All feature modules
