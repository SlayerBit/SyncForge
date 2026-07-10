import React, { useState, useEffect } from 'react'
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
  ClipboardList,
  Check,
  Star,
  Keyboard
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { notificationApi } from '@/features/notification/api/notification.api'
import { useWorkspacesQuery, useWorkspaceMembersQuery } from '@/features/workspace/api/workspace.queries'
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
import { usePresenceStore } from '@/stores/presence.store'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

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

  const finalWorkspaceId = workspaceId || board?.workspaceId || ''
  const activeWorkspace = workspaces?.find((w) => w.id === finalWorkspaceId)

  const { data: boards } = useWorkspaceBoardsQuery(finalWorkspaceId, true)
  const { data: members } = useWorkspaceMembersQuery(finalWorkspaceId)
  const onlineUserIds = usePresenceStore((state) => state.onlineUserIds)

  const [createWsOpen, setCreateWsOpen] = useState(false)
  const [favoritesCollapsed, setFavoritesCollapsed] = useState(false)
  const [boardsCollapsed, setBoardsCollapsed] = useState(false)
  const [teammatesCollapsed, setTeammatesCollapsed] = useState(false)
  const [mgmtCollapsed, setMgmtCollapsed] = useState(false)

  const { sidebarOpen, toggleSidebar } = useUIStore()

  // Manage persistent favorites in local storage
  const [favorites, setFavorites] = useState<string[]>([])

  useEffect(() => {
    const saved = localStorage.getItem('syncforge-favorite-boards')
    if (saved) {
      try {
        setFavorites(JSON.parse(saved))
      } catch (e) {
        console.error(e)
      }
    }
  }, [])

  const toggleFavorite = (bId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const updated = favorites.includes(bId)
      ? favorites.filter((id) => id !== bId)
      : [...favorites, bId]
    setFavorites(updated)
    localStorage.setItem('syncforge-favorite-boards', JSON.stringify(updated))
  }

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => navigate('/login'),
    })
  }

  const mainNavItems = [
    { to: '/', label: 'Dashboard', icon: LayoutGrid },
    { to: '/notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
    { to: '/settings', label: 'Settings', icon: Settings },
  ]

  // Filter boards that are favorited
  const favoriteBoards = (boards || []).filter((b) => favorites.includes(b.id))

  return (
    <AnimatePresence initial={false}>
      {sidebarOpen && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 240, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="h-screen flex flex-col shrink-0 select-none overflow-hidden z-20 border-r border-border/40 bg-bg-secondary"
        >
          {/* Floating Inner Container for Premium Workspace Look */}
          <div className="flex-1 flex flex-col m-3 mr-0 rounded-2xl border border-border/60 bg-bg-primary/50 backdrop-blur-md shadow-sm overflow-hidden">
            {/* Workspace Switcher Header */}
            <div className="p-3 border-b border-border/40 flex items-center justify-between gap-1 shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center justify-between flex-1 p-1.5 rounded-xl hover:bg-bg-hover/80 active:scale-[0.98] transition-all text-xs text-left max-w-[170px] border border-border/40 bg-bg-primary shadow-xs">
                    <div className="flex items-center gap-2 truncate">
                      <div className="flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-lg bg-accent-primary/10 text-accent-primary font-bold text-[10px] border border-accent-primary/20">
                        {activeWorkspace ? activeWorkspace.name[0].toUpperCase() : 'S'}
                      </div>
                      <span className="font-semibold truncate text-text-primary">
                        {activeWorkspace ? activeWorkspace.name : 'Workspace'}
                      </span>
                    </div>
                    <ChevronsUpDown className="h-3 w-3 text-text-tertiary shrink-0" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[190px] text-xs rounded-xl shadow-lg border-border/50">
                  {workspaces?.map((ws) => (
                    <DropdownMenuItem
                      key={ws.id}
                      onClick={() => navigate(`/workspaces/${ws.id}`)}
                      className={cn(
                        "cursor-pointer rounded-lg m-1 flex items-center justify-between",
                        ws.id === finalWorkspaceId ? "bg-accent-primary/10 text-accent-primary font-bold hover:bg-accent-primary/25 hover:text-accent-primary" : ""
                      )}
                    >
                      <span>{ws.name}</span>
                      {ws.id === finalWorkspaceId && <Check className="h-3 w-3 text-accent-primary shrink-0" />}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuItem
                    onClick={() => setCreateWsOpen(true)}
                    className="cursor-pointer gap-2 border-t border-border mt-1 font-bold text-accent-primary rounded-lg m-1"
                  >
                    <Plus className="h-4 w-4" />
                    New Workspace
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <button 
                onClick={toggleSidebar}
                className="p-1.5 rounded-lg hover:bg-bg-hover text-text-secondary hover:text-text-primary transition-all active:scale-[0.9] shrink-0"
                title="Collapse Sidebar"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            </div>

            {/* Main Navigation Links */}
            <div className="flex-1 overflow-y-auto p-2.5 space-y-5 custom-scrollbar">
              <nav className="space-y-1 relative">
                {mainNavItems.map((item) => {
                  const isActive = location.pathname === item.to
                  return (
                    <Link key={item.to} to={item.to} className="relative block">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "w-full justify-start text-xs gap-2.5 px-3 h-8.5 font-medium transition-all rounded-lg relative overflow-hidden active:scale-[0.98]",
                          isActive ? 'text-accent-primary' : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover/50'
                        )}
                      >
                        {isActive && (
                          <motion.span
                            layoutId="mainNavHighlight"
                            className="absolute inset-0 bg-accent-primary/5 rounded-lg border-l-2 border-accent-primary"
                            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                          />
                        )}
                        <item.icon className={cn("h-4 w-4 relative z-10", isActive ? "text-accent-primary" : "text-text-secondary")} />
                        <span className="relative z-10">{item.label}</span>
                        {item.badge && item.badge > 0 && (
                          <span className="absolute right-3 bg-accent-primary text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full min-w-[16px] text-center z-10 shadow-sm">
                            {item.badge}
                          </span>
                        )}
                      </Button>
                    </Link>
                  )
                })}
              </nav>

              {/* Favorites Folders */}
              {finalWorkspaceId && (
                <div className="space-y-1">
                  <button
                    onClick={() => setFavoritesCollapsed(!favoritesCollapsed)}
                    className="flex items-center justify-between w-full px-2.5 py-1.5 text-[9px] font-bold text-text-tertiary uppercase tracking-wider hover:text-text-primary transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <Star className="h-3 w-3 text-warning fill-warning/20" />
                      <span>Favorites</span>
                      {favoriteBoards.length > 0 && (
                        <span className="ml-1 text-[9px] font-bold text-text-secondary bg-bg-hover px-1.5 py-0.25 rounded-md">
                          {favoriteBoards.length}
                        </span>
                      )}
                    </span>
                    {favoritesCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>

                  {!favoritesCollapsed && (
                    <nav className="space-y-0.5 pl-1.5">
                      {favoriteBoards.length === 0 ? (
                        <p className="text-[10px] text-text-tertiary/80 italic px-2.5 py-1 leading-normal">
                          Star boards to pin them here
                        </p>
                      ) : (
                        favoriteBoards.map((b) => {
                          const isBoardActive = boardId === b.id
                          return (
                            <div key={b.id} className="group relative flex items-center w-full">
                              <Link to={`/boards/${b.id}`} className="flex-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={cn(
                                    "w-full justify-start text-xs font-medium pl-3 pr-8 h-8 truncate rounded-lg relative active:scale-[0.98]",
                                    isBoardActive ? 'text-accent-primary' : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover/50'
                                  )}
                                >
                                  {isBoardActive && (
                                    <motion.span
                                      layoutId="favNavHighlight"
                                      className="absolute inset-0 bg-accent-primary/5 rounded-lg border-l-2 border-accent-primary"
                                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                                    />
                                  )}
                                  <ClipboardList className={cn("h-3.5 w-3.5 mr-1.5 shrink-0 relative z-10", isBoardActive ? "text-accent-primary" : "text-text-secondary")} />
                                  <span className="truncate relative z-10">{b.name}</span>
                                </Button>
                              </Link>
                              <button
                                onClick={(e) => toggleFavorite(b.id, e)}
                                className="absolute right-2 p-1 text-warning hover:scale-110 active:scale-90 transition-transform z-10"
                                title="Unfavorite"
                              >
                                <Star className="h-3 w-3 fill-warning" />
                              </button>
                            </div>
                          )
                        })
                      )}
                    </nav>
                  )}
                </div>
              )}

              {/* Boards List Section */}
              {finalWorkspaceId && (
                <div className="space-y-1">
                  <button 
                    onClick={() => setBoardsCollapsed(!boardsCollapsed)}
                    className="flex items-center justify-between w-full px-2.5 py-1.5 text-[9px] font-bold text-text-tertiary uppercase tracking-wider hover:text-text-primary transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <FolderKanban className="h-3.5 w-3.5" />
                      <span>Boards</span>
                      {boards && boards.length > 0 && (
                        <span className="ml-1 text-[9px] font-bold text-text-secondary bg-bg-hover px-1.5 py-0.25 rounded-md">
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
                        boards.map((b) => {
                          const isBoardActive = boardId === b.id
                          const isFav = favorites.includes(b.id)
                          return (
                            <div key={b.id} className="group relative flex items-center w-full">
                              <Link to={`/boards/${b.id}`} className="flex-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={cn(
                                    "w-full justify-start text-xs font-medium pl-3 pr-8 h-8 truncate rounded-lg relative active:scale-[0.98]",
                                    isBoardActive ? 'text-accent-primary' : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover/50'
                                  )}
                                >
                                  {isBoardActive && (
                                    <motion.span
                                      layoutId="boardNavHighlight"
                                      className="absolute inset-0 bg-accent-primary/5 rounded-lg border-l-2 border-accent-primary"
                                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                                    />
                                  )}
                                  <ClipboardList className={cn("h-3.5 w-3.5 mr-1.5 shrink-0 relative z-10", isBoardActive ? "text-accent-primary" : "text-text-secondary")} />
                                  <span className="truncate relative z-10">{b.name}</span>
                                </Button>
                              </Link>
                              <button
                                onClick={(e) => toggleFavorite(b.id, e)}
                                className="absolute right-2 p-1 text-text-tertiary hover:text-warning hover:scale-110 active:scale-90 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 z-10"
                                title={isFav ? "Unfavorite" : "Favorite"}
                              >
                                <Star className={cn("h-3 w-3", isFav ? "text-warning fill-warning" : "")} />
                              </button>
                            </div>
                          )
                        })
                      )}
                    </nav>
                  )}
                </div>
              )}

              {/* Active Teammates Section */}
              {finalWorkspaceId && (
                <div className="space-y-1">
                  <button 
                    onClick={() => setTeammatesCollapsed(!teammatesCollapsed)}
                    className="flex items-center justify-between w-full px-2.5 py-1.5 text-[9px] font-bold text-text-tertiary uppercase tracking-wider hover:text-text-primary transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      <span>Teammates</span>
                      {members && members.length > 0 && (
                        <span className="ml-1 text-[9px] font-bold text-text-secondary bg-bg-hover px-1.5 py-0.25 rounded-md">
                          {members.length}
                        </span>
                      )}
                    </span>
                    {teammatesCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>

                  {!teammatesCollapsed && (
                    <nav className="space-y-0.5 pl-1.5 max-h-[140px] overflow-y-auto pr-1.5 custom-scrollbar">
                      {!members || members.length === 0 ? (
                        <p className="text-[10px] text-text-tertiary italic px-2.5 py-1">No members in workspace</p>
                      ) : (
                        members.map((m) => {
                          const isOnline = onlineUserIds.includes(m.userId)
                          return (
                            <div key={m.userId} className="flex items-center gap-2 px-2.5 py-1 rounded-lg hover:bg-bg-hover/30 transition-colors">
                              <div className="relative">
                                <Avatar displayName={m.displayName} size="xs" />
                                <span
                                  className={cn(
                                    "absolute -bottom-0.5 -right-0.5 block h-2 w-2 rounded-full ring-1.5 ring-bg-primary",
                                    isOnline ? "bg-success animate-pulse" : "bg-text-tertiary"
                                  )}
                                />
                              </div>
                              <span className="text-[11px] font-semibold text-text-secondary truncate">
                                {m.displayName}
                              </span>
                            </div>
                          )
                        })
                      )}
                    </nav>
                  )}
                </div>
              )}

              {/* Workspace Management Section */}
              {finalWorkspaceId && (
                <div className="space-y-1">
                  <button 
                    onClick={() => setMgmtCollapsed(!mgmtCollapsed)}
                    className="flex items-center justify-between w-full px-2.5 py-1.5 text-[9px] font-bold text-text-tertiary uppercase tracking-wider hover:text-text-primary transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <Settings className="h-3.5 w-3.5" />
                      <span>Workspace Mgmt</span>
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
                            "w-full justify-start text-xs gap-2 px-3 h-8.5 font-medium transition-all rounded-lg relative active:scale-[0.98]",
                            location.pathname.endsWith('/members') 
                              ? 'text-accent-primary bg-accent-primary/5 border-l-2 border-accent-primary' 
                              : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover/50'
                          )}
                        >
                          <Users className="h-3.5 w-3.5" />
                          Members
                        </Button>
                      </Link>
                      <Link to={`/workspaces/${finalWorkspaceId}/settings`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "w-full justify-start text-xs gap-2 px-3 h-8.5 font-medium transition-all rounded-lg relative active:scale-[0.98]",
                            location.pathname.endsWith('/settings') 
                              ? 'text-accent-primary bg-accent-primary/5 border-l-2 border-accent-primary' 
                              : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover/50'
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

            {/* Keyboard Shortcuts Hint */}
            <div className="p-3 border-t border-border-default/30 bg-bg-secondary/15 select-none space-y-1 shrink-0">
              <span className="text-[8px] font-bold text-text-tertiary uppercase tracking-wider block pl-0.5">Shortcuts</span>
              <div className="flex flex-col gap-1.5 text-[9px] text-text-secondary font-medium">
                <div className="flex justify-between items-center px-1 py-0.5 rounded hover:bg-bg-hover/40">
                  <span>Search commands</span>
                  <kbd className="bg-bg-tertiary border border-border-default/60 px-1 py-0.2 rounded font-mono text-[8px] shrink-0">⌘K</kbd>
                </div>
                <div className="flex justify-between items-center px-1 py-0.5 rounded hover:bg-bg-hover/40">
                  <span>Create task</span>
                  <kbd className="bg-bg-tertiary border border-border-default/60 px-1 py-0.2 rounded font-mono text-[8px] shrink-0">C</kbd>
                </div>
              </div>
            </div>

            {/* User profile footer */}
            <div className="p-3 border-t border-border/40 flex items-center justify-between bg-bg-hover/30 shrink-0">
              <div className="flex items-center gap-2 truncate">
                <Avatar displayName={user?.displayName || '?'} size="sm" />
                <div className="truncate">
                  <p className="text-xs font-semibold truncate leading-tight text-text-primary">{user?.displayName}</p>
                  <p className="text-[10px] text-text-tertiary truncate leading-none mt-0.5">{user?.email}</p>
                </div>
              </div>
              <Button
                onClick={handleLogout}
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-text-tertiary hover:text-danger hover:bg-danger-subtle rounded-lg transition-colors active:scale-90"
                title="Sign Out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <CreateWorkspaceDialog open={createWsOpen} onOpenChange={setCreateWsOpen} />
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
export default Sidebar
