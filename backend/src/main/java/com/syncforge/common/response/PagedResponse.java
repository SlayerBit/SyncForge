package com.syncforge.common.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;

import java.time.Instant;
import java.util.List;

@Getter
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PagedResponse<T> {

    private final List<T> data;
    private final PageInfo page;
    private final Instant timestamp;
    private final String requestId;

    private PagedResponse(List<T> data, PageInfo page, String requestId) {
        this.data = data;
        this.page = page;
        this.timestamp = Instant.now();
        this.requestId = requestId;
    }

    public static <T> PagedResponse<T> of(List<T> data, int number, int size, long totalElements, int totalPages) {
        return new PagedResponse<>(data, new PageInfo(number, size, totalElements, totalPages), null);
    }

    public static <T> PagedResponse<T> of(List<T> data, int number, int size, long totalElements, int totalPages, String requestId) {
        return new PagedResponse<>(data, new PageInfo(number, size, totalElements, totalPages), requestId);
    }

    @Getter
    public static class PageInfo {
        private final int number;
        private final int size;
        private final long totalElements;
        private final int totalPages;

        public PageInfo(int number, int size, long totalElements, int totalPages) {
            this.number = number;
            this.size = size;
            this.totalElements = totalElements;
            this.totalPages = totalPages;
        }
    }
}
