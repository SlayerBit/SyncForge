package com.syncforge.module.comment.service;

import com.syncforge.common.response.CursorResponse;
import com.syncforge.module.comment.dto.*;

import java.util.UUID;

public interface CommentService {
    CommentDto createComment(UUID taskId, CreateCommentRequest request, UUID authorId);
    CommentDto getComment(UUID commentId);
    CommentDto updateComment(UUID commentId, UpdateCommentRequest request, UUID authorId);
    void deleteComment(UUID commentId, UUID authorId);
    CursorResponse<CommentDto> getTaskComments(UUID taskId, UUID cursor, int size);
}
