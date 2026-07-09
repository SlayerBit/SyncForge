package com.syncforge.security.service;

import com.syncforge.module.workspace.domain.WorkspaceRole;
import com.syncforge.module.workspace.service.WorkspaceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class WorkspaceAuthorizationService {

    private final WorkspaceService workspaceService;

    public void checkPermission(UUID userId, UUID workspaceId, WorkspaceRole requiredRole) {
        WorkspaceRole userRole = workspaceService.getMemberRole(workspaceId, userId);
        
        if (userRole == null || !userRole.hasPermission(requiredRole)) {
            log.warn("Access denied for user {} in workspace {}. Required role: {}, Actual role: {}",
                    userId, workspaceId, requiredRole, userRole);
            throw new AccessDeniedException("You don't have permission to perform this action.");
        }
    }
}
