package com.syncforge.module.workspace.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.syncforge.common.exception.BusinessException;
import com.syncforge.common.exception.ResourceNotFoundException;
import com.syncforge.common.util.SlugUtils;
import com.syncforge.module.user.domain.User;
import com.syncforge.module.user.repository.UserRepository;
import com.syncforge.module.workspace.domain.*;
import com.syncforge.module.workspace.dto.*;
import com.syncforge.module.workspace.event.*;
import com.syncforge.module.workspace.mapper.WorkspaceMapper;
import com.syncforge.module.workspace.repository.WorkspaceInvitationRepository;
import com.syncforge.module.workspace.repository.WorkspaceMemberRepository;
import com.syncforge.module.workspace.repository.WorkspaceRepository;
import com.syncforge.module.workspace.service.WorkspaceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class WorkspaceServiceImpl implements WorkspaceService {

    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final WorkspaceInvitationRepository workspaceInvitationRepository;
    private final UserRepository userRepository;
    private final WorkspaceMapper workspaceMapper;
    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;
    private final ApplicationEventPublisher eventPublisher;

    private static final String MEMBER_CACHE_PREFIX = "workspace:%s:member:%s";
    private static final String LIST_CACHE_PREFIX = "workspace:%s:members";

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 digest algorithm not available", e);
        }
    }

    private String generateUniqueSlug(String name) {
        String baseSlug = SlugUtils.toSlug(name);
        if (baseSlug.length() < 2) {
            baseSlug = "workspace";
        }
        String currentSlug = baseSlug;
        int counter = 2;
        while (workspaceRepository.existsBySlug(currentSlug)) {
            currentSlug = baseSlug + "-" + counter;
            counter++;
        }
        return currentSlug;
    }

    @Override
    @Transactional
    public WorkspaceDto createWorkspace(UUID userId, CreateWorkspaceRequest request) {
        log.info("Creating workspace: {}", request.name());
        User owner = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        // Enforce rule: Max 10 workspaces owned by user
        long ownedCount = workspaceRepository.countByOwnerId(userId);
        if (ownedCount >= 10) {
            throw new BusinessException("Maximum limit of 10 workspaces exceeded", "LIMIT_EXCEEDED", HttpStatus.BAD_REQUEST);
        }

        // Enforce rule: A user can be a member of up to 20 workspaces
        long memberCount = workspaceMemberRepository.countByUserId(userId);
        if (memberCount >= 20) {
            throw new BusinessException("Maximum membership limit of 20 workspaces exceeded", "LIMIT_EXCEEDED", HttpStatus.BAD_REQUEST);
        }

        String slug = generateUniqueSlug(request.name());
        Workspace workspace = new Workspace(request.name(), slug, request.description(), owner);
        workspaceRepository.save(workspace);

        // First member is owner
        WorkspaceMember member = new WorkspaceMember(workspace, owner, WorkspaceRole.OWNER);
        workspaceMemberRepository.save(member);

        // Evict cache
        evictMemberCaches(workspace.getId(), userId);

        // Event
        eventPublisher.publishEvent(new WorkspaceCreated(workspace.getId(), workspace.getName(), workspace.getSlug(), owner.getId()));

        return workspaceMapper.toDto(workspace);
    }

    @Override
    @Transactional(readOnly = true)
    public WorkspaceDto getWorkspace(UUID workspaceId) {
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace", workspaceId));
        return workspaceMapper.toDto(workspace);
    }

    @Override
    @Transactional
    public WorkspaceDto updateWorkspace(UUID workspaceId, UpdateWorkspaceRequest request) {
        log.info("Updating workspace: {}", workspaceId);
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace", workspaceId));

        workspace.update(request.name(), request.description());
        workspaceRepository.save(workspace);

        return workspaceMapper.toDto(workspace);
    }

    @Override
    @Transactional
    public void deleteWorkspace(UUID workspaceId, UUID userId) {
        log.info("Deleting workspace: {} by user: {}", workspaceId, userId);
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace", workspaceId));

        if (!workspace.getOwner().getId().equals(userId)) {
            throw new BusinessException("Only the workspace owner can delete it.", "FORBIDDEN", HttpStatus.FORBIDDEN);
        }

        // Evict member cache for all members
        List<WorkspaceMember> members = workspaceMemberRepository.findByWorkspaceId(workspaceId);
        workspaceRepository.delete(workspace);

        for (WorkspaceMember member : members) {
            evictMemberCaches(workspaceId, member.getUser().getId());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<WorkspaceDto> getUserWorkspaces(UUID userId) {
        return workspaceMemberRepository.findByUserId(userId).stream()
                .map(member -> workspaceMapper.toDto(member.getWorkspace()))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public WorkspaceMemberDto addMember(UUID workspaceId, UUID userId, WorkspaceRole role) {
        log.info("Adding member {} with role {} to workspace {}", userId, role, workspaceId);
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace", workspaceId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        if (workspaceMemberRepository.existsByWorkspaceIdAndUserId(workspaceId, userId)) {
            throw new BusinessException("User is already a member of this workspace.", "ALREADY_MEMBER", HttpStatus.CONFLICT);
        }

        // Limit checks
        long memberCount = workspaceMemberRepository.countByWorkspaceId(workspaceId);
        if (memberCount >= 50) {
            throw new BusinessException("Workspace has reached the maximum of 50 members.", "LIMIT_EXCEEDED", HttpStatus.BAD_REQUEST);
        }

        long userWorkspaceCount = workspaceMemberRepository.countByUserId(userId);
        if (userWorkspaceCount >= 20) {
            throw new BusinessException("User has reached the maximum of 20 workspace memberships.", "LIMIT_EXCEEDED", HttpStatus.BAD_REQUEST);
        }

        WorkspaceMember member = new WorkspaceMember(workspace, user, role);
        workspaceMemberRepository.save(member);

        evictMemberCaches(workspaceId, userId);

        return workspaceMapper.toMemberDto(member);
    }

    @Override
    @Transactional
    public void removeMember(UUID workspaceId, UUID userId) {
        log.info("Removing member {} from workspace {}", userId, workspaceId);
        WorkspaceMember member = workspaceMemberRepository.findByWorkspaceIdAndUserId(workspaceId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace member not found"));

        if (member.getRole() == WorkspaceRole.OWNER) {
            throw new BusinessException("OWNER cannot leave without transferring ownership first.", "FORBIDDEN", HttpStatus.BAD_REQUEST);
        }

        workspaceMemberRepository.delete(member);
        evictMemberCaches(workspaceId, userId);

        // Event
        eventPublisher.publishEvent(new MemberRemoved(workspaceId, userId, null));
    }

    @Override
    @Transactional
    public void updateMemberRole(UUID workspaceId, UUID userId, WorkspaceRole role) {
        log.info("Updating member {} role to {} in workspace {}", userId, role, workspaceId);
        WorkspaceMember member = workspaceMemberRepository.findByWorkspaceIdAndUserId(workspaceId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace member not found"));

        if (member.getRole() == WorkspaceRole.OWNER) {
            throw new BusinessException("Owner role cannot be changed directly. Use ownership transfer.", "FORBIDDEN", HttpStatus.BAD_REQUEST);
        }

        if (role == WorkspaceRole.OWNER) {
            throw new BusinessException("Cannot promote member to OWNER directly. Use ownership transfer.", "FORBIDDEN", HttpStatus.BAD_REQUEST);
        }

        WorkspaceRole oldRole = member.getRole();
        member.updateRole(role);
        workspaceMemberRepository.save(member);

        evictMemberCaches(workspaceId, userId);

        // Event
        eventPublisher.publishEvent(new MemberRoleChanged(workspaceId, userId, oldRole.name(), role.name(), null));
    }

    @Override
    @Transactional(readOnly = true)
    public List<WorkspaceMemberDto> getMembers(UUID workspaceId) {
        String listCacheKey = String.format(LIST_CACHE_PREFIX, workspaceId);
        try {
            Object cached = redisTemplate.opsForValue().get(listCacheKey);
            if (cached != null) {
                return objectMapper.convertValue(cached, new TypeReference<List<WorkspaceMemberDto>>() {});
            }
        } catch (Exception e) {
            log.warn("Redis error reading workspace members: {}", e.getMessage());
        }

        List<WorkspaceMemberDto> members = workspaceMemberRepository.findByWorkspaceId(workspaceId).stream()
                .map(workspaceMapper::toMemberDto)
                .collect(Collectors.toList());

        try {
            redisTemplate.opsForValue().set(listCacheKey, members, withJitter(Duration.ofMinutes(5)));
        } catch (Exception e) {
            log.warn("Redis error writing workspace members: {}", e.getMessage());
        }

        return members;
    }

    @Override
    @Transactional(readOnly = true)
    public WorkspaceRole getMemberRole(UUID workspaceId, UUID userId) {
        String memberKey = String.format(MEMBER_CACHE_PREFIX, workspaceId, userId);
        try {
            Object roleObj = redisTemplate.opsForValue().get(memberKey);
            if (roleObj != null) {
                String val = roleObj.toString();
                if ("NONE".equals(val)) {
                    return null;
                }
                return WorkspaceRole.valueOf(val);
            }
        } catch (Exception e) {
            log.warn("Redis error reading workspace membership role: {}", e.getMessage());
        }

        Optional<WorkspaceMember> memberOpt = workspaceMemberRepository.findByWorkspaceIdAndUserId(workspaceId, userId);
        if (memberOpt.isPresent()) {
            WorkspaceRole role = memberOpt.get().getRole();
            try {
                redisTemplate.opsForValue().set(memberKey, role.name(), withJitter(Duration.ofMinutes(5)));
            } catch (Exception e) {
                log.warn("Redis error caching membership role: {}", e.getMessage());
            }
            return role;
        } else {
            try {
                // Negative caching
                redisTemplate.opsForValue().set(memberKey, "NONE", Duration.ofMinutes(1));
            } catch (Exception e) {
                log.warn("Redis error writing negative membership cache: {}", e.getMessage());
            }
            return null;
        }
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isMember(UUID workspaceId, UUID userId) {
        return getMemberRole(workspaceId, userId) != null;
    }

    @Override
    @Transactional
    public InvitationDto createInvitation(UUID workspaceId, CreateInvitationRequest request, UUID invitedByUserId) {
        log.info("Creating invitation to workspace: {} for: {}", workspaceId, request.email());
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace", workspaceId));

        User inviter = userRepository.findById(invitedByUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", invitedByUserId));

        // Check if invitee is already a member
        Optional<User> inviteeOpt = userRepository.findByEmailIgnoreCase(request.email());
        if (inviteeOpt.isPresent() && workspaceMemberRepository.existsByWorkspaceIdAndUserId(workspaceId, inviteeOpt.get().getId())) {
            throw new BusinessException("User is already a member of this workspace.", "ALREADY_MEMBER", HttpStatus.CONFLICT);
        }

        // Check pending invitations limit
        long pendingCount = workspaceInvitationRepository.countByWorkspaceIdAndStatus(workspaceId, InvitationStatus.PENDING);
        if (pendingCount >= 20) {
            throw new BusinessException("Workspace has reached the limit of 20 pending invitations.", "LIMIT_EXCEEDED", HttpStatus.BAD_REQUEST);
        }

        // Check if there is already a pending invitation for this email in this workspace
        Optional<WorkspaceInvitation> pendingOpt = workspaceInvitationRepository.findByWorkspaceIdAndEmailAndStatus(
                workspaceId, request.email(), InvitationStatus.PENDING);
        if (pendingOpt.isPresent()) {
            throw new BusinessException("An invitation has already been sent to this email.", "DUPLICATE_INVITATION", HttpStatus.CONFLICT);
        }

        String rawToken = UUID.randomUUID().toString();
        String tokenHash = hashToken(rawToken);
        Instant expiresAt = Instant.now().plus(Duration.ofDays(7));

        WorkspaceInvitation invitation = new WorkspaceInvitation(
                workspace, request.email(), WorkspaceRole.valueOf(request.role()), tokenHash, inviter, expiresAt);
        workspaceInvitationRepository.save(invitation);

        // Trigger email notification or event
        eventPublisher.publishEvent(new MemberInvited(workspaceId, request.email(), request.role(), invitedByUserId, invitation.getId()));

        return workspaceMapper.toInvitationDto(invitation);
    }

    @Override
    @Transactional
    public void acceptInvitation(String token, UUID userId) {
        log.info("Accepting invitation with token by user: {}", userId);
        String hash = hashToken(token);
        WorkspaceInvitation invitation = workspaceInvitationRepository.findByTokenHash(hash)
                .orElseThrow(() -> new ResourceNotFoundException("Invitation not found."));

        if (invitation.getStatus() != InvitationStatus.PENDING || invitation.isExpired()) {
            throw new BusinessException("Invitation has expired or already been accepted/revoked.", "INVITATION_INVALID", HttpStatus.BAD_REQUEST);
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        if (!invitation.getEmail().equalsIgnoreCase(user.getEmail())) {
            throw new BusinessException("Invitation email does not match user email.", "FORBIDDEN", HttpStatus.FORBIDDEN);
        }

        invitation.accept();
        workspaceInvitationRepository.save(invitation);

        addMember(invitation.getWorkspace().getId(), userId, invitation.getRole());

        // Event
        eventPublisher.publishEvent(new InvitationAccepted(invitation.getWorkspace().getId(), userId, invitation.getRole().name()));
    }

    @Override
    @Transactional
    public void revokeInvitation(UUID invitationId) {
        log.info("Revoking invitation: {}", invitationId);
        WorkspaceInvitation invitation = workspaceInvitationRepository.findById(invitationId)
                .orElseThrow(() -> new ResourceNotFoundException("Invitation", invitationId));

        if (invitation.getStatus() != InvitationStatus.PENDING) {
            throw new BusinessException("Invitation cannot be revoked because its status is " + invitation.getStatus().name(), "INVALID_STATE", HttpStatus.BAD_REQUEST);
        }

        invitation.revoke();
        workspaceInvitationRepository.save(invitation);
    }

    @Override
    @Transactional(readOnly = true)
    public List<InvitationDto> getPendingInvitations(UUID workspaceId) {
        return workspaceInvitationRepository.findByWorkspaceIdAndStatus(workspaceId, InvitationStatus.PENDING).stream()
                .map(workspaceMapper::toInvitationDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void transferOwnership(UUID workspaceId, UUID ownerId, UUID newOwnerId) {
        log.info("Transferring ownership of workspace {} from {} to {}", workspaceId, ownerId, newOwnerId);
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace", workspaceId));

        if (!workspace.getOwner().getId().equals(ownerId)) {
            throw new BusinessException("Only the workspace owner can transfer ownership.", "FORBIDDEN", HttpStatus.FORBIDDEN);
        }

        WorkspaceMember currentOwnerMember = workspaceMemberRepository.findByWorkspaceIdAndUserId(workspaceId, ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Current owner member record not found"));

        WorkspaceMember newOwnerMember = workspaceMemberRepository.findByWorkspaceIdAndUserId(workspaceId, newOwnerId)
                .orElseThrow(() -> new BusinessException("New owner must be a member of the workspace.", "NEW_OWNER_NOT_MEMBER", HttpStatus.BAD_REQUEST));

        // Perform transfer
        workspace.transferOwnership(newOwnerMember.getUser());
        workspaceRepository.save(workspace);

        currentOwnerMember.updateRole(WorkspaceRole.ADMIN);
        workspaceMemberRepository.save(currentOwnerMember);

        newOwnerMember.updateRole(WorkspaceRole.OWNER);
        workspaceMemberRepository.save(newOwnerMember);

        evictMemberCaches(workspaceId, ownerId);
        evictMemberCaches(workspaceId, newOwnerId);

        // Event
        eventPublisher.publishEvent(new OwnershipTransferred(workspaceId, ownerId, newOwnerId));
    }

    @Override
    @Transactional
    public void cleanupExpiredInvitations() {
        log.info("Running workspace invitation cleanup...");
        Instant now = Instant.now();
        int markedCount = workspaceInvitationRepository.markExpiredInvitations(now);
        log.info("Marked {} expired invitations", markedCount);

        Instant threshold = now.minus(30, java.time.temporal.ChronoUnit.DAYS);
        int deletedCount = workspaceInvitationRepository.deleteExpiredInvitationsOlderThan30Days(threshold);
        log.info("Deleted {} expired invitations older than 30 days", deletedCount);
    }

    private void evictMemberCaches(UUID workspaceId, UUID userId) {
        try {
            String memberKey = String.format(MEMBER_CACHE_PREFIX, workspaceId, userId);
            String listKey = String.format(LIST_CACHE_PREFIX, workspaceId);
            redisTemplate.delete(memberKey);
            redisTemplate.delete(listKey);
            log.debug("Evicted membership caches for workspace {} user {}", workspaceId, userId);
        } catch (Exception e) {
            log.warn("Redis error evicting membership caches: {}", e.getMessage());
        }
    }

    private Duration withJitter(Duration baseTtl) {
        long jitterMs = java.util.concurrent.ThreadLocalRandom.current().nextLong(0, baseTtl.toMillis() / 5);
        return baseTtl.plusMillis(jitterMs);
    }
}
