package com.irctc.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.LocalTime;
import java.util.List;

public final class BookingDtos {
    private BookingDtos() {}

    /** Data for the "Passenger Details" page (old BookingServlet doGet). */
    public record QuoteResponse(TrainDtos.TrainDto train, String classCode, BigDecimal farePerPassenger,
                                LocalTime segmentDepartureTime, LocalTime segmentArrivalTime,
                                int maxPassengers) {}

    public record PassengerRequest(
            @NotBlank @Size(max = 100) String name,
            @NotNull @Min(1) @Max(120) Integer age,
            @NotBlank String gender,
            @Size(max = 20) String phone,
            @Size(max = 150) String email) {}

    public record CreateBookingRequest(
            @NotNull Integer trainId,
            @NotNull LocalDate journeyDate,
            @NotBlank String source,
            @NotBlank String destination,
            String classCode,
            @NotBlank @Email String primaryEmail,
            @NotEmpty @Size(max = 6) List<@Valid PassengerRequest> passengers) {}

    public record CreateBookingResponse(Integer bookingId, BigDecimal totalAmount, OffsetDateTime expiresAt) {}

    public record PassengerDto(Integer id, String name, Integer age, String gender, String phone,
                               String email, String coachCode, Integer seatNumber, String berthType) {}

    public record BookingDto(Integer bookingId, String status, String classCode,
                             Integer trainId, String trainName, String trainNumber,
                             String segmentSource, String segmentDestination,
                             LocalTime departureTime, LocalTime arrivalTime,
                             LocalDate journeyDate, LocalDate bookingDate,
                             Integer passengerCount, BigDecimal totalAmount, String primaryEmail,
                             LocalDateTime createdAt, OffsetDateTime expiresAt,
                             String userName, String userEmail,
                             List<PassengerDto> passengers) {}
}
