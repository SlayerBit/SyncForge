package com.syncforge.module.workspace.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record TransferOwnershipRequest(
        @NotNull
        UUID newOwnerId
) {}
