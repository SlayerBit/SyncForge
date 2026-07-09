import React, { useState } from 'react'
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom'
import {
  LayoutGrid,
  Settings,
  Users,
  LogOut,
  FolderKanban,
  ChevronsUpDown,
  Plus,
  Compass,
  Bell,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { notificationApi } from '@/features/notification/api/notification.api'
import { useWorkspacesQuery } from '@/features/workspace/api/workspace.queries'
import { useWorkspaceBoardsQuery, useBoardQuery } from '@/features/board/api/board.queries'
import { useLogoutMutation } from '@/features/auth/api/auth.queries'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { Avatar } from '@/components/shared/Avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CreateWorkspaceDialog } from '@/features/workspace/components/CreateWorkspaceDialog'

export function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { workspaceId, boardId } = useParams<{ workspaceId: string; boardId: string }>()
  const { user } = useAuth()
  const logoutMutation = useLogoutMutation()

  const { data: workspaces } = useWorkspacesQuery()
  const { data: board } = useBoardQuery(boardId!)

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationApi.getUnreadCount(),
    refetchInterval: 15000,
  })

  const finalWorkspaceId = workspaceId || board?.workspaceId
  const activeWorkspace = workspaces?.find((w) => w.id === finalWorkspaceId)

  const { data: boards } = useWorkspaceBoardsQuery(finalWorkspaceId!, true)

  const [createWsOpen, setCreateWsOpen] = useState(false)

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => navigate('/login'),
    })
  }

  return (
    <aside className="w-64 bg-bg-secondary border-r border-border flex flex-col h-screen text-text-primary">
      {/* Workspace Switcher Header */}
      <div className="p-4 border-b border-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center justify-between w-full p-2 rounded-md hover:bg-bg-tertiary transition-colors border border-transparent hover:border-border text-xs text-left">
              <div className="flex items-center gap-2 truncate">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-accent-primary-subtle text-accent-primary font-bold">
                  {activeWorkspace ? activeWorkspace.name[0].toUpperCase() : '⚡'}
                </div>
                <span className="font-semibold truncate">
                  {activeWorkspace ? activeWorkspace.name : 'Select Workspace'}
                </span>
              </div>
              <ChevronsUpDown className="h-4 w-4 text-text-tertiary" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[220px] text-xs">
            {workspaces?.map((ws) => (
              <DropdownMenuItem
                key={ws.id}
                onClick={() => navigate(`/workspaces/${ws.id}`)}
                className="cursor-pointer"
              >
                {ws.name}
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem
              onClick={() => setCreateWsOpen(true)}
              className="cursor-pointer gap-2 border-t border-border mt-1 font-semibold text-accent-primary"
            >
              <Plus className="h-4 w-4" />
              New Workspace
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Main Navigation Links */}
      <div className="flex-1 overflow-y-auto p-3 space-y-6">
        <nav className="space-y-1">
          <Link to="/">
            <Button
              variant="ghost"
              size="sm"
              className={`w-full justify-start text-[11px] gap-2 ${
                location.pathname === '/' ? 'bg-bg-tertiary text-text-primary' : 'text-text-secondary'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
              Dashboard
            </Button>
          </Link>
          <Link to="/notifications">
            <Button
              variant="ghost"
              size="sm"
              className={`w-full justify-start text-[11px] gap-2 relative ${
                location.pathname === '/notifications' ? 'bg-bg-tertiary text-text-primary' : 'text-text-secondary'
              }`}
            >
              <Bell className="h-4 w-4" />
              <span>Notifications</span>
              {unreadCount > 0 && (
                <span className="absolute right-2 bg-accent-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </Button>
          </Link>
          <Link to="/settings">
            <Button
              variant="ghost"
              size="sm"
              className={`w-full justify-start text-[11px] gap-2 ${
                location.pathname === '/settings' ? 'bg-bg-tertiary text-text-primary' : 'text-text-secondary'
              }`}
            >
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </Link>
        </nav>

        {/* Boards List Section */}
        {finalWorkspaceId && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-2 text-[10px] font-bold text-text-tertiary uppercase tracking-wider">
              <span>Boards</span>
              <FolderKanban className="h-3.5 w-3.5" />
            </div>
            <nav className="space-y-0.5">
              {!boards || boards.length === 0 ? (
                <p className="text-[10px] text-text-tertiary italic px-2">No boards available</p>
              ) : (
                boards.map((b) => (
                  <Link key={b.id} to={`/boards/${b.id}`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`w-full justify-start text-[11px] font-normal pl-4 truncate ${
                        boardId === b.id ? 'bg-bg-tertiary text-text-primary font-semibold' : 'text-text-secondary'
                      }`}
                    >
                      {b.name}
                    </Button>
                  </Link>
                ))
              )}
            </nav>
          </div>
        )}

        {/* Workspace Management (Only visible if workspace context exists) */}
        {finalWorkspaceId && (
          <div className="space-y-2">
            <span className="px-2 text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">
              Management
            </span>
            <nav className="space-y-0.5">
              <Link to={`/workspaces/${finalWorkspaceId}/members`}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`w-full justify-start text-[11px] gap-2 ${
                    location.pathname.endsWith('/members') ? 'bg-bg-tertiary text-text-primary' : 'text-text-secondary'
                  }`}
                >
                  <Users className="h-4 w-4" />
                  Members directory
                </Button>
              </Link>
              <Link to={`/workspaces/${finalWorkspaceId}/settings`}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`w-full justify-start text-[11px] gap-2 ${
                    location.pathname.endsWith('/settings') ? 'bg-bg-tertiary text-text-primary' : 'text-text-secondary'
                  }`}
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Button>
              </Link>
            </nav>
          </div>
        )}
      </div>

      {/* User profile footer */}
      <div className="p-4 border-t border-border flex items-center justify-between bg-bg-tertiary/20">
        <div className="flex items-center gap-2 truncate">
          <Avatar displayName={user?.displayName || '?'} size="sm" />
          <div className="truncate">
            <p className="text-xs font-semibold truncate">{user?.displayName}</p>
            <p className="text-[10px] text-text-tertiary truncate">{user?.email}</p>
          </div>
        </div>
        <Button
          onClick={handleLogout}
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-text-tertiary hover:text-danger hover:bg-danger-subtle"
          title="Sign Out"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>

      <CreateWorkspaceDialog open={createWsOpen} onOpenChange={setCreateWsOpen} />
    </aside>
  )
}
export default Sidebar
