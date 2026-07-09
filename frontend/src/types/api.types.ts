export interface ApiResponse<T> {
  data: T
  timestamp: string
  requestId: string
}

export interface PagedResponse<T> {
  data: T[]
  page: {
    number: number
    size: number
    totalElements: number
    totalPages: number
  }
  timestamp: string
  requestId: string
}

export interface CursorResponse<T> {
  data: T[]
  cursor: {
    next: string | null
    hasMore: boolean
  }
  timestamp: string
  requestId: string
}

export interface ErrorDetails {
  field: string
  message: string
}

export interface ErrorResponse {
  status: number
  error: string
  message: string
  details?: ErrorDetails[]
  timestamp: string
  requestId: string
  traceId?: string
}
