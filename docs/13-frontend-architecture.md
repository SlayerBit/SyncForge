# SyncForge — Frontend Architecture

## Philosophy

The frontend is a **single-page application** (SPA) that serves as the interface for the SyncForge backend. It should feel fast, professional, minimal, and carefully crafted — inspired by Linear, Notion, and GitHub but with its own identity.

**Design principles**:
- Speed over spectacle — instant UI feedback, optimistic updates
- Clarity over cleverness — obvious navigation, predictable behavior
- Density without clutter — information-rich but visually organized
- Keyboard-first — power users should rarely need the mouse
- Dark mode as default — with light mode support

---

## Technology Decisions

| Technology | Role | Why |
|---|---|---|
| **React 18** | UI framework | Component model, ecosystem, hiring pool |
| **TypeScript 5** | Type safety | Catches errors at compile time; self-documenting |
| **Vite 5** | Build tool | Fast HMR, modern ESM, excellent DX |
| **React Router v6** | Routing | Standard; supports nested layouts and protected routes |
| **TanStack Query v5** | Server state | Caching, deduplication, background refetch, optimistic updates |
| **Zustand** | Client state | Minimal boilerplate; no providers; TypeScript-native |
| **React Hook Form** | Forms | Performant (uncontrolled); minimal re-renders |
| **Zod** | Validation | TypeScript-first; integrates with React Hook Form |
| **Tailwind CSS 3** | Styling | Utility-first; consistent design tokens; purges unused CSS |
| **shadcn/ui** | Components | Unstyled primitives (Radix); full customization control |
| **dnd-kit** | Drag & drop | Modern, accessible, performant; sensor-based architecture |
| **Framer Motion** | Animation | Minimal use — only for meaningful transitions |
| **Lucide Icons** | Icons | Tree-shakeable; consistent style |

---

## Folder Structure

```
src/
├── app/                          # Application entry, providers, router
│   ├── App.tsx
│   ├── Router.tsx
│   └── Providers.tsx
│
├── features/                     # Feature modules (mirrors backend)
│   ├── auth/
│   │   ├── api/                  # API functions (TanStack Query)
│   │   │   ├── auth.api.ts
│   │   │   └── auth.queries.ts
│   │   ├── components/           # Feature-specific components
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   └── ForgotPasswordForm.tsx
│   │   ├── hooks/                # Feature-specific hooks
│   │   │   └── useAuth.ts
│   │   ├── pages/                # Route pages
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   └── ForgotPasswordPage.tsx
│   │   ├── types/                # TypeScript types
│   │   │   └── auth.types.ts
│   │   └── utils/                # Feature-specific utilities
│   │
│   ├── workspace/
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   └── types/
│   │
│   ├── board/
│   │   ├── api/
│   │   ├── components/
│   │   │   ├── BoardView.tsx
│   │   │   ├── Column.tsx
│   │   │   ├── TaskCard.tsx
│   │   │   └── TaskDetailPanel.tsx
│   │   ├── hooks/
│   │   │   ├── useBoardData.ts
│   │   │   └── useDragAndDrop.ts
│   │   ├── pages/
│   │   └── types/
│   │
│   ├── task/
│   ├── comment/
│   ├── notification/
│   ├── search/
│   ├── presence/
│   └── settings/
│
├── components/                   # Shared UI components
│   ├── ui/                       # shadcn/ui components (auto-generated)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   ├── layout/                   # Layout components
│   │   ├── AppLayout.tsx
│   │   ├── AuthLayout.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── CommandPalette.tsx
│   └── shared/                   # Shared business components
│       ├── Avatar.tsx
│       ├── UserPresence.tsx
│       ├── EmptyState.tsx
│       ├── LoadingSkeleton.tsx
│       └── ErrorBoundary.tsx
│
├── hooks/                        # Global hooks
│   ├── useWebSocket.ts
│   ├── usePresence.ts
│   ├── useKeyboardShortcut.ts
│   └── useTheme.ts
│
├── lib/                          # Utilities and configuration
│   ├── api-client.ts             # Axios instance with interceptors
│   ├── ws-client.ts              # WebSocket client
│   ├── queryClient.ts            # TanStack Query config
│   └── utils.ts                  # cn() and helpers
│
├── stores/                       # Zustand stores (client state only)
│   ├── auth.store.ts
│   ├── ui.store.ts
│   └── presence.store.ts
│
├── types/                        # Global TypeScript types
│   ├── api.types.ts              # API response types
│   └── common.types.ts
│
└── styles/
    └── globals.css               # Tailwind directives + custom CSS
```

---

## Routing

```typescript
const router = createBrowserRouter([
  // Public routes
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/reset-password', element: <ResetPasswordPage /> },
      { path: '/verify-email', element: <VerifyEmailPage /> },
    ],
  },
  // Protected routes
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '/workspaces/:workspaceSlug', element: <WorkspacePage /> },
          { path: '/workspaces/:workspaceSlug/boards/:boardId', element: <BoardPage /> },
          { path: '/workspaces/:workspaceSlug/settings', element: <WorkspaceSettingsPage /> },
          { path: '/workspaces/:workspaceSlug/members', element: <MembersPage /> },
          { path: '/notifications', element: <NotificationsPage /> },
          { path: '/settings', element: <UserSettingsPage /> },
        ],
      },
    ],
  },
  // Invitation acceptance (public but with auth check)
  { path: '/invitations/:token', element: <InvitationPage /> },
  // 404
  { path: '*', element: <NotFoundPage /> },
]);
```

### Protected Route

```typescript
function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}
```

---

## State Management

### Server State (TanStack Query)

All data from the backend is managed by TanStack Query. This includes:
- User profile
- Workspaces, members, invitations
- Boards, columns, tasks
- Comments
- Notifications
- Search results
- Activity logs

**Query key convention**:
```typescript
const queryKeys = {
  workspaces: ['workspaces'] as const,
  workspace: (id: string) => ['workspaces', id] as const,
  boards: (workspaceId: string) => ['workspaces', workspaceId, 'boards'] as const,
  board: (boardId: string) => ['boards', boardId] as const,
  tasks: (boardId: string) => ['boards', boardId, 'tasks'] as const,
  task: (taskId: string) => ['tasks', taskId] as const,
  comments: (taskId: string) => ['tasks', taskId, 'comments'] as const,
  notifications: ['notifications'] as const,
  unreadCount: ['notifications', 'unread-count'] as const,
};
```

**Stale time configuration**:
| Query | Stale Time | Justification |
|---|---|---|
| User profile | 5 minutes | Rarely changes |
| Workspace list | 2 minutes | Low change frequency |
| Board data | 30 seconds | Moderate change frequency; WebSocket handles real-time |
| Notifications | 1 minute | WebSocket provides real-time updates |
| Search results | 0 (always fresh) | Query-dependent |

### Client State (Zustand)

Client-only state not from the server:

```typescript
// auth.store.ts — Authentication state
interface AuthStore {
  accessToken: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
}

// ui.store.ts — UI state
interface UIStore {
  sidebarOpen: boolean;
  commandPaletteOpen: boolean;
  theme: 'light' | 'dark';
  activeTaskId: string | null;
  toggleSidebar: () => void;
  toggleCommandPalette: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

// presence.store.ts — Local presence cache
interface PresenceStore {
  presenceMap: Map<string, PresenceStatus>;
  updatePresence: (userId: string, status: PresenceStatus) => void;
}
```

---

## API Layer

### API Client

```typescript
// lib/api-client.ts
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach JWT
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.headers['X-Request-ID'] = crypto.randomUUID();
  return config;
});

// Response interceptor: refresh token on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && error.response?.data?.error === 'TOKEN_EXPIRED') {
      const newToken = await refreshAccessToken();
      if (newToken) {
        error.config.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(error.config);
      }
    }
    return Promise.reject(error);
  }
);
```

### Query Example

```typescript
// features/board/api/board.queries.ts
export function useBoardQuery(boardId: string) {
  return useQuery({
    queryKey: queryKeys.board(boardId),
    queryFn: () => boardApi.getBoard(boardId),
    staleTime: 30_000,
  });
}
```

### Optimistic Update Example

```typescript
export function useMoveTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: taskApi.moveTask,
    onMutate: async ({ taskId, targetColumnId, afterTaskId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.board(boardId) });
      const previous = queryClient.getQueryData(queryKeys.board(boardId));

      // Optimistically update board state
      queryClient.setQueryData(queryKeys.board(boardId), (old) => {
        return moveTaskInBoard(old, taskId, targetColumnId, afterTaskId);
      });

      return { previous };
    },
    onError: (_err, _vars, context) => {
      // Revert on failure
      queryClient.setQueryData(queryKeys.board(boardId), context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.board(boardId) });
    },
  });
}
```

---

## WebSocket Integration

```typescript
// hooks/useWebSocket.ts
export function useWebSocket() {
  const { accessToken } = useAuthStore();
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocketManager>();

  useEffect(() => {
    if (!accessToken) return;

    const ws = new WebSocketManager();
    ws.connect(accessToken);
    wsRef.current = ws;

    return () => ws.disconnect();
  }, [accessToken]);

  return wsRef;
}

// hooks/useBoardSubscription.ts
export function useBoardSubscription(boardId: string) {
  const ws = useWebSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!ws.current || !boardId) return;

    ws.current.subscribeToBoard(boardId, (message) => {
      switch (message.type) {
        case 'TASK_CREATED':
        case 'TASK_UPDATED':
        case 'TASK_MOVED':
        case 'TASK_ARCHIVED':
          queryClient.invalidateQueries({ queryKey: queryKeys.board(boardId) });
          break;
        case 'COLUMN_CREATED':
        case 'COLUMN_REORDERED':
          queryClient.invalidateQueries({ queryKey: queryKeys.board(boardId) });
          break;
      }
    });

    return () => ws.current?.unsubscribeFromBoard(boardId);
  }, [boardId]);
}
```

---

## Drag & Drop (dnd-kit)

```typescript
// features/board/hooks/useDragAndDrop.ts
export function useBoardDragAndDrop(board: Board) {
  const moveTask = useMoveTask();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const taskId = active.id as string;
    const targetColumnId = over.data.current?.columnId;
    const afterTaskId = over.data.current?.afterTaskId;

    moveTask.mutate({ taskId, targetColumnId, afterTaskId, version: active.data.current?.version });
  };

  return { sensors, handleDragEnd };
}
```

---

## Form Handling

```typescript
// Zod schema
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

// Component
function LoginForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });
  const login = useLogin();

  const onSubmit = (data: LoginFormData) => login.mutate(data);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input {...register('email')} error={errors.email?.message} />
      <Input {...register('password')} type="password" error={errors.password?.message} />
      <Button type="submit" loading={isSubmitting}>Sign In</Button>
    </form>
  );
}
```

---

## Error Handling

### Error Boundary

```typescript
function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ReactErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) => (
        <ErrorState
          title="Something went wrong"
          message={error.message}
          onRetry={resetErrorBoundary}
        />
      )}
    >
      {children}
    </ReactErrorBoundary>
  );
}
```

### Toast Notifications

Use `sonner` (via shadcn/ui) for toast notifications:
- **Success**: "Task created successfully"
- **Error**: "Failed to update task. Please try again."
- **Conflict**: "This task was modified by another user. Refreshing..."
- **Network**: "Connection lost. Reconnecting..."

---

## Accessibility

- All interactive elements are keyboard accessible
- Focus management on modal open/close and route transitions
- `aria-label` on icon-only buttons
- Skip-to-content link
- Proper heading hierarchy (h1 → h2 → h3)
- Color contrast ratio ≥ 4.5:1 (WCAG AA)
- Screen reader announcements for dynamic content (task moved, notification received)
- Reduced motion support: `prefers-reduced-motion` media query

---

## Performance

- **Code splitting**: Route-based lazy loading with `React.lazy()` and `Suspense`
- **Bundle optimization**: Vite tree-shaking; only import used shadcn/ui components
- **Image optimization**: Gravatar URLs with size parameter (`?s=40` for thumbnails, `?s=200` for profile)
- **Virtualization**: For long lists (notifications, activity), use `@tanstack/react-virtual`
- **Debouncing**: Search input debounced at 300ms
- **Memoization**: `React.memo` on TaskCard and Column components to prevent unnecessary re-renders during drag
