package com.syncforge.module.workspace.service;

import com.syncforge.module.workspace.domain.WorkspaceRole;
import com.syncforge.module.workspace.dto.*;

import java.util.List;
import java.util.UUID;

public interface WorkspaceService {
    WorkspaceDto createWorkspace(UUID userId, CreateWorkspaceRequest request);
    WorkspaceDto getWorkspace(UUID workspaceId);
    WorkspaceDto updateWorkspace(UUID workspaceId, UpdateWorkspaceRequest request);
    void deleteWorkspace(UUID workspaceId, UUID userId);
    List<WorkspaceDto> getUserWorkspaces(UUID userId);

    WorkspaceMemberDto addMember(UUID workspaceId, UUID userId, WorkspaceRole role);
    void removeMember(UUID workspaceId, UUID userId);
    void updateMemberRole(UUID workspaceId, UUID userId, WorkspaceRole role);
    List<WorkspaceMemberDto> getMembers(UUID workspaceId);
    WorkspaceRole getMemberRole(UUID workspaceId, UUID userId);
    boolean isMember(UUID workspaceId, UUID userId);

    InvitationDto createInvitation(UUID workspaceId, CreateInvitationRequest request, UUID invitedByUserId);
    void acceptInvitation(String token, UUID userId);
    void revokeInvitation(UUID invitationId);
    List<InvitationDto> getPendingInvitations(UUID workspaceId);
    void transferOwnership(UUID workspaceId, UUID ownerId, UUID newOwnerId);
    void cleanupExpiredInvitations();
}
