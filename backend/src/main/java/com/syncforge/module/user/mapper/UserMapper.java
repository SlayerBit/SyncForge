package com.syncforge.module.user.mapper;

import com.syncforge.common.util.GravatarUtils;
import com.syncforge.module.user.domain.User;
import com.syncforge.module.user.dto.UserDto;
import com.syncforge.module.user.dto.UserSummaryDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.ERROR, imports = {GravatarUtils.class})
public interface UserMapper {

    @Mapping(target = "avatarUrl", expression = "java(GravatarUtils.getAvatarUrl(user.getEmail()))")
    UserDto toDto(User user);

    @Mapping(target = "avatarUrl", expression = "java(GravatarUtils.getAvatarUrl(user.getEmail()))")
    UserSummaryDto toSummaryDto(User user);
}
