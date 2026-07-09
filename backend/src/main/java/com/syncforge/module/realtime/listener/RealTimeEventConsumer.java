package com.syncforge.module.realtime.listener;

import com.syncforge.module.comment.dto.CommentDto;
import com.syncforge.module.comment.event.CommentCreated;
import com.syncforge.module.comment.event.CommentDeleted;
import com.syncforge.module.comment.event.CommentUpdated;
import com.syncforge.module.comment.service.CommentService;
import com.syncforge.module.notification.event.NotificationCreated;
import com.syncforge.module.realtime.dto.WebSocketBroadcastMessage;
import com.syncforge.module.realtime.service.WebSocketRedisRelay;
import com.syncforge.module.task.dto.TaskDto;
import com.syncforge.module.task.event.TaskArchived;
import com.syncforge.module.task.event.TaskCreated;
import com.syncforge.module.task.event.TaskMoved;
import com.syncforge.module.task.event.TaskUpdated;
import com.syncforge.module.task.service.TaskService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class RealTimeEventConsumer {

    private final WebSocketRedisRelay redisRelay;
    private final TaskService taskService;
    private final CommentService commentService;

    // TASK REAL-TIME BROADCASTS
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleTaskCreated(TaskCreated event) {
        log.info("Relaying TaskCreated event to WebSocket channel");
        try {
            TaskDto dto = taskService.getTask(event.getTaskId());
            redisRelay.publish(new WebSocketBroadcastMessage(
                    "/topic/board/" + event.getBoardId(),
                    null,
                    Map.of("type", "TASK_CREATED", "data", dto)
            ));
        } catch (Exception e) {
            log.error("Failed to broadcast TaskCreated event", e);
        }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleTaskUpdated(TaskUpdated event) {
        log.info("Relaying TaskUpdated event to WebSocket channel");
        try {
            TaskDto dto = taskService.getTask(event.getTaskId());
            redisRelay.publish(new WebSocketBroadcastMessage(
                    "/topic/board/" + event.getBoardId(),
                    null,
                    Map.of("type", "TASK_UPDATED", "data", dto)
            ));
        } catch (Exception e) {
            log.error("Failed to broadcast TaskUpdated event", e);
        }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleTaskMoved(TaskMoved event) {
        log.info("Relaying TaskMoved event to WebSocket channel");
        redisRelay.publish(new WebSocketBroadcastMessage(
                "/topic/board/" + event.getBoardId(),
                null,
                Map.of("type", "TASK_MOVED", "data", Map.of(
                        "taskId", event.getTaskId(),
                        "fromColumnId", event.getFromColumnId(),
                        "toColumnId", event.getToColumnId(),
                        "position", event.getNewPosition()
                ))
        ));
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleTaskArchived(TaskArchived event) {
        log.info("Relaying TaskArchived event to WebSocket channel");
        redisRelay.publish(new WebSocketBroadcastMessage(
                "/topic/board/" + event.getBoardId(),
                null,
                Map.of("type", "TASK_ARCHIVED", "data", event.getTaskId())
        ));
    }

    // COMMENT REAL-TIME BROADCASTS
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleCommentCreated(CommentCreated event) {
        log.info("Relaying CommentCreated event to WebSocket channel");
        try {
            CommentDto dto = commentService.getComment(event.getCommentId());
            redisRelay.publish(new WebSocketBroadcastMessage(
                    "/topic/board/" + event.getBoardId(),
                    null,
                    Map.of("type", "COMMENT_CREATED", "data", dto)
            ));
        } catch (Exception e) {
            log.error("Failed to broadcast CommentCreated event", e);
        }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleCommentUpdated(CommentUpdated event) {
        log.info("Relaying CommentUpdated event to WebSocket channel");
        try {
            CommentDto dto = commentService.getComment(event.getCommentId());
            redisRelay.publish(new WebSocketBroadcastMessage(
                    "/topic/board/" + event.getBoardId(),
                    null,
                    Map.of("type", "COMMENT_UPDATED", "data", dto)
            ));
        } catch (Exception e) {
            log.error("Failed to broadcast CommentUpdated event", e);
        }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleCommentDeleted(CommentDeleted event) {
        log.info("Relaying CommentDeleted event to WebSocket channel");
        redisRelay.publish(new WebSocketBroadcastMessage(
                "/topic/board/" + event.getBoardId(),
                null,
                Map.of("type", "COMMENT_DELETED", "data", event.getCommentId())
        ));
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleNotificationCreated(NotificationCreated event) {
        log.info("Relaying NotificationCreated event to private channel: {}", event.getEmail());
        redisRelay.publish(new WebSocketBroadcastMessage(
                "/queue/notifications",
                event.getEmail(),
                event.getNotification()
        ));
    }
}
