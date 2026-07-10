import React, { useEffect } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { Router } from '@/components/Router'
import { Toaster } from 'sonner'
import { useUIStore } from '@/stores/ui.store'

export function App() {
  const theme = useUIStore((state) => state.theme)

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
  }, [theme])

  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster position="top-right" theme={theme} closeButton />
    </QueryClientProvider>
  )
}
export default App
