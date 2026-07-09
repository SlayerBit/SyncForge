# SyncForge — Appendix: Diagrams

## System Context Diagram

```mermaid
graph TB
    subgraph "SyncForge System"
        FE["React SPA<br/>(Frontend)"]
        BE["Spring Boot<br/>(Backend)"]
        PG["PostgreSQL 16<br/>(Primary DB)"]
        RD["Redis 7<br/>(Cache/Presence/Pub-Sub)"]
    end

    USER["User<br/>(Browser)"]
    SMTP["SMTP Server<br/>(Mailhog/Production)"]
    GRAV["Gravatar<br/>(Avatar Service)"]

    USER -->|HTTPS| FE
    FE -->|REST API| BE
    FE -->|WebSocket| BE
    BE --> PG
    BE --> RD
    BE -->|SMTP| SMTP
    FE -->|Image Request| GRAV
```

---

## Full Entity Relationship Diagram

```mermaid
erDiagram
    USERS {
        uuid id PK
        varchar email UK
        varchar password_hash
        varchar display_name
        varchar status
        jsonb preferences
        integer version
        timestamptz created_at
        timestamptz updated_at
    }

    WORKSPACES {
        uuid id PK
        varchar name
        varchar slug UK
        varchar description
        uuid owner_id FK
        integer version
        timestamptz created_at
        timestamptz updated_at
    }

    WORKSPACE_MEMBERS {
        uuid id PK
        uuid workspace_id FK
        uuid user_id FK
        varchar role
        timestamptz joined_at
    }

    WORKSPACE_INVITATIONS {
        uuid id PK
        uuid workspace_id FK
        varchar email
        varchar role
        varchar token_hash UK
        varchar status
        uuid invited_by FK
        timestamptz expires_at
        timestamptz created_at
    }

    BOARDS {
        uuid id PK
        uuid workspace_id FK
        varchar name
        varchar description
        varchar prefix
        integer task_sequence
        boolean archived
        integer version
        timestamptz created_at
        timestamptz updated_at
    }

    BOARD_COLUMNS {
        uuid id PK
        uuid board_id FK
        varchar name
        varchar position
        integer task_limit
        integer version
        timestamptz created_at
        timestamptz updated_at
    }

    TASKS {
        uuid id PK
        uuid column_id FK
        uuid board_id FK
        varchar title
        text description
        varchar priority
        varchar status
        varchar position
        varchar identifier
        uuid creator_id FK
        date due_date
        boolean archived
        integer version
        tsvector search_vector
        timestamptz created_at
        timestamptz updated_at
    }

    TASK_ASSIGNMENTS {
        uuid id PK
        uuid task_id FK
        uuid user_id FK
        timestamptz assigned_at
    }

    LABELS {
        uuid id PK
        uuid workspace_id FK
        varchar name
        varchar color
        timestamptz created_at
    }

    TASK_LABELS {
        uuid task_id PK_FK
        uuid label_id PK_FK
    }

    COMMENTS {
        uuid id PK
        uuid task_id FK
        uuid author_id FK
        text content
        boolean deleted
        integer version
        tsvector search_vector
        timestamptz created_at
        timestamptz updated_at
    }

    MENTIONS {
        uuid id PK
        uuid comment_id FK
        uuid mentioned_user_id FK
        timestamptz created_at
    }

    NOTIFICATIONS {
        uuid id PK
        uuid user_id FK
        varchar type
        varchar title
        text message
        varchar reference_type
        uuid reference_id
        boolean read
        timestamptz created_at
    }

    ACTIVITY_LOGS {
        uuid id PK
        uuid workspace_id FK
        uuid actor_id FK
        varchar entity_type
        uuid entity_id
        varchar action
        jsonb changes
        timestamptz created_at
    }

    REFRESH_TOKENS {
        uuid id PK
        uuid user_id FK
        varchar token_hash UK
        varchar family_id
        boolean used
        boolean revoked
        timestamptz expires_at
        timestamptz created_at
    }

    VERIFICATION_TOKENS {
        uuid id PK
        uuid user_id FK
        varchar token_hash UK
        varchar status
        timestamptz expires_at
        timestamptz created_at
    }

    PASSWORD_RESET_TOKENS {
        uuid id PK
        uuid user_id FK
        varchar token_hash UK
        varchar status
        timestamptz expires_at
        timestamptz created_at
    }

    USERS ||--o{ WORKSPACE_MEMBERS : "is member of"
    USERS ||--o{ WORKSPACES : "owns"
    USERS ||--o{ TASK_ASSIGNMENTS : "is assigned to"
    USERS ||--o{ COMMENTS : "authors"
    USERS ||--o{ MENTIONS : "is mentioned in"
    USERS ||--o{ NOTIFICATIONS : "receives"
    USERS ||--o{ ACTIVITY_LOGS : "performs"
    USERS ||--o{ REFRESH_TOKENS : "has"
    USERS ||--o{ VERIFICATION_TOKENS : "has"
    USERS ||--o{ PASSWORD_RESET_TOKENS : "has"

    WORKSPACES ||--o{ WORKSPACE_MEMBERS : "has"
    WORKSPACES ||--o{ WORKSPACE_INVITATIONS : "has"
    WORKSPACES ||--o{ BOARDS : "contains"
    WORKSPACES ||--o{ LABELS : "defines"
    WORKSPACES ||--o{ ACTIVITY_LOGS : "records"

    BOARDS ||--o{ BOARD_COLUMNS : "has"
    BOARDS ||--o{ TASKS : "contains"

    BOARD_COLUMNS ||--o{ TASKS : "contains"

    TASKS ||--o{ TASK_ASSIGNMENTS : "has"
    TASKS ||--o{ TASK_LABELS : "has"
    TASKS ||--o{ COMMENTS : "has"

    LABELS ||--o{ TASK_LABELS : "applied to"

    COMMENTS ||--o{ MENTIONS : "contains"
```

---

## Authentication Flow

```mermaid
graph TB
    subgraph "Login Flow"
        A[User submits credentials] --> B{Rate Limited?}
        B -->|Yes| C[429 Too Many Requests]
        B -->|No| D{User exists?}
        D -->|No| E[401 Invalid Credentials]
        D -->|Yes| F{Password correct?}
        F -->|No| G[Increment failure counter]
        G --> H{Account locked?}
        H -->|Yes| I[423 Locked]
        H -->|No| E
        F -->|Yes| J{Account status?}
        J -->|SUSPENDED/DEACTIVATED| K[403 Forbidden]
        J -->|ACTIVE| L[Generate JWT]
        L --> M[Generate Refresh Token]
        M --> N[Create Token Family]
        N --> O[200 OK + Tokens]
    end
```

---

## Request Lifecycle

```mermaid
graph LR
    subgraph "HTTP Request Pipeline"
        A[Client] --> B[CORS Filter]
        B --> C[Request Context Filter<br/>Set MDC, Request ID]
        C --> D[Rate Limit Filter]
        D --> E[Security Header Filter]
        E --> F[JWT Auth Filter<br/>Validate, Build Principal]
        F --> G[Controller<br/>Authorization Check]
        G --> H[Service<br/>Business Logic]
        H --> I[Repository<br/>Database Access]
        I --> J[Response<br/>DTO Mapping]
        J --> K[Domain Events<br/>After Commit]
        K --> L[Event Consumers<br/>Activity, Notification, WebSocket]
    end
```

---

## WebSocket Architecture

```mermaid
graph TB
    subgraph "Instance 1"
        C1["Client A"]
        C2["Client B"]
        WS1["WebSocket Handler"]
        REL1["Event Relay"]
    end

    subgraph "Instance 2"
        C3["Client C"]
        C4["Client D"]
        WS2["WebSocket Handler"]
        REL2["Event Relay"]
    end

    subgraph "Shared Infrastructure"
        RD["Redis Pub/Sub"]
        PG["PostgreSQL"]
    end

    C1 <-->|STOMP| WS1
    C2 <-->|STOMP| WS1
    C3 <-->|STOMP| WS2
    C4 <-->|STOMP| WS2

    REL1 <-->|Publish/Subscribe| RD
    REL2 <-->|Publish/Subscribe| RD

    WS1 -.->|Read/Write| PG
    WS2 -.->|Read/Write| PG
```

---

## Drag-and-Drop Flow

```mermaid
sequenceDiagram
    participant U as User
    participant UI as React UI
    participant API as REST API
    participant DB as PostgreSQL
    participant WS as WebSocket
    participant Other as Other Clients

    U->>UI: Drag task to new column
    UI->>UI: Optimistic update (move task locally)
    UI->>API: POST /tasks/{id}/move
    API->>API: Validate permissions
    API->>API: Calculate fractional index position
    API->>DB: UPDATE task (column_id, position, version+1)
    alt Success
        API-->>UI: 200 OK
        API->>WS: Publish TaskMoved event
        WS->>Other: Broadcast TASK_MOVED
    else Version Conflict
        API-->>UI: 409 Conflict
        UI->>UI: Revert optimistic update
        UI->>API: GET /boards/{id} (refresh state)
    end
```

---

## Cache-Aside Pattern

```mermaid
graph TB
    subgraph "Read Path"
        A[Service requests data] --> B{Cache hit?}
        B -->|Yes| C[Return cached data]
        B -->|No| D[Query PostgreSQL]
        D --> E[Store in Redis with TTL]
        E --> C
    end

    subgraph "Write Path"
        F[Service writes data] --> G[Update PostgreSQL]
        G --> H[Delete from Redis]
        H --> I[Next read repopulates cache]
    end
```

---

## Notification Pipeline

```mermaid
graph LR
    subgraph "Trigger Events"
        A1[TaskAssigned]
        A2[CommentAdded]
        A3[MentionCreated]
        A4[MemberInvited]
    end

    subgraph "Notification Module"
        B["NotificationEventConsumer<br/>@TransactionalEventListener"]
        C["NotificationService<br/>Create + Persist"]
        D["NotificationCreated Event"]
    end

    subgraph "Delivery"
        E["WebSocket Relay"]
        F["Redis Pub/Sub"]
        G["User's Browser"]
    end

    A1 & A2 & A3 & A4 --> B
    B --> C
    C --> D
    D --> E
    E --> F
    F --> G
```

---

## Domain Module Dependency Graph

```mermaid
graph TB
    AUTH["Auth"]
    USER["User"]
    WORKSPACE["Workspace"]
    BOARD["Board"]
    TASK["Task"]
    COMMENT["Comment"]
    LABEL["Label"]
    NOTIFICATION["Notification"]
    PRESENCE["Presence"]
    SEARCH["Search"]
    ACTIVITY["Activity"]

    AUTH --> USER
    WORKSPACE --> USER
    BOARD --> WORKSPACE
    TASK --> BOARD
    TASK --> USER
    TASK --> LABEL
    COMMENT --> TASK
    COMMENT --> USER
    LABEL --> WORKSPACE
    NOTIFICATION --> USER
    SEARCH --> TASK
    SEARCH --> BOARD
    SEARCH --> COMMENT
    ACTIVITY --> USER
    ACTIVITY --> WORKSPACE
    PRESENCE --> USER
    PRESENCE --> WORKSPACE
```

**Rule**: Dependencies flow downward. No circular dependencies allowed.

---

## Deployment Architecture

```mermaid
graph TB
    subgraph "Client"
        BROWSER["Browser"]
    end

    subgraph "Edge"
        LB["Load Balancer<br/>(Nginx / Cloud LB)"]
    end

    subgraph "Application Tier"
        APP1["SyncForge Instance 1<br/>:8080"]
        APP2["SyncForge Instance 2<br/>:8080"]
    end

    subgraph "Data Tier"
        PG["PostgreSQL 16<br/>(Primary)"]
        RD["Redis 7<br/>(Cache + Pub/Sub)"]
    end

    subgraph "Monitoring"
        PROM["Prometheus"]
        GRAF["Grafana"]
    end

    BROWSER -->|HTTPS| LB
    LB --> APP1
    LB --> APP2
    APP1 --> PG
    APP1 --> RD
    APP2 --> PG
    APP2 --> RD
    PROM -->|Scrape| APP1
    PROM -->|Scrape| APP2
    GRAF --> PROM
```
