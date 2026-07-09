package com.syncforge.config;

import com.syncforge.security.jwt.JwtTokenProvider;
import com.syncforge.module.workspace.service.WorkspaceService;
import com.syncforge.module.board.service.BoardService;
import com.syncforge.module.board.dto.BoardDto;
import com.syncforge.module.workspace.domain.WorkspaceRole;
import com.syncforge.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.util.StringUtils;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.security.Principal;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
@Slf4j
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtTokenProvider tokenProvider;
    private final WorkspaceService workspaceService;
    private final BoardService boardService;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic", "/queue");
        config.setApplicationDestinationPrefixes("/app");
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOrigins("http://localhost:3000", "http://localhost:5173")
                .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

                if (accessor == null) {
                    return message;
                }

                if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                    String token = accessor.getFirstNativeHeader("Authorization");
                    if (!StringUtils.hasText(token)) {
                        token = accessor.getFirstNativeHeader("token");
                    }
                    if (StringUtils.hasText(token) && token.startsWith("Bearer ")) {
                        token = token.substring(7);
                    }

                    if (StringUtils.hasText(token) && tokenProvider.validateToken(token)) {
                        UserPrincipal principal = tokenProvider.validateAndGetPrincipal(token);
                        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                                principal, null, principal.getAuthorities());
                        accessor.setUser(auth);
                        log.debug("WebSocket authenticated user: {}", principal.getId());
                    } else {
                        log.warn("WebSocket connection attempt without valid JWT token");
                        throw new AccessDeniedException("Unauthorized WebSocket connection");
                    }
                } else if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
                    Principal principal = accessor.getUser();
                    if (principal == null) {
                        throw new AccessDeniedException("User not authenticated");
                    }

                    UserPrincipal user = (UserPrincipal) ((UsernamePasswordAuthenticationToken) principal).getPrincipal();
                    String destination = accessor.getDestination();

                    if (destination != null) {
                        validateSubscription(destination, user.getId());
                    }
                }

                return message;
            }
        });
    }

    private void validateSubscription(String destination, UUID userId) {
        // 1. Topic Board: /topic/board/{boardId}
        Pattern boardPattern = Pattern.compile("^/topic/board/([^/]+)$");
        Matcher boardMatcher = boardPattern.matcher(destination);
        if (boardMatcher.matches()) {
            UUID boardId = UUID.fromString(boardMatcher.group(1));
            BoardDto board = boardService.getBoard(boardId);
            if (!workspaceService.isMember(board.workspaceId(), userId)) {
                log.warn("Subscription denied: user {} is not a member of board's {} workspace {}", userId, boardId, board.workspaceId());
                throw new AccessDeniedException("Access denied to board topic");
            }
            return;
        }

        // 2. Topic Workspace Presence: /topic/workspace/{workspaceId}/presence
        Pattern presencePattern = Pattern.compile("^/topic/workspace/([^/]+)/presence$");
        Matcher presenceMatcher = presencePattern.matcher(destination);
        if (presenceMatcher.matches()) {
            UUID workspaceId = UUID.fromString(presenceMatcher.group(1));
            if (!workspaceService.isMember(workspaceId, userId)) {
                log.warn("Subscription denied: user {} is not a member of workspace {}", userId, workspaceId);
                throw new AccessDeniedException("Access denied to workspace presence topic");
            }
            return;
        }

        // 3. User queue notifications: /user/queue/notifications
        if (destination.startsWith("/user/") || destination.contains("/queue/notifications")) {
            // Private user destinations are checked by Spring Security/destination resolvers.
            // We allow this sub as long as they are authenticated.
            return;
        }

        log.warn("Subscription denied: invalid/unauthorized destination {}", destination);
        throw new AccessDeniedException("Unauthorized subscription path");
    }
}
