package com.syncforge.module.comment.repository;

import com.syncforge.module.comment.domain.Mention;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MentionRepository extends JpaRepository<Mention, UUID> {

    List<Mention> findByCommentId(UUID commentId);

    List<Mention> findByMentionedUserId(UUID mentionedUserId);
}
