package com.syncforge.module.task.service.impl;

import com.syncforge.common.exception.BusinessException;
import com.syncforge.common.exception.ResourceNotFoundException;
import com.syncforge.common.util.FractionalIndex;
import com.syncforge.module.board.domain.Board;
import com.syncforge.module.board.domain.BoardColumn;
import com.syncforge.module.board.repository.BoardColumnRepository;
import com.syncforge.module.board.repository.BoardRepository;
import com.syncforge.module.task.domain.*;
import com.syncforge.module.task.dto.*;
import com.syncforge.module.task.event.*;
import com.syncforge.module.task.mapper.TaskMapper;
import com.syncforge.module.task.repository.LabelRepository;
import com.syncforge.module.task.repository.TaskAssignmentRepository;
import com.syncforge.module.task.repository.TaskRepository;
import com.syncforge.module.task.service.CommentCountProvider;
import com.syncforge.module.task.service.TaskService;
import com.syncforge.module.user.domain.User;
import com.syncforge.module.user.dto.UserSummaryDto;
import com.syncforge.module.user.mapper.UserMapper;
import com.syncforge.module.user.repository.UserRepository;
import com.syncforge.module.workspace.domain.Workspace;
import com.syncforge.module.workspace.repository.WorkspaceMemberRepository;
import com.syncforge.module.workspace.repository.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TaskServiceImpl implements TaskService {

    private final TaskRepository taskRepository;
    private final TaskAssignmentRepository taskAssignmentRepository;
    private final LabelRepository labelRepository;
    private final BoardRepository boardRepository;
    private final BoardColumnRepository boardColumnRepository;
    private final UserRepository userRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final WorkspaceRepository workspaceRepository;
    private final TaskMapper taskMapper;
    private final UserMapper userMapper;
    private final CommentCountProvider commentCountProvider;
    private final ApplicationEventPublisher eventPublisher;
    private final com.syncforge.common.metrics.SyncForgeMetrics metrics;

    private List<UserSummaryDto> getAssigneesForTask(UUID taskId) {
        return taskAssignmentRepository.findByTaskId(taskId).stream()
                .map(assignment -> userMapper.toSummaryDto(assignment.getUser()))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public TaskDto createTask(UUID columnId, CreateTaskRequest request, UUID creatorId) {
        log.info("Creating task in column: {}", columnId);
        BoardColumn column = boardColumnRepository.findById(columnId)
                .orElseThrow(() -> new ResourceNotFoundException("BoardColumn", columnId));

        Board board = column.getBoard();
        UUID workspaceId = board.getWorkspace().getId();

        User creator = userRepository.findById(creatorId)
                .orElseThrow(() -> new ResourceNotFoundException("User", creatorId));

        // WIP limit check
        if (column.getTaskLimit() != null) {
            long activeCount = taskRepository.countActiveTasksByColumnId(columnId);
            if (activeCount >= column.getTaskLimit()) {
                throw new BusinessException("Column WIP limit exceeded", "WIP_LIMIT_EXCEEDED", HttpStatus.BAD_REQUEST);
            }
        }

        // Sequential Identifier generation
        int sequence = board.incrementTaskSequence();
        boardRepository.save(board);
        String identifier = board.getPrefix() + "-" + sequence;

        // Position generation (at the end)
        List<Task> currentTasks = taskRepository.findByColumnIdAndArchivedFalseOrderByPositionAsc(columnId);
        String before = currentTasks.isEmpty() ? null : currentTasks.get(currentTasks.size() - 1).getPosition();
        String position = FractionalIndex.midpoint(before, null);

        Priority priority = request.priority() != null ? Priority.valueOf(request.priority()) : Priority.NONE;

        Task task = new Task(column, board, request.title(), request.description(), priority, position, identifier, creator, request.dueDate());

        // Assignees
        if (request.assigneeIds() != null && !request.assigneeIds().isEmpty()) {
            if (request.assigneeIds().size() > 5) {
                throw new BusinessException("A task cannot have more than 5 assignees.", "LIMIT_EXCEEDED", HttpStatus.BAD_REQUEST);
            }
            for (UUID assigneeId : request.assigneeIds()) {
                if (!workspaceMemberRepository.existsByWorkspaceIdAndUserId(workspaceId, assigneeId)) {
                    throw new BusinessException("Assignee must be a member of the workspace.", "ASSIGNEE_NOT_MEMBER", HttpStatus.BAD_REQUEST);
                }
            }
        }

        // Labels
        if (request.labelIds() != null && !request.labelIds().isEmpty()) {
            if (request.labelIds().size() > 10) {
                throw new BusinessException("A task cannot have more than 10 labels.", "LIMIT_EXCEEDED", HttpStatus.BAD_REQUEST);
            }
            List<Label> labels = labelRepository.findAllById(request.labelIds());
            for (Label label : labels) {
                if (!label.getWorkspace().getId().equals(workspaceId)) {
                    throw new BusinessException("Label must belong to the workspace.", "LABEL_SCOPE_MISMATCH", HttpStatus.BAD_REQUEST);
                }
                task.addLabel(label);
            }
        }

        taskRepository.save(task);

        List<UserSummaryDto> assignees = new ArrayList<>();
        if (request.assigneeIds() != null) {
            List<User> users = userRepository.findAllById(request.assigneeIds());
            for (User u : users) {
                TaskAssignment assignment = new TaskAssignment(task, u);
                taskAssignmentRepository.save(assignment);
                assignees.add(userMapper.toSummaryDto(u));
            }
        }

        // Event
        eventPublisher.publishEvent(new TaskCreated(task.getId(), board.getId(), columnId, workspaceId, identifier, task.getTitle(), creatorId));

        return taskMapper.toDto(task, assignees, 0);
    }

    @Override
    @Transactional(readOnly = true)
    public TaskDto getTask(UUID taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task", taskId));
        List<UserSummaryDto> assignees = getAssigneesForTask(taskId);
        int commentCount = commentCountProvider.getCommentCount(taskId);
        return taskMapper.toDto(task, assignees, commentCount);
    }

    @Override
    @Transactional
    public TaskDto updateTask(UUID taskId, UpdateTaskRequest request, UUID actorId) {
        log.info("Updating task: {}", taskId);
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task", taskId));

        if (!Objects.equals(task.getVersion(), request.version())) {
            throw new ObjectOptimisticLockingFailureException(Task.class, taskId);
        }

        Priority priority = request.priority() != null ? Priority.valueOf(request.priority()) : Priority.NONE;
        task.update(request.title(), request.description(), priority, request.dueDate());
        taskRepository.save(task);

        // Event
        eventPublisher.publishEvent(new TaskUpdated(taskId, task.getBoard().getId(), task.getBoard().getWorkspace().getId(), actorId));

        List<UserSummaryDto> assignees = getAssigneesForTask(taskId);
        int commentCount = commentCountProvider.getCommentCount(taskId);
        return taskMapper.toDto(task, assignees, commentCount);
    }

    @Override
    @Transactional
    public void archiveTask(UUID taskId, UUID actorId) {
        log.info("Archiving task: {}", taskId);
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task", taskId));

        task.archive();
        taskRepository.save(task);

        // Event
        eventPublisher.publishEvent(new TaskArchived(taskId, task.getBoard().getId(), task.getBoard().getWorkspace().getId(), actorId));
    }

    @Override
    @Transactional
    public void moveTask(UUID taskId, MoveTaskRequest request, UUID actorId) {
        log.info("Moving task {} to column {}", taskId, request.targetColumnId());
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task", taskId));

        if (!Objects.equals(task.getVersion(), request.version())) {
            throw new ObjectOptimisticLockingFailureException(Task.class, taskId);
        }

        BoardColumn targetColumn = boardColumnRepository.findById(request.targetColumnId())
                .orElseThrow(() -> new ResourceNotFoundException("BoardColumn", request.targetColumnId()));

        if (!targetColumn.getBoard().getId().equals(task.getBoard().getId())) {
            throw new BusinessException("Cannot move task to a column on a different board.", "INVALID_MOVE", HttpStatus.BAD_REQUEST);
        }

        UUID fromColumnId = task.getColumn().getId();

        // WIP Limit check if column changed
        if (!fromColumnId.equals(request.targetColumnId()) && targetColumn.getTaskLimit() != null) {
            long activeCount = taskRepository.countActiveTasksByColumnId(request.targetColumnId());
            if (activeCount >= targetColumn.getTaskLimit()) {
                throw new BusinessException("Target column WIP limit exceeded.", "WIP_LIMIT_EXCEEDED", HttpStatus.BAD_REQUEST);
            }
        }

        List<Task> tasksInTarget = taskRepository.findByColumnIdAndArchivedFalseOrderByPositionAsc(request.targetColumnId());

        // Position calculation
        String before = null;
        String after = null;

        if (request.afterTaskId() == null) {
            if (!tasksInTarget.isEmpty()) {
                after = tasksInTarget.get(0).getPosition();
            }
        } else {
            int idx = -1;
            for (int i = 0; i < tasksInTarget.size(); i++) {
                if (tasksInTarget.get(i).getId().equals(request.afterTaskId())) {
                    idx = i;
                    break;
                }
            }
            if (idx == -1) {
                throw new BusinessException("Target afterTask not found in column.", "NOT_FOUND", HttpStatus.NOT_FOUND);
            }
            before = tasksInTarget.get(idx).getPosition();
            if (idx + 1 < tasksInTarget.size()) {
                after = tasksInTarget.get(idx + 1).getPosition();
            }
        }

        String newPosition = FractionalIndex.midpoint(before, after);
        if (!fromColumnId.equals(request.targetColumnId())) {
            metrics.incrementTaskTransition(task.getColumn().getName(), targetColumn.getName());
        }
        task.move(targetColumn, newPosition);
        taskRepository.save(task);

        // Event
        eventPublisher.publishEvent(new TaskMoved(taskId, task.getBoard().getId(), task.getBoard().getWorkspace().getId(), fromColumnId, request.targetColumnId(), newPosition, actorId));
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaskDto> getColumnTasks(UUID columnId) {
        List<Task> tasks = taskRepository.findByColumnIdAndArchivedFalseOrderByPositionAsc(columnId);
        Set<UUID> taskIds = tasks.stream().map(Task::getId).collect(Collectors.toSet());
        Map<UUID, Integer> commentCounts = commentCountProvider.getCommentCounts(taskIds);

        return tasks.stream()
                .map(t -> taskMapper.toDto(t, getAssigneesForTask(t.getId()), commentCounts.getOrDefault(t.getId(), 0)))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaskDto> getBoardTasks(UUID boardId, boolean includeArchived) {
        List<Task> tasks = taskRepository.findByBoardIdAndArchived(boardId, includeArchived);
        Set<UUID> taskIds = tasks.stream().map(Task::getId).collect(Collectors.toSet());
        Map<UUID, Integer> commentCounts = commentCountProvider.getCommentCounts(taskIds);

        return tasks.stream()
                .map(t -> taskMapper.toDto(t, getAssigneesForTask(t.getId()), commentCounts.getOrDefault(t.getId(), 0)))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public com.syncforge.common.response.PagedResponse<TaskDto> getFilteredTasks(
            UUID boardId, String status, String priority, UUID assigneeId, UUID labelId, Boolean archived, org.springframework.data.domain.Pageable pageable) {
        log.info("Querying tasks for board {} with dynamic filters", boardId);

        org.springframework.data.jpa.domain.Specification<Task> spec = (root, query, cb) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("board").get("id"), boardId));

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), TaskStatus.valueOf(status)));
            }
            if (priority != null) {
                predicates.add(cb.equal(root.get("priority"), Priority.valueOf(priority)));
            }
            if (archived != null) {
                predicates.add(cb.equal(root.get("archived"), archived));
            }
            if (assigneeId != null) {
                predicates.add(cb.equal(root.join("assignments").get("user").get("id"), assigneeId));
            }
            if (labelId != null) {
                predicates.add(cb.equal(root.join("labels").get("id"), labelId));
            }

            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };

        org.springframework.data.domain.Page<Task> page = taskRepository.findAll(spec, pageable);
        Set<UUID> taskIds = page.getContent().stream().map(Task::getId).collect(Collectors.toSet());
        Map<UUID, Integer> commentCounts = commentCountProvider.getCommentCounts(taskIds);

        List<TaskDto> dtos = page.getContent().stream()
                .map(t -> taskMapper.toDto(t, getAssigneesForTask(t.getId()), commentCounts.getOrDefault(t.getId(), 0)))
                .collect(Collectors.toList());

        return com.syncforge.common.response.PagedResponse.of(
                dtos,
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages()
        );
    }

    @Override
    @Transactional
    public void assignUser(UUID taskId, UUID userId, UUID actorId) {
        log.info("Assigning user {} to task {}", userId, taskId);
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task", taskId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        if (!workspaceMemberRepository.existsByWorkspaceIdAndUserId(task.getBoard().getWorkspace().getId(), userId)) {
            throw new BusinessException("User must be a member of the workspace.", "ASSIGNEE_NOT_MEMBER", HttpStatus.BAD_REQUEST);
        }

        if (taskAssignmentRepository.existsByTaskIdAndUserId(taskId, userId)) {
            throw new BusinessException("User is already assigned to this task.", "ALREADY_ASSIGNED", HttpStatus.CONFLICT);
        }

        List<TaskAssignment> current = taskAssignmentRepository.findByTaskId(taskId);
        if (current.size() >= 5) {
            throw new BusinessException("A task cannot have more than 5 assignees.", "LIMIT_EXCEEDED", HttpStatus.BAD_REQUEST);
        }

        TaskAssignment assignment = new TaskAssignment(task, user);
        taskAssignmentRepository.save(assignment);

        // Event
        eventPublisher.publishEvent(new TaskAssigned(taskId, userId, actorId, task.getBoard().getId(), task.getBoard().getWorkspace().getId(), task.getIdentifier()));
    }

    @Override
    @Transactional
    public void unassignUser(UUID taskId, UUID userId, UUID actorId) {
        log.info("Unassigning user {} from task {}", userId, taskId);
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task", taskId));

        TaskAssignment assignment = taskAssignmentRepository.findByTaskIdAndUserId(taskId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment record not found."));

        taskAssignmentRepository.delete(assignment);

        // Event
        eventPublisher.publishEvent(new TaskUnassigned(taskId, userId, task.getBoard().getId(), task.getBoard().getWorkspace().getId(), actorId));
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserSummaryDto> getAssignees(UUID taskId) {
        return getAssigneesForTask(taskId);
    }

    @Override
    @Transactional
    public LabelDto createLabel(UUID workspaceId, CreateLabelRequest request) {
        log.info("Creating label {} in workspace {}", request.name(), workspaceId);
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace", workspaceId));

        if (labelRepository.existsByWorkspaceIdAndNameIgnoreCase(workspaceId, request.name())) {
            throw new BusinessException("Label name already exists in this workspace.", "DUPLICATE_LABEL", HttpStatus.CONFLICT);
        }

        long labelCount = labelRepository.countByWorkspaceId(workspaceId);
        if (labelCount >= 50) {
            throw new BusinessException("Workspace has reached the limit of 50 labels.", "LIMIT_EXCEEDED", HttpStatus.BAD_REQUEST);
        }

        Label label = new Label(workspace, request.name(), request.color());
        labelRepository.save(label);

        return taskMapper.toLabelDto(label);
    }

    @Override
    @Transactional(readOnly = true)
    public LabelDto getLabel(UUID labelId) {
        Label label = labelRepository.findById(labelId)
                .orElseThrow(() -> new ResourceNotFoundException("Label", labelId));
        return taskMapper.toLabelDto(label);
    }

    @Override
    @Transactional
    public void deleteLabel(UUID labelId) {
        log.info("Deleting label: {}", labelId);
        Label label = labelRepository.findById(labelId)
                .orElseThrow(() -> new ResourceNotFoundException("Label", labelId));

        labelRepository.delete(label);
    }

    @Override
    @Transactional(readOnly = true)
    public List<LabelDto> getWorkspaceLabels(UUID workspaceId) {
        return labelRepository.findByWorkspaceId(workspaceId).stream()
                .map(taskMapper::toLabelDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void addLabelToTask(UUID taskId, UUID labelId, UUID actorId) {
        log.info("Adding label {} to task {}", labelId, taskId);
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task", taskId));

        Label label = labelRepository.findById(labelId)
                .orElseThrow(() -> new ResourceNotFoundException("Label", labelId));

        if (!label.getWorkspace().getId().equals(task.getBoard().getWorkspace().getId())) {
            throw new BusinessException("Label scope mismatch.", "LABEL_SCOPE_MISMATCH", HttpStatus.BAD_REQUEST);
        }

        if (task.getLabels().size() >= 10) {
            throw new BusinessException("A task cannot have more than 10 labels.", "LIMIT_EXCEEDED", HttpStatus.BAD_REQUEST);
        }

        task.addLabel(label);
        taskRepository.save(task);

        // Event
        eventPublisher.publishEvent(new LabelAdded(taskId, labelId, label.getName(), task.getBoard().getId(), task.getBoard().getWorkspace().getId(), actorId));
    }

    @Override
    @Transactional
    public void removeLabelFromTask(UUID taskId, UUID labelId, UUID actorId) {
        log.info("Removing label {} from task {}", labelId, taskId);
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task", taskId));

        Label label = labelRepository.findById(labelId)
                .orElseThrow(() -> new ResourceNotFoundException("Label", labelId));

        task.removeLabel(label);
        taskRepository.save(task);

        // Event
        eventPublisher.publishEvent(new LabelRemoved(taskId, labelId, label.getName(), task.getBoard().getId(), task.getBoard().getWorkspace().getId(), actorId));
    }
}
