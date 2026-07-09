# SyncForge — Testing Strategy

## Testing Philosophy

Follow the **Testing Pyramid**: many unit tests, fewer integration tests, minimal E2E tests. Every test should be fast, deterministic, and provide clear failure messages.

**Coverage target**: 80%+ line coverage for business logic (services, validators, mappers). Not a vanity metric — focus on testing behavior, not lines.

---

## Unit Tests

### What to Test
- Service layer business logic
- Validators and password strength checker
- MapStruct mappers (generated code correctness)
- Utility classes (FractionalIndex, SlugUtils, etc.)
- Domain event construction
- Permission evaluation logic
- DTO validation rules

### Framework
- **JUnit 5** with `@ExtendWith(MockitoExtension.class)`
- **Mockito** for dependency mocking
- **AssertJ** for fluent assertions

### Conventions
- Test class: `{ClassName}Test.java` in same package under `src/test/java`
- Test method naming: `should{ExpectedBehavior}_when{Condition}`
- Arrange-Act-Assert structure
- Each test tests one behavior

### Example

```java
@ExtendWith(MockitoExtension.class)
class TaskServiceImplTest {

    @Mock private TaskRepository taskRepository;
    @Mock private BoardService boardService;
    @Mock private ApplicationEventPublisher eventPublisher;
    @InjectMocks private TaskServiceImpl taskService;

    @Test
    void shouldCreateTask_whenValidRequest() {
        // Arrange
        var request = new CreateTaskRequest("Implement auth", null, "HIGH", null, List.of(), List.of());
        when(boardService.incrementTaskSequence(boardId)).thenReturn(42);
        when(taskRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        // Act
        var result = taskService.createTask(columnId, request);

        // Assert
        assertThat(result.getTitle()).isEqualTo("Implement auth");
        assertThat(result.getIdentifier()).isEqualTo("SF-42");
        verify(eventPublisher).publishEvent(any(TaskCreated.class));
    }

    @Test
    void shouldThrow_whenTaskArchived() {
        when(taskRepository.findById(taskId)).thenReturn(Optional.of(archivedTask));
        assertThatThrownBy(() -> taskService.updateTask(taskId, request))
            .isInstanceOf(BusinessException.class)
            .hasMessage("Cannot update an archived task");
    }
}
```

### What to Mock
- Repositories (database access)
- External services (email)
- Redis template
- Event publisher (verify events are published)
- Other module services (when testing cross-module interaction)

### What NOT to Mock
- The class under test
- Simple value objects and DTOs
- Mappers (test them separately)

---

## Integration Tests

### What to Test
- Controller → Service → Repository full stack
- API request/response contract
- Authentication and authorization flows
- Transaction behavior
- Redis caching behavior
- WebSocket message delivery
- Database constraint enforcement

### Framework
- **Spring Boot Test** with `@SpringBootTest`
- **Testcontainers** for PostgreSQL and Redis
- **MockMvc** for HTTP testing
- **TestRestTemplate** for full integration tests

### Testcontainers Setup

```java
@Testcontainers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
abstract class IntegrationTestBase {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
        .withDatabaseName("syncforge_test")
        .withUsername("test")
        .withPassword("test");

    @Container
    static GenericContainer<?> redis = new GenericContainer<>("redis:7-alpine")
        .withExposedPorts(6379);

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.data.redis.host", redis::getHost);
        registry.add("spring.data.redis.port", () -> redis.getMappedPort(6379));
    }
}
```

### Controller Integration Test Example

```java
class AuthControllerIT extends IntegrationTestBase {

    @Autowired private MockMvc mockMvc;

    @Test
    void shouldRegisterUser_andReturnCreated() throws Exception {
        var request = """
            { "email": "new@example.com", "password": "SecureP@ss1", "displayName": "Test User" }
            """;

        mockMvc.perform(post("/api/auth/register")
                .contentType(APPLICATION_JSON)
                .content(request))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.data.email").value("new@example.com"))
            .andExpect(jsonPath("$.data.status").value("PENDING"));
    }

    @Test
    void shouldReject_whenEmailAlreadyExists() throws Exception {
        // Register first
        registerUser("existing@example.com");

        // Try duplicate
        mockMvc.perform(post("/api/auth/register")
                .contentType(APPLICATION_JSON)
                .content("""
                    { "email": "existing@example.com", "password": "SecureP@ss1", "displayName": "Test" }
                    """))
            .andExpect(status().isConflict());
    }
}
```

### Repository Test Example

```java
@DataJpaTest
@Testcontainers
class TaskRepositoryTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Test
    void shouldFindTasksByBoardId_excludingArchived() {
        // Setup test data
        var tasks = taskRepository.findByBoardIdAndArchivedFalse(boardId, Pageable.ofSize(50));
        assertThat(tasks).hasSize(3);
        assertThat(tasks).noneMatch(Task::isArchived);
    }
}
```

---

## Security Tests

### What to Test
- Unauthenticated access returns 401
- Insufficient role returns 403
- JWT validation (expired, invalid signature, blacklisted)
- Refresh token rotation and replay detection
- Rate limiting
- CORS headers
- Password validation rules

### Example

```java
class SecurityIT extends IntegrationTestBase {

    @Test
    void shouldReturn401_whenNoToken() throws Exception {
        mockMvc.perform(get("/api/workspaces"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldReturn403_whenViewerTriesToCreate() throws Exception {
        var viewerToken = loginAsViewer();
        mockMvc.perform(post("/api/workspaces/" + workspaceId + "/boards")
                .header("Authorization", "Bearer " + viewerToken)
                .contentType(APPLICATION_JSON)
                .content("""{ "name": "New Board" }"""))
            .andExpect(status().isForbidden());
    }

    @Test
    void shouldDetectRefreshTokenReplay() throws Exception {
        var loginResponse = login();
        var refreshToken = loginResponse.getRefreshToken();

        // Use refresh token once (valid)
        var newTokens = refresh(refreshToken);
        assertThat(newTokens.getAccessToken()).isNotNull();

        // Replay original refresh token (attack detected)
        mockMvc.perform(post("/api/auth/refresh")
                .contentType(APPLICATION_JSON)
                .content("""{ "refreshToken": "%s" }""".formatted(refreshToken)))
            .andExpect(status().isUnauthorized());

        // Even the new token should be revoked (entire family)
        mockMvc.perform(post("/api/auth/refresh")
                .contentType(APPLICATION_JSON)
                .content("""{ "refreshToken": "%s" }""".formatted(newTokens.getRefreshToken())))
            .andExpect(status().isUnauthorized());
    }
}
```

---

## Test Data

### Test Fixtures

Create a `TestDataFactory` utility for consistent test data:

```java
public class TestDataFactory {
    public static User createUser(String email) { ... }
    public static Workspace createWorkspace(User owner) { ... }
    public static Board createBoard(Workspace workspace) { ... }
    public static Task createTask(BoardColumn column) { ... }
    public static String validPassword() { return "SecureP@ss1"; }
}
```

### Database Cleanup
- Use `@Transactional` on test methods for automatic rollback (unit/integration)
- Use `@Sql(scripts = "cleanup.sql", executionPhase = AFTER_TEST_METHOD)` for non-transactional tests
- Testcontainers create fresh databases per test class

---

## Test Organization

```
src/test/java/com/syncforge/
├── module/
│   ├── auth/
│   │   ├── service/
│   │   │   └── AuthServiceImplTest.java       # Unit
│   │   ├── controller/
│   │   │   └── AuthControllerIT.java          # Integration
│   │   └── repository/
│   │       └── RefreshTokenRepositoryIT.java  # Repository
│   ├── task/
│   │   ├── service/
│   │   │   └── TaskServiceImplTest.java
│   │   └── controller/
│   │       └── TaskControllerIT.java
│   └── ...
├── security/
│   └── SecurityIT.java                        # Security integration tests
├── common/
│   ├── FractionalIndexTest.java               # Unit
│   └── SlugUtilsTest.java                     # Unit
└── support/
    ├── IntegrationTestBase.java               # Shared Testcontainers setup
    └── TestDataFactory.java                   # Test data builders
```

---

## CI Execution

- **Unit tests**: Run on every push (`mvn test -pl '!integration-tests'`)
- **Integration tests**: Run on every PR (`mvn verify` with Testcontainers)
- **Timeout**: 10 minutes max for full test suite
- **Parallelization**: Unit tests run in parallel; integration tests run sequentially (shared containers)
