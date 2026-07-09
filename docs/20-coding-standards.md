# SyncForge — Coding Standards

## Java Backend Standards

### Package Organization

```
com.syncforge.module.{feature}.{layer}
```

| Layer | Purpose | Example |
|---|---|---|
| `controller` | HTTP endpoints | `TaskController` |
| `service` | Business logic interfaces | `TaskService` |
| `service.impl` | Business logic implementations | `TaskServiceImpl` |
| `repository` | Data access | `TaskRepository` |
| `domain` | JPA entities | `Task` |
| `dto` | Request/response objects | `CreateTaskRequest`, `TaskDto` |
| `mapper` | Object mapping | `TaskMapper` |
| `event` | Domain events | `TaskCreated` |
| `exception` | Module exceptions | `TaskNotFoundException` |
| `config` | Module configuration | `TaskConfig` |
| `validator` | Custom validators | `TaskValidator` |

### Naming Conventions

| Element | Convention | Example |
|---|---|---|
| Entity | Singular noun | `Task`, `Board`, `User` |
| DTO (response) | `{Entity}Dto` | `TaskDto`, `BoardDto` |
| DTO (create) | `Create{Entity}Request` | `CreateTaskRequest` |
| DTO (update) | `Update{Entity}Request` | `UpdateTaskRequest` |
| Service interface | `{Entity}Service` | `TaskService` |
| Service impl | `{Entity}ServiceImpl` | `TaskServiceImpl` |
| Repository | `{Entity}Repository` | `TaskRepository` |
| Controller | `{Entity}Controller` | `TaskController` |
| Mapper | `{Entity}Mapper` | `TaskMapper` |
| Exception | `{Description}Exception` | `TaskNotFoundException` |
| Event | `{Entity}{Action}` (past tense) | `TaskCreated`, `TaskMoved` |
| Constant | `UPPER_SNAKE_CASE` | `MAX_LABELS_PER_TASK` |
| Database table | `snake_case` (plural) | `tasks`, `board_columns` |
| Database column | `snake_case` | `created_at`, `workspace_id` |
| JSON field | `camelCase` | `createdAt`, `workspaceId` |
| URL path | `kebab-case` (plural) | `/api/workspaces`, `/api/board-columns` |
| Environment var | `UPPER_SNAKE_CASE` | `SYNCFORGE_JWT_SECRET` |

### Entity Conventions

```java
@Entity
@Table(name = "tasks")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)  // JPA requires no-arg constructor
public class Task extends BaseEntity {

    @Id
    private UUID id;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Priority priority = Priority.NONE;

    @Version
    private Integer version;

    // Constructor for creation (not Lombok @AllArgsConstructor)
    public Task(UUID id, String title, Priority priority, UUID columnId, String position) {
        this.id = id;
        this.title = title;
        this.priority = priority;
        // ...
    }

    // Business methods
    public void archive() {
        this.archived = true;
        this.status = TaskStatus.ARCHIVED;
    }

    public void moveTo(UUID columnId, String position) {
        this.columnId = columnId;
        this.position = position;
    }
}
```

**Rules**:
- Use `@Getter` but NOT `@Setter` — mutations via business methods
- `@NoArgsConstructor(access = AccessLevel.PROTECTED)` for JPA
- Explicit constructors for creation
- Business logic in entity methods where it belongs to the entity's state
- No Lombok `@Builder` on entities (too easy to create invalid state)

### DTO Conventions

```java
// Use Java records for immutable DTOs
public record CreateTaskRequest(
    @NotBlank @Size(min = 2, max = 255) String title,
    @Size(max = 10000) String description,
    String priority,
    LocalDate dueDate,
    @Size(max = 5) List<UUID> assigneeIds,
    @Size(max = 10) List<UUID> labelIds
) {}

public record TaskDto(
    UUID id,
    String identifier,
    String title,
    String description,
    String priority,
    String status,
    String position,
    LocalDate dueDate,
    boolean archived,
    int version,
    List<UserSummaryDto> assignees,
    List<LabelDto> labels,
    int commentCount,
    Instant createdAt,
    Instant updatedAt
) {}
```

**Rules**:
- Use Java `record` for all DTOs (immutable, concise)
- Jakarta validation annotations on request DTOs
- No validation annotations on response DTOs
- Never expose entity objects through API — always map to DTOs

### Service Conventions

```java
// Interface
public interface TaskService {
    TaskDto createTask(UUID columnId, CreateTaskRequest request);
    TaskDto getTask(UUID taskId);
    TaskDto updateTask(UUID taskId, UpdateTaskRequest request);
}

// Implementation
@Service
@RequiredArgsConstructor  // Constructor injection
@Slf4j
public class TaskServiceImpl implements TaskService {

    private final TaskRepository taskRepository;
    private final BoardService boardService;
    private final TaskMapper taskMapper;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    @Transactional
    public TaskDto createTask(UUID columnId, CreateTaskRequest request) {
        log.info("Creating task in column: {}", columnId);
        // Business logic here
    }

    @Override
    @Transactional(readOnly = true)
    public TaskDto getTask(UUID taskId) {
        return taskRepository.findById(taskId)
            .map(taskMapper::toDto)
            .orElseThrow(() -> new TaskNotFoundException(taskId));
    }
}
```

**Rules**:
- Constructor injection via `@RequiredArgsConstructor` (NO field injection)
- `@Transactional` on write methods
- `@Transactional(readOnly = true)` on read methods
- Log business operations at INFO level
- Never catch and swallow exceptions silently
- Business logic in service layer, NOT in controllers

### Controller Conventions

```java
@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
@Tag(name = "Tasks", description = "Task management")
public class TaskController {

    private final TaskService taskService;
    private final WorkspaceAuthorizationService authService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create a task")
    public ApiResponse<TaskDto> createTask(
            @PathVariable UUID columnId,
            @Valid @RequestBody CreateTaskRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {

        authService.checkPermission(principal.getId(), workspaceId, WorkspaceRole.MEMBER);
        TaskDto task = taskService.createTask(columnId, request);
        return ApiResponse.created(task);
    }
}
```

**Rules**:
- Controllers handle only HTTP concerns
- Authorization checks in controller (before service call)
- `@Valid` on request bodies
- Use `ApiResponse<T>` wrapper for consistent responses
- OpenAPI annotations on every endpoint
- No business logic in controllers

### Repository Conventions

```java
public interface TaskRepository extends JpaRepository<Task, UUID> {

    // Custom queries use method naming convention
    List<Task> findByBoardIdAndArchivedFalseOrderByPositionAsc(UUID boardId);

    // Complex queries use @Query
    @Query("SELECT t FROM Task t WHERE t.boardId = :boardId AND t.archived = false")
    Page<Task> findActiveTasks(@Param("boardId") UUID boardId, Pageable pageable);

    // Modifying queries
    @Modifying
    @Query("UPDATE Task t SET t.archived = true WHERE t.id = :id")
    int archiveTask(@Param("id") UUID id);
}
```

**Rules**:
- Extend `JpaRepository<Entity, UUID>`
- Method naming convention for simple queries
- `@Query` for complex queries
- `@Modifying` for update/delete queries
- Never return entities through module boundaries — services map to DTOs

### Mapper Conventions

```java
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.ERROR)
public interface TaskMapper {

    TaskDto toDto(Task task);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "version", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Task toEntity(CreateTaskRequest request);
}
```

**Rules**:
- `componentModel = "spring"` for Spring integration
- `unmappedTargetPolicy = ReportingPolicy.ERROR` to catch unmapped fields at compile time
- Explicit `@Mapping(target = ..., ignore = true)` for auto-generated fields

### Exception Conventions

```java
// Base exception
public abstract class BusinessException extends RuntimeException {
    private final String errorCode;
    private final HttpStatus status;

    protected BusinessException(String message, String errorCode, HttpStatus status) {
        super(message);
        this.errorCode = errorCode;
        this.status = status;
    }
}

// Module-specific exceptions
public class TaskNotFoundException extends BusinessException {
    public TaskNotFoundException(UUID taskId) {
        super("Task not found: " + taskId, "TASK_NOT_FOUND", HttpStatus.NOT_FOUND);
    }
}

public class TaskArchivedException extends BusinessException {
    public TaskArchivedException(UUID taskId) {
        super("Task is archived: " + taskId, "TASK_ARCHIVED", HttpStatus.BAD_REQUEST);
    }
}
```

### Logging Conventions

```java
// Use SLF4J parameterized logging
log.info("Task created: id={}, identifier={}, boardId={}", task.getId(), task.getIdentifier(), boardId);

// NEVER string concatenation
log.info("Task created: " + task.getId());  // ❌ BAD — always evaluates

// Include context
log.warn("Failed to create notification: userId={}, type={}", userId, type, exception);
```

---

## TypeScript Frontend Standards

### Component Conventions

```typescript
// Functional components with TypeScript props
interface TaskCardProps {
  task: TaskDto;
  onDragStart?: () => void;
  className?: string;
}

export function TaskCard({ task, onDragStart, className }: TaskCardProps) {
  return (
    <div className={cn('rounded-md border p-3', className)}>
      {/* ... */}
    </div>
  );
}
```

**Rules**:
- Named exports (not default exports)
- Props interface defined above component
- `className` prop for style customization
- Use `cn()` utility for class merging

### File Naming

| Element | Convention | Example |
|---|---|---|
| Component | `PascalCase.tsx` | `TaskCard.tsx` |
| Hook | `camelCase.ts` | `useBoardData.ts` |
| API | `kebab-case.api.ts` | `board.api.ts` |
| Types | `kebab-case.types.ts` | `board.types.ts` |
| Store | `kebab-case.store.ts` | `auth.store.ts` |
| Utility | `camelCase.ts` | `utils.ts` |

### Import Order

```typescript
// 1. React and framework
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

// 2. Third-party
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';

// 3. Internal shared
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// 4. Feature-internal
import { TaskCard } from './TaskCard';
import type { TaskDto } from './types';
```

---

## General Engineering Principles

### Favor
- Readable code over clever code
- Explicit over implicit
- Composition over inheritance
- Immutability by default
- Constructor injection
- Small, focused functions (< 30 lines)
- Early returns to reduce nesting
- Descriptive variable names

### Avoid
- Field injection (`@Autowired` on fields)
- Business logic in controllers
- Shared mutable state
- Circular dependencies
- Magic strings and magic numbers
- Premature abstraction
- God classes (> 300 lines)
- Deep inheritance hierarchies (> 2 levels)
- Comments that restate the code
- Commented-out code
