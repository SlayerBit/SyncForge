package com.syncforge.module.user.controller;

import com.syncforge.common.response.ApiResponse;
import com.syncforge.module.user.dto.UpdatePreferencesRequest;
import com.syncforge.module.user.dto.UpdateProfileRequest;
import com.syncforge.module.user.dto.UserDto;
import com.syncforge.module.user.service.UserService;
import com.syncforge.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "User management APIs")
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    @Operation(summary = "Get current user profile")
    public ApiResponse<UserDto> getMyProfile(@AuthenticationPrincipal UserPrincipal principal) {
        UserDto userDto = userService.getUserById(principal.getId());
        return ApiResponse.ok(userDto);
    }

    @PatchMapping("/me")
    @Operation(summary = "Update current user profile")
    public ApiResponse<UserDto> updateProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateProfileRequest request) {
        UserDto userDto = userService.updateProfile(principal.getId(), request);
        return ApiResponse.ok(userDto);
    }

    @PatchMapping("/me/preferences")
    @Operation(summary = "Update current user preferences")
    public ApiResponse<UserDto> updatePreferences(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdatePreferencesRequest request) {
        UserDto userDto = userService.updatePreferences(principal.getId(), request);
        return ApiResponse.ok(userDto);
    }

    @PostMapping("/me/deactivate")
    @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
    @Operation(summary = "Deactivate current user account")
    public void deactivateUser(@AuthenticationPrincipal UserPrincipal principal) {
        userService.deactivateUser(principal.getId());
    }
}
