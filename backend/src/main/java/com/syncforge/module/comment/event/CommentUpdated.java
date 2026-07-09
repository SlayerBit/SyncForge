package com.syncforge.module.comment.event;

import com.syncforge.common.event.DomainEvent;
import lombok.Getter;

import java.util.UUID;

@Getter
public class CommentUpdated extends DomainEvent {
    private final UUID commentId;
    private final UUID taskId;
    private final UUID boardId;

    public CommentUpdated(UUID commentId, UUID taskId, UUID boardId, UUID workspaceId, UUID actorId) {
        super(actorId, workspaceId);
        this.commentId = commentId;
        this.taskId = taskId;
        this.boardId = boardId;
    }
}
