package com.syncforge.module.comment.event;

import com.syncforge.common.event.DomainEvent;
import lombok.Getter;

import java.util.UUID;

@Getter
public class CommentCreated extends DomainEvent {
    private final UUID commentId;
    private final UUID taskId;
    private final UUID authorId;
    private final String content;
    private final UUID boardId;

    public CommentCreated(UUID commentId, UUID taskId, UUID authorId, String content, UUID boardId, UUID workspaceId) {
        super(authorId, workspaceId);
        this.commentId = commentId;
        this.taskId = taskId;
        this.authorId = authorId;
        this.content = content;
        this.boardId = boardId;
    }
}
