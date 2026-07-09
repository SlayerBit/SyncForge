package com.syncforge.module.notification.mapper;

import com.syncforge.module.notification.domain.Notification;
import com.syncforge.module.notification.dto.NotificationDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.ERROR)
public interface NotificationMapper {

    @Mapping(target = "userId", source = "user.id")
    @Mapping(target = "type", expression = "java(notification.getType().name())")
    NotificationDto toDto(Notification notification);
}
