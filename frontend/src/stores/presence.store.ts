import { create } from 'zustand'

interface PresenceState {
  onlineUserIds: string[]
  setOnlineUserIds: (ids: string[]) => void
}

export const usePresenceStore = create<PresenceState>((set) => ({
  onlineUserIds: [],
  setOnlineUserIds: (ids) => set({ onlineUserIds: ids }),
}))
export default usePresenceStore
