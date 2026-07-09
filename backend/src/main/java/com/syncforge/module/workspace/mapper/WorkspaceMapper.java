package com.syncforge.module.workspace.mapper;

import com.syncforge.common.util.GravatarUtils;
import com.syncforge.module.workspace.domain.Workspace;
import com.syncforge.module.workspace.domain.WorkspaceInvitation;
import com.syncforge.module.workspace.domain.WorkspaceMember;
import com.syncforge.module.workspace.dto.InvitationDto;
import com.syncforge.module.workspace.dto.WorkspaceDto;
import com.syncforge.module.workspace.dto.WorkspaceMemberDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.ERROR, imports = {GravatarUtils.class})
public interface WorkspaceMapper {

    @Mapping(target = "ownerId", source = "owner.id")
    WorkspaceDto toDto(Workspace workspace);

    @Mapping(target = "userId", source = "user.id")
    @Mapping(target = "displayName", source = "user.displayName")
    @Mapping(target = "email", source = "user.email")
    @Mapping(target = "avatarUrl", expression = "java(GravatarUtils.getAvatarUrl(member.getUser().getEmail()))")
    @Mapping(target = "role", expression = "java(member.getRole().name())")
    WorkspaceMemberDto toMemberDto(WorkspaceMember member);

    @Mapping(target = "workspaceId", source = "workspace.id")
    @Mapping(target = "role", expression = "java(invitation.getRole().name())")
    @Mapping(target = "status", expression = "java(invitation.getStatus().name())")
    @Mapping(target = "invitedBy", source = "invitedBy.id")
    InvitationDto toInvitationDto(WorkspaceInvitation invitation);
}
