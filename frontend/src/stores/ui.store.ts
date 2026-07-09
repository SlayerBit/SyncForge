import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
  sidebarOpen: boolean
  commandPaletteOpen: boolean
  theme: 'light' | 'dark'
  activeTaskId: string | null
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  toggleCommandPalette: () => void
  setCommandPaletteOpen: (open: boolean) => void
  setTheme: (theme: 'light' | 'dark') => void
  setActiveTaskId: (taskId: string | null) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      commandPaletteOpen: false,
      theme: 'dark',
      activeTaskId: null,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleCommandPalette: () => set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
      setTheme: (theme) => set({ theme }),
      setActiveTaskId: (taskId) => set({ activeTaskId: taskId }),
    }),
    {
      name: 'syncforge-ui-storage',
      partialize: (state) => ({ theme: state.theme }), // only persist theme
    }
  )
)
