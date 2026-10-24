package com.irctc.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public final class MiscDtos {
    private MiscDtos() {}

    public record MessageResponse(String message) {}

    // ---------- PNR ----------
    public record PnrPassenger(String name, String status, String coach, String berth, String berthType) {}

    /** Normalised result for both local bookings and live IRCTC (RapidAPI) data. */
    public record PnrResult(String source, String pnr, String trainInfo, String journeyDate,
                            String from, String to, String bookingStatus, List<PnrPassenger> passengers) {}

    // ---------- Live status ----------
    public record LiveStatus(String trainName, String trainNumber, int delayMinutes,
                             double distanceCovered, double totalDistance,
                             String nextStoppage, String nextStoppageEta,
                             String currentStation, String currentEta) {}

    // ---------- Chat ----------
    public record ChatRequest(@NotBlank @Size(max = 1000) String message) {}
    public record ChatResponse(String reply) {}

    // ---------- Food ----------
    public record FoodItemDto(Integer id, String name, String description, BigDecimal price,
                              String type, String category, String imageUrl) {}

    public record FoodMenuResponse(Integer pnr, String mealCategory, List<FoodItemDto> items) {}

    public record FoodCheckoutRequest(@NotBlank String pnr,
                                      @NotBlank @Size(max = 100) String contactName,
                                      @NotBlank @Size(max = 20) String contactPhone,
                                      @NotEmpty Map<Integer, Integer> cart) {}

    public record FoodConfirmRequest(@NotBlank String sessionId) {}

    // ---------- Admin ----------
    public record DashboardStats(BigDecimal revenue, long users, long blocked, long trains) {}
}
