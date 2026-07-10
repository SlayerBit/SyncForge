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
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { BoardSkeleton } from '@/components/shared/LoadingSkeleton'

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
    <div className="flex flex-col h-full overflow-hidden text-text-primary p-6 space-y-4 animate-fade-in">
      <BoardHeader board={board} />

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
              className="w-[280px] shrink-0 border-dashed border-border bg-bg-secondary hover:bg-bg-tertiary h-[48px] justify-start gap-2 text-xs font-semibold text-text-secondary"
            >
              <Plus className="h-4 w-4" />
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
  )
}
export default BoardPage
