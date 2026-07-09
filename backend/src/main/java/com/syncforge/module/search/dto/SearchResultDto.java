package com.syncforge.module.search.dto;

import com.syncforge.module.comment.dto.CommentDto;
import com.syncforge.module.task.dto.TaskDto;
import java.util.List;

public record SearchResultDto(
        List<TaskDto> tasks,
        List<CommentDto> comments,
        List<String> recentQueries
) {}
