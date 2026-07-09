package com.syncforge.common.exception;

import org.springframework.http.HttpStatus;

public class ResourceNotFoundException extends BusinessException {

    public ResourceNotFoundException(String message) {
        super(message, "NOT_FOUND", HttpStatus.NOT_FOUND);
    }

    public ResourceNotFoundException(String resourceName, Object id) {
        super(String.format("%s not found with ID: %s", resourceName, id), "NOT_FOUND", HttpStatus.NOT_FOUND);
    }
}
