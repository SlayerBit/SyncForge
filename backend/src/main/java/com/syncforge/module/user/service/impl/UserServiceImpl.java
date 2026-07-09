package com.syncforge.module.user.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.syncforge.common.exception.ResourceNotFoundException;
import com.syncforge.module.user.domain.User;
import com.syncforge.module.user.domain.UserPreferences;
import com.syncforge.module.user.dto.UpdatePreferencesRequest;
import com.syncforge.module.user.dto.UpdateProfileRequest;
import com.syncforge.module.user.dto.UserDto;
import com.syncforge.module.user.mapper.UserMapper;
import com.syncforge.module.user.repository.UserRepository;
import com.syncforge.module.user.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;

    private static final String CACHE_KEY_PREFIX = "user:";
    private static final Duration BASE_TTL = Duration.ofMinutes(10);

    @Override
    @Transactional(readOnly = true)
    public UserDto getUserById(UUID userId) {
        String cacheKey = CACHE_KEY_PREFIX + userId;
        try {
            Object cached = redisTemplate.opsForValue().get(cacheKey);
            if (cached != null) {
                log.debug("Cache hit for user: {}", userId);
                return objectMapper.convertValue(cached, UserDto.class);
            }
        } catch (Exception e) {
            log.warn("Redis error during user cache read: {}", e.getMessage());
        }

        log.debug("Cache miss for user: {}", userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        UserDto dto = userMapper.toDto(user);

        try {
            long jitterMs = ThreadLocalRandom.current().nextLong(0, BASE_TTL.toMillis() / 5);
            Duration ttlWithJitter = BASE_TTL.plusMillis(jitterMs);
            redisTemplate.opsForValue().set(cacheKey, dto, ttlWithJitter);
        } catch (Exception e) {
            log.warn("Redis error during user cache write: {}", e.getMessage());
        }

        return dto;
    }

    @Override
    @Transactional(readOnly = true)
    public UserDto getUserByEmail(String email) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        return userMapper.toDto(user);
    }

    @Override
    @Transactional
    public UserDto updateProfile(UUID userId, UpdateProfileRequest request) {
        log.info("Updating profile for user: {}", userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        user.updateProfile(request.displayName());
        userRepository.save(user);

        // Invalidate cache
        evictCache(userId);

        return userMapper.toDto(user);
    }

    @Override
    @Transactional
    public UserDto updatePreferences(UUID userId, UpdatePreferencesRequest request) {
        log.info("Updating preferences for user: {}", userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        UserPreferences prefs = user.getPreferences();
        if (request.theme() != null) prefs.setTheme(request.theme());
        if (request.emailNotifications() != null) prefs.setEmailNotifications(request.emailNotifications());
        if (request.timezone() != null) prefs.setTimezone(request.timezone());
        if (request.locale() != null) prefs.setLocale(request.locale());

        user.updatePreferences(prefs);
        userRepository.save(user);

        // Invalidate cache
        evictCache(userId);

        return userMapper.toDto(user);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmailIgnoreCase(email);
    }

    @Override
    @Transactional
    public User createUser(String email, String passwordHash, String displayName) {
        log.info("Creating user with email: {}", email);
        User user = new User(email, passwordHash, displayName);
        return userRepository.save(user);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserDto> getUsersByIds(Collection<UUID> userIds) {
        return userRepository.findAllById(userIds).stream()
                .map(userMapper::toDto)
                .collect(Collectors.toList());
    }

    private void evictCache(UUID userId) {
        String cacheKey = CACHE_KEY_PREFIX + userId;
        try {
            redisTemplate.delete(cacheKey);
            log.debug("Evicted user cache for key: {}", cacheKey);
        } catch (Exception e) {
            log.warn("Redis error during user cache eviction: {}", e.getMessage());
        }
    }
}
