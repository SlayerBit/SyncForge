import React, { useState } from 'react'
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus } from 'lucide-react'
import { TaskCard } from './TaskCard'
import { ColumnSettingsMenu } from './ColumnSettingsMenu'
import { Button } from '@/components/ui/button'
import { ColumnDto, TaskDto } from '@/types/common.types'
import { cn } from '@/lib/utils'

interface ColumnContainerProps {
  boardId: string
  column: ColumnDto
  tasks: TaskDto[]
  onAddTask?: (columnId: string) => void
  onTaskClick?: (task: TaskDto) => void
}

export function ColumnContainer({
  boardId,
  column,
  tasks,
  onAddTask,
  onTaskClick,
}: ColumnContainerProps) {
  const taskIds = tasks.map((t) => t.id)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: {
      type: 'Column',
      column,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const isOverLimit = column.taskLimit !== null && column.taskLimit !== undefined && tasks.length > column.taskLimit

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="flex h-[500px] w-[280px] shrink-0 flex-col rounded-lg border border-border border-dashed bg-bg-tertiary/20 opacity-40"
      />
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex w-[280px] shrink-0 flex-col rounded-lg bg-bg-secondary border border-border p-3 space-y-3 max-h-[640px] overflow-hidden text-text-primary',
        isOverLimit && 'border-danger bg-danger-subtle/5'
      )}
    >
      {/* Header */}
      <div {...attributes} {...listeners} className="flex items-center justify-between cursor-grab active:cursor-grabbing pb-1 border-b border-border/40">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold tracking-tight truncate max-w-[150px]">
            {column.name}
          </h3>
          <span className="text-[10px] text-text-tertiary bg-bg-tertiary px-1.5 py-0.5 rounded">
            {tasks.length}
            {column.taskLimit !== null && ` / ${column.taskLimit}`}
          </span>
        </div>
        <ColumnSettingsMenu boardId={boardId} column={column} />
      </div>

      {/* Task List container */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={() => onTaskClick?.(task)} />
          ))}
        </SortableContext>
      </div>

      {/* Add Task Button */}
      {onAddTask && (
        <Button
          onClick={() => onAddTask(column.id)}
          variant="ghost"
          size="sm"
          className="w-full justify-start text-[11px] gap-1.5 text-text-secondary hover:text-text-primary"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Task
        </Button>
      )}
    </div>
  )
}
export default ColumnContainer
