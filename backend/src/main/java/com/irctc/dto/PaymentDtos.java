package com.irctc.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public final class PaymentDtos {
    private PaymentDtos() {}

    /** seatNumbers empty/null = "Skip & Auto-Assign". Berth types are always computed on the server. */
    public record DummyPaymentRequest(@NotNull Integer bookingId, List<Integer> seatNumbers) {}

    public record StripeSessionRequest(@NotNull Integer bookingId, List<Integer> seatNumbers) {}

    public record StripeSessionResponse(String url) {}

    public record StripeConfirmRequest(@NotBlank String sessionId) {}

    public record PaymentResult(Integer bookingId, String status) {}
}
