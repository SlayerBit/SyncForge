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
import { Calendar, AlertCircle, MessageSquare, Trash2, X, Plus, Edit2, History, Send, Copy, Link2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

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

  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [newComment, setNewComment] = useState('')
  const [isEditingDesc, setIsEditingDesc] = useState(false)
  const [activeTab, setActiveTab] = useState<'comments' | 'activity'>('comments')

  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editingCommentContent, setEditingCommentContent] = useState('')

  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionIndex, setMentionIndex] = useState(-1)

  const { data: activities } = useQuery({
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

  const handleCopyLink = () => {
    if (!task) return
    const taskUrl = `${window.location.origin}/boards/${boardId}?task=${task.id}`
    navigator.clipboard.writeText(taskUrl)
    toast.success('Task link copied to clipboard!')
  }

  const handleCopyIdentifier = () => {
    if (!task) return
    navigator.clipboard.writeText(task.identifier)
    toast.success('Task ID copied to clipboard!')
  }

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="fixed inset-y-0 right-0 left-auto translate-x-0 translate-y-0 z-50 h-full w-[640px] max-w-none border-l border-border/60 bg-bg-primary shadow-2xl p-0 flex flex-col sm:rounded-none outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right duration-300">
        {loadingTask || !task ? (
          <div className="p-16 text-center text-xs text-text-secondary animate-pulse font-medium">
            Loading workpiece details...
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Header Title Editor */}
            <div className="p-6 pb-4 border-b border-border/40 space-y-2 bg-bg-secondary/40 shrink-0">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => handleUpdateField({ title })}
                className="text-base font-extrabold border-none bg-transparent hover:bg-bg-hover/40 focus:bg-bg-hover/80 px-2 py-1 -ml-2 rounded-lg w-full text-text-primary focus:outline-none transition-colors"
              />
              <div className="flex items-center gap-2.5 text-[10px] text-text-secondary font-semibold">
                <span className="text-text-tertiary">Identifier:</span>
                <div className="flex items-center gap-1 bg-bg-hover px-2 py-0.5 rounded-md border border-border/40 font-mono select-all">
                  <span>{task.identifier}</span>
                  <button
                    type="button"
                    onClick={handleCopyIdentifier}
                    className="hover:bg-bg-tertiary p-0.5 rounded text-text-tertiary hover:text-text-primary transition-all active:scale-90"
                    title="Copy Task ID"
                  >
                    <Copy className="h-2.5 w-2.5" />
                  </button>
                </div>
                <span className="text-text-tertiary">Column:</span>
                <span className="bg-bg-hover px-2 py-0.5 rounded-md border border-border/40">
                  {task.status}
                </span>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex items-center gap-1 hover:bg-bg-tertiary px-2 py-0.5 rounded-md border border-border/60 text-text-tertiary hover:text-text-primary transition-all active:scale-95"
                  title="Copy Task Link"
                >
                  <Link2 className="h-2.5 w-2.5" />
                  <span>Copy Link</span>
                </button>
              </div>
            </div>

            {/* Split Grid */}
            <div className="flex-1 grid md:grid-cols-12 overflow-hidden min-h-0">
              {/* Left Column (Main Scrollpane) */}
              <div className="md:col-span-8 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {/* Description Box */}
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">
                    Task Description
                  </Label>
                  {isEditingDesc ? (
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-2"
                    >
                      <Textarea
                        value={desc}
                        onChange={(e) => setDesc(e.target.value)}
                        className="resize-none h-32 text-xs bg-bg-secondary border-border/60 focus:ring-accent-primary"
                        placeholder="Add a detailed description..."
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="text-xs bg-accent-primary hover:bg-accent-primary-hover h-8.5 font-bold px-4 active:scale-95"
                          onClick={() => {
                            handleUpdateField({ description: desc })
                            setIsEditingDesc(false)
                          }}
                        >
                          Save
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-xs h-8.5 font-bold" 
                          onClick={() => setIsEditingDesc(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </motion.div>
                  ) : (
                    <div
                      onClick={() => setIsEditingDesc(true)}
                      className="p-3.5 min-h-[96px] rounded-xl border border-border bg-bg-secondary/20 cursor-pointer hover:bg-bg-secondary/50 transition-colors text-xs text-text-secondary leading-relaxed"
                    >
                      {task.description || <span className="italic text-text-tertiary/75">No description set. Click to define.</span>}
                    </div>
                  )}
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-5 border-b border-border/40 pb-1.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('comments')}
                    className={cn(
                      "pb-2 text-xs font-bold border-b-2 px-1 transition-all relative",
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
                      "pb-2 text-xs font-bold border-b-2 px-1 transition-all flex items-center gap-1.5 relative",
                      activeTab === 'activity'
                        ? 'border-accent-primary text-text-primary'
                        : 'border-transparent text-text-secondary hover:text-text-primary'
                    )}
                  >
                    <History className="h-3.5 w-3.5" />
                    Activity Logs
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
                          className="text-xs bg-bg-secondary border-border/80 h-9"
                          disabled={addCommentMutation.isPending}
                        />
                        <Button 
                          type="submit" 
                          size="sm" 
                          disabled={addCommentMutation.isPending} 
                          className="gap-1.5 h-9 bg-accent-primary hover:bg-accent-primary-hover active:scale-95 transition-all"
                        >
                          <Send className="h-3.5 w-3.5" />
                          Send
                        </Button>
                      </form>

                      {/* Mentions Suggestion Popover */}
                      {showMentionSuggestions && (
                        <div className="absolute left-0 bottom-full mb-1.5 bg-bg-primary border border-border/80 rounded-xl shadow-xl max-h-40 overflow-y-auto w-64 z-50 p-1 text-xs space-y-0.5 custom-scrollbar">
                          <div className="px-2.5 py-1.5 text-[9px] text-text-tertiary font-bold uppercase tracking-wider border-b border-border/30 mb-1">
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
                                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-bg-hover text-xs transition-colors flex items-center gap-2"
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
                    <div className="space-y-3">
                      {loadingComments ? (
                        <p className="text-[10px] text-text-tertiary animate-pulse font-medium">Loading conversation...</p>
                      ) : !comments || comments.length === 0 ? (
                        <p className="text-[11px] text-text-tertiary italic py-6 text-center">No comments yet. Start the conversation!</p>
                      ) : (
                        comments.map((comment) => (
                          <div
                            key={comment.id}
                            className="flex gap-3 text-xs bg-bg-secondary/40 p-3 rounded-xl border border-border/40 hover:border-border transition-all"
                          >
                            <Avatar displayName={comment.author.displayName} size="xs" />
                            <div className="flex-1 space-y-1.5">
                              <div className="flex justify-between items-center text-[10px] text-text-tertiary font-semibold">
                                <span className="text-text-primary font-bold">
                                  {comment.author.displayName}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span>
                                    {formatDistanceToNow(new Date(comment.createdAt), {
                                      addSuffix: true,
                                    })}
                                  </span>
                                  {comment.author.id === currentUser?.id && (
                                    <div className="flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingCommentId(comment.id)
                                          setEditingCommentContent(comment.content)
                                        }}
                                        className="text-text-tertiary hover:text-text-primary transition-colors"
                                      >
                                        <Edit2 className="h-3 w-3" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => deleteCommentMutation.mutate(comment.id)}
                                        className="text-text-tertiary hover:text-danger transition-colors"
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
                                    className="resize-none h-16 text-xs bg-bg-primary focus:ring-accent-primary"
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
                    {!activities || !activities.data || activities.data.length === 0 ? (
                      <p className="text-[10px] text-text-tertiary italic text-center py-6">No activity logged.</p>
                    ) : (
                      <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[1px] before:bg-border/60 pl-1">
                        {activities.data.map((act: ActivityLogDto) => (
                          <div key={act.id} className="flex gap-3 text-xs pl-1">
                            <div className="h-5 w-5 rounded-full bg-bg-hover border border-border flex items-center justify-center text-[9px] font-bold text-text-secondary shrink-0 z-10">
                              {act.actorDisplayName ? act.actorDisplayName[0].toUpperCase() : 'S'}
                            </div>
                            <div className="flex-1 space-y-1 pt-0.5">
                              <p className="text-[11px] text-text-secondary">
                                <span className="font-semibold text-text-primary">
                                  {act.actorDisplayName}
                                </span>{' '}
                                {act.action}
                              </p>
                              {act.details && (
                                <p className="text-[10px] text-text-tertiary bg-bg-secondary p-2 rounded-lg border border-border/40 leading-normal">
                                  {act.details}
                                </p>
                              )}
                              <span className="text-[9px] text-text-tertiary block font-medium">
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

              {/* Right Column (Sidebar Inspector) */}
              <div className="md:col-span-4 p-6 border-l border-border/40 bg-bg-secondary/30 space-y-5 overflow-y-auto custom-scrollbar">
                {/* Priority Selection */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5 text-text-tertiary/70" />
                    Priority
                  </Label>
                  <Select
                    value={task.priority}
                    onValueChange={(val) => handleUpdateField({ priority: val })}
                  >
                    <SelectTrigger className="h-8.5 text-xs bg-bg-primary border-border/60 rounded-lg shadow-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Due Date */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-text-tertiary/70" />
                    Due Date
                  </Label>
                  <Input
                    type="date"
                    value={task.dueDate ? task.dueDate.split('T')[0] : ''}
                    onChange={(e) => handleUpdateField({ dueDate: e.target.value || null })}
                    className="h-8.5 text-xs bg-bg-primary border-border/60 rounded-lg shadow-xs"
                  />
                </div>

                {/* Assignees Selector */}
                <div className="space-y-2 border-t border-border/40 pt-4">
                  <Label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">Assignees</Label>
                  <div className="flex flex-wrap gap-1 mb-1">
                    {task.assignees?.map((a) => (
                      <span key={a.id} className="inline-flex items-center gap-1 text-[10px] font-semibold bg-bg-primary px-2.5 py-0.5 rounded-full border border-border/80 text-text-secondary">
                        {a.displayName}
                        <button onClick={() => handleAssigneeChange(a.id)}>
                          <X className="h-2.5 w-2.5 text-text-tertiary hover:text-danger transition-colors ml-0.5" />
                        </button>
                      </span>
                    ))}
                  </div>

                  <Select onValueChange={handleAssigneeChange}>
                    <SelectTrigger className="h-8 text-xs bg-bg-primary border-border/60 rounded-lg">
                      <SelectValue placeholder="Add assignee" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {members?.filter(m => !task.assignees?.some(a => a.id === m.userId)).map((m) => (
                        <SelectItem key={m.userId} value={m.userId}>
                          {m.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Labels Selector */}
                <div className="space-y-2 border-t border-border/40 pt-4">
                  <Label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">Labels</Label>
                  <div className="flex flex-wrap gap-1 mb-1">
                    {task.labels?.map((l) => (
                      <span
                        key={l.id}
                        style={{ backgroundColor: l.color + '15', color: l.color, borderColor: l.color + '30' }}
                        className="inline-flex items-center gap-1 text-[9px] font-bold px-2.5 py-0.5 rounded-full border"
                      >
                        {l.name}
                        <button onClick={() => handleLabelChange(l.id)}>
                          <X className="h-2.5 w-2.5 hover:text-danger transition-colors ml-0.5" />
                        </button>
                      </span>
                    ))}
                  </div>

                  <Select onValueChange={handleLabelChange}>
                    <SelectTrigger className="h-8 text-xs bg-bg-primary border-border/60 rounded-lg">
                      <SelectValue placeholder="Add label" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
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
