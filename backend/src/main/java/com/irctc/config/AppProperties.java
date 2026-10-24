package com.irctc.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

/**
 * Type-safe binding of the "app.*" section of application.yml.
 * Replaces the manual Properties.load("config.properties") calls in DBConnection and EmailUtil.
 */
@ConfigurationProperties(prefix = "app")
public record AppProperties(
        String frontendUrl,
        List<String> corsAllowedOrigins,
        String timezone,
        Jwt jwt,
        Booking booking,
        Stripe stripe,
        RapidApi rapidapi,
        Gemini gemini
) {
    public record Jwt(String secret, long expirationMinutes) {}
    public record Booking(int holdMinutes, int stalePendingMinutes, int maxPassengers) {}
    public record Stripe(String secretKey) {}
    public record RapidApi(String key, String host) {}
    public record Gemini(String apiKey, String model) {}
}
