package com.syncforge.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;

@Component
@RequiredArgsConstructor
@Slf4j
public class RateLimiter {

    private final RedisTemplate<String, Object> redisTemplate;

    public boolean isAllowed(String key, int limit, Duration window) {
        try {
            long now = Instant.now().getEpochSecond();
            long windowSize = window.getSeconds();
            if (windowSize <= 0) {
                return true; 
            }
            long currentWindow = now / windowSize;
            long previousWindow = currentWindow - 1;
            long elapsedInWindow = now % windowSize;
            double weight = 1.0 - ((double) elapsedInWindow / windowSize);

            String currentKey = "rate_limit:" + key + ":" + currentWindow;
            String previousKey = "rate_limit:" + key + ":" + previousWindow;

            Object prevVal = redisTemplate.opsForValue().get(previousKey);
            Long previousCount = null;
            if (prevVal instanceof Number) {
                previousCount = ((Number) prevVal).longValue();
            } else if (prevVal instanceof String) {
                previousCount = Long.parseLong((String) prevVal);
            }

            Long currentCount = redisTemplate.opsForValue().increment(currentKey);
            redisTemplate.expire(currentKey, window.multipliedBy(2));

            double weightedCount = (previousCount != null ? previousCount * weight : 0) + (currentCount != null ? currentCount : 0);
            return weightedCount <= limit;
        } catch (Exception e) {
            log.warn("Redis is down. Rate limiting bypassed (fail open). Error: {}", e.getMessage());
            return true; 
        }
    }
}
