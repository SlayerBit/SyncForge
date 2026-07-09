package com.syncforge.module.board.mapper;

import com.syncforge.module.board.domain.Board;
import com.syncforge.module.board.domain.BoardColumn;
import com.syncforge.module.board.dto.BoardDetailDto;
import com.syncforge.module.board.dto.BoardDto;
import com.syncforge.module.board.dto.ColumnDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.ERROR)
public interface BoardMapper {

    @Mapping(target = "workspaceId", source = "workspace.id")
    BoardDto toDto(Board board);

    @Mapping(target = "boardId", source = "board.id")
    ColumnDto toColumnDto(BoardColumn column);

    List<ColumnDto> toColumnDtoList(List<BoardColumn> columns);

    @Mapping(target = "workspaceId", source = "board.workspace.id")
    @Mapping(target = "columns", source = "columns")
    BoardDetailDto toDetailDto(Board board, List<BoardColumn> columns);
}
