package com.syncforge.common.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;

import java.time.Instant;

@Getter
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private final T data;
    private final Instant timestamp;
    private final String requestId;

    private ApiResponse(T data, String requestId) {
        this.data = data;
        this.timestamp = Instant.now();
        this.requestId = requestId;
    }

    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(data, null);
    }

    public static <T> ApiResponse<T> created(T data) {
        return new ApiResponse<>(data, null);
    }

    public static <T> ApiResponse<T> of(T data, String requestId) {
        return new ApiResponse<>(data, requestId);
    }
}
