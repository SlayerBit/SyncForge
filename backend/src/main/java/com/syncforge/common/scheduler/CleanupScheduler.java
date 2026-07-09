package com.syncforge.common.scheduler;

import com.syncforge.module.auth.repository.PasswordResetTokenRepository;
import com.syncforge.module.auth.repository.RefreshTokenRepository;
import com.syncforge.module.auth.repository.VerificationTokenRepository;
import com.syncforge.module.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Component
@RequiredArgsConstructor
@Slf4j
public class CleanupScheduler {

    private final VerificationTokenRepository verificationTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final NotificationRepository notificationRepository;
    private final com.syncforge.module.workspace.service.WorkspaceService workspaceService;

    @Scheduled(cron = "0 0 0 * * *") // Runs every night at midnight
    @SchedulerLock(name = "CleanupScheduler_cleanupExpired", lockAtLeastFor = "PT5M", lockAtMostFor = "PT30M")
    @Transactional
    public void cleanupExpired() {
        log.info("Starting scheduled database cleanup job...");
        Instant now = Instant.now();

        try {
            verificationTokenRepository.deleteExpired(now);
            log.info("Cleaned up expired verification tokens.");
        } catch (Exception e) {
            log.error("Failed to clean up expired verification tokens", e);
        }

        try {
            passwordResetTokenRepository.deleteExpired(now);
            log.info("Cleaned up expired password reset tokens.");
        } catch (Exception e) {
            log.error("Failed to clean up expired password reset tokens", e);
        }

        try {
            refreshTokenRepository.deleteExpired(now);
            log.info("Cleaned up expired refresh tokens.");
        } catch (Exception e) {
            log.error("Failed to clean up expired refresh tokens", e);
        }

        try {
            Instant notificationThreshold = now.minus(30, ChronoUnit.DAYS);
            notificationRepository.deleteExpired(notificationThreshold);
            log.info("Cleaned up notifications older than 30 days.");
        } catch (Exception e) {
            log.error("Failed to clean up expired notifications", e);
        }

        try {
            workspaceService.cleanupExpiredInvitations();
            log.info("Cleaned up expired workspace invitations.");
        } catch (Exception e) {
            log.error("Failed to clean up expired workspace invitations", e);
        }

        log.info("Scheduled database cleanup job completed successfully.");
    }
}
