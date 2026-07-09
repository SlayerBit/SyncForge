# SyncForge — Screen Specifications

## Login Page

### Purpose
Authenticate existing users.

### Layout
- Centered card (400px) on dark background
- SyncForge logo + tagline at top
- Email input, password input, submit button
- "Forgot password?" link below form
- "Don't have an account? Sign up" link at bottom

### Components
- `AuthLayout` wrapper
- `Input` (email, password)
- `Button` (primary, full-width)
- `Link` (forgot password, register)

### States
- **Default**: Empty form, focused on email input
- **Loading**: Button shows spinner; inputs disabled
- **Error**: Red border on invalid fields; error message below each field
- **Rate limited**: Form disabled; countdown timer displayed
- **Account locked**: Error banner: "Account temporarily locked"

### Interactions
- `Enter` submits form
- `Tab` moves between fields
- Password visibility toggle (eye icon)

### Accessibility
- `aria-label` on password visibility toggle
- Error messages linked via `aria-describedby`
- Focus auto-set to email input on page load

### Responsive
- Full-width form below 640px
- Card centered with padding on larger screens

---

## Register Page

### Purpose
Create a new user account.

### Layout
Same centered card as login with additional fields.

### Components
- `Input` (display name, email, password, confirm password)
- Password strength indicator (bar with 4 segments)
- `Button` (primary, "Create Account")
- `Link` ("Already have an account? Sign in")

### States
- **Default**: Empty form
- **Loading**: Button spinner
- **Validation errors**: Inline field errors
- **Success**: Redirect to "Check your email" confirmation page

### Business Rules Enforced
- Real-time password strength feedback
- Email format validation (client-side)
- Display name 2-100 characters

---

## Forgot Password Page

### Purpose
Initiate password reset.

### Layout
- Centered card
- Email input
- Submit button
- Back to login link

### States
- **Default**: Email input focused
- **Success**: "If an account exists, we've sent a reset link" (always shows success)
- **Rate limited**: "Please wait before requesting again"

---

## Email Verification Page

### Purpose
Confirm email address via token link.

### Layout
- Centered card
- Spinner while verifying
- Success or error message

### States
- **Verifying**: Spinner + "Verifying your email..."
- **Success**: Checkmark + "Email verified! Redirecting to login..."
- **Error**: "This link has expired. Resend verification email."
- **Already verified**: "Email already verified. Proceed to login."

---

## Dashboard Page

### Purpose
Landing page after login. Overview of the user's workspaces and recent activity.

### Layout
```
┌──────────────────────────────────────────────────┐
│ [Sidebar]  │  Dashboard                          │
│            │                                     │
│            │  Your Workspaces                    │
│            │  ┌──────────┐ ┌──────────┐          │
│            │  │ Workspace│ │ Workspace│ [+ New]  │
│            │  │ 3 boards │ │ 5 boards │          │
│            │  └──────────┘ └──────────┘          │
│            │                                     │
│            │  Recent Tasks                       │
│            │  ┌─────────────────────────┐        │
│            │  │ SF-42 Implement auth    │        │
│            │  │ SF-41 Design DB schema  │        │
│            │  └─────────────────────────┘        │
│            │                                     │
│            │  Assigned to You (5)                 │
│            │  ┌─────────────────────────┐        │
│            │  │ SF-40 Fix login bug     │        │
│            │  └─────────────────────────┘        │
└──────────────────────────────────────────────────┘
```

### Components
- `AppLayout` with `Sidebar`
- Workspace cards (clickable)
- Task list items (clickable → navigate to board + open task)
- "Create Workspace" button

### States
- **Loading**: Skeleton cards and list items
- **Empty**: "Create your first workspace" empty state
- **Error**: Error banner with retry

---

## Workspace Page

### Purpose
Workspace overview with boards list.

### Layout
```
┌──────────────────────────────────────────────────┐
│ [Sidebar]  │  Workspace Name                     │
│            │  3 members · 5 boards               │
│            │                                     │
│            │  Boards                    [+ New]   │
│            │  ┌──────────┐ ┌──────────┐          │
│            │  │ Sprint   │ │ Backlog  │          │
│            │  │ 12 tasks │ │ 8 tasks  │          │
│            │  └──────────┘ └──────────┘          │
│            │                                     │
│            │  Recent Activity                    │
│            │  • John created task SF-42          │
│            │  • Jane moved SF-41 to Done         │
└──────────────────────────────────────────────────┘
```

### Components
- Board cards with task count
- Activity feed (latest 10)
- Workspace header with member avatars
- "New Board" dialog

### States
- **Loading**: Skeleton boards and activity
- **Empty boards**: "Create your first board" CTA
- **Archived boards**: Filtered out by default; toggle to show

---

## Board Page (Main View)

### Purpose
Kanban board — the core experience.

### Layout
```
┌──────────────────────────────────────────────────────────────┐
│ [Sidebar] │ ← Workspace  Board Name  🔍 Filter  👥 3 online  │
│           │──────────────────────────────────────────────────│
│           │ To Do (3)     │ In Progress (2) │ Done (5)       │
│           │ ┌───────────┐ │ ┌───────────┐   │ ┌───────────┐ │
│           │ │ Task Card │ │ │ Task Card │   │ │ Task Card │ │
│           │ └───────────┘ │ └───────────┘   │ └───────────┘ │
│           │ ┌───────────┐ │ ┌───────────┐   │ ┌───────────┐ │
│           │ │ Task Card │ │ │ Task Card │   │ │ Task Card │ │
│           │ └───────────┘ │                 │ └───────────┘ │
│           │ ┌───────────┐ │                 │ ┌───────────┐ │
│           │ │ Task Card │ │                 │ │ Task Card │ │
│           │ └───────────┘ │                 │ └───────────┘ │
│           │               │                 │ ┌───────────┐ │
│           │ + Add task    │ + Add task       │ │ Task Card │ │
│           │               │                 │ └───────────┘ │
│           │               │                 │ + Add task    │
│           │               │                 │ + Add column  │
└──────────────────────────────────────────────────────────────┘
```

### Header Bar
- Back arrow to workspace
- Board name (editable inline for MEMBER+)
- Filter button (opens dropdown with status, priority, assignee, label filters)
- Active filters shown as chips (removable)
- Online presence avatars (members viewing this board)
- Board menu (archive, settings)

### Columns
- Column header: name, task count, WIP limit warning, add task button, column menu
- Scrollable task list
- Drop zone indicator during drag
- "Add column" button after last column

### Task Cards
- Click → opens Task Detail Panel
- Drag → move between columns or reorder
- Show: identifier, title, labels (chips), priority indicator, due date, assignee avatars, comment count

### States
- **Loading**: Column skeletons (3 columns with card skeletons)
- **Empty board**: "Add your first task" prompt in the first column
- **Dragging**: Task card at 80% opacity with shadow; drop zone highlighted
- **Filtering**: Non-matching cards hidden with smooth animation; filter chips in header

### Keyboard
- `N` — New task in first column
- `F` — Open filter dropdown
- `Escape` — Clear filters, close panels
- Arrow keys — Navigate between cards (when card focused)

### Responsive
- Columns scroll horizontally on smaller screens
- Task detail panel overlays on medium screens
- Single-column stacked view on mobile

---

## Task Detail Panel

### Purpose
View and edit task details in a slide-over panel.

### Layout
```
┌─────────────────────────────────────────┐
│ ← Close                     ⋯ Menu     │
│                                         │
│ SF-42                                   │
│ Implement authentication flow           │ ← Editable title
│                                         │
│ Status: In Progress ▾                   │
│ Priority: 🔴 Urgent ▾                  │
│ Assignees: 👤 John, 👤 Jane  [+]       │
│ Labels: [Bug] [Auth]  [+]              │
│ Due Date: Feb 1, 2024  📅              │
│                                         │
│ ─────────────────────────────           │
│                                         │
│ Description                             │
│ ┌─────────────────────────────────┐     │
│ │ Add JWT-based authentication... │     │ ← Editable textarea
│ └─────────────────────────────────┘     │
│                                         │
│ ─────────────────────────────           │
│                                         │
│ Activity     Comments                   │ ← Tab switcher
│                                         │
│ 💬 John Doe · 2 hours ago              │
│ This looks good @Jane. Ship it.         │
│                                         │
│ 📝 Jane moved task to In Progress       │
│ 3 hours ago                             │
│                                         │
│ ─────────────────────────────           │
│                                         │
│ ┌─────────────────────────────────┐     │
│ │ Add a comment...           Send │     │
│ └─────────────────────────────────┘     │
└─────────────────────────────────────────┘
```

### Components
- Slide-over panel (480px from right)
- Inline editable title
- Status dropdown, priority dropdown
- Assignee list with add button (opens member selector)
- Label chips with add button (opens label selector)
- Date picker for due date
- Rich text description (markdown-supported textarea)
- Tab switcher: Activity timeline / Comments
- Comment input with @mention autocomplete

### Interactions
- Click title to edit inline
- Click status/priority to change via dropdown
- `Cmd+Enter` to submit comment
- `@` in comment input triggers mention autocomplete
- `Escape` closes panel (if no unsaved changes)

### States
- **Loading**: Skeleton panel
- **View mode**: Read-only for VIEWER role
- **Edit mode**: MEMBER+ can edit fields inline
- **Comment loading**: Skeleton comments while fetching
- **No comments**: "No comments yet. Start the conversation."

---

## Notifications Page

### Purpose
Full notification inbox.

### Layout
```
┌──────────────────────────────────────────┐
│ [Sidebar]  │  Notifications              │
│            │  [All] [Unread]  Mark All ✓  │
│            │                             │
│            │  Today                      │
│            │  ┌─────────────────────┐    │
│            │  │ 🔵 You were assigned│    │
│            │  │   to SF-42          │    │
│            │  │   2 hours ago       │    │
│            │  └─────────────────────┘    │
│            │  ┌─────────────────────┐    │
│            │  │ ○  @Jane mentioned  │    │
│            │  │   you in SF-41      │    │
│            │  │   3 hours ago       │    │
│            │  └─────────────────────┘    │
│            │                             │
│            │  Yesterday                  │
│            │  ...                        │
└──────────────────────────────────────────┘
```

### Interactions
- Click notification → navigate to referenced entity
- Click blue dot → mark as read
- "Mark all read" bulk action
- Swipe to delete (mobile)
- Infinite scroll with cursor pagination

### States
- **Loading**: Skeleton notifications
- **Empty**: "You're all caught up!" with checkmark illustration
- **Error**: "Failed to load notifications" with retry

---

## Global Search

### Purpose
Search across tasks, boards, comments, labels, and users within a workspace.

### Layout
Accessed via Command Palette (`Cmd+K`) or search icon in header.

```
┌──────────────────────────────────────┐
│ 🔍 Search tasks, boards, comments...│
├──────────────────────────────────────┤
│ Recent                               │
│   implement auth                     │
│   database design                    │
│                                      │
│ ─ After typing ─                     │
│                                      │
│ Tasks (3)                            │
│   SF-42 Implement authentication     │
│   SF-45 Auth middleware              │
│                                      │
│ Comments (1)                         │
│   "...JWT auth flow..." on SF-42     │
│                                      │
│ Boards (1)                           │
│   Auth Sprint Board                  │
└──────────────────────────────────────┘
```

### Interactions
- Type to search (300ms debounce)
- `↑/↓` to navigate results
- `Enter` to select
- `Escape` to close
- Results grouped by type with headers

### States
- **Initial**: Recent searches
- **Searching**: Loading spinner
- **Results**: Grouped by type
- **No results**: "No results found for '{query}'"

---

## User Settings Page

### Purpose
Update profile and preferences.

### Layout
```
┌────────────────────────────────────────┐
│ [Sidebar]  │  Settings                 │
│            │                           │
│            │  Profile                  │
│            │  👤 Gravatar (linked)     │
│            │  Display Name: [John Doe] │
│            │  Email: user@example.com  │
│            │  [Save Changes]           │
│            │                           │
│            │  ─────────────            │
│            │                           │
│            │  Preferences              │
│            │  Theme: [Dark ▾]          │
│            │  Notifications: [On ▾]    │
│            │                           │
│            │  ─────────────            │
│            │                           │
│            │  Security                 │
│            │  [Change Password]        │
│            │  [Log out all devices]    │
│            │                           │
│            │  ─────────────            │
│            │                           │
│            │  Danger Zone              │
│            │  [Deactivate Account]     │
└────────────────────────────────────────┘
```

---

## Workspace Settings Page

### Purpose
Manage workspace name, description, members, and invitations.

### Layout
Tabbed settings: General, Members, Invitations, Danger Zone.

### General Tab
- Workspace name (editable)
- Workspace slug (read-only; auto-generated)
- Description (editable textarea)
- Save button

### Members Tab
- Member list with avatar, name, email, role badge
- Role dropdown (for ADMIN+)
- Remove button (for ADMIN+, except OWNER)
- "Invite Member" button

### Invitations Tab
- Pending invitation list
- Invite form (email + role selector)
- Revoke button on pending invitations

### Danger Zone Tab
- Transfer ownership (OWNER only)
- Delete workspace (OWNER only, with confirmation dialog)

---

## Workspace Members Page

### Purpose
View and manage workspace members (same as Members tab but as a standalone page for easier navigation).

### Layout
- Member list with search/filter
- Online presence indicators
- Role management (for ADMIN+)
- Invite button

---

## Common UI Patterns

### Confirmation Dialogs
Used for destructive actions (delete, archive, remove member):

```
┌─────────────────────────────────┐
│ Delete this task?               │
│                                 │
│ This action cannot be undone.   │
│ Task SF-42 will be permanently  │
│ removed.                        │
│                                 │
│        [Cancel]  [Delete]       │
└─────────────────────────────────┘
```

### Inline Editing
- Click to activate edit mode
- `Enter` to save
- `Escape` to cancel
- Auto-save after 2 seconds of inactivity (for description)

### Loading Strategy
1. Show skeleton immediately
2. Fade in real content
3. Cache previous data (TanStack Query) — show stale while revalidating
4. Error state with retry if fetch fails
