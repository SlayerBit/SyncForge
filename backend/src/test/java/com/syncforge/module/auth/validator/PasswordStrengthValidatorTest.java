package com.syncforge.module.auth.validator;

import org.junit.jupiter.api.Test;
import java.util.List;
import static org.assertj.core.api.Assertions.assertThat;

class PasswordStrengthValidatorTest {

    private final PasswordStrengthValidator validator = new PasswordStrengthValidator();

    @Test
    void shouldReturnErrors_whenPasswordIsTooShort() {
        List<String> errors = validator.validate("Sh0rt!");
        assertThat(errors).contains("Password must be at least 8 characters");
    }

    @Test
    void shouldReturnErrors_whenPasswordLacksUppercase() {
        List<String> errors = validator.validate("lowercase123!");
        assertThat(errors).contains("Password must contain an uppercase letter");
    }

    @Test
    void shouldReturnErrors_whenPasswordLacksLowercase() {
        List<String> errors = validator.validate("UPPERCASE123!");
        assertThat(errors).contains("Password must contain a lowercase letter");
    }

    @Test
    void shouldReturnErrors_whenPasswordLacksDigit() {
        List<String> errors = validator.validate("NoDigitsHere!");
        assertThat(errors).contains("Password must contain a digit");
    }

    @Test
    void shouldReturnErrors_whenPasswordLacksSpecialChar() {
        List<String> errors = validator.validate("NoSpecialChars123");
        assertThat(errors).contains("Password must contain a special character");
    }

    @Test
    void shouldPass_whenPasswordIsStrong() {
        List<String> errors = validator.validate("StrongP@ss123");
        assertThat(errors).isEmpty();
    }
}
