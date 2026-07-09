package com.syncforge.module.user.dto;

public record UpdatePreferencesRequest(
        String theme,
        Boolean emailNotifications,
        String timezone,
        String locale
) {}
