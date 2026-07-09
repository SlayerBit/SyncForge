package com.syncforge.module.task.repository;

import com.syncforge.module.task.domain.TaskAssignment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TaskAssignmentRepository extends JpaRepository<TaskAssignment, UUID> {

    List<TaskAssignment> findByTaskId(UUID taskId);

    Optional<TaskAssignment> findByTaskIdAndUserId(UUID taskId, UUID userId);

    boolean existsByTaskIdAndUserId(UUID taskId, UUID userId);
}
