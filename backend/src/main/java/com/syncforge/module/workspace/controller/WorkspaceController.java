package com.syncforge.module.workspace.controller;

import com.syncforge.common.response.ApiResponse;
import com.syncforge.common.exception.BusinessException;
import com.syncforge.module.workspace.domain.WorkspaceRole;
import com.syncforge.module.workspace.dto.*;
import com.syncforge.module.workspace.service.WorkspaceService;
import com.syncforge.security.UserPrincipal;
import com.syncforge.security.service.WorkspaceAuthorizationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Workspaces", description = "Workspace and membership management APIs")
public class WorkspaceController {

    private final WorkspaceService workspaceService;
    private final WorkspaceAuthorizationService authService;

    @PostMapping("/workspaces")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create a new workspace")
    public ApiResponse<WorkspaceDto> createWorkspace(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateWorkspaceRequest request) {
        WorkspaceDto workspace = workspaceService.createWorkspace(principal.getId(), request);
        return ApiResponse.created(workspace);
    }

    @GetMapping("/workspaces")
    @Operation(summary = "List workspaces for the current user")
    public ApiResponse<List<WorkspaceDto>> getMyWorkspaces(@AuthenticationPrincipal UserPrincipal principal) {
        List<WorkspaceDto> workspaces = workspaceService.getUserWorkspaces(principal.getId());
        return ApiResponse.ok(workspaces);
    }

    @GetMapping("/workspaces/{workspaceId}")
    @Operation(summary = "Get workspace details")
    public ApiResponse<WorkspaceDto> getWorkspace(
            @PathVariable UUID workspaceId,
            @AuthenticationPrincipal UserPrincipal principal) {
        authService.checkPermission(principal.getId(), workspaceId, WorkspaceRole.VIEWER);
        WorkspaceDto workspace = workspaceService.getWorkspace(workspaceId);
        return ApiResponse.ok(workspace);
    }

    @PatchMapping("/workspaces/{workspaceId}")
    @Operation(summary = "Update workspace settings")
    public ApiResponse<WorkspaceDto> updateWorkspace(
            @PathVariable UUID workspaceId,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateWorkspaceRequest request) {
        authService.checkPermission(principal.getId(), workspaceId, WorkspaceRole.ADMIN);
        WorkspaceDto workspace = workspaceService.updateWorkspace(workspaceId, request);
        return ApiResponse.ok(workspace);
    }

    @DeleteMapping("/workspaces/{workspaceId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete a workspace")
    public void deleteWorkspace(
            @PathVariable UUID workspaceId,
            @AuthenticationPrincipal UserPrincipal principal) {
        authService.checkPermission(principal.getId(), workspaceId, WorkspaceRole.OWNER);
        workspaceService.deleteWorkspace(workspaceId, principal.getId());
    }

    @GetMapping("/workspaces/{workspaceId}/members")
    @Operation(summary = "Get workspace members")
    public ApiResponse<List<WorkspaceMemberDto>> getMembers(
            @PathVariable UUID workspaceId,
            @AuthenticationPrincipal UserPrincipal principal) {
        authService.checkPermission(principal.getId(), workspaceId, WorkspaceRole.VIEWER);
        List<WorkspaceMemberDto> members = workspaceService.getMembers(workspaceId);
        return ApiResponse.ok(members);
    }

    @DeleteMapping("/workspaces/{workspaceId}/members/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Remove a member from a workspace")
    public void removeMember(
            @PathVariable UUID workspaceId,
            @PathVariable UUID userId,
            @AuthenticationPrincipal UserPrincipal principal) {
        authService.checkPermission(principal.getId(), workspaceId, WorkspaceRole.ADMIN);
        workspaceService.removeMember(workspaceId, userId);
    }

    @PatchMapping("/workspaces/{workspaceId}/members/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Update a member's role")
    public void updateMemberRole(
            @PathVariable UUID workspaceId,
            @PathVariable UUID userId,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateMemberRoleRequest request) {
        authService.checkPermission(principal.getId(), workspaceId, WorkspaceRole.ADMIN);
        workspaceService.updateMemberRole(workspaceId, userId, WorkspaceRole.valueOf(request.role()));
    }

    @PostMapping("/workspaces/{workspaceId}/invitations")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Invite a user to a workspace")
    public ApiResponse<InvitationDto> inviteUser(
            @PathVariable UUID workspaceId,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateInvitationRequest request) {
        authService.checkPermission(principal.getId(), workspaceId, WorkspaceRole.ADMIN);
        // Verify they are not inviting to a role higher than their own
        WorkspaceRole inviterRole = workspaceService.getMemberRole(workspaceId, principal.getId());
        WorkspaceRole targetRole = WorkspaceRole.valueOf(request.role());
        if (targetRole.getLevel() >= inviterRole.getLevel()) {
            throw new BusinessException("Cannot invite users to a role equal or higher than your own.", "FORBIDDEN", HttpStatus.FORBIDDEN);
        }
        InvitationDto invitation = workspaceService.createInvitation(workspaceId, request, principal.getId());
        return ApiResponse.created(invitation);
    }

    @PostMapping("/invitations/{token}/accept")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Accept an invitation to a workspace")
    public void acceptInvitation(
            @PathVariable String token,
            @AuthenticationPrincipal UserPrincipal principal) {
        workspaceService.acceptInvitation(token, principal.getId());
    }

    @DeleteMapping("/workspaces/{workspaceId}/invitations/{invitationId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Revoke a workspace invitation")
    public void revokeInvitation(
            @PathVariable UUID workspaceId,
            @PathVariable UUID invitationId,
            @AuthenticationPrincipal UserPrincipal principal) {
        authService.checkPermission(principal.getId(), workspaceId, WorkspaceRole.ADMIN);
        workspaceService.revokeInvitation(invitationId);
    }

    @GetMapping("/workspaces/{workspaceId}/invitations")
    @Operation(summary = "List pending invitations for a workspace")
    public ApiResponse<List<InvitationDto>> getInvitations(
            @PathVariable UUID workspaceId,
            @AuthenticationPrincipal UserPrincipal principal) {
        authService.checkPermission(principal.getId(), workspaceId, WorkspaceRole.ADMIN);
        List<InvitationDto> invitations = workspaceService.getPendingInvitations(workspaceId);
        return ApiResponse.ok(invitations);
    }

    @PostMapping("/workspaces/{workspaceId}/transfer-ownership")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Transfer ownership of the workspace")
    public void transferOwnership(
            @PathVariable UUID workspaceId,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody TransferOwnershipRequest request) {
        authService.checkPermission(principal.getId(), workspaceId, WorkspaceRole.OWNER);
        workspaceService.transferOwnership(workspaceId, principal.getId(), request.newOwnerId());
    }
}
