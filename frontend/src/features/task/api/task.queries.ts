import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { taskApi } from './task.api'

const queryKeys = {
  task: (taskId: string) => ['tasks', taskId] as const,
}

export function useTaskQuery(taskId: string | null) {
  return useQuery({
    queryKey: queryKeys.task(taskId!),
    queryFn: () => taskApi.get(taskId!),
    enabled: !!taskId,
  })
}

export function useCreateTaskMutation(boardId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ columnId, ...data }: {
      columnId: string
      title: string
      description?: string
      priority: string
      dueDate?: string
      assigneeIds?: string[]
      labelIds?: string[]
    }) => taskApi.create(columnId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards', boardId] })
    },
  })
}

export function useUpdateTaskMutation(boardId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ taskId, ...data }: {
      taskId: string
      title?: string
      description?: string
      priority?: string
      dueDate?: string | null
      version: number
    }) => taskApi.update(taskId, data as any),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.task(variables.taskId) })
      queryClient.invalidateQueries({ queryKey: ['boards', boardId] })
    },
  })
}

export function useArchiveTaskMutation(boardId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: taskApi.archive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards', boardId] })
    },
  })
}

export function useAssignTaskMutation(boardId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ taskId, userId }: { taskId: string; userId: string }) =>
      taskApi.assign(taskId, userId),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.task(taskId) })
      queryClient.invalidateQueries({ queryKey: ['boards', boardId] })
    },
  })
}

export function useUnassignTaskMutation(boardId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ taskId, userId }: { taskId: string; userId: string }) =>
      taskApi.unassign(taskId, userId),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.task(taskId) })
      queryClient.invalidateQueries({ queryKey: ['boards', boardId] })
    },
  })
}

export function useAddLabelMutation(boardId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ taskId, labelId }: { taskId: string; labelId: string }) =>
      taskApi.addLabel(taskId, labelId),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.task(taskId) })
      queryClient.invalidateQueries({ queryKey: ['boards', boardId] })
    },
  })
}

export function useRemoveLabelMutation(boardId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ taskId, labelId }: { taskId: string; labelId: string }) =>
      taskApi.removeLabel(taskId, labelId),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.task(taskId) })
      queryClient.invalidateQueries({ queryKey: ['boards', boardId] })
    },
  })
}
