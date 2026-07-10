import React from 'react'
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
    if (n.includes('backlog')) return 'bg-text-tertiary/75'
    if (n.includes('todo') || n.includes('open')) return 'bg-accent-primary'
    if (n.includes('progress') || n.includes('doing') || n.includes('dev')) return 'bg-amber-500'
    if (n.includes('done') || n.includes('comp') || n.includes('finish')) return 'bg-emerald-500'
    return 'bg-indigo-500'
  }

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="flex h-[calc(100vh-12rem)] max-h-[720px] w-[285px] shrink-0 flex-col rounded-2xl border border-dashed border-accent-primary/20 bg-bg-secondary/40 opacity-40 animate-pulse"
      />
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex w-[285px] shrink-0 flex-col rounded-2xl bg-bg-secondary/30 border border-border/50 p-4 space-y-4 h-[calc(100vh-12rem)] max-h-[720px] overflow-hidden text-text-primary shadow-xs hover:border-border transition-colors duration-300 backdrop-blur-xs relative pt-5',
        isOverLimit && 'border-rose-500 bg-rose-500/[0.02]'
      )}
    >
      {/* Status-colored top accent bar */}
      <div className={cn("absolute top-0 left-0 right-0 h-1 rounded-t-2xl shadow-xs", getStatusColor(column.name))} />

      {/* Header */}
      <div 
        {...attributes} 
        {...listeners} 
        className="flex items-center justify-between cursor-grab active:cursor-grabbing pb-2.5 border-b border-border/40 group select-none"
      >
        <div className="flex items-center gap-2 truncate">
          <GripVertical className="h-4 w-4 text-text-tertiary/40 group-hover:text-text-secondary transition-colors shrink-0" />
          <span className={cn("h-2.5 w-2.5 rounded-full shrink-0 shadow-sm", getStatusColor(column.name))} />
          <h3 className="text-xs font-bold tracking-tight text-text-primary truncate max-w-[125px]">
            {column.name}
          </h3>
          <span className={cn(
            "text-[9px] px-2 py-0.5 rounded-full font-extrabold select-none tracking-wider",
            isOverLimit 
              ? "text-rose-600 bg-rose-500/10 border border-rose-500/20" 
              : "text-text-secondary bg-bg-hover/80 border border-border/30"
          )}>
            {tasks.length}
            {column.taskLimit !== null && ` / ${column.taskLimit}`}
          </span>
        </div>
        <ColumnSettingsMenu boardId={boardId} column={column} />
      </div>

      {/* Task List container */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
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
          className="w-full justify-start text-[11px] font-semibold gap-2 text-text-secondary hover:text-text-primary hover:bg-bg-hover active:scale-[0.98] transition-all rounded-xl py-1.5 h-8.5"
        >
          <Plus className="h-4 w-4 text-text-tertiary" />
          Add Card
        </Button>
      )}
    </div>
  )
}
export default ColumnContainer
