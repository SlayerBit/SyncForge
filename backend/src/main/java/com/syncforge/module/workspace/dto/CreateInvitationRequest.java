package com.syncforge.module.workspace.dto;

import com.syncforge.common.validation.ValidEnum;
import com.syncforge.module.workspace.domain.WorkspaceRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record CreateInvitationRequest(
        @NotBlank
        @Email
        String email,

        @NotBlank
        @ValidEnum(enumClass = WorkspaceRole.class, ignoreCase = false)
        String role
) {}
