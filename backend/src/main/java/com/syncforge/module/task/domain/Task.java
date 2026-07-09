package com.syncforge.module.task.domain;

import com.github.f4b6a3.uuid.UuidCreator;
import com.syncforge.common.domain.BaseEntity;
import com.syncforge.module.board.domain.Board;
import com.syncforge.module.board.domain.BoardColumn;
import com.syncforge.module.user.domain.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "tasks", uniqueConstraints = @UniqueConstraint(columnNames = {"board_id", "identifier"}))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Task extends BaseEntity {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "column_id", nullable = false)
    private BoardColumn column;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_id", nullable = false)
    private Board board;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Priority priority = Priority.NONE;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TaskStatus status = TaskStatus.OPEN;

    @Column(nullable = false, length = 255)
    private String position;

    @Column(nullable = false, length = 20)
    private String identifier;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creator_id", nullable = false)
    private User creator;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(nullable = false)
    private boolean archived = false;

    @Version
    private Integer version;

    @OneToMany(mappedBy = "task", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<TaskAssignment> assignments = new HashSet<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "task_labels",
            joinColumns = @JoinColumn(name = "task_id"),
            inverseJoinColumns = @JoinColumn(name = "label_id")
    )
    private Set<Label> labels = new HashSet<>();

    public Task(BoardColumn column, Board board, String title, String description, Priority priority,
                String position, String identifier, User creator, LocalDate dueDate) {
        this.id = UuidCreator.getTimeOrderedEpoch();
        this.column = column;
        this.board = board;
        this.title = title;
        this.description = description;
        this.priority = priority != null ? priority : Priority.NONE;
        this.status = TaskStatus.OPEN;
        this.position = position;
        this.identifier = identifier;
        this.creator = creator;
        this.dueDate = dueDate;
        this.archived = false;
    }

    public void update(String title, String description, Priority priority, LocalDate dueDate) {
        this.title = title;
        this.description = description;
        if (priority != null) {
            this.priority = priority;
        }
        this.dueDate = dueDate;
    }

    public void move(BoardColumn targetColumn, String newPosition) {
        this.column = targetColumn;
        this.position = newPosition;
        if (targetColumn.getName().equalsIgnoreCase("Done")) {
            this.status = TaskStatus.DONE;
        } else if (targetColumn.getName().equalsIgnoreCase("To Do")) {
            this.status = TaskStatus.OPEN;
        } else {
            this.status = TaskStatus.IN_PROGRESS;
        }
    }

    public void archive() {
        this.archived = true;
        this.status = TaskStatus.ARCHIVED;
    }

    public void addLabel(Label label) {
        this.labels.add(label);
    }

    public void removeLabel(Label label) {
        this.labels.remove(label);
    }
}
