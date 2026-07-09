package com.syncforge.common.health;

import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

import java.lang.management.ManagementFactory;
import java.lang.management.MemoryMXBean;
import java.lang.management.OperatingSystemMXBean;

@Component
public class SystemResourcesHealthIndicator implements HealthIndicator {

    @Override
    public Health health() {
        OperatingSystemMXBean osBean = ManagementFactory.getOperatingSystemMXBean();
        MemoryMXBean memoryBean = ManagementFactory.getMemoryMXBean();

        double systemCpuLoad = -1.0;
        if (osBean instanceof com.sun.management.OperatingSystemMXBean sunOsBean) {
            systemCpuLoad = sunOsBean.getCpuLoad();
        }

        long maxMemory = Runtime.getRuntime().maxMemory();
        long usedMemory = memoryBean.getHeapMemoryUsage().getUsed();
        double memoryRatio = (double) usedMemory / maxMemory;

        Health.Builder builder = Health.up();
        builder.withDetail("cpu.cores", osBean.getAvailableProcessors());
        if (systemCpuLoad >= 0.0) {
            builder.withDetail("cpu.systemLoad", String.format("%.2f%%", systemCpuLoad * 100));
        }
        builder.withDetail("memory.used", bytesToMb(usedMemory))
               .withDetail("memory.max", bytesToMb(maxMemory))
               .withDetail("memory.usageRatio", String.format("%.2f%%", memoryRatio * 100));

        if (memoryRatio > 0.90) {
            return builder.down().withDetail("status", "High memory pressure").build();
        }
        return builder.build();
    }

    private String bytesToMb(long bytes) {
        return (bytes / (1024 * 1024)) + " MB";
    }
}
