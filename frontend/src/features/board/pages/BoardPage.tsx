import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core'
import {
  SortableContext,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import { useBoardQuery, useMoveTaskMutation } from '../api/board.queries'
import { boardApi } from '../api/board.api'
import { BoardHeader } from '../components/BoardHeader'
import { ColumnContainer } from '../components/ColumnContainer'
import { CreateColumnDialog } from '../components/CreateColumnDialog'
import { CreateTaskDialog } from '@/features/task/components/CreateTaskDialog'
import { TaskDetailDialog } from '@/features/task/components/TaskDetailDialog'
import { TaskCard } from '../components/TaskCard'
import { wsService } from '@/lib/websocket'
import { usePresenceStore } from '@/stores/presence.store'
import { useQueryClient } from '@tanstack/react-query'
import { ColumnDto, TaskDto } from '@/types/common.types'
import { Plus, Calendar as CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { BoardSkeleton } from '@/components/shared/LoadingSkeleton'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

export function BoardPage() {
  const { boardId } = useParams<{ boardId: string }>()
  const queryClient = useQueryClient()
  const { data: board, isLoading: loadingBoard } = useBoardQuery(boardId!)
  const moveTaskMutation = useMoveTaskMutation(boardId!)

  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeType, setActiveType] = useState<'Column' | 'Task' | null>(null)
  const [activeTask, setActiveTask] = useState<TaskDto | null>(null)
  const [activeColumn, setActiveColumn] = useState<ColumnDto | null>(null)

  // Dialog states
  const [createColOpen, setCreateColOpen] = useState(false)
  const [createTaskOpen, setCreateTaskOpen] = useState(false)
  const [targetColumnId, setTargetColumnId] = useState<string | null>(null)
  const [detailTaskId, setDetailTaskId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'board' | 'list' | 'calendar' | 'timeline' | 'analytics' | 'roadmap'>('board')

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement?.tagName
      if (activeEl === 'INPUT' || activeEl === 'TEXTAREA' || document.activeElement?.getAttribute('contenteditable') === 'true') {
        return
      }

      if (e.key.toLowerCase() === 'c') {
        e.preventDefault()
        // If targetColumnId is null, pick the first column of the board as fallback
        if (!targetColumnId && board?.columns && board.columns.length > 0) {
          setTargetColumnId(board.columns[0].id)
        }
        setCreateTaskOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [board, targetColumnId])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Real-time WebSocket synchronization
  useEffect(() => {
    if (!boardId || !board?.workspaceId) return

    // Connect and subscribe to board + presence topics
    wsService.connect(() => {
      // 1. Subscribe to Board updates
      wsService.subscribe(`/topic/board/${boardId}`, (message: any) => {
        console.log('[WS] Received board update event:', message.type)
        queryClient.invalidateQueries({ queryKey: ['boards', boardId] })
      })

      // 2. Subscribe to Workspace Presence list updates
      wsService.subscribe(`/topic/workspace/${board.workspaceId}/presence`, (userIds: string[]) => {
        console.log('[WS] Received workspace presence update:', userIds)
        usePresenceStore.getState().setOnlineUserIds(userIds)
      })

      // Send initial heartbeat to mark presence online
      wsService.send('/app/presence/heartbeat', { workspaceId: board.workspaceId })
    })

    // Setup periodic presence heartbeat mapping (every 15s)
    const interval = setInterval(() => {
      if (wsService.client?.connected) {
        wsService.send('/app/presence/heartbeat', { workspaceId: board.workspaceId })
      }
    }, 15000)

    return () => {
      clearInterval(interval)
      wsService.disconnect()
    }
  }, [boardId, board?.workspaceId, queryClient])

  if (loadingBoard) {
    return <BoardSkeleton />
  }

  if (!board) {
    return <div className="p-8 text-danger text-center">Board not found</div>
  }

  const columns = board.columns || []
  const columnIds = columns.map((c) => c.id)

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    setActiveId(active.id as string)

    const data = active.data.current
    if (data?.type === 'Column') {
      setActiveType('Column')
      setActiveColumn(data.column)
    } else if (data?.type === 'Task') {
      setActiveType('Task')
      setActiveTask(data.task)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    setActiveType(null)
    setActiveTask(null)
    setActiveColumn(null)

    if (!over) return

    // 1. Reordering columns
    if (activeType === 'Column') {
      const activeIdx = columns.findIndex((c) => c.id === active.id)
      const overIdx = columns.findIndex((c) => c.id === over.id)

      if (activeIdx !== overIdx) {
        try {
          // Identify column placing: after which target column ID is it placed
          const targetColId = overIdx === 0 ? null : columns[overIdx - 1].id
          await boardApi.reorderColumn(active.id as string, { afterColumnId: targetColId })
          queryClient.invalidateQueries({ queryKey: ['boards', boardId] })
          toast.success('Column layout updated')
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Failed to reorder columns')
        }
      }
      return
    }

    // 2. Moving tasks
    if (activeType === 'Task') {
      const activeData = active.data.current
      const overData = over.data.current

      if (!activeData || !overData) return

      const activeTaskObj = activeData.task as TaskDto
      let targetColId = ''
      let afterTaskId: string | null = null

      if (overData.type === 'Column') {
        targetColId = overData.column.id
        const targetTasks = overData.column.tasks || []
        afterTaskId = targetTasks.length > 0 ? targetTasks[targetTasks.length - 1].id : null
      } else if (overData.type === 'Task') {
        const overTask = overData.task as TaskDto
        targetColId = overTask.columnId
        afterTaskId = overTask.id
      }

      // Check if task actually moved to a different column or relative index position
      if (activeTaskObj.columnId !== targetColId || activeTaskObj.id !== afterTaskId) {
        moveTaskMutation.mutate({
          taskId: activeTaskObj.id,
          targetColumnId: targetColId,
          afterTaskId,
          version: activeTaskObj.version,
        })
      }
    }
  }

  return (
    <div className="relative flex flex-col h-full overflow-hidden text-text-primary p-6 space-y-4 animate-fade-in">
      {/* Blueprint grid pattern overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#5c4fe504_1.5px,transparent_1.5px)] [background-size:20px_20px] pointer-events-none" />
      <div className="relative z-10 flex flex-col h-full overflow-hidden space-y-4">
        <BoardHeader board={board} />

        {/* View Selection Tabs */}
        <div className="flex items-center gap-1 border-b border-border/40 pb-1 text-xs select-none">
          {[
            { id: 'board', label: 'Board view' },
            { id: 'list', label: 'List view' },
            { id: 'calendar', label: 'Calendar' },
            { id: 'timeline', label: 'Timeline' },
            { id: 'analytics', label: 'Analytics' },
            { id: 'roadmap', label: 'Roadmap' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "px-3 py-1.5 rounded-lg font-bold transition-all relative",
                activeTab === tab.id
                  ? "bg-bg-secondary border border-border/50 text-text-primary shadow-xs"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-secondary/35"
              )}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="activeViewTab" 
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-primary rounded-full" 
                />
              )}
            </button>
          ))}
        </div>

        {activeTab === 'board' && (
          <div className="flex-1 overflow-x-auto min-h-0">
            <DndContext
              sensors={sensors}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="flex gap-4 items-start pb-4">
                <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
                  {columns.map((column) => (
                    <ColumnContainer
                      key={column.id}
                      boardId={board.id}
                      column={column}
                      tasks={column.tasks || []}
                      onAddTask={(colId) => {
                        setTargetColumnId(colId)
                        setCreateTaskOpen(true)
                      }}
                      onTaskClick={(task) => setDetailTaskId(task.id)}
                    />
                  ))}
                </SortableContext>

                {/* Add Column Button */}
                <Button
                  onClick={() => setCreateColOpen(true)}
                  variant="outline"
                  className="w-[285px] shrink-0 border-dashed border-border/80 bg-bg-secondary/40 hover:bg-bg-secondary/80 hover:border-accent-primary/30 h-[48px] rounded-2xl justify-start gap-2 text-xs font-bold text-text-secondary active:scale-[0.98] transition-all"
                >
                  <Plus className="h-4 w-4 text-text-tertiary" />
                  Add Column
                </Button>
              </div>

              <DragOverlay
                dropAnimation={{
                  sideEffects: defaultDropAnimationSideEffects({
                    styles: {
                      active: {
                        opacity: '0.5',
                      },
                    },
                  }),
                }}
              >
                {activeId && activeType === 'Column' && activeColumn && (
                  <ColumnContainer
                    boardId={board.id}
                    column={activeColumn}
                    tasks={activeColumn.tasks || []}
                  />
                )}
                {activeId && activeType === 'Task' && activeTask && (
                  <TaskCard task={activeTask} />
                )}
              </DragOverlay>
            </DndContext>
          </div>
        )}

        {activeTab === 'list' && (
          <div className="flex-1 overflow-auto bg-bg-secondary/20 border border-border/60 rounded-2xl p-4.5 max-w-5xl">
            <table className="w-full text-left text-xs border-collapse select-none">
              <thead>
                <tr className="border-b border-border/50 bg-bg-secondary/40 text-text-secondary font-bold">
                  <th className="p-3.5">Identifier</th>
                  <th className="p-3.5">Title</th>
                  <th className="p-3.5">Status Column</th>
                  <th className="p-3.5">Priority Level</th>
                  <th className="p-3.5">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {columns.flatMap(col => (col.tasks || []).map(task => (
                  <tr 
                    key={task.id} 
                    onClick={() => setDetailTaskId(task.id)}
                    className="hover:bg-bg-secondary/60 cursor-pointer transition-colors"
                  >
                    <td className="p-3.5 font-mono text-[10px] text-text-tertiary">#{task.id.slice(0, 5)}</td>
                    <td className="p-3.5 font-semibold text-text-primary">{task.title}</td>
                    <td className="p-3.5">
                      <span className="bg-bg-secondary border border-border/40 px-2 py-0.5 rounded-md text-[10px]">
                        {col.name}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className={cn(
                        "text-[9px] font-extrabold px-2 py-0.5 rounded border uppercase",
                        task.priority === 'HIGH' || task.priority === 'URGENT' ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' : 'bg-bg-primary text-text-secondary border-border/40'
                      )}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="p-3.5 text-text-tertiary">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                )))}
                {columns.flatMap(c => c.tasks || []).length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-text-tertiary italic">
                      No tasks found. Create a column and task to get started!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab !== 'board' && activeTab !== 'list' && (
          <div className="flex-1 flex flex-col items-center justify-center p-12 border border-dashed border-border/70 rounded-2xl bg-bg-secondary/25">
            <CalendarIcon className="h-10 w-10 text-text-tertiary opacity-45 animate-pulse" />
            <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider mt-4">
              {activeTab} layout coming soon
            </h4>
            <p className="text-[10px] text-text-secondary mt-1.5 max-w-[280px] text-center leading-relaxed">
              We are finalizing the blueprint for the dynamic {activeTab} view. Stay tuned for updates!
            </p>
          </div>
        )}

      {/* Dialogs */}
      <CreateColumnDialog
        boardId={board.id}
        open={createColOpen}
        onOpenChange={setCreateColOpen}
      />

      <CreateTaskDialog
        boardId={board.id}
        columnId={targetColumnId}
        open={createTaskOpen}
        onOpenChange={setCreateTaskOpen}
      />

      <TaskDetailDialog
        taskId={detailTaskId}
        boardId={board.id}
        workspaceId={board.workspaceId}
        open={!!detailTaskId}
        onOpenChange={(open) => !open && setDetailTaskId(null)}
      />
      </div>
    </div>
  )
}
export default BoardPage
