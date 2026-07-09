package com.syncforge.common.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;

import java.time.Instant;
import java.util.List;

@Getter
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CursorResponse<T> {

    private final List<T> data;
    private final CursorInfo cursor;
    private final Instant timestamp;
    private final String requestId;

    private CursorResponse(List<T> data, CursorInfo cursor, String requestId) {
        this.data = data;
        this.cursor = cursor;
        this.timestamp = Instant.now();
        this.requestId = requestId;
    }

    public static <T> CursorResponse<T> of(List<T> data, String next, boolean hasMore) {
        return new CursorResponse<>(data, new CursorInfo(next, hasMore), null);
    }

    public static <T> CursorResponse<T> of(List<T> data, String next, boolean hasMore, String requestId) {
        return new CursorResponse<>(data, new CursorInfo(next, hasMore), requestId);
    }

    @Getter
    public static class CursorInfo {
        private final String next;
        private final boolean hasMore;

        public CursorInfo(String next, boolean hasMore) {
            this.next = next;
            this.hasMore = hasMore;
        }
    }
}
