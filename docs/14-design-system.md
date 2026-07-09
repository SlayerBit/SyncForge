# SyncForge — Design System

## Design Philosophy

SyncForge's visual identity is **functional minimalism** — every element serves a purpose, every space is intentional, and the interface recedes to let the user's content take center stage.

**Principles**:
1. **Restrained** — Neutral palette with focused color accents; no decorative elements
2. **Dense** — High information density without feeling cluttered
3. **Fast** — Interface responds instantly; loading states are smooth, not jarring
4. **Consistent** — Same patterns everywhere; learn once, use everywhere
5. **Accessible** — Meets WCAG 2.1 AA; works for everyone

**Inspiration**: Linear's density and speed, Notion's structure, GitHub's information hierarchy, Raycast's keyboard-first interaction.

**Not**: Glassmorphism, heavy gradients, oversized rounded corners, decorative animations, generic dashboards.

---

## Typography

**Font**: `Inter` — clean, modern, optimized for UI at small sizes. Load from Google Fonts with `display=swap`.

| Token | Size | Weight | Line Height | Usage |
|---|---|---|---|---|
| `text-xs` | 11px | 400 | 16px | Metadata, timestamps, badges |
| `text-sm` | 13px | 400 | 20px | Secondary text, descriptions |
| `text-base` | 14px | 400 | 22px | Body text, inputs, buttons |
| `text-lg` | 16px | 500 | 24px | Section headings, card titles |
| `text-xl` | 18px | 600 | 28px | Page section titles |
| `text-2xl` | 24px | 600 | 32px | Page titles |
| `text-3xl` | 30px | 700 | 36px | Hero headings (auth pages only) |

**Monospace**: `JetBrains Mono` — for task identifiers (e.g., `SF-42`) and code.

---

## Color System

### Dark Mode (Default)

| Token | Hex | Usage |
|---|---|---|
| `--bg-primary` | `#09090b` | Page background |
| `--bg-secondary` | `#111113` | Card/panel background |
| `--bg-tertiary` | `#1a1a1f` | Elevated surfaces, hover states |
| `--bg-hover` | `#222228` | Interactive hover |
| `--border-default` | `#27272a` | Default borders |
| `--border-subtle` | `#1e1e22` | Subtle dividers |
| `--text-primary` | `#fafafa` | Primary text |
| `--text-secondary` | `#a1a1aa` | Secondary text, placeholders |
| `--text-tertiary` | `#71717a` | Tertiary text, disabled |
| `--accent-primary` | `#6366f1` | Primary actions (indigo) |
| `--accent-primary-hover` | `#818cf8` | Primary hover |
| `--accent-primary-subtle` | `#6366f120` | Primary backgrounds (20% opacity) |
| `--success` | `#22c55e` | Success states |
| `--success-subtle` | `#22c55e20` | Success backgrounds |
| `--warning` | `#f59e0b` | Warning states |
| `--warning-subtle` | `#f59e0b20` | Warning backgrounds |
| `--danger` | `#ef4444` | Destructive actions, errors |
| `--danger-subtle` | `#ef444420` | Error backgrounds |
| `--info` | `#3b82f6` | Information, links |

### Light Mode

| Token | Hex | Usage |
|---|---|---|
| `--bg-primary` | `#ffffff` | Page background |
| `--bg-secondary` | `#f9fafb` | Card/panel background |
| `--bg-tertiary` | `#f3f4f6` | Elevated surfaces |
| `--bg-hover` | `#e5e7eb` | Interactive hover |
| `--border-default` | `#e5e7eb` | Default borders |
| `--border-subtle` | `#f3f4f6` | Subtle dividers |
| `--text-primary` | `#111827` | Primary text |
| `--text-secondary` | `#6b7280` | Secondary text |
| `--text-tertiary` | `#9ca3af` | Tertiary text |
| `--accent-primary` | `#4f46e5` | Primary actions |

### Priority Colors

| Priority | Color | Hex |
|---|---|---|
| Urgent | Red | `#ef4444` |
| High | Orange | `#f97316` |
| Medium | Yellow | `#eab308` |
| Low | Blue | `#3b82f6` |
| None | Gray | `#71717a` |

### Status Colors

| Status | Color | Hex |
|---|---|---|
| Open | Gray | `#a1a1aa` |
| In Progress | Blue | `#3b82f6` |
| Done | Green | `#22c55e` |
| Archived | Dim gray | `#52525b` |

### Label Palette

Preset colors for workspace labels (12 options):

```
#ef4444  Red        #f97316  Orange     #eab308  Yellow
#22c55e  Green      #06b6d4  Cyan       #3b82f6  Blue
#8b5cf6  Violet     #ec4899  Pink       #f43f5e  Rose
#14b8a6  Teal       #84cc16  Lime       #a855f7  Purple
```

---

## Spacing & Layout

### Spacing Scale

| Token | Value | Usage |
|---|---|---|
| `space-0.5` | 2px | Tight gaps |
| `space-1` | 4px | Icon padding, dense lists |
| `space-1.5` | 6px | Compact padding |
| `space-2` | 8px | Default padding, gaps |
| `space-3` | 12px | Card padding, input padding |
| `space-4` | 16px | Section spacing |
| `space-5` | 20px | Group spacing |
| `space-6` | 24px | Page section spacing |
| `space-8` | 32px | Major section breaks |

### Border Radius

| Token | Value | Usage |
|---|---|---|
| `rounded-sm` | 4px | Badges, small chips |
| `rounded-md` | 6px | Buttons, inputs, cards |
| `rounded-lg` | 8px | Dialogs, panels |
| `rounded-full` | 9999px | Avatars, status indicators |

### Elevation (Shadows)

| Token | Value | Usage |
|---|---|---|
| `shadow-sm` | `0 1px 2px rgba(0,0,0,0.3)` | Cards, dropdowns |
| `shadow-md` | `0 4px 12px rgba(0,0,0,0.4)` | Dialogs, popovers |
| `shadow-lg` | `0 8px 24px rgba(0,0,0,0.5)` | Command palette, modals |

### Layout

- **Sidebar width**: 240px (collapsible to 48px)
- **Max content width**: 1200px
- **Board column width**: 280px (fixed)
- **Task detail panel**: 480px (slide-over from right)
- **Breakpoints**: `sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`

---

## Component Library

### Buttons

| Variant | Usage | Style |
|---|---|---|
| `primary` | Main actions (Create, Save) | Solid accent background |
| `secondary` | Secondary actions | Subtle background, border |
| `ghost` | Tertiary actions, toolbar | No background; hover highlight |
| `danger` | Destructive actions (Delete) | Red background |
| `link` | Navigation, inline actions | No background; underline on hover |

**Sizes**: `sm` (28px), `md` (32px), `lg` (36px)

**States**: Default, Hover, Active, Disabled, Loading (spinner replaces text)

**Accessibility**: Focus ring (2px offset, accent color); `aria-disabled` when loading.

### Inputs

| Variant | Usage |
|---|---|
| `default` | Standard text input |
| `search` | Search with icon prefix |
| `textarea` | Multi-line (comments, descriptions) |

**States**: Default, Focused, Error, Disabled

**Accessibility**: Associated `<label>`, `aria-invalid`, `aria-describedby` for errors.

### Avatar

- **Sizes**: `xs` (20px), `sm` (24px), `md` (32px), `lg` (40px), `xl` (64px)
- **Source**: Gravatar URL with size parameter
- **Fallback**: User initials on colored background (derived from display name hash)
- **Presence indicator**: Small colored dot (green/yellow/gray) on bottom-right

### TaskCard

The primary interactive element on the board.

```
┌─────────────────────────────────┐
│ SF-42  [Bug] [UI]               │  ← Identifier + Labels (chips)
│ Implement authentication flow   │  ← Title (truncated to 2 lines)
│                                 │
│ 🔴 Urgent     📅 Feb 1         │  ← Priority + Due date
│ 👤 👤  💬 3                    │  ← Assignee avatars + comment count
└─────────────────────────────────┘
```

**Interaction**: Click to open task detail panel. Drag to reorder or move between columns.

**States**: Default, Hover (elevated shadow), Dragging (opacity 0.5, shadow), Selected (accent border).

### Column

```
┌─────────────────┐
│ To Do (3)    + ⋯│  ← Column name + task count + add + menu
├─────────────────┤
│ [TaskCard]      │
│ [TaskCard]      │
│ [TaskCard]      │
│                 │
│  + Add task     │  ← Add task button (ghost)
└─────────────────┘
```

### Dialog / Modal

- Centered overlay with backdrop blur
- Close on Escape key
- Close on backdrop click
- Focus trapped inside dialog
- `aria-labelledby` and `aria-describedby`
- Sizes: `sm` (400px), `md` (500px), `lg` (640px)

### Command Palette

Activated with `Cmd+K` (Mac) / `Ctrl+K` (Windows).

```
┌──────────────────────────────────────┐
│ 🔍 Type a command...                │
├──────────────────────────────────────┤
│ 📋 Tasks                            │
│    SF-42 Implement authentication   │
│    SF-43 Design database schema     │
│ 📁 Boards                           │
│    Sprint Board                     │
│    Backlog                          │
│ ⚡ Actions                          │
│    Create new task                  │
│    Create new board                 │
│    Toggle dark mode                 │
└──────────────────────────────────────┘
```

### Toast Notifications

- Position: bottom-right
- Auto-dismiss: 4 seconds (configurable)
- Types: success (green), error (red), warning (yellow), info (blue)
- Stack: max 3 visible; queue additional
- Close on click or dismiss button

### Loading Skeletons

Pulsing placeholder elements that match the shape of the content they replace:
- Task cards: Rectangle with shimmer
- Board columns: Column header + 3 card skeletons
- User list: Avatar circle + text lines
- Navigation: Sidebar items with shimmer

### Empty States

Each view has a dedicated empty state with:
- Illustration or icon (Lucide, 48px, muted color)
- Heading: "No tasks yet"
- Description: "Create your first task to get started"
- CTA button: "Create Task"

### Error States

- **Network error**: "Unable to connect. Check your internet connection." [Retry]
- **Not found**: "This page doesn't exist." [Go Home]
- **Permission denied**: "You don't have access to this resource." [Go Back]
- **Server error**: "Something went wrong. We're looking into it." [Retry]

### Context Menu

Right-click on cards, columns, or sidebar items:
- Copy link
- Edit
- Archive
- Delete
- Move to...
- Assign to...

### Sidebar Navigation

```
┌────────────────────┐
│  ⚡ SyncForge       │  ← Logo + name
│                    │
│  Workspace ▾       │  ← Workspace switcher
│                    │
│  📊 Dashboard       │
│  📋 Boards          │
│    Sprint Board    │
│    Backlog         │
│  👥 Members         │
│  ⚙️ Settings        │
│                    │
│  ─────────────     │
│  🔔 Notifications 5│  ← Badge count
│  👤 Profile         │
└────────────────────┘
```

### Breadcrumbs

```
Workspace Name > Board Name > SF-42
```

Clickable segments for navigation context.

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Cmd/Ctrl + K` | Open command palette |
| `Cmd/Ctrl + /` | Toggle sidebar |
| `Cmd/Ctrl + N` | New task |
| `Cmd/Ctrl + B` | New board |
| `Escape` | Close panel/dialog/command palette |
| `?` | Show keyboard shortcuts |
| `N` | New task (when no input focused) |
| `↑ / ↓` | Navigate lists |
| `Enter` | Select/open item |
| `Tab` | Next focusable element |

---

## Responsive Behavior

| Breakpoint | Layout |
|---|---|
| `≥ 1024px` | Full layout: sidebar + board + task panel |
| `768px – 1023px` | Collapsed sidebar; board scrolls horizontally; task panel as overlay |
| `< 768px` | No sidebar (hamburger menu); single column view; bottom navigation |

### Mobile Adaptations
- Horizontal scroll for board columns (touch-friendly)
- Bottom sheet for task details (instead of side panel)
- Pull-to-refresh on board view
- Simplified toolbar

---

## Animations (Framer Motion)

Only used where they improve usability:

| Animation | Duration | Easing | Purpose |
|---|---|---|---|
| Page transitions | 150ms | `ease-out` | Smooth navigation |
| Dialog open/close | 200ms | `ease-out` / `ease-in` | Focus context |
| Task panel slide | 200ms | `ease-out` | Spatial awareness |
| Drag & drop | 100ms | `ease-out` | Position feedback |
| Toast enter/exit | 200ms | `spring` | Attention without disruption |
| Skeleton pulse | 1.5s loop | `ease-in-out` | Loading indication |

**Reduced motion**: All animations respect `prefers-reduced-motion: reduce`. When enabled, transitions are instant (0ms).

---

## Dark Mode Implementation

```typescript
// hooks/useTheme.ts
export function useTheme() {
  const { theme, setTheme } = useUIStore();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.classList.toggle('light', theme === 'light');
  }, [theme]);

  return { theme, setTheme, toggle: () => setTheme(theme === 'dark' ? 'light' : 'dark') };
}
```

CSS variables change based on the `.dark` / `.light` class on `<html>`. Tailwind's `dark:` variant handles component-level overrides.
