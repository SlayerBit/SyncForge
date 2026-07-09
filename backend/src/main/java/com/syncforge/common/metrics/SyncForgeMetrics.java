package com.syncforge.common.metrics;

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Counter;
import org.springframework.stereotype.Component;

@Component
public class SyncForgeMetrics {

    private final MeterRegistry meterRegistry;
    private final Counter loginLockoutCounter;

    public SyncForgeMetrics(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
        this.loginLockoutCounter = Counter.builder("syncforge.login.lockout.total")
                .description("Total number of user account lockouts due to brute-force protection")
                .register(meterRegistry);
    }

    public void incrementLoginLockout() {
        loginLockoutCounter.increment();
    }

    public void incrementTaskTransition(String fromStatus, String toStatus) {
        Counter.builder("syncforge.task.transition.total")
                .description("Total number of task status transitions")
                .tag("from", fromStatus)
                .tag("to", toStatus)
                .register(meterRegistry)
                .increment();
    }
}
