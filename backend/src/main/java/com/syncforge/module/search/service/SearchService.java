package com.syncforge.module.search.service;

import com.syncforge.module.search.dto.SearchResultDto;

import java.util.List;
import java.util.UUID;

public interface SearchService {
    SearchResultDto search(UUID workspaceId, String query, UUID userId);
    List<String> getRecentQueries(UUID userId);
    void clearRecentQueries(UUID userId);
}
