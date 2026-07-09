package com.syncforge.module.task.service;

import java.util.Map;
import java.util.Set;
import java.util.UUID;

public interface CommentCountProvider {
    int getCommentCount(UUID taskId);
    Map<UUID, Integer> getCommentCounts(Set<UUID> taskIds);
}
