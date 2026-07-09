package com.syncforge.module.auth.validator;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Component
@Slf4j
public class PasswordStrengthValidator {

    private static final Set<String> COMMON_PASSWORDS = loadCommonPasswords();
    private static final int MIN_LENGTH = 8;
    private static final int MAX_LENGTH = 128;

    private static Set<String> loadCommonPasswords() {
        try (InputStream is = PasswordStrengthValidator.class.getResourceAsStream("/common-passwords.txt")) {
            if (is == null) {
                log.warn("common-passwords.txt not found. Password checks against common passwords will be skipped.");
                return Collections.emptySet();
            }
            Set<String> passwords = new HashSet<>();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    passwords.add(line.trim().toLowerCase());
                }
            }
            return passwords;
        } catch (Exception e) {
            log.error("Failed to load common passwords", e);
            return Collections.emptySet();
        }
    }

    public List<String> validate(String password) {
        List<String> errors = new ArrayList<>();
        if (password == null) {
            errors.add("Password is required");
            return errors;
        }
        if (password.length() < MIN_LENGTH) {
            errors.add("Password must be at least 8 characters");
        }
        if (password.length() > MAX_LENGTH) {
            errors.add("Password must be at most 128 characters");
        }
        if (!password.matches(".*[A-Z].*")) {
            errors.add("Password must contain an uppercase letter");
        }
        if (!password.matches(".*[a-z].*")) {
            errors.add("Password must contain a lowercase letter");
        }
        if (!password.matches(".*\\d.*")) {
            errors.add("Password must contain a digit");
        }
        if (!password.matches(".*[!@#$%^&*()_+\\-=\\[\\]{}|;:,.<>?].*")) {
            errors.add("Password must contain a special character");
        }
        if (COMMON_PASSWORDS.contains(password.toLowerCase())) {
            errors.add("Password is too common");
        }
        return errors;
    }
}
