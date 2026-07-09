package com.syncforge.module.workspace.domain;

public enum WorkspaceRole {
    VIEWER(1),
    MEMBER(2),
    ADMIN(3),
    OWNER(4);

    private final int level;

    WorkspaceRole(int level) {
        this.level = level;
    }

    public int getLevel() {
        return level;
    }

    public boolean hasPermission(WorkspaceRole required) {
        return this.level >= required.level;
    }
}
