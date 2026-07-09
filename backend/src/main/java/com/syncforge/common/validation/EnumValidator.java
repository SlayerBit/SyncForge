package com.syncforge.common.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class EnumValidator implements ConstraintValidator<ValidEnum, CharSequence> {

    private Set<String> acceptedValues;
    private boolean ignoreCase;

    @Override
    public void initialize(ValidEnum annotation) {
        ignoreCase = annotation.ignoreCase();
        acceptedValues = Stream.of(annotation.enumClass().getEnumConstants())
                .map(Enum::name)
                .map(val -> ignoreCase ? val.toLowerCase() : val)
                .collect(Collectors.toSet());
    }

    @Override
    public boolean isValid(CharSequence value, ConstraintValidatorContext context) {
        if (value == null) {
            return true; 
        }
        String stringValue = value.toString();
        return acceptedValues.contains(ignoreCase ? stringValue.toLowerCase() : stringValue);
    }
}
