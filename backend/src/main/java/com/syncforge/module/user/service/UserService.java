package com.syncforge.module.user.service;

import com.syncforge.module.user.domain.User;
import com.syncforge.module.user.dto.UpdatePreferencesRequest;
import com.syncforge.module.user.dto.UpdateProfileRequest;
import com.syncforge.module.user.dto.UserDto;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface UserService {
    UserDto getUserById(UUID userId);
    UserDto getUserByEmail(String email);
    UserDto updateProfile(UUID userId, UpdateProfileRequest request);
    UserDto updatePreferences(UUID userId, UpdatePreferencesRequest request);
    boolean existsByEmail(String email);
    User createUser(String email, String passwordHash, String displayName);
    List<UserDto> getUsersByIds(Collection<UUID> userIds);
}
