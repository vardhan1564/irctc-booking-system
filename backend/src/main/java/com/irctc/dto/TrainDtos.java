package com.irctc.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalTime;

public final class TrainDtos {
    private TrainDtos() {}

    public record TrainDto(Integer id, String trainName, String trainNumber, String source,
                           String destination, LocalTime departureTime, LocalTime arrivalTime,
                           Integer totalSeats, Integer availableSeats, BigDecimal farePerKm) {}

    /** One row on the search results page. ticketPrice is the SL base fare for the segment. */
    public record TrainSearchResult(Integer id, String trainName, String trainNumber,
                                    LocalTime departureTime, LocalTime arrivalTime,
                                    LocalTime segmentDepartureTime, LocalTime segmentArrivalTime,
                                    Integer availableSeats, BigDecimal ticketPrice) {}

    /** Admin add/edit train form. */
    public record TrainRequest(
            @NotBlank @Size(max = 10) String trainNumber,
            @NotBlank @Size(max = 100) String trainName,
            @NotBlank String source,
            @NotBlank String destination,
            @NotNull LocalTime departureTime,
            @NotNull LocalTime arrivalTime,
            @NotNull @Min(1) Integer totalSeats,
            @NotNull @Min(0) Integer availableSeats,
            @NotNull @DecimalMin("0.0") BigDecimal fare) {}
}
