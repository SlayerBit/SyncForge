import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useTaskQuery,
  useUpdateTaskMutation,
  useAssignTaskMutation,
  useUnassignTaskMutation,
  useAddLabelMutation,
  useRemoveLabelMutation,
} from '../api/task.queries'
import { useWorkspaceMembersQuery } from '@/features/workspace/api/workspace.queries'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { commentApi } from '@/features/comment/api/comment.api'
import { activityApi, ActivityLogDto } from '../api/activity.api'
import { labelApi } from '../api/label.api'
import { Avatar } from '@/components/shared/Avatar'
import { useAuthStore } from '@/stores/auth.store'
import { Calendar, AlertCircle, MessageSquare, Trash2, X, Plus, Edit2, History, Send } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

interface TaskDetailDialogProps {
  taskId: string | null
  boardId: string
  workspaceId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TaskDetailDialog({
  taskId,
  boardId,
  workspaceId,
  open,
  onOpenChange,
}: TaskDetailDialogProps) {
  const queryClient = useQueryClient()
  const { data: task, isLoading: loadingTask } = useTaskQuery(taskId)
  const { data: members } = useWorkspaceMembersQuery(workspaceId)
  
  const { data: labels } = useQuery({
    queryKey: ['labels', workspaceId],
    queryFn: () => labelApi.list(workspaceId),
    enabled: open && !!workspaceId,
  })

  const { data: comments, isLoading: loadingComments } = useQuery({
    queryKey: ['comments', taskId],
    queryFn: () => commentApi.list(taskId!),
    enabled: !!taskId && open,
  })

  const updateMutation = useUpdateTaskMutation(boardId)
  const assignMutation = useAssignTaskMutation(boardId)
  const unassignMutation = useUnassignTaskMutation(boardId)
  const addLabelMutation = useAddLabelMutation(boardId)
  const removeLabelMutation = useRemoveLabelMutation(boardId)

  const { user: currentUser } = useAuthStore()

  // Local fields for editing title/description
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [newComment, setNewComment] = useState('')
  const [isEditingDesc, setIsEditingDesc] = useState(false)
  const [activeTab, setActiveTab] = useState<'comments' | 'activity'>('comments')

  // Comment Editing state
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editingCommentContent, setEditingCommentContent] = useState('')

  // Autocomplete Mentions state
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionIndex, setMentionIndex] = useState(-1)

  // Query activity logs
  const { data: activities, isLoading: loadingActivity } = useQuery({
    queryKey: ['task-activity', taskId],
    queryFn: () => activityApi.listTaskActivity(taskId!),
    enabled: !!taskId && open && activeTab === 'activity',
  })

  React.useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDesc(task.description || '')
    }
  }, [task])

  const handleUpdateField = (fields: Record<string, any>) => {
    if (!task) return
    updateMutation.mutate(
      {
        taskId: task.id,
        version: task.version,
        ...fields,
      },
      {
        onSuccess: () => {
          toast.success('Task updated!')
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.message || 'Failed to update task')
        },
      }
    )
  }

  const handleAssigneeChange = (userId: string) => {
    if (!task) return
    const isAssigned = task.assignees?.some((a) => a.id === userId)

    if (isAssigned) {
      unassignMutation.mutate(
        { taskId: task.id, userId },
        {
          onSuccess: () => toast.success('Assignee removed'),
          onError: (err: any) => toast.error(err.response?.data?.message || 'Error updating assignees'),
        }
      )
    } else {
      assignMutation.mutate(
        { taskId: task.id, userId },
        {
          onSuccess: () => toast.success('Assignee added'),
          onError: (err: any) => toast.error(err.response?.data?.message || 'Error updating assignees'),
        }
      )
    }
  }

  const handleLabelChange = (labelId: string) => {
    if (!task) return
    const hasLabel = task.labels?.some((l) => l.id === labelId)

    if (hasLabel) {
      removeLabelMutation.mutate(
        { taskId: task.id, labelId },
        {
          onSuccess: () => toast.success('Label removed'),
          onError: (err: any) => toast.error(err.response?.data?.message || 'Error updating labels'),
        }
      )
    } else {
      addLabelMutation.mutate(
        { taskId: task.id, labelId },
        {
          onSuccess: () => toast.success('Label added'),
          onError: (err: any) => toast.error(err.response?.data?.message || 'Error updating labels'),
        }
      )
    }
  }

  const addCommentMutation = useMutation({
    mutationFn: (content: string) => commentApi.create(taskId!, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', taskId] })
      setNewComment('')
      toast.success('Comment added!')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to add comment')
    },
  })

  const updateCommentMutation = useMutation({
    mutationFn: ({ commentId, content }: { commentId: string; content: string }) =>
      commentApi.update(commentId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', taskId] })
      setEditingCommentId(null)
      toast.success('Comment updated!')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update comment')
    },
  })

  const deleteCommentMutation = useMutation({
    mutationFn: commentApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', taskId] })
      toast.success('Comment deleted')
    },
  })

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return
    addCommentMutation.mutate(newComment)
  }

  const handleCommentChange = (val: string) => {
    setNewComment(val)

    const lastAt = val.lastIndexOf('@')
    if (lastAt >= 0 && (lastAt === 0 || val[lastAt - 1] === ' ')) {
      const textAfter = val.slice(lastAt + 1)
      if (!textAfter.includes(' ')) {
        setShowMentionSuggestions(true)
        setMentionQuery(textAfter.toLowerCase())
        setMentionIndex(lastAt)
        return
      }
    }
    setShowMentionSuggestions(false)
  }

  const selectMention = (member: any) => {
    if (mentionIndex < 0) return
    const before = newComment.slice(0, mentionIndex)
    const after = newComment.slice(mentionIndex).replace(/@[^\s]*/, `@${member.displayName} `)
    setNewComment(before + after)
    setShowMentionSuggestions(false)
  }

  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[760px] max-h-[85vh] overflow-y-auto text-text-primary bg-bg-secondary border-border/80 p-5 sm:p-6 shadow-xl rounded-xl custom-scrollbar animate-scale-in">
        {loadingTask || !task ? (
          <div className="p-12 text-center text-xs text-text-secondary animate-pulse">Loading card details...</div>
        ) : (
          <div className="space-y-5 select-none">
            {/* Header */}
            <div className="space-y-1">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => handleUpdateField({ title })}
                className="text-lg font-bold border-none bg-transparent hover:bg-bg-tertiary/40 focus:bg-bg-tertiary/60 px-2 py-1 -ml-2 rounded w-full text-text-primary transition-colors focus:outline-none focus:ring-0"
              />
              <div className="flex items-center gap-1.5 text-[10px] text-text-tertiary">
                <span>Task Identifier:</span>
                <span className="font-semibold text-text-secondary bg-bg-tertiary/60 border border-border/40 px-1.5 py-0.5 rounded">
                  {task.identifier}
                </span>
                <span className="mx-1">•</span>
                <span>Column:</span>
                <span className="font-semibold text-text-secondary bg-bg-tertiary/60 border border-border/40 px-1.5 py-0.5 rounded">
                  {task.status}
                </span>
              </div>
            </div>

            {/* Main Content Split Grid */}
            <div className="grid gap-6 md:grid-cols-3">
              {/* Left Column: Description & Comments */}
              <div className="md:col-span-2 space-y-5">
                {/* Description */}
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Description</Label>
                  {isEditingDesc ? (
                    <div className="space-y-2 animate-slide-up">
                      <Textarea
                        value={desc}
                        onChange={(e) => setDesc(e.target.value)}
                        className="resize-none h-32 text-xs bg-bg-primary"
                        placeholder="Add a detailed description..."
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            handleUpdateField({ description: desc })
                            setIsEditingDesc(false)
                          }}
                        >
                          Save
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setIsEditingDesc(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => setIsEditingDesc(true)}
                      className="p-3 min-h-[96px] rounded-lg border border-border bg-bg-primary/40 cursor-pointer hover:bg-bg-primary/80 transition-colors text-xs text-text-secondary leading-relaxed"
                    >
                      {task.description || <span className="italic text-text-tertiary/80">Add a detailed description...</span>}
                    </div>
                  )}
                </div>

                {/* Tabs for Comments and Activity */}
                <div className="flex items-center gap-4 border-b border-border/50 pb-1 pt-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('comments')}
                    className={cn(
                      "pb-2 text-xs font-semibold border-b-2 px-1 transition-all relative",
                      activeTab === 'comments'
                        ? 'border-accent-primary text-text-primary'
                        : 'border-transparent text-text-secondary hover:text-text-primary'
                    )}
                  >
                    Comments {comments && comments.length > 0 ? `(${comments.length})` : ''}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('activity')}
                    className={cn(
                      "pb-2 text-xs font-semibold border-b-2 px-1 transition-all flex items-center gap-1.5 relative",
                      activeTab === 'activity'
                        ? 'border-accent-primary text-text-primary'
                        : 'border-transparent text-text-secondary hover:text-text-primary'
                    )}
                  >
                    <History className="h-3.5 w-3.5" />
                    Activity
                  </button>
                </div>

                {activeTab === 'comments' ? (
                  <div className="space-y-4 pt-1">
                    {/* Add Comment Input Form */}
                    <div className="relative">
                      <form
                        onSubmit={handleAddComment}
                        className="flex gap-2"
                      >
                        <Input
                          placeholder="Write a comment... (use @ to mention)"
                          value={newComment}
                          onChange={(e) => handleCommentChange(e.target.value)}
                          className="text-xs bg-bg-primary/50"
                          disabled={addCommentMutation.isPending}
                        />
                        <Button type="submit" size="sm" disabled={addCommentMutation.isPending} className="gap-1">
                          <Send className="h-3 w-3" />
                          Send
                        </Button>
                      </form>

                      {/* Mentions Suggestion Popover */}
                      {showMentionSuggestions && (
                        <div className="absolute left-0 bottom-full mb-1.5 bg-bg-secondary border border-border rounded-lg shadow-xl max-h-40 overflow-y-auto w-64 z-50 p-1 text-xs space-y-0.5 custom-scrollbar">
                          <div className="px-2.5 py-1.5 text-[9px] text-text-tertiary font-bold uppercase tracking-wider border-b border-border/40 mb-1">
                            Mention Team Members
                          </div>
                          {members
                            ?.filter(
                              (m) =>
                                m.displayName.toLowerCase().includes(mentionQuery) ||
                                m.email.toLowerCase().includes(mentionQuery)
                            )
                            .map((m) => (
                              <button
                                key={m.userId}
                                type="button"
                                onClick={() => selectMention(m)}
                                className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-bg-tertiary text-xs transition-colors flex items-center gap-2"
                              >
                                <Avatar displayName={m.displayName} size="xs" />
                                <div className="truncate">
                                  <p className="font-semibold truncate text-[11px] text-text-primary">{m.displayName}</p>
                                  <p className="text-[9px] text-text-tertiary truncate">{m.email}</p>
                                </div>
                              </button>
                            ))}
                        </div>
                      )}
                    </div>

                    {/* Comments Feed */}
                    <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                      {loadingComments ? (
                        <p className="text-[10px] text-text-tertiary animate-pulse">Loading comments...</p>
                      ) : !comments || comments.length === 0 ? (
                        <p className="text-[11px] text-text-tertiary italic py-3 text-center">No comments yet. Start the conversation!</p>
                      ) : (
                        comments.map((comment) => (
                          <div
                            key={comment.id}
                            className="flex gap-3 text-xs bg-bg-primary/20 p-3 rounded-lg border border-border/40 hover:border-border/80 transition-colors"
                          >
                            <Avatar displayName={comment.author.displayName} size="xs" />
                            <div className="flex-1 space-y-1">
                              <div className="flex justify-between items-center text-[10px] text-text-tertiary">
                                <span className="font-semibold text-text-primary">
                                  {comment.author.displayName}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span>
                                    {formatDistanceToNow(new Date(comment.createdAt), {
                                      addSuffix: true,
                                    })}
                                  </span>
                                  {comment.author.id === currentUser?.id && (
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingCommentId(comment.id)
                                          setEditingCommentContent(comment.content)
                                        }}
                                        className="text-text-tertiary hover:text-text-primary transition-colors"
                                        title="Edit comment"
                                      >
                                        <Edit2 className="h-3 w-3" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => deleteCommentMutation.mutate(comment.id)}
                                        className="text-text-tertiary hover:text-danger transition-colors"
                                        title="Delete comment"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {editingCommentId === comment.id ? (
                                <div className="space-y-2 pt-1">
                                  <Textarea
                                    value={editingCommentContent}
                                    onChange={(e) => setEditingCommentContent(e.target.value)}
                                    className="resize-none h-16 text-xs"
                                  />
                                  <div className="flex gap-1.5">
                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        updateCommentMutation.mutate({
                                          commentId: comment.id,
                                          content: editingCommentContent,
                                        })
                                      }
                                      disabled={updateCommentMutation.isPending}
                                    >
                                      Save
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setEditingCommentId(null)}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-text-secondary leading-relaxed text-[11px] whitespace-pre-wrap">{comment.content}</p>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ) : (
                  /* Activity Timeline */
                  <div className="space-y-4 pt-1">
                    {loadingActivity ? (
                      <p className="text-[10px] text-text-tertiary animate-pulse">Loading activity...</p>
                    ) : !activities || !activities.data || activities.data.length === 0 ? (
                      <p className="text-[10px] text-text-tertiary italic text-center py-3">No activity logged.</p>
                    ) : (
                      <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[1px] before:bg-border/60 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                        {activities.data.map((act: ActivityLogDto) => (
                          <div key={act.id} className="flex gap-3 text-xs pl-1">
                            <div className="h-5 w-5 rounded-full bg-bg-tertiary border border-border flex items-center justify-center text-[9px] font-bold text-text-secondary shrink-0 z-10">
                              {act.actorDisplayName ? act.actorDisplayName[0].toUpperCase() : 'S'}
                            </div>
                            <div className="flex-1 space-y-0.5 pt-0.5">
                              <p className="text-[11px] text-text-secondary">
                                <span className="font-semibold text-text-primary">
                                  {act.actorDisplayName}
                                </span>{' '}
                                {act.action}
                              </p>
                              {act.details && (
                                <p className="text-[10px] text-text-tertiary bg-bg-primary/30 p-1.5 rounded border border-border/40">
                                  {act.details}
                                </p>
                              )}
                              <span className="text-[9px] text-text-tertiary block">
                                {formatDistanceToNow(new Date(act.createdAt), {
                                  addSuffix: true,
                                })}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column: Properties Sidebar */}
              <div className="space-y-4 rounded-xl border border-border/80 bg-bg-primary/20 p-4 h-fit">
                {/* Priority */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Priority
                  </Label>
                  <Select
                    value={task.priority}
                    onValueChange={(val) => handleUpdateField({ priority: val })}
                  >
                    <SelectTrigger className="h-8 text-xs bg-bg-secondary border-border/80">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Due Date */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Due Date
                  </Label>
                  <Input
                    type="date"
                    value={task.dueDate ? task.dueDate.split('T')[0] : ''}
                    onChange={(e) => handleUpdateField({ dueDate: e.target.value || null })}
                    className="h-8 text-xs bg-bg-secondary border-border/80"
                  />
                </div>

                {/* Assignees Selector */}
                <div className="space-y-2 border-t border-border/40 pt-3">
                  <Label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">Assignees</Label>
                  <div className="flex flex-wrap gap-1 mb-1">
                    {task.assignees?.map((a) => (
                      <span key={a.id} className="inline-flex items-center gap-1 text-[10px] bg-bg-secondary px-2 py-0.5 rounded-full border border-border/60 text-text-secondary">
                        {a.displayName}
                        <button onClick={() => handleAssigneeChange(a.id)}>
                          <X className="h-2.5 w-2.5 text-text-tertiary hover:text-danger transition-colors" />
                        </button>
                      </span>
                    ))}
                  </div>

                  <Select onValueChange={handleAssigneeChange}>
                    <SelectTrigger className="h-8 text-xs bg-bg-secondary border-border/80">
                      <SelectValue placeholder="Add assignee" />
                    </SelectTrigger>
                    <SelectContent>
                      {members?.filter(m => !task.assignees?.some(a => a.id === m.userId)).map((m) => (
                        <SelectItem key={m.userId} value={m.userId}>
                          {m.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Labels Selector */}
                <div className="space-y-2 border-t border-border/40 pt-3">
                  <Label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">Labels</Label>
                  <div className="flex flex-wrap gap-1 mb-1">
                    {task.labels?.map((l) => (
                      <span
                        key={l.id}
                        style={{ backgroundColor: l.color + '15', color: l.color, borderColor: l.color }}
                        className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border"
                      >
                        {l.name}
                        <button onClick={() => handleLabelChange(l.id)}>
                          <X className="h-2.5 w-2.5 hover:text-danger transition-colors" />
                        </button>
                      </span>
                    ))}
                  </div>

                  <Select onValueChange={handleLabelChange}>
                    <SelectTrigger className="h-8 text-xs bg-bg-secondary border-border/80">
                      <SelectValue placeholder="Add label" />
                    </SelectTrigger>
                    <SelectContent>
                      {labels?.filter(l => !task.labels?.some(tl => tl.id === l.id)).map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          {l.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
export default TaskDetailDialog
