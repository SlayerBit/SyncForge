import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, Compass, Settings, User, Bell, Plus, LogOut, Moon, Sun, Keyboard, X, Folder, LayoutGrid, Calendar } from 'lucide-react'
import { useWorkspacesQuery } from '@/features/workspace/api/workspace.queries'
import { useUIStore } from '@/stores/ui.store'
import { useAuthStore } from '@/stores/auth.store'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const navigate = useNavigate()
  const { theme, setTheme } = useUIStore()
  const { clearAuth } = useAuthStore()
  const { data: workspaces } = useWorkspacesQuery()

  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Autocomplete command items
  const baseCommands = [
    { id: 'go-dashboard', label: 'Go to Dashboard', category: 'Navigation', icon: Compass, action: () => navigate('/') },
    { id: 'go-notifications', label: 'View Notifications', category: 'Navigation', icon: Bell, action: () => navigate('/notifications') },
    { id: 'go-settings', label: 'Open Settings', category: 'Navigation', icon: Settings, action: () => navigate('/settings') },
    { id: 'theme-light', label: 'Use Light Theme', category: 'Appearance', icon: Sun, action: () => setTheme('light') },
    { id: 'theme-dark', label: 'Use Dark Theme', category: 'Appearance', icon: Moon, action: () => setTheme('dark') },
    { id: 'logout', label: 'Log Out Session', category: 'Account', icon: LogOut, action: () => { clearAuth(); navigate('/login'); } },
  ]

  // Dynamic Workspace and Board navigation items
  const workspaceCommands = (workspaces || []).map((ws) => ({
    id: `ws-${ws.id}`,
    label: `Jump to Workspace: ${ws.name}`,
    category: 'Workspaces',
    icon: Folder,
    action: () => navigate(`/workspaces/${ws.id}`),
  }))

  const allItems = [...baseCommands, ...workspaceCommands]

  // Filter items based on user search query
  const filtered = allItems.filter(item =>
    item.label.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  )

  // Reset index on search query update
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  // Handle keyboard events (Arrows, Enter, Esc)
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].action()
          onClose()
        }
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, filtered, selectedIndex, onClose])

  // Auto-focus input on open
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setQuery('')
    }
  }, [open])

  if (!open) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 select-none">
        {/* Backdrop overlay */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/10 backdrop-blur-xs dark:bg-black/45 dark:backdrop-blur-sm cursor-default"
        />

        {/* Command dialog wrapper */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: -8 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-border-default bg-bg-secondary p-0 shadow-2xl dark:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.6)]"
        >
          {/* Search bar input container */}
          <div className="flex items-center gap-3.5 border-b border-border/40 px-4.5 py-3.5 bg-bg-secondary/35">
            <Search className="h-4.5 w-4.5 text-text-tertiary" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search workspaces, commands or settings... (Arrow keys to navigate)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-xs font-medium text-text-primary placeholder-text-tertiary focus:outline-none"
            />
            <button 
              onClick={onClose}
              className="h-6 w-6 rounded-md hover:bg-bg-hover flex items-center justify-center text-text-tertiary hover:text-text-primary transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Results container */}
          <div className="max-h-[320px] overflow-y-auto p-2 custom-scrollbar">
            {filtered.length === 0 ? (
              <div className="py-12 text-center text-xs text-text-tertiary italic">
                No matching commands found.
              </div>
            ) : (
              <div className="space-y-1">
                {filtered.map((item, idx) => {
                  const Icon = item.icon
                  const isSelected = idx === selectedIndex
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        item.action()
                        onClose()
                      }}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-xl flex items-center justify-between transition-colors duration-150 select-none",
                        isSelected 
                          ? "bg-accent-primary text-white" 
                          : "hover:bg-bg-secondary text-text-primary"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-lg border",
                          isSelected 
                            ? "bg-white/10 border-white/20 text-white" 
                            : "bg-bg-primary border-border/40 text-text-secondary"
                        )}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold leading-tight">{item.label}</p>
                          <p className={cn(
                            "text-[9px] font-bold mt-0.5",
                            isSelected ? "text-white/70" : "text-text-tertiary"
                          )}>
                            {item.category}
                          </p>
                        </div>
                      </div>
                      
                      {isSelected && (
                        <span className="text-[10px] font-semibold bg-white/20 text-white px-2 py-0.5 rounded-md flex items-center gap-0.5 shadow-inner">
                          <span>Enter</span>
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Shortcut guide footer */}
          <div className="border-t border-border/40 px-4.5 py-3 bg-bg-secondary/20 flex items-center justify-between text-[10px] text-text-tertiary font-bold uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <Keyboard className="h-4 w-4 text-text-tertiary" />
              <span>Keyboard Navigation</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-bg-secondary px-1.5 py-0.5 rounded border border-border/40">↑↓ Navigate</span>
              <span className="bg-bg-secondary px-1.5 py-0.5 rounded border border-border/40">Esc Close</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
export default CommandPalette
