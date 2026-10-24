package com.irctc.service;

import com.irctc.entity.Booking;
import com.irctc.entity.Passenger;
import com.irctc.exception.ApiException;
import com.irctc.repository.BookingRepository;
import com.irctc.util.SeatLayout;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;

/**
 * Seat map data + seat assignment. Replaces SeatAvailabilityServlet and the assignSeats() method
 * that was duplicated in PaymentServlet and StripeCallbackServlet.
 */
@Service
public class SeatService {

    private final BookingRepository bookings;

    public SeatService(BookingRepository bookings) {
        this.bookings = bookings;
    }

    public List<Integer> bookedSeats(Integer trainId, LocalDate date, String coach) {
        return bookings.findBookedSeats(trainId, date, coach);
    }

    /**
     * Throws if the user's chosen seats are invalid: wrong count, out of range, duplicated or taken.
     * Old code trusted whatever "12-LB,13-MB" string the browser sent, including the berth type.
     */
    public void validateSelection(Booking booking, List<Integer> seatNumbers) {
        if (seatNumbers == null || seatNumbers.isEmpty()) return; // auto-assign
        String cls = booking.getClassCode();
        int max = SeatLayout.maxSeats(cls);
        if (seatNumbers.size() != booking.getPassengerCount()) {
            throw ApiException.badRequest("Please select exactly " + booking.getPassengerCount() + " seat(s).");
        }
        if (new HashSet<>(seatNumbers).size() != seatNumbers.size()) {
            throw ApiException.badRequest("The same seat was selected twice.");
        }
        for (Integer n : seatNumbers) {
            if (n == null || n < 1 || n > max) {
                throw ApiException.badRequest("Seat " + n + " does not exist in this coach.");
            }
        }
        Set<Integer> taken = new HashSet<>(bookedSeats(booking.getTrain().getId(), booking.getJourneyDate(),
                SeatLayout.coachCode(cls)));
        for (Integer n : seatNumbers) {
            if (taken.contains(n)) {
                throw ApiException.conflict("Seat " + n + " was just booked by someone else. Please pick another seat.");
            }
        }
    }

    /**
     * Assigns seats to the booking's passengers. If the chosen seats are no longer valid and
     * strict == false (user already paid on Stripe), falls back to auto-assignment instead of failing.
     */
    public void assign(Booking booking, List<Integer> chosen, boolean strict) {
        String cls = booking.getClassCode();
        String coach = SeatLayout.coachCode(cls);
        List<Integer> seats = chosen == null ? List.of() : chosen;

        if (!seats.isEmpty()) {
            try {
                validateSelection(booking, seats);
            } catch (ApiException e) {
                if (strict) throw e;
                seats = List.of();
            }
        }
        if (seats.isEmpty()) {
            seats = autoPick(booking, coach);
        }

        List<Passenger> pax = booking.getPassengerList();
        for (int i = 0; i < pax.size(); i++) {
            int seatNo = seats.get(i);
            Passenger p = pax.get(i);
            p.setSeatNumber(seatNo);
            p.setCoachCode(coach);
            p.setBerthType(SeatLayout.berthType(cls, seatNo)); // always computed on the server
        }
    }

    private List<Integer> autoPick(Booking booking, String coach) {
        Set<Integer> taken = new HashSet<>(bookedSeats(booking.getTrain().getId(), booking.getJourneyDate(), coach));
        int needed = booking.getPassengerList().size();
        int max = SeatLayout.maxSeats(booking.getClassCode());
        List<Integer> picked = new ArrayList<>();
        for (int n = 1; n <= max && picked.size() < needed; n++) {
            if (!taken.contains(n)) picked.add(n);
        }
        if (picked.size() < needed) {
            throw ApiException.conflict("Not enough free berths left in coach " + coach + " for this date.");
        }
        return picked;
    }
}
