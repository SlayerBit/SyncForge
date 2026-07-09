package com.syncforge.module.task.service;

import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@ConditionalOnMissingBean(CommentCountProvider.class)
public class DefaultCommentCountProvider implements CommentCountProvider {

    @Override
    public int getCommentCount(UUID taskId) {
        return 0;
    }

    @Override
    public Map<UUID, Integer> getCommentCounts(Set<UUID> taskIds) {
        if (taskIds == null) {
            return Collections.emptyMap();
        }
        return taskIds.stream().collect(Collectors.toMap(id -> id, id -> 0));
    }
}
