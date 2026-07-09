import React from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { SearchBar } from '../shared/SearchBar'
import { ErrorBoundary } from '../shared/ErrorBoundary'

export function AppLayout() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg-primary text-text-primary dark">
      {/* Navigation Sidebar */}
      <Sidebar />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header toolbar */}
        <header className="h-14 border-b border-border bg-bg-secondary flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            <span className="text-xs font-semibold text-text-tertiary">SyncForge App</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Global/Workspace cmd+K Search */}
            <SearchBar />
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
