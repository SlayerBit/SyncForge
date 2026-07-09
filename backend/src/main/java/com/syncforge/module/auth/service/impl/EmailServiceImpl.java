package com.syncforge.module.auth.service.impl;

import com.syncforge.module.auth.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Value("${syncforge.base-url:http://localhost:3000}")
    private String baseUrl;

    @Override
    @Async
    public void sendVerificationEmail(String email, String token) {
        // According to rest api spec, user is verified by calling GET /api/auth/verify-email?token={token}
        // Let's send the backend URL or a frontend URL that calls it. Let's send the link to frontend.
        String verificationUrl = baseUrl + "/verify-email?token=" + token;
        log.info("Sending verification email to {} with link {}", email, verificationUrl);

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(email);
            message.setSubject("SyncForge — Verify your email address");
            message.setText("Welcome to SyncForge!\n\nPlease verify your email by clicking the link below:\n" + verificationUrl);
            mailSender.send(message);
        } catch (Exception e) {
            log.error("Failed to send verification email to {}", email, e);
        }
    }

    @Override
    @Async
    public void sendPasswordResetEmail(String email, String token) {
        String resetUrl = baseUrl + "/reset-password?token=" + token;
        log.info("Sending password reset email to {} with link {}", email, resetUrl);

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(email);
            message.setSubject("SyncForge — Reset your password");
            message.setText("You requested a password reset.\n\nPlease reset your password by clicking the link below:\n" + resetUrl);
            mailSender.send(message);
        } catch (Exception e) {
            log.error("Failed to send password reset email to {}", email, e);
        }
    }
}
