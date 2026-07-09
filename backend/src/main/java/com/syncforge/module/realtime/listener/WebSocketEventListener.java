package com.syncforge.module.realtime.listener;

import com.syncforge.module.realtime.service.PresenceService;
import com.syncforge.module.workspace.dto.WorkspaceDto;
import com.syncforge.module.workspace.service.WorkspaceService;
import com.syncforge.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketEventListener {

    private final PresenceService presenceService;
    private final WorkspaceService workspaceService;

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        Principal principal = headerAccessor.getUser();

        if (principal instanceof UsernamePasswordAuthenticationToken authToken) {
            if (authToken.getPrincipal() instanceof UserPrincipal userPrincipal) {
                log.info("WebSocket connection closed for user: {}", userPrincipal.getId());
                // Find all workspaces this user is member of
                List<WorkspaceDto> userWorkspaces = workspaceService.getUserWorkspaces(userPrincipal.getId());
                for (WorkspaceDto ws : userWorkspaces) {
                    presenceService.markOffline(ws.id(), userPrincipal.getId());
                }
            }
        }
    }
}
