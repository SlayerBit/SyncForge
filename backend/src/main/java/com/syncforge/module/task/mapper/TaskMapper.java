package com.syncforge.module.task.mapper;

import com.syncforge.module.task.domain.Label;
import com.syncforge.module.task.domain.Task;
import com.syncforge.module.task.dto.LabelDto;
import com.syncforge.module.task.dto.TaskDto;
import com.syncforge.module.user.dto.UserSummaryDto;
import org.mapstruct.Context;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.ERROR)
public interface TaskMapper {

    @Mapping(target = "workspaceId", source = "workspace.id")
    LabelDto toLabelDto(Label label);

    List<LabelDto> toLabelDtoList(List<Label> labels);

    @Mapping(target = "columnId", source = "task.column.id")
    @Mapping(target = "boardId", source = "task.board.id")
    @Mapping(target = "assignees", source = "assignees")
    @Mapping(target = "labels", source = "task.labels")
    @Mapping(target = "commentCount", source = "commentCount")
    TaskDto toDto(Task task, List<UserSummaryDto> assignees, int commentCount);
}
