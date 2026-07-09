package com.syncforge.security.jwt;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "syncforge.jwt")
public class JwtProperties {
    private String secret;
    private long accessExpirySeconds = 900; // 15 mins
    private long refreshExpirySeconds = 604800; // 7 days
}
