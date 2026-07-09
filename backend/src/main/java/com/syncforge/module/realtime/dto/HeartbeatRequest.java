package com.syncforge.module.realtime.dto;

import java.util.UUID;

public record HeartbeatRequest(
        UUID workspaceId
) {}
