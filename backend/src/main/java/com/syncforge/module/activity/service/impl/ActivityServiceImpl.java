package com.syncforge.module.activity.service.impl;

import com.syncforge.common.exception.ResourceNotFoundException;
import com.syncforge.common.response.CursorResponse;
import com.syncforge.module.activity.domain.ActivityLog;
import com.syncforge.module.activity.dto.ActivityLogDto;
import com.syncforge.module.activity.mapper.ActivityMapper;
import com.syncforge.module.activity.repository.ActivityLogRepository;
import com.syncforge.module.activity.service.ActivityService;
import com.syncforge.module.user.domain.User;
import com.syncforge.module.user.mapper.UserMapper;
import com.syncforge.module.user.repository.UserRepository;
import com.syncforge.module.workspace.domain.Workspace;
import com.syncforge.module.workspace.repository.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Slice;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ActivityServiceImpl implements ActivityService {

    private final ActivityLogRepository activityLogRepository;
    private final WorkspaceRepository workspaceRepository;
    private final UserRepository userRepository;
    private final ActivityMapper activityMapper;
    private final UserMapper userMapper;

    @Override
    @Transactional
    public void logActivity(UUID workspaceId, UUID actorId, String entityType, UUID entityId, String action, Map<String, Object> changes) {
        log.info("Logging activity: {} on {} {} in workspace {}", action, entityType, entityId, workspaceId);
        Workspace workspace = workspaceRepository.findById(workspaceId).orElse(null);
        User actor = userRepository.findById(actorId).orElse(null);

        if (workspace == null || actor == null) {
            log.warn("Failed to log activity: workspace or actor not found");
            return;
        }

        ActivityLog activityLog = new ActivityLog(workspace, actor, entityType, entityId, action, changes);
        activityLogRepository.save(activityLog);
    }

    @Override
    @Transactional(readOnly = true)
    public CursorResponse<ActivityLogDto> getWorkspaceActivity(UUID workspaceId, UUID cursor, int size) {
        PageRequest pageRequest = PageRequest.of(0, size);
        Slice<ActivityLog> slice;
        if (cursor == null) {
            slice = activityLogRepository.findByWorkspaceFirstPage(workspaceId, pageRequest);
        } else {
            slice = activityLogRepository.findByWorkspaceWithCursor(workspaceId, cursor, pageRequest);
        }

        List<ActivityLogDto> dtos = slice.getContent().stream()
                .map(log -> activityMapper.toDto(log, userMapper.toSummaryDto(log.getActor())))
                .collect(Collectors.toList());

        String nextCursor = null;
        if (slice.hasNext() && !dtos.isEmpty()) {
            nextCursor = dtos.get(dtos.size() - 1).id().toString();
        }

        return CursorResponse.of(dtos, nextCursor, slice.hasNext());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ActivityLogDto> getEntityActivity(String entityType, UUID entityId) {
        return activityLogRepository.findByEntity(entityType, entityId).stream()
                .map(log -> activityMapper.toDto(log, userMapper.toSummaryDto(log.getActor())))
                .collect(Collectors.toList());
    }
}
