import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { apiClient } from '@/lib/api-client'
import { ApiResponse } from '@/types/api.types'

interface SearchTask {
  id: string
  title: string
  status: string
  boardId: string
}

interface SearchComment {
  id: string
  content: string
  taskId: string
  boardId: string
  taskTitle: string
}

interface SearchResult {
  tasks: SearchTask[]
  comments: SearchComment[]
}

export function SearchBar() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult>({ tasks: [], comments: [] })
  const [loading, setLoading] = useState(false)

  // Listen for Cmd+K shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  // Fetch results when typing
  useEffect(() => {
    if (!workspaceId || !query.trim()) {
      setResults({ tasks: [], comments: [] })
      return
    }

    const delayDebounce = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await apiClient.get<ApiResponse<SearchResult>>(
          `/workspaces/${workspaceId}/search?q=${encodeURIComponent(query)}`
        )
        setResults(res.data.data)
      } catch (e) {
        console.error('Search failed', e)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(delayDebounce)
  }, [query, workspaceId])

  const handleSelectTask = (boardId: string, taskId: string) => {
    setOpen(false)
    navigate(`/boards/${boardId}?task=${taskId}`)
  }

  if (!workspaceId) return null

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-xs text-text-tertiary bg-bg-secondary hover:bg-bg-tertiary border border-border rounded-md w-[200px] justify-between transition-colors shadow-sm select-none"
      >
        <div className="flex items-center gap-1.5">
          <Search className="h-3.5 w-3.5" />
          <span>Search workspace...</span>
        </div>
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-0.5 rounded border border-border bg-bg-tertiary px-1.5 font-mono text-[9px] font-medium text-text-tertiary opacity-100">
          <span className="text-[10px]">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Type to search tasks and comments..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList className="text-xs">
          {loading && <div className="p-4 text-center text-text-tertiary">Searching...</div>}
          {!loading && results.tasks.length === 0 && results.comments.length === 0 && (
            <CommandEmpty>No results found.</CommandEmpty>
          )}

          {!loading && results.tasks.length > 0 && (
            <CommandGroup heading="Tasks">
              {results.tasks.map((task) => (
                <CommandItem
                  key={task.id}
                  onSelect={() => handleSelectTask(task.boardId, task.id)}
                  className="cursor-pointer hover:bg-bg-hover flex items-center justify-between"
                >
                  <span className="font-medium text-text-primary">{task.title}</span>
                  <span className="text-[10px] text-text-tertiary uppercase">{task.status}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {!loading && results.comments.length > 0 && (
            <CommandGroup heading="Comments">
              {results.comments.map((comment) => (
                <CommandItem
                  key={comment.id}
                  onSelect={() => handleSelectTask(comment.boardId, comment.taskId)}
                  className="cursor-pointer hover:bg-bg-hover flex flex-col items-start gap-0.5"
                >
                  <span className="text-text-secondary line-clamp-1">{comment.content}</span>
                  <span className="text-[9px] text-text-tertiary">On task: {comment.taskTitle}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}
export default SearchBar
