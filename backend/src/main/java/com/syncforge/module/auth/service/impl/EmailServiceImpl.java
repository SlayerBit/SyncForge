package com.syncforge.module.auth.service.impl;

import com.syncforge.module.auth.service.EmailService;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
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
        String verificationUrl = baseUrl + "/verify-email?token=" + token;
        log.info("Sending verification email to {} with link {}", email, verificationUrl);

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "utf-8");
            
            helper.setTo(email);
            helper.setSubject("SyncForge — Verify your email address");
            
            String htmlMsg = "<div style=\"font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 40px auto; padding: 32px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;\">" +
                    "  <div style=\"text-align: center; margin-bottom: 28px;\">" +
                    "    <h2 style=\"color: #0f172a; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em;\">SyncForge</h2>" +
                    "  </div>" +
                    "  <div style=\"color: #334155; font-size: 15px; line-height: 1.6;\">" +
                    "    <p style=\"margin-top: 0; margin-bottom: 16px;\">Welcome to SyncForge!</p>" +
                    "    <p style=\"margin-top: 0; margin-bottom: 24px;\">Please click the button below to verify your email address and activate your account:</p>" +
                    "    <div style=\"text-align: center; margin: 32px 0;\">" +
                    "      <a href=\"" + verificationUrl + "\" style=\"display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 28px; font-weight: 600; font-size: 14px; border-radius: 8px; text-decoration: none; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.1), 0 2px 4px -1px rgba(37, 99, 235, 0.06);\">Verify Email Address</a>" +
                    "    </div>" +
                    "    <p style=\"font-size: 13px; color: #64748b; margin-top: 32px; margin-bottom: 8px;\">This link is valid for 24 hours. If the button above doesn't work, copy and paste the URL below into your browser:</p>" +
                    "    <p style=\"font-size: 13px; color: #2563eb; word-break: break-all; margin: 0;\">" + verificationUrl + "</p>" +
                    "  </div>" +
                    "</div>";

            helper.setText(htmlMsg, true);
            mailSender.send(mimeMessage);
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
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "utf-8");
            
            helper.setTo(email);
            helper.setSubject("SyncForge — Reset your password");
            
            String htmlMsg = "<div style=\"font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 40px auto; padding: 32px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;\">" +
                    "  <div style=\"text-align: center; margin-bottom: 28px;\">" +
                    "    <h2 style=\"color: #0f172a; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em;\">SyncForge</h2>" +
                    "  </div>" +
                    "  <div style=\"color: #334155; font-size: 15px; line-height: 1.6;\">" +
                    "    <p style=\"margin-top: 0; margin-bottom: 16px;\">You requested a password reset for your SyncForge account.</p>" +
                    "    <p style=\"margin-top: 0; margin-bottom: 24px;\">Click the button below to set a new password:</p>" +
                    "    <div style=\"text-align: center; margin: 32px 0;\">" +
                    "      <a href=\"" + resetUrl + "\" style=\"display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 28px; font-weight: 600; font-size: 14px; border-radius: 8px; text-decoration: none; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.1), 0 2px 4px -1px rgba(37, 99, 235, 0.06);\">Reset Password</a>" +
                    "    </div>" +
                    "    <p style=\"font-size: 13px; color: #64748b; margin-top: 32px; margin-bottom: 8px;\">This link is valid for 1 hour. If you did not request this, you can safely ignore this email.</p>" +
                    "    <p style=\"font-size: 13px; color: #2563eb; word-break: break-all; margin: 0;\">" + resetUrl + "</p>" +
                    "  </div>" +
                    "</div>";

            helper.setText(htmlMsg, true);
            mailSender.send(mimeMessage);
        } catch (Exception e) {
            log.error("Failed to send password reset email to {}", email, e);
        }
    }
}
