import React from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { Router } from '@/components/Router'
import { Toaster } from 'sonner'

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster position="top-right" theme="dark" closeButton />
    </QueryClientProvider>
  )
}
export default App
