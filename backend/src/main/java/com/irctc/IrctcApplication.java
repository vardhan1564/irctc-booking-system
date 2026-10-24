package com.irctc;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.util.TimeZone;

/**
 * Entry point. Replaces the WAR + Tomcat deployment of the old project:
 * Spring Boot starts an embedded Tomcat, so "mvn spring-boot:run" is all you need.
 *
 * UserDetailsServiceAutoConfiguration is excluded because we authenticate with our own
 * JWT filter, so Spring's default in-memory user is not needed.
 */
@SpringBootApplication(exclude = UserDetailsServiceAutoConfiguration.class)
@ConfigurationPropertiesScan
@EnableAsync        // emails + PDF generation run in background threads (old code used new Thread(...))
@EnableScheduling   // auto-cancels abandoned PENDING bookings
public class IrctcApplication {
    public static void main(String[] args) {
        // All timestamps (booking hold timer, created_at) are in Indian time, matching the DB URL.
        TimeZone.setDefault(TimeZone.getTimeZone("Asia/Kolkata"));
        SpringApplication.run(IrctcApplication.class, args);
    }
}
