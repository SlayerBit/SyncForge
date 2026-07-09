package com.syncforge.module.realtime.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.syncforge.module.realtime.dto.WebSocketBroadcastMessage;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.listener.PatternTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;

@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketRedisRelay implements MessageListener {

    private final RedisMessageListenerContainer container;
    private final RedisTemplate<String, Object> redisTemplate;
    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;

    @PostConstruct
    public void init() {
        container.addMessageListener(this, new PatternTopic("ws:broadcast"));
        log.info("Registered WebSocketRedisRelay to channel ws:broadcast");
    }

    public void publish(WebSocketBroadcastMessage message) {
        try {
            redisTemplate.convertAndSend("ws:broadcast", message);
            log.debug("Published WebSocket relay message to destination: {}", message.getDestination());
        } catch (Exception e) {
            log.warn("Redis pub/sub failed. Falling back to local broadcast: {}", e.getMessage());
            // Failback to local broadcast immediately
            relayLocally(message);
        }
    }

    @Override
    public void onMessage(Message message, byte[] pattern) {
        try {
            byte[] body = message.getBody();
            // RedisTemplate's Jackson serializer prefixes strings or encloses in JSON wrapper depending on configuration.
            // Since we configured GenericJackson2JsonRedisSerializer, we parse it using objectMapper.
            // But wait, message body might contain serialize info. Let's deserialize using the redisTemplate serializer if possible,
            // or just use objectMapper.
            String json = new String(body, StandardCharsets.UTF_8);
            // If GenericJackson2JsonRedisSerializer was used, it contains class type info or is JSON string.
            // Let's use the redisTemplate's valueSerializer to deserialize:
            Object obj = redisTemplate.getValueSerializer().deserialize(body);
            if (obj instanceof WebSocketBroadcastMessage broadcastMessage) {
                relayLocally(broadcastMessage);
            } else {
                // Try direct parsing
                WebSocketBroadcastMessage broadcastMessage = objectMapper.readValue(json, WebSocketBroadcastMessage.class);
                relayLocally(broadcastMessage);
            }
        } catch (Exception e) {
            log.error("Failed to deserialize WebSocket broadcast message", e);
        }
    }

    private void relayLocally(WebSocketBroadcastMessage message) {
        log.debug("Relaying message locally to destination: {}", message.getDestination());
        if (message.getUsername() != null) {
            messagingTemplate.convertAndSendToUser(
                    message.getUsername(),
                    message.getDestination(),
                    message.getPayload()
            );
        } else {
            messagingTemplate.convertAndSend(
                    message.getDestination(),
                    message.getPayload()
            );
        }
    }
}
