package com.irctc.util;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Single source of truth for fares. In the old project the same multipliers were copy-pasted
 * in BookingServlet (twice) and trains.jsp; now the backend owns the calculation.
 */
public final class FareCalculator {

    /** Fare used for trains that have no intermediate stops configured (old code: 500.00). */
    public static final BigDecimal DIRECT_TRAIN_BASE_FARE = new BigDecimal("500.00");

    private FareCalculator() {}

    public static BigDecimal classMultiplier(String classCode) {
        if (classCode == null) return BigDecimal.ONE;
        return switch (classCode) {
            case "1A" -> new BigDecimal("4.0");
            case "2A" -> new BigDecimal("2.5");
            case "3A" -> new BigDecimal("1.8");
            default -> BigDecimal.ONE; // SL
        };
    }

    public static BigDecimal baseFare(BigDecimal farePerKm, int distanceKm) {
        return farePerKm.multiply(BigDecimal.valueOf(distanceKm));
    }

    public static BigDecimal farePerPassenger(BigDecimal baseFare, String classCode) {
        return baseFare.multiply(classMultiplier(classCode)).setScale(2, RoundingMode.HALF_UP);
    }

    public static String normalizeClass(String classCode) {
        if (classCode == null || classCode.isBlank()) return "SL";
        return switch (classCode) {
            case "SL", "3A", "2A", "1A" -> classCode;
            default -> "SL";
        };
    }

    public static String classLabel(String classCode) {
        return switch (normalizeClass(classCode)) {
            case "1A" -> "AC FIRST CLASS (1A)";
            case "2A" -> "AC 2 TIER (2A)";
            case "3A" -> "AC 3 TIER (3A)";
            default -> "SLEEPER (SL)";
        };
    }
}
