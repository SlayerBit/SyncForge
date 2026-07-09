package com.syncforge.module.activity.mapper;

import com.syncforge.module.activity.domain.ActivityLog;
import com.syncforge.module.activity.dto.ActivityLogDto;
import com.syncforge.module.user.dto.UserSummaryDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.ERROR)
public interface ActivityMapper {

    @Mapping(target = "id", source = "log.id")
    @Mapping(target = "workspaceId", source = "log.workspace.id")
    @Mapping(target = "actor", source = "actor")
    @Mapping(target = "changes", source = "log.changes")
    ActivityLogDto toDto(ActivityLog log, UserSummaryDto actor);
}
