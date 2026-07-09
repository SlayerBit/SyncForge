package com.syncforge.module.search.controller;

import com.syncforge.common.response.ApiResponse;
import com.syncforge.module.search.dto.SearchResultDto;
import com.syncforge.module.search.service.SearchService;
import com.syncforge.module.workspace.domain.WorkspaceRole;
import com.syncforge.security.UserPrincipal;
import com.syncforge.security.service.WorkspaceAuthorizationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Search", description = "Workspace global search and history APIs")
public class SearchController {

    private final SearchService searchService;
    private final WorkspaceAuthorizationService authService;

    @GetMapping("/workspaces/{workspaceId}/search")
    @Operation(summary = "Search tasks and comments in a workspace")
    public ApiResponse<SearchResultDto> search(
            @PathVariable UUID workspaceId,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(name = "q") String query) {
        authService.checkPermission(principal.getId(), workspaceId, WorkspaceRole.VIEWER);
        SearchResultDto results = searchService.search(workspaceId, query, principal.getId());
        return ApiResponse.ok(results);
    }

    @GetMapping("/search/recent")
    @Operation(summary = "Get user's recent search queries")
    public ApiResponse<List<String>> getRecentQueries(@AuthenticationPrincipal UserPrincipal principal) {
        List<String> recent = searchService.getRecentQueries(principal.getId());
        return ApiResponse.ok(recent);
    }

    @DeleteMapping("/search/recent")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Clear user's search history")
    public void clearRecentQueries(@AuthenticationPrincipal UserPrincipal principal) {
        searchService.clearRecentQueries(principal.getId());
    }
}
