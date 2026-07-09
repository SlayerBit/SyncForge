package com.syncforge.module.search.service.impl;

import com.syncforge.module.comment.domain.Comment;
import com.syncforge.module.comment.dto.CommentDto;
import com.syncforge.module.comment.mapper.CommentMapper;
import com.syncforge.module.comment.repository.CommentRepository;
import com.syncforge.module.search.dto.SearchResultDto;
import com.syncforge.module.search.service.SearchService;
import com.syncforge.module.task.domain.Task;
import com.syncforge.module.task.domain.TaskAssignment;
import com.syncforge.module.task.dto.TaskDto;
import com.syncforge.module.task.mapper.TaskMapper;
import com.syncforge.module.task.repository.TaskAssignmentRepository;
import com.syncforge.module.task.repository.TaskRepository;
import com.syncforge.module.task.service.CommentCountProvider;
import com.syncforge.module.user.dto.UserSummaryDto;
import com.syncforge.module.user.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SearchServiceImpl implements SearchService {

    private final TaskRepository taskRepository;
    private final TaskAssignmentRepository taskAssignmentRepository;
    private final CommentRepository commentRepository;
    private final TaskMapper taskMapper;
    private final CommentMapper commentMapper;
    private final UserMapper userMapper;
    private final CommentCountProvider commentCountProvider;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String RECENT_SEARCHES_KEY = "search:recent:%s";

    @Override
    @Transactional(readOnly = true)
    public SearchResultDto search(UUID workspaceId, String query, UUID userId) {
        log.info("Performing workspace search in workspace {} for user {} with query {}", workspaceId, userId, query);

        // Record search in Redis if query is non-empty
        if (query != null && !query.trim().isEmpty()) {
            recordSearchQuery(userId, query.trim());
        }

        List<Task> tasks = taskRepository.searchTasksInWorkspace(workspaceId, query);
        List<Comment> comments = commentRepository.searchCommentsInWorkspace(workspaceId, query);

        // Map tasks
        Set<UUID> taskIds = tasks.stream().map(Task::getId).collect(Collectors.toSet());
        Map<UUID, Integer> commentCounts = commentCountProvider.getCommentCounts(taskIds);

        List<TaskDto> taskDtos = tasks.stream()
                .map(t -> {
                    List<UserSummaryDto> assignees = taskAssignmentRepository.findByTaskId(t.getId()).stream()
                            .map(assignment -> userMapper.toSummaryDto(assignment.getUser()))
                            .collect(Collectors.toList());
                    return taskMapper.toDto(t, assignees, commentCounts.getOrDefault(t.getId(), 0));
                })
                .collect(Collectors.toList());

        // Map comments
        List<CommentDto> commentDtos = comments.stream()
                .map(c -> commentMapper.toDto(c, userMapper.toSummaryDto(c.getAuthor())))
                .collect(Collectors.toList());

        List<String> recentQueries = getRecentQueries(userId);

        return new SearchResultDto(taskDtos, commentDtos, recentQueries);
    }

    private void recordSearchQuery(UUID userId, String query) {
        String key = String.format(RECENT_SEARCHES_KEY, userId);
        try {
            // Remove duplicates
            redisTemplate.opsForList().remove(key, 1, query);
            // Push to head
            redisTemplate.opsForList().leftPush(key, query);
            // Trim to max 5
            redisTemplate.opsForList().trim(key, 0, 4);
            // Set 30 days expiration
            redisTemplate.expire(key, Duration.ofDays(30));
        } catch (Exception e) {
            log.warn("Redis error recording search query: {}", e.getMessage());
        }
    }

    @Override
    public List<String> getRecentQueries(UUID userId) {
        String key = String.format(RECENT_SEARCHES_KEY, userId);
        try {
            List<Object> range = redisTemplate.opsForList().range(key, 0, 4);
            if (range != null) {
                return range.stream().map(Object::toString).collect(Collectors.toList());
            }
        } catch (Exception e) {
            log.warn("Redis error fetching recent search queries: {}", e.getMessage());
        }
        return Collections.emptyList();
    }

    @Override
    public void clearRecentQueries(UUID userId) {
        String key = String.format(RECENT_SEARCHES_KEY, userId);
        try {
            redisTemplate.delete(key);
        } catch (Exception e) {
            log.warn("Redis error clearing recent search queries: {}", e.getMessage());
        }
    }
}
