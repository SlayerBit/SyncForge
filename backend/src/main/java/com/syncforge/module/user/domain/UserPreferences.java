package com.syncforge.module.user.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserPreferences implements Serializable {

    @Builder.Default
    private String theme = "dark";

    @Builder.Default
    private boolean emailNotifications = true;

    @Builder.Default
    private String timezone = "UTC";

    @Builder.Default
    private String locale = "en";
}
