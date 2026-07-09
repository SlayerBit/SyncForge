package com.syncforge.module.task.event;

import com.syncforge.common.event.DomainEvent;
import lombok.Getter;

import java.util.UUID;

@Getter
public class LabelAdded extends DomainEvent {
    private final UUID taskId;
    private final UUID labelId;
    private final String labelName;
    private final UUID boardId;

    public LabelAdded(UUID taskId, UUID labelId, String labelName, UUID boardId, UUID workspaceId, UUID actorId) {
        super(actorId, workspaceId);
        this.taskId = taskId;
        this.labelId = labelId;
        this.labelName = labelName;
        this.boardId = boardId;
    }
}
