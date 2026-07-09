import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { boardApi } from './board.api'
import { taskApi } from '@/features/task/api/task.api'
import { BoardDto } from '@/types/common.types'

const queryKeys = {
  boards: (workspaceId: string) => ['workspaces', workspaceId, 'boards'] as const,
  board: (boardId: string) => ['boards', boardId] as const,
}

export function useWorkspaceBoardsQuery(workspaceId: string, includeArchived = false) {
  return useQuery({
    queryKey: queryKeys.boards(workspaceId),
    queryFn: () => boardApi.listWorkspaceBoards(workspaceId, includeArchived),
    enabled: !!workspaceId,
  })
}

export function useBoardQuery(boardId: string) {
  return useQuery({
    queryKey: queryKeys.board(boardId),
    queryFn: () => boardApi.getBoard(boardId),
    enabled: !!boardId,
  })
}

export function useCreateBoardMutation(workspaceId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; description?: string }) => boardApi.createBoard(workspaceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.boards(workspaceId) })
    },
  })
}

export function useUpdateBoardMutation(boardId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; version: number }) => boardApi.updateBoard(boardId, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.board(boardId), updated)
      queryClient.invalidateQueries({ queryKey: queryKeys.boards(updated.workspaceId) })
    },
  })
}

export function useArchiveBoardMutation(workspaceId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: boardApi.archiveBoard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.boards(workspaceId) })
    },
  })
}

export function useMoveTaskMutation(boardId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ taskId, targetColumnId, afterTaskId, version }: {
      taskId: string
      targetColumnId: string
      afterTaskId: string | null
      version: number
    }) => taskApi.move(taskId, { targetColumnId, afterTaskId, version }),
    onMutate: async ({ taskId, targetColumnId, afterTaskId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.board(boardId) })
      const previous = queryClient.getQueryData<BoardDto>(queryKeys.board(boardId))

      if (previous) {
        // Optimistically update local board cache structure
        const updatedColumns = previous.columns.map((col) => {
          // Remove task from its current column if present
          const cleanTasks = col.tasks.filter((t) => t.id !== taskId)
          return { ...col, tasks: cleanTasks }
        })

        // Find the task we are moving
        let movedTask: any = null
        for (const col of previous.columns) {
          const found = col.tasks.find((t) => t.id === taskId)
          if (found) {
            movedTask = { ...found, status: col.id === targetColumnId ? found.status : 'IN_PROGRESS' }
            break
          }
        }

        if (movedTask) {
          // Add task to target column
          const targetColIdx = updatedColumns.findIndex((col) => col.id === targetColumnId)
          if (targetColIdx !== -1) {
            const targetCol = updatedColumns[targetColIdx]
            const targetTasks = [...targetCol.tasks]

            if (afterTaskId === null) {
              targetTasks.unshift(movedTask)
            } else {
              const idx = targetTasks.findIndex((t) => t.id === afterTaskId)
              if (idx !== -1) {
                targetTasks.splice(idx + 1, 0, movedTask)
              } else {
                targetTasks.push(movedTask)
              }
            }

            updatedColumns[targetColIdx] = { ...targetCol, tasks: targetTasks }
          }
        }

        queryClient.setQueryData(queryKeys.board(boardId), {
          ...previous,
          columns: updatedColumns,
        })
      }

      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.board(boardId), context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.board(boardId) })
    },
  })
}
