package com.syncforge.common.constant;

public final class SyncForgeConstants {

    private SyncForgeConstants() {}

    public static final int MAX_WORKSPACES_PER_OWNER = 10;
    public static final int MAX_WORKSPACES_PER_MEMBER = 20;
    public static final int MAX_MEMBERS_PER_WORKSPACE = 50;
    public static final int MAX_PENDING_INVITATIONS_PER_WORKSPACE = 20;
    public static final int MAX_COLUMNS_PER_BOARD = 12;
    public static final int MAX_ASSIGNEES_PER_TASK = 5;
    public static final int MAX_LABELS_PER_TASK = 10;
    public static final int MAX_LABELS_PER_WORKSPACE = 50;
    
    public static final int COMMENT_EDIT_WINDOW_MINUTES = 15;
    public static final int EMAIL_VERIFICATION_EXPIRATION_HOURS = 24;
    public static final int PASSWORD_RESET_EXPIRATION_HOURS = 1;
    public static final int INVITATION_EXPIRATION_DAYS = 7;
    public static final int NOTIFICATION_RETENTION_DAYS = 90;
    public static final int DEACTIVATED_USER_RETENTION_DAYS = 90;
    public static final int SOFT_DELETED_WORKSPACE_RETENTION_DAYS = 30;
}
