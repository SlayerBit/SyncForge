import React, { useState } from 'react'
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus, GripVertical } from 'lucide-react'
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

  const getStatusColor = (name: string) => {
    const n = name.toLowerCase()
    if (n.includes('backlog')) return 'bg-text-tertiary'
    if (n.includes('todo') || n.includes('open')) return 'bg-info'
    if (n.includes('progress') || n.includes('doing') || n.includes('dev')) return 'bg-warning'
    if (n.includes('done') || n.includes('comp') || n.includes('finish')) return 'bg-success'
    return 'bg-accent-primary'
  }

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="flex h-[calc(100vh-11rem)] max-h-[760px] w-[282px] shrink-0 flex-col rounded-lg border border-border border-dashed bg-bg-tertiary/20 opacity-30 animate-pulse"
      />
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex w-[282px] shrink-0 flex-col rounded-lg bg-bg-secondary border border-border/80 p-3.5 space-y-3.5 h-[calc(100vh-11rem)] max-h-[760px] overflow-hidden text-text-primary shadow-sm hover:shadow-md transition-shadow duration-300',
        isOverLimit && 'border-danger bg-danger-subtle/5'
      )}
    >
      {/* Header */}
      <div 
        {...attributes} 
        {...listeners} 
        className="flex items-center justify-between cursor-grab active:cursor-grabbing pb-2 border-b border-border/50 group select-none"
      >
        <div className="flex items-center gap-2 truncate">
          <GripVertical className="h-3.5 w-3.5 text-text-tertiary/40 group-hover:text-text-secondary transition-colors shrink-0" />
          <span className={cn("h-2 w-2 rounded-full shrink-0", getStatusColor(column.name))} />
          <h3 className="text-xs font-semibold tracking-tight truncate max-w-[130px]">
            {column.name}
          </h3>
          <span className={cn(
            "text-[10px] px-1.5 py-0.5 rounded-full font-bold select-none",
            isOverLimit 
              ? "text-danger bg-danger-subtle border border-danger/20" 
              : "text-text-secondary bg-bg-tertiary border border-border/40"
          )}>
            {tasks.length}
            {column.taskLimit !== null && ` / ${column.taskLimit}`}
          </span>
        </div>
        <ColumnSettingsMenu boardId={boardId} column={column} />
      </div>

      {/* Task List container */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
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
          className="w-full justify-start text-xs gap-1.5 text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-all"
        >
          <Plus className="h-4 w-4" />
          Add Card
        </Button>
      )}
    </div>
  )
}
export default ColumnContainer
