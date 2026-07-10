import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Calendar, AlertCircle } from 'lucide-react'
import { Avatar } from '@/components/shared/Avatar'
import { TaskDto } from '@/types/common.types'
import { cn } from '@/lib/utils'

interface TaskCardProps {
  task: TaskDto
  onClick?: () => void
}

const priorityColors = {
  LOW: 'border-l-2 border-l-success',
  MEDIUM: 'border-l-2 border-l-warning',
  HIGH: 'border-l-2 border-l-danger',
  URGENT: 'border-l-2 border-l-danger bg-danger-subtle/10',
  NONE: 'border-l-2 border-l-transparent',
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: 'Task',
      task,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handleDueDate = (dateStr?: string) => {
    if (!dateStr) return null
    const date = new Date(dateStr)
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="h-[100px] rounded-lg border border-border border-dashed bg-bg-tertiary opacity-40"
      />
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        'group rounded-lg border border-border bg-bg-secondary p-3.5 shadow-sm hover:shadow-md hover:-translate-y-0.5 cursor-grab active:cursor-grabbing transition-all duration-200 select-none active:scale-[0.98]',
        priorityColors[task.priority]
      )}
    >
      <div className="space-y-2.5">
        {/* Title */}
        <h4 className="text-xs font-semibold text-text-primary group-hover:text-accent-primary transition-colors line-clamp-2">
          {task.title}
        </h4>

        {/* Labels */}
        {task.labels && task.labels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {task.labels.map((lbl) => (
              <span
                key={lbl.id}
                style={{ backgroundColor: lbl.color + '20', color: lbl.color, borderColor: lbl.color }}
                className="text-[9px] font-semibold px-1.5 py-0.5 rounded border"
              >
                {lbl.name}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-1 border-t border-border/40">
          {/* Due date */}
          <div className="flex items-center gap-1 text-[10px] text-text-tertiary">
            {task.dueDate && (
              <>
                <Calendar className="h-3 w-3" />
                <span>{handleDueDate(task.dueDate)}</span>
              </>
            )}
          </div>

          {/* Assignees list */}
          <div className="flex -space-x-1 items-center">
            {task.assignees?.map((asn) => (
              <Avatar
                key={asn.id}
                displayName={asn.displayName}
                size="xs"
                className="ring-1 ring-background"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
export default TaskCard
