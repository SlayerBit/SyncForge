package com.syncforge.module.board.domain;

import com.github.f4b6a3.uuid.UuidCreator;
import com.syncforge.common.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Entity
@Table(name = "board_columns")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class BoardColumn extends BaseEntity {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_id", nullable = false)
    private Board board;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 255)
    private String position;

    @Column(name = "task_limit")
    private Integer taskLimit;

    @Version
    private Integer version;

    public BoardColumn(Board board, String name, String position, Integer taskLimit) {
        this.id = UuidCreator.getTimeOrderedEpoch();
        this.board = board;
        this.name = name;
        this.position = position;
        this.taskLimit = taskLimit;
    }

    public void update(String name, Integer taskLimit) {
        this.name = name;
        this.taskLimit = taskLimit;
    }

    public void reorder(String newPosition) {
        this.position = newPosition;
    }
}
