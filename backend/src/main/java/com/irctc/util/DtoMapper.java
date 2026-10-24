package com.irctc.util;

import com.irctc.dto.AuthDtos.AdminDto;
import com.irctc.dto.AuthDtos.UserDto;
import com.irctc.dto.BookingDtos.BookingDto;
import com.irctc.dto.BookingDtos.PassengerDto;
import com.irctc.dto.MiscDtos.FoodItemDto;
import com.irctc.dto.TrainDtos.TrainDto;
import com.irctc.entity.*;

import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;

/** Entity -> DTO conversion. Entities never leave the service layer (no password leaks, no lazy-loading surprises). */
public final class DtoMapper {
    private DtoMapper() {}

    public static UserDto toDto(User u) {
        return new UserDto(u.getId(), u.getFullName(), u.getEmail(), u.getPhone(), u.getGender(),
                u.getAge(), u.getAddress(), u.isVerifiedUser(), u.isBlockedUser(), u.getCreatedAt());
    }

    public static AdminDto toDto(Admin a) {
        return new AdminDto(a.getId(), a.getUsername(), a.getFullName());
    }

    public static TrainDto toDto(Train t) {
        return new TrainDto(t.getId(), t.getTrainName(), t.getTrainNumber(), t.getSource(),
                t.getDestination(), t.getDepartureTime(), t.getArrivalTime(), t.getTotalSeats(),
                t.getAvailableSeats(), t.getFarePerKm());
    }

    public static PassengerDto toDto(Passenger p) {
        return new PassengerDto(p.getId(), p.getName(), p.getAge(), p.getGender(), p.getPhone(),
                p.getEmail(), p.getCoachCode(), p.getSeatNumber(), p.getBerthType());
    }

    public static FoodItemDto toDto(FoodItem f, String displayCategory) {
        return new FoodItemDto(f.getId(), f.getItemName(), f.getDescription(), f.getPrice(),
                f.getType(), displayCategory, f.getImageUrl());
    }

    public static BookingDto toDto(Booking b, LocalTime segDep, LocalTime segArr,
                                   boolean includePassengers, boolean includeUser, int holdMinutes) {
        Train t = b.getTrain();
        List<PassengerDto> pax = includePassengers
                ? b.getPassengerList().stream().map(DtoMapper::toDto).toList()
                : List.of();
        return new BookingDto(
                b.getId(), b.getStatus(), FareCalculator.normalizeClass(b.getClassCode()),
                t.getId(), t.getTrainName(), t.getTrainNumber(),
                b.getSegmentSource(), b.getSegmentDestination(),
                segDep != null ? segDep : t.getDepartureTime(),
                segArr != null ? segArr : t.getArrivalTime(),
                b.getJourneyDate(), b.getBookingDate(),
                b.getPassengerCount(), b.getTotalAmount(), b.getPrimaryEmail(),
                b.getCreatedAt(),
                b.getCreatedAt() == null ? null
                        : b.getCreatedAt().plusMinutes(holdMinutes).atZone(ZoneId.systemDefault()).toOffsetDateTime(),
                includeUser ? b.getUser().getFullName() : null,
                includeUser ? b.getUser().getEmail() : null,
                pax);
    }
}
