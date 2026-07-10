import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Calendar, AlignLeft, CheckSquare } from 'lucide-react'
import { Avatar } from '@/components/shared/Avatar'
import { TaskDto } from '@/types/common.types'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface TaskCardProps {
  task: TaskDto
  onClick?: () => void
}

const priorityColors = {
  LOW: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  MEDIUM: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  HIGH: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  URGENT: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 animate-pulse',
  NONE: 'bg-bg-tertiary text-text-tertiary border-border/40',
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
    ...(isDragging ? {
      transform: CSS.Transform.toString(transform) + ' rotate(-2.5deg) scale(1.025)',
      zIndex: 50,
    } : {}),
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
        className="h-[105px] rounded-xl border border-dashed border-accent-primary/30 bg-accent-primary/5 opacity-50"
      />
    )
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className="group rounded-xl border border-border/50 bg-bg-primary p-3.5 shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing transition-all select-none"
    >
      <div className="space-y-3">
        {/* Priority Badge and Header Indicators */}
        <div className="flex items-center justify-between gap-2">
          <span className={cn(
            "text-[9px] font-bold px-2 py-0.5 rounded-full border tracking-wide uppercase",
            priorityColors[task.priority]
          )}>
            {task.priority}
          </span>
          <span className="text-[9px] font-semibold text-text-tertiary/70 group-hover:text-text-secondary transition-colors">
            #{task.id.slice(0, 5)}
          </span>
        </div>

        {/* Title */}
        <h4 className="text-xs font-semibold text-text-primary group-hover:text-accent-primary transition-colors leading-relaxed line-clamp-2">
          {task.title}
        </h4>

        {/* Labels */}
        {task.labels && task.labels.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {task.labels.map((lbl) => (
              <span
                key={lbl.id}
                style={{ backgroundColor: lbl.color + '15', color: lbl.color, borderColor: lbl.color + '30' }}
                className="text-[9px] font-bold px-2 py-0.5 rounded-md border tracking-wide"
              >
                {lbl.name}
              </span>
            ))}
          </div>
        )}

        {/* Footer Meta and Assignees */}
        <div className="flex items-center justify-between pt-2.5 border-t border-border/30">
          <div className="flex items-center gap-2 text-text-tertiary">
            {task.dueDate && (
              <div className="flex items-center gap-1 text-[9px] font-medium bg-bg-secondary px-1.5 py-0.5 rounded">
                <Calendar className="h-3 w-3" />
                <span>{handleDueDate(task.dueDate)}</span>
              </div>
            )}
            {task.description && (
              <AlignLeft className="h-3 w-3 opacity-60" />
            )}
          </div>

          {/* Assignees list overlapping avatars */}
          <div className="flex -space-x-1.5 items-center">
            {task.assignees?.map((asn) => (
              <Avatar
                key={asn.id}
                displayName={asn.displayName}
                size="xs"
                className="ring-1.5 ring-bg-primary transition-transform group-hover:scale-105"
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
export default TaskCard
