import React from 'react'
import { Outlet, Link, useLocation, useParams, useNavigate } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { SearchBar } from '../shared/SearchBar'
import { ErrorBoundary } from '../shared/ErrorBoundary'
import { useUIStore } from '@/stores/ui.store'
import { useAuthStore } from '@/stores/auth.store'
import { useWorkspaceQuery } from '@/features/workspace/api/workspace.queries'
import { useBoardQuery } from '@/features/board/api/board.queries'
import { useLogoutMutation } from '@/features/auth/api/auth.queries'
import { 
  PanelLeft, 
  ChevronRight, 
  Home, 
  Bell, 
  Settings as SettingsIcon, 
  User, 
  LogOut,
  ChevronDown
} from 'lucide-react'
import { Avatar } from '../shared/Avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function AppLayout() {
  const { sidebarOpen, toggleSidebar } = useUIStore()
  const user = useAuthStore((state) => state.user)
  const logoutMutation = useLogoutMutation()
  const navigate = useNavigate()
  const location = useLocation()
  
  const { workspaceId, boardId } = useParams<{ workspaceId?: string; boardId?: string }>()
  
  // Queries for breadcrumbs
  const { data: board } = useBoardQuery(boardId || '')
  const activeWorkspaceId = workspaceId || board?.workspaceId || ''
  const { data: workspace } = useWorkspaceQuery(activeWorkspaceId)

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => navigate('/login'),
    })
  }

  // Render breadcrumbs
  const renderBreadcrumbs = () => {
    const paths = []
    
    // Always start with home/dashboard
    paths.push(
      <Link key="home" to="/" className="flex items-center gap-1 hover:text-text-primary transition-colors">
        <Home className="h-3.5 w-3.5" />
      </Link>
    )

    if (location.pathname === '/notifications') {
      paths.push(
        <React.Fragment key="notif">
          <ChevronRight className="h-3 w-3 text-text-tertiary" />
          <span className="text-xs font-semibold text-text-primary">Notifications</span>
        </React.Fragment>
      )
    } else if (location.pathname === '/settings') {
      paths.push(
        <React.Fragment key="settings">
          <ChevronRight className="h-3 w-3 text-text-tertiary" />
          <span className="text-xs font-semibold text-text-primary">User Settings</span>
        </React.Fragment>
      )
    } else if (workspace) {
      paths.push(
        <React.Fragment key="workspace">
          <ChevronRight className="h-3 w-3 text-text-tertiary" />
          <Link to={`/workspaces/${workspace.id}`} className="hover:text-text-primary transition-colors">
            {workspace.name}
          </Link>
        </React.Fragment>
      )
      
      if (location.pathname.endsWith('/settings')) {
        paths.push(
          <React.Fragment key="ws-settings">
            <ChevronRight className="h-3 w-3 text-text-tertiary" />
            <span className="text-xs font-semibold text-text-primary">Settings</span>
          </React.Fragment>
        )
      } else if (location.pathname.endsWith('/members')) {
        paths.push(
          <React.Fragment key="ws-members">
            <ChevronRight className="h-3 w-3 text-text-tertiary" />
            <span className="text-xs font-semibold text-text-primary">Members</span>
          </React.Fragment>
        )
      } else if (board) {
        paths.push(
          <React.Fragment key="board">
            <ChevronRight className="h-3 w-3 text-text-tertiary" />
            <span className="text-xs font-semibold text-text-primary">{board.name}</span>
          </React.Fragment>
        )
      }
    } else if (board) {
      paths.push(
        <React.Fragment key="board-only">
          <ChevronRight className="h-3 w-3 text-text-tertiary" />
          <span className="text-xs font-semibold text-text-primary">{board.name}</span>
        </React.Fragment>
      )
    }

    return (
      <div className="flex items-center gap-1.5 text-xs text-text-secondary select-none">
        {paths}
      </div>
    )
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg-primary text-text-primary dark">
      {/* Navigation Sidebar */}
      <Sidebar />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col h-full overflow-hidden transition-all duration-300">
        {/* Header toolbar */}
        <header className="h-12 border-b border-border bg-bg-secondary/60 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-10">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button 
                onClick={toggleSidebar}
                className="p-1.5 rounded-md hover:bg-bg-tertiary text-text-secondary hover:text-text-primary transition-all active:scale-95"
                title="Expand Sidebar"
              >
                <PanelLeft className="h-4 w-4" />
              </button>
            )}
            
            {renderBreadcrumbs()}
          </div>

          <div className="flex items-center gap-3.5">
            {/* Global/Workspace cmd+K Search */}
            <SearchBar />

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1.5 p-1 rounded-full hover:bg-bg-tertiary transition-colors active:scale-95">
                  <Avatar displayName={user?.displayName || '?'} size="sm" />
                  <ChevronDown className="h-3 w-3 text-text-secondary" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[180px] text-xs">
                <div className="px-2 py-1.5 border-b border-border mb-1">
                  <p className="font-semibold text-text-primary truncate">{user?.displayName}</p>
                  <p className="text-[10px] text-text-tertiary truncate">{user?.email}</p>
                </div>
                <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer gap-2">
                  <User className="h-3.5 w-3.5" />
                  Profile settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/notifications')} className="cursor-pointer gap-2">
                  <Bell className="h-3.5 w-3.5" />
                  Notifications
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer gap-2 text-danger hover:text-danger hover:bg-danger-subtle border-t border-border mt-1 font-semibold">
                  <LogOut className="h-3.5 w-3.5" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Dynamic page contents wrapper */}
        <main className="flex-1 overflow-auto bg-bg-primary">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}
export default AppLayout

