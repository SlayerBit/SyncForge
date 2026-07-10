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
  Bell,
  PanelLeftClose,
  ChevronDown,
  ChevronRight,
  ClipboardList
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
import { useUIStore } from '@/stores/ui.store'
import { cn } from '@/lib/utils'

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
  const [boardsCollapsed, setBoardsCollapsed] = useState(false)
  const [mgmtCollapsed, setMgmtCollapsed] = useState(false)
  
  const { sidebarOpen, toggleSidebar } = useUIStore()

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => navigate('/login'),
    })
  }

  return (
    <aside className={cn(
      "bg-bg-secondary border-r border-border flex flex-col h-screen text-text-primary transition-all duration-300 ease-in-out shrink-0 overflow-hidden select-none z-20",
      sidebarOpen ? "w-60 opacity-100" : "w-0 border-r-0 opacity-0"
    )}>
      {/* Workspace Switcher Header */}
      <div className="p-3 border-b border-border flex items-center justify-between gap-1 shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center justify-between flex-1 p-1.5 rounded-md hover:bg-bg-tertiary transition-colors border border-transparent hover:border-border text-xs text-left max-w-[170px]">
              <div className="flex items-center gap-2 truncate">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-accent-primary-subtle text-accent-primary font-bold text-[10px] border border-accent-primary/20">
                  {activeWorkspace ? activeWorkspace.name[0].toUpperCase() : 'S'}
                </div>
                <span className="font-semibold truncate">
                  {activeWorkspace ? activeWorkspace.name : 'Select Workspace'}
                </span>
              </div>
              <ChevronsUpDown className="h-3.5 w-3.5 text-text-tertiary shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[200px] text-xs">
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

        <button 
          onClick={toggleSidebar}
          className="p-1.5 rounded-md hover:bg-bg-tertiary text-text-secondary hover:text-text-primary transition-colors active:scale-95 shrink-0"
          title="Collapse Sidebar"
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>

      {/* Main Navigation Links */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-5 custom-scrollbar">
        <nav className="space-y-0.5">
          <Link to="/">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "w-full justify-start text-xs gap-2 px-2.5 h-8 font-normal transition-all rounded-md relative",
                location.pathname === '/' 
                  ? 'bg-bg-tertiary/75 text-text-primary font-medium border-l-2 border-accent-primary rounded-l-none' 
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Dashboard
            </Button>
          </Link>
          <Link to="/notifications">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "w-full justify-start text-xs gap-2 px-2.5 h-8 font-normal transition-all rounded-md relative",
                location.pathname === '/notifications' 
                  ? 'bg-bg-tertiary/75 text-text-primary font-medium border-l-2 border-accent-primary rounded-l-none' 
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              <Bell className="h-3.5 w-3.5" />
              <span>Notifications</span>
              {unreadCount > 0 && (
                <span className="absolute right-2.5 bg-accent-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[16px] text-center">
                  {unreadCount}
                </span>
              )}
            </Button>
          </Link>
          <Link to="/settings">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "w-full justify-start text-xs gap-2 px-2.5 h-8 font-normal transition-all rounded-md relative",
                location.pathname === '/settings' 
                  ? 'bg-bg-tertiary/75 text-text-primary font-medium border-l-2 border-accent-primary rounded-l-none' 
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              <Settings className="h-3.5 w-3.5" />
              Settings
            </Button>
          </Link>
        </nav>

        {/* Boards List Section */}
        {finalWorkspaceId && (
          <div className="space-y-1">
            <button 
              onClick={() => setBoardsCollapsed(!boardsCollapsed)}
              className="flex items-center justify-between w-full px-2.5 py-1 text-[10px] font-bold text-text-tertiary uppercase tracking-wider hover:text-text-primary transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <FolderKanban className="h-3.5 w-3.5" />
                <span>Boards</span>
                {boards && boards.length > 0 && (
                  <span className="ml-1 text-[9px] font-semibold text-text-tertiary lowercase normal-case bg-bg-tertiary px-1 rounded-sm">
                    {boards.length}
                  </span>
                )}
              </span>
              {boardsCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
            
            {!boardsCollapsed && (
              <nav className="space-y-0.5 pl-1.5">
                {!boards || boards.length === 0 ? (
                  <p className="text-[10px] text-text-tertiary italic px-2.5 py-1">No boards available</p>
                ) : (
                  boards.map((b) => (
                    <Link key={b.id} to={`/boards/${b.id}`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "w-full justify-start text-xs font-normal pl-4 h-7.5 truncate rounded-md relative",
                          boardId === b.id 
                            ? 'bg-bg-tertiary/75 text-text-primary font-medium border-l-2 border-accent-primary rounded-l-none' 
                            : 'text-text-secondary hover:text-text-primary'
                        )}
                      >
                        <ClipboardList className="h-3 w-3 mr-1.5 shrink-0 opacity-70" />
                        <span className="truncate">{b.name}</span>
                      </Button>
                    </Link>
                  ))
                )}
              </nav>
            )}
          </div>
        )}

        {/* Workspace Management (Only visible if workspace context exists) */}
        {finalWorkspaceId && (
          <div className="space-y-1">
            <button 
              onClick={() => setMgmtCollapsed(!mgmtCollapsed)}
              className="flex items-center justify-between w-full px-2.5 py-1 text-[10px] font-bold text-text-tertiary uppercase tracking-wider hover:text-text-primary transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                <span>Management</span>
              </span>
              {mgmtCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
            
            {!mgmtCollapsed && (
              <nav className="space-y-0.5 pl-1.5">
                <Link to={`/workspaces/${finalWorkspaceId}/members`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "w-full justify-start text-xs gap-2 px-2.5 h-8 font-normal transition-all rounded-md relative",
                      location.pathname.endsWith('/members') 
                        ? 'bg-bg-tertiary/75 text-text-primary font-medium border-l-2 border-accent-primary rounded-l-none' 
                        : 'text-text-secondary hover:text-text-primary'
                    )}
                  >
                    <Users className="h-3.5 w-3.5" />
                    Members directory
                  </Button>
                </Link>
                <Link to={`/workspaces/${finalWorkspaceId}/settings`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "w-full justify-start text-xs gap-2 px-2.5 h-8 font-normal transition-all rounded-md relative",
                      location.pathname.endsWith('/settings') 
                        ? 'bg-bg-tertiary/75 text-text-primary font-medium border-l-2 border-accent-primary rounded-l-none' 
                        : 'text-text-secondary hover:text-text-primary'
                    )}
                  >
                    <Settings className="h-3.5 w-3.5" />
                    Settings
                  </Button>
                </Link>
              </nav>
            )}
          </div>
        )}
      </div>

      {/* User profile footer */}
      <div className="p-3 border-t border-border flex items-center justify-between bg-bg-tertiary/10 shrink-0">
        <div className="flex items-center gap-2 truncate">
          <Avatar displayName={user?.displayName || '?'} size="sm" />
          <div className="truncate">
            <p className="text-xs font-semibold truncate leading-tight">{user?.displayName}</p>
            <p className="text-[10px] text-text-tertiary truncate leading-none mt-0.5">{user?.email}</p>
          </div>
        </div>
        <Button
          onClick={handleLogout}
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-text-tertiary hover:text-danger hover:bg-danger-subtle rounded-md"
          title="Sign Out"
        >
          <LogOut className="h-3.5 w-3.5" />
        </Button>
      </div>

      <CreateWorkspaceDialog open={createWsOpen} onOpenChange={setCreateWsOpen} />
    </aside>
  )
}
export default Sidebar
