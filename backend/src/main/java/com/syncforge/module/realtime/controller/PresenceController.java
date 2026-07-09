package com.syncforge.module.realtime.controller;

import com.syncforge.module.realtime.dto.HeartbeatRequest;
import com.syncforge.module.realtime.service.PresenceService;
import com.syncforge.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
@RequiredArgsConstructor
@Slf4j
public class PresenceController {

    private final PresenceService presenceService;

    @MessageMapping("/presence/heartbeat")
    public void receiveHeartbeat(Principal principal, HeartbeatRequest request) {
        if (principal instanceof UsernamePasswordAuthenticationToken authToken) {
            if (authToken.getPrincipal() instanceof UserPrincipal userPrincipal) {
                if (request.workspaceId() != null) {
                    presenceService.markOnline(request.workspaceId(), userPrincipal.getId());
                }
            }
        }
    }
}
