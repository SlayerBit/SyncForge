# SyncForge — REST API Specification

## API Design Principles

- Resource-oriented endpoints with plural nouns
- Consistent naming: `kebab-case` for URLs, `camelCase` for JSON fields
- Stateless — every request includes authentication
- Standard HTTP methods: GET (read), POST (create), PATCH (partial update), DELETE
- Standard status codes: 200, 201, 204, 400, 401, 403, 404, 409, 422, 429, 500
- All responses use consistent envelope format
- API prefix: `/api`

## API Versioning

**Strategy**: URL path prefix versioning is NOT used in the initial implementation. The API is unversioned (`/api/...`). Versioning will be introduced when breaking changes are needed (future).

**Justification**: For a single-client application (the React SPA), API versioning adds complexity without benefit. The frontend and backend are deployed together, so breaking changes can be coordinated.

**Future**: When public APIs or mobile clients are introduced, use URL path versioning (`/api/v2/...`).

---

## Response Format

### Success Response

```json
{
  "data": { ... },
  "timestamp": "2024-01-15T10:30:00Z",
  "requestId": "req-uuid"
}
```

### Paginated Response

```json
{
  "data": [ ... ],
  "page": {
    "number": 0,
    "size": 20,
    "totalElements": 150,
    "totalPages": 8
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "requestId": "req-uuid"
}
```

### Cursor-Paginated Response

```json
{
  "data": [ ... ],
  "cursor": {
    "next": "cursor-value",
    "hasMore": true
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "requestId": "req-uuid"
}
```

### Error Response

```json
{
  "status": 400,
  "error": "VALIDATION_ERROR",
  "message": "Validation failed",
  "details": [
    { "field": "email", "message": "must be a valid email address" },
    { "field": "password", "message": "must be at least 8 characters" }
  ],
  "timestamp": "2024-01-15T10:30:00Z",
  "requestId": "req-uuid",
  "traceId": "trace-uuid"
}
```

### Error Codes

| Code | HTTP Status | Description |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `INVALID_REQUEST` | 400 | Malformed request |
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `TOKEN_EXPIRED` | 401 | JWT or refresh token expired |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource conflict (duplicate, version) |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## Authentication APIs

### POST /api/auth/register

| Property | Value |
|---|---|
| **Purpose** | Create a new user account |
| **Authentication** | None |
| **Rate Limit** | 3/10min per IP |

**Request**:
```json
{ "email": "user@example.com", "password": "SecureP@ss1", "displayName": "John Doe" }
```

**Response** (201):
```json
{ "data": { "userId": "uuid", "email": "user@example.com", "displayName": "John Doe", "status": "PENDING" } }
```

**Errors**: 400 (validation), 409 (email exists)

---

### POST /api/auth/login

| Property | Value |
|---|---|
| **Purpose** | Authenticate and receive tokens |
| **Authentication** | None |
| **Rate Limit** | 5/min per email, 20/min per IP |

**Request**:
```json
{ "email": "user@example.com", "password": "SecureP@ss1" }
```

**Response** (200):
```json
{
  "data": {
    "accessToken": "eyJ...", "refreshToken": "abc...",
    "tokenType": "Bearer", "expiresIn": 900,
    "user": { "id": "uuid", "email": "...", "displayName": "...", "status": "ACTIVE", "avatarUrl": "..." }
  }
}
```

**Errors**: 401 (invalid credentials), 423 (account locked), 429 (rate limited)

---

### POST /api/auth/refresh

| Property | Value |
|---|---|
| **Purpose** | Exchange refresh token for new access + refresh tokens |
| **Authentication** | None (token in body) |
| **Rate Limit** | 10/min per user |

**Request**: `{ "refreshToken": "abc..." }`

**Response** (200): Same structure as login response.

**Errors**: 401 (expired/revoked/replayed token)

---

### POST /api/auth/logout

| Property | Value |
|---|---|
| **Purpose** | Invalidate current session |
| **Authentication** | Bearer token |

**Request**: `{ "refreshToken": "abc..." }`

**Response**: 204 No Content

---

### POST /api/auth/logout-all

| Property | Value |
|---|---|
| **Purpose** | Invalidate all sessions |
| **Authentication** | Bearer token |

**Response**: 204 No Content

---

### GET /api/auth/verify-email?token={token}

| Property | Value |
|---|---|
| **Purpose** | Verify email address |
| **Authentication** | None (token-based) |

**Response** (200): `{ "data": { "message": "Email verified successfully" } }`

**Errors**: 400 (invalid/expired token)

---

### POST /api/auth/resend-verification

| Property | Value |
|---|---|
| **Purpose** | Resend verification email |
| **Authentication** | None |
| **Rate Limit** | 3/hour per email |

**Request**: `{ "email": "user@example.com" }`

**Response**: 200 (always, prevents enumeration)

---

### POST /api/auth/forgot-password

| Property | Value |
|---|---|
| **Purpose** | Request password reset email |
| **Authentication** | None |
| **Rate Limit** | 3/hour per email |

**Request**: `{ "email": "user@example.com" }`

**Response**: 200 (always, prevents enumeration)

---

### POST /api/auth/reset-password

| Property | Value |
|---|---|
| **Purpose** | Reset password with token |
| **Authentication** | None (token-based) |

**Request**: `{ "token": "abc...", "newPassword": "NewSecureP@ss1" }`

**Response**: 200

**Errors**: 400 (invalid/expired token, weak password)

---

## User APIs

### GET /api/users/me

| Property | Value |
|---|---|
| **Purpose** | Get current user's profile |
| **Authentication** | Bearer token |
| **Authorization** | Authenticated |

**Response** (200):
```json
{
  "data": {
    "id": "uuid", "email": "user@example.com", "displayName": "John Doe",
    "status": "ACTIVE", "avatarUrl": "https://gravatar.com/...",
    "preferences": { "theme": "dark", "emailNotifications": true },
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### PATCH /api/users/me

| Property | Value |
|---|---|
| **Purpose** | Update current user's profile |
| **Authentication** | Bearer token |
| **Authorization** | Authenticated |

**Request**: `{ "displayName": "Jane Doe" }`

**Response** (200): Updated user profile

---

### PATCH /api/users/me/preferences

| Property | Value |
|---|---|
| **Purpose** | Update user preferences |
| **Authentication** | Bearer token |

**Request**: `{ "theme": "light", "emailNotifications": false }`

**Response** (200): Updated user profile

---

## Workspace APIs

### POST /api/workspaces

| Property | Value |
|---|---|
| **Purpose** | Create a workspace |
| **Authentication** | Bearer token |
| **Authorization** | Authenticated (ACTIVE status) |
| **Events** | `WorkspaceCreated` |

**Request**: `{ "name": "My Workspace", "description": "Optional description" }`

**Response** (201):
```json
{
  "data": {
    "id": "uuid", "name": "My Workspace", "slug": "my-workspace",
    "description": "...", "ownerId": "uuid",
    "createdAt": "...", "updatedAt": "..."
  }
}
```

---

### GET /api/workspaces

| Property | Value |
|---|---|
| **Purpose** | List user's workspaces |
| **Authentication** | Bearer token |

**Response** (200): Array of workspace summaries

---

### GET /api/workspaces/{workspaceId}

| Property | Value |
|---|---|
| **Purpose** | Get workspace details |
| **Authorization** | VIEWER+ |

---

### PATCH /api/workspaces/{workspaceId}

| Property | Value |
|---|---|
| **Purpose** | Update workspace |
| **Authorization** | ADMIN+ |
| **Events** | Workspace cache invalidated |

---

### DELETE /api/workspaces/{workspaceId}

| Property | Value |
|---|---|
| **Purpose** | Delete workspace |
| **Authorization** | OWNER |

---

### GET /api/workspaces/{workspaceId}/members

| Property | Value |
|---|---|
| **Purpose** | List workspace members |
| **Authorization** | VIEWER+ |

**Response** (200):
```json
{
  "data": [
    { "id": "uuid", "userId": "uuid", "displayName": "...", "email": "...",
      "avatarUrl": "...", "role": "ADMIN", "joinedAt": "..." }
  ]
}
```

---

### DELETE /api/workspaces/{workspaceId}/members/{userId}

| Property | Value |
|---|---|
| **Purpose** | Remove member from workspace |
| **Authorization** | ADMIN+ (cannot remove OWNER) |
| **Events** | `MemberRemoved` |

---

### PATCH /api/workspaces/{workspaceId}/members/{userId}

| Property | Value |
|---|---|
| **Purpose** | Update member role |
| **Authorization** | ADMIN+ (cannot promote above own role) |
| **Events** | `MemberRoleChanged` |

**Request**: `{ "role": "ADMIN" }`

---

### POST /api/workspaces/{workspaceId}/invitations

| Property | Value |
|---|---|
| **Purpose** | Invite user to workspace |
| **Authorization** | ADMIN+ |
| **Events** | `MemberInvited` |

**Request**: `{ "email": "newuser@example.com", "role": "MEMBER" }`

**Response** (201): Invitation details

---

### POST /api/invitations/{token}/accept

| Property | Value |
|---|---|
| **Purpose** | Accept workspace invitation |
| **Authentication** | Bearer token |
| **Authorization** | Email must match |
| **Events** | `InvitationAccepted` |

---

### DELETE /api/workspaces/{workspaceId}/invitations/{invitationId}

| Property | Value |
|---|---|
| **Purpose** | Revoke invitation |
| **Authorization** | ADMIN+ |

---

### POST /api/workspaces/{workspaceId}/transfer-ownership

| Property | Value |
|---|---|
| **Purpose** | Transfer workspace ownership |
| **Authorization** | OWNER |
| **Events** | `OwnershipTransferred` |

**Request**: `{ "newOwnerId": "uuid" }`

---

## Board APIs

### POST /api/workspaces/{workspaceId}/boards

| Property | Value |
|---|---|
| **Purpose** | Create board with default columns |
| **Authorization** | MEMBER+ |
| **Events** | `BoardCreated` |

**Request**: `{ "name": "Sprint Board", "description": "..." }`

**Response** (201): Board with columns

---

### GET /api/workspaces/{workspaceId}/boards

| Property | Value |
|---|---|
| **Purpose** | List workspace boards |
| **Authorization** | VIEWER+ |
| **Query Params** | `includeArchived` (boolean, default false) |

---

### GET /api/boards/{boardId}

| Property | Value |
|---|---|
| **Purpose** | Get board with columns and tasks |
| **Authorization** | VIEWER+ |
| **Performance** | Target < 500ms |

**Response** (200):
```json
{
  "data": {
    "id": "uuid", "name": "Sprint Board", "workspaceId": "uuid",
    "archived": false, "version": 3,
    "columns": [
      {
        "id": "col-uuid", "name": "To Do", "position": "U", "taskLimit": null,
        "tasks": [
          {
            "id": "task-uuid", "identifier": "SF-42", "title": "...",
            "priority": "HIGH", "status": "OPEN", "position": "a",
            "assignees": [{ "id": "uuid", "displayName": "...", "avatarUrl": "..." }],
            "labels": [{ "id": "uuid", "name": "Bug", "color": "#ef4444" }],
            "commentCount": 3, "dueDate": "2024-02-01",
            "createdAt": "...", "updatedAt": "..."
          }
        ]
      }
    ]
  }
}
```

---

### PATCH /api/boards/{boardId}

| Property | Value |
|---|---|
| **Authorization** | MEMBER+ |
| **Idempotent** | Yes (version check) |

**Request**: `{ "name": "Updated Board", "version": 3 }`

---

### POST /api/boards/{boardId}/archive

| Property | Value |
|---|---|
| **Authorization** | ADMIN+ |
| **Events** | `BoardArchived` |

---

### POST /api/boards/{boardId}/columns

| Property | Value |
|---|---|
| **Purpose** | Add column to board |
| **Authorization** | MEMBER+ |
| **Events** | `ColumnCreated` |

**Request**: `{ "name": "Review", "taskLimit": 5 }`

---

### PATCH /api/columns/{columnId}

| Property | Value |
|---|---|
| **Authorization** | MEMBER+ |

---

### DELETE /api/columns/{columnId}

| Property | Value |
|---|---|
| **Authorization** | MEMBER+ |
| **Constraint** | Column must be empty (no non-archived tasks) |

---

### PATCH /api/columns/{columnId}/reorder

| Property | Value |
|---|---|
| **Purpose** | Move column to new position |
| **Authorization** | MEMBER+ |
| **Events** | `ColumnReordered` |

**Request**: `{ "afterColumnId": "uuid" }` (null = move to start)

---

## Task APIs

### POST /api/columns/{columnId}/tasks

| Property | Value |
|---|---|
| **Purpose** | Create task in column |
| **Authorization** | MEMBER+ |
| **Events** | `TaskCreated` |

**Request**:
```json
{
  "title": "Implement authentication",
  "description": "Add JWT-based auth...",
  "priority": "HIGH",
  "dueDate": "2024-02-01",
  "assigneeIds": ["uuid"],
  "labelIds": ["uuid"]
}
```

---

### GET /api/tasks/{taskId}

| Property | Value |
|---|---|
| **Authorization** | VIEWER+ |

**Response** (200): Full task details including assignees, labels, comment count, activity summary

---

### PATCH /api/tasks/{taskId}

| Property | Value |
|---|---|
| **Authorization** | MEMBER+ |
| **Idempotent** | Yes (version check) |
| **Events** | `TaskUpdated` |

**Request**: `{ "title": "Updated title", "priority": "URGENT", "version": 5 }`

---

### POST /api/tasks/{taskId}/move

| Property | Value |
|---|---|
| **Purpose** | Move task to different column/position |
| **Authorization** | MEMBER+ |
| **Events** | `TaskMoved` |

**Request**: `{ "targetColumnId": "uuid", "afterTaskId": "uuid", "version": 5 }`

---

### POST /api/tasks/{taskId}/archive

| Property | Value |
|---|---|
| **Authorization** | MEMBER+ (creator or ADMIN+) |
| **Events** | `TaskArchived` |

---

### POST /api/tasks/{taskId}/assign

| Property | Value |
|---|---|
| **Authorization** | MEMBER+ |
| **Events** | `TaskAssigned` |

**Request**: `{ "userId": "uuid" }`

---

### DELETE /api/tasks/{taskId}/assignees/{userId}

| Property | Value |
|---|---|
| **Authorization** | MEMBER+ |
| **Events** | `TaskUnassigned` |

---

### POST /api/tasks/{taskId}/labels/{labelId}

| Property | Value |
|---|---|
| **Purpose** | Add label to task |
| **Authorization** | MEMBER+ |

---

### DELETE /api/tasks/{taskId}/labels/{labelId}

| Property | Value |
|---|---|
| **Purpose** | Remove label from task |
| **Authorization** | MEMBER+ |

---

### GET /api/boards/{boardId}/tasks

| Property | Value |
|---|---|
| **Purpose** | List tasks for a board with filtering |
| **Authorization** | VIEWER+ |
| **Pagination** | Offset (default page=0, size=50) |
| **Filters** | `status`, `priority`, `assigneeId`, `labelId`, `archived` |
| **Sorting** | `createdAt`, `updatedAt`, `priority`, `dueDate`, `position` |

---

## Label APIs

### POST /api/workspaces/{workspaceId}/labels

| Property | Value |
|---|---|
| **Purpose** | Create workspace label |
| **Authorization** | MEMBER+ |

**Request**: `{ "name": "Bug", "color": "#ef4444" }`

---

### GET /api/workspaces/{workspaceId}/labels

| Property | Value |
|---|---|
| **Authorization** | VIEWER+ |

---

### DELETE /api/labels/{labelId}

| Property | Value |
|---|---|
| **Authorization** | ADMIN+ |

---

## Comment APIs

### POST /api/tasks/{taskId}/comments

| Property | Value |
|---|---|
| **Purpose** | Add comment to task |
| **Authorization** | MEMBER+ |
| **Events** | `CommentAdded`, `MentionCreated` (if mentions found) |

**Request**: `{ "content": "This looks good @JohnDoe. Let's ship it." }`

---

### GET /api/tasks/{taskId}/comments

| Property | Value |
|---|---|
| **Authorization** | VIEWER+ |
| **Pagination** | Cursor (by `created_at` DESC) |

---

### PATCH /api/comments/{commentId}

| Property | Value |
|---|---|
| **Authorization** | Author only, within 15 minutes |
| **Events** | `CommentUpdated` |

**Request**: `{ "content": "Updated content", "version": 1 }`

---

### DELETE /api/comments/{commentId}

| Property | Value |
|---|---|
| **Purpose** | Soft-delete comment |
| **Authorization** | Author or ADMIN+ |
| **Events** | `CommentDeleted` |

---

## Notification APIs

### GET /api/notifications

| Property | Value |
|---|---|
| **Purpose** | List current user's notifications |
| **Authorization** | Authenticated |
| **Pagination** | Cursor (by `created_at` DESC) |
| **Filters** | `read` (boolean) |

---

### GET /api/notifications/unread-count

| Property | Value |
|---|---|
| **Purpose** | Get unread notification count |
| **Authorization** | Authenticated |

**Response**: `{ "data": { "count": 5 } }`

---

### PATCH /api/notifications/{notificationId}/read

| Property | Value |
|---|---|
| **Purpose** | Mark notification as read |
| **Authorization** | Authenticated (owner only) |

---

### POST /api/notifications/mark-all-read

| Property | Value |
|---|---|
| **Purpose** | Mark all notifications as read |
| **Authorization** | Authenticated |

---

### DELETE /api/notifications/{notificationId}

| Property | Value |
|---|---|
| **Authorization** | Authenticated (owner only) |

---

## Search APIs

### GET /api/workspaces/{workspaceId}/search

| Property | Value |
|---|---|
| **Purpose** | Full-text search within workspace |
| **Authorization** | VIEWER+ |
| **Pagination** | Offset |
| **Performance** | Target < 500ms |

**Query Params**: `q` (search query), `type` (TASK, BOARD, COMMENT, LABEL, USER), `page`, `size`

**Response** (200):
```json
{
  "data": [
    {
      "type": "TASK",
      "id": "uuid",
      "title": "Implement authentication",
      "snippet": "...JWT-based <mark>auth</mark>entication...",
      "boardName": "Sprint Board",
      "identifier": "SF-42",
      "relevance": 0.95
    }
  ],
  "page": { "number": 0, "size": 20, "totalElements": 3, "totalPages": 1 }
}
```

---

## Activity APIs

### GET /api/tasks/{taskId}/activity

| Property | Value |
|---|---|
| **Purpose** | Get activity timeline for a task |
| **Authorization** | VIEWER+ |
| **Pagination** | Cursor (by `created_at` DESC) |

---

### GET /api/workspaces/{workspaceId}/activity

| Property | Value |
|---|---|
| **Purpose** | Get workspace-wide activity feed |
| **Authorization** | VIEWER+ |
| **Pagination** | Cursor (by `created_at` DESC) |

---

## Validation Layer

### Transport Validation (DTO)

Using Jakarta Bean Validation annotations on request DTOs:

```java
public record CreateTaskRequest(
    @NotBlank @Size(min = 2, max = 255) String title,
    @Size(max = 10000) String description,
    @ValidEnum(enumClass = Priority.class) String priority,
    LocalDate dueDate,
    @Size(max = 5) List<UUID> assigneeIds,
    @Size(max = 10) List<UUID> labelIds
) {}
```

### Business Validation (Service)

- Workspace membership verification
- Board archive status check
- Task archive status check
- Column existence validation
- Label workspace scope validation
- Comment edit window enforcement

### Database Validation (Constraints)

- UNIQUE constraints (email, slug, identifier)
- CHECK constraints (status, priority, role enums)
- NOT NULL constraints
- Foreign key constraints

---

## Filtering & Sorting

### Task Filtering

| Filter | Parameter | Type | Index Used |
|---|---|---|---|
| Status | `?status=OPEN` | Enum | `idx_tasks_status` |
| Priority | `?priority=HIGH` | Enum | `idx_tasks_priority` |
| Assignee | `?assigneeId=uuid` | UUID | Join on `task_assignments` |
| Label | `?labelId=uuid` | UUID | Join on `task_labels` |
| Archived | `?archived=false` | Boolean | `idx_tasks_board` |
| Due Date Range | `?dueBefore=2024-02-01&dueAfter=2024-01-01` | Date | `idx_tasks_due_date` |

### Task Sorting

| Sort | Parameter | Index |
|---|---|---|
| Created date | `?sort=createdAt,desc` | PK (UUID v7 is time-ordered) |
| Updated date | `?sort=updatedAt,desc` | `idx_tasks_board` |
| Priority | `?sort=priority,desc` | `idx_tasks_priority` |
| Due date | `?sort=dueDate,asc` | `idx_tasks_due_date` |
| Position | `?sort=position,asc` | `idx_tasks_column_position` |

Default sort: `position ASC` (board view), `updatedAt DESC` (list view).

---

## Global Exception Handling

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        // 400 — VALIDATION_ERROR with field details
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException ex) {
        // 404 — NOT_FOUND
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException ex) {
        // 403 — FORBIDDEN
    }

    @ExceptionHandler(OptimisticLockingFailureException.class)
    public ResponseEntity<ErrorResponse> handleConflict(OptimisticLockingFailureException ex) {
        // 409 — CONFLICT
    }

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ErrorResponse> handleBusiness(BusinessException ex) {
        // 400/409/422 — based on exception subclass
    }

    @ExceptionHandler(RateLimitExceededException.class)
    public ResponseEntity<ErrorResponse> handleRateLimit(RateLimitExceededException ex) {
        // 429 — RATE_LIMITED with Retry-After header
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleUnexpected(Exception ex) {
        // 500 — INTERNAL_ERROR (log full stack trace; return generic message)
    }
}
```
