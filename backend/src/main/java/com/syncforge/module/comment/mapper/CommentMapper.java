package com.syncforge.module.comment.mapper;

import com.syncforge.module.comment.domain.Comment;
import com.syncforge.module.comment.dto.CommentDto;
import com.syncforge.module.user.dto.UserSummaryDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.ERROR)
public interface CommentMapper {

    @Mapping(target = "id", source = "comment.id")
    @Mapping(target = "taskId", source = "comment.task.id")
    @Mapping(target = "author", source = "author")
    @Mapping(target = "version", source = "comment.version")
    CommentDto toDto(Comment comment, UserSummaryDto author);
}
