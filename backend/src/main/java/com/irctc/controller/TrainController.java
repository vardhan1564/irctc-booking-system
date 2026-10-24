package com.irctc.controller;

import com.irctc.dto.BookingDtos.QuoteResponse;
import com.irctc.dto.TrainDtos.TrainSearchResult;
import com.irctc.service.BookingService;
import com.irctc.service.SeatService;
import com.irctc.service.TrainService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api")
public class TrainController {

    private final TrainService trains;
    private final BookingService bookings;
    private final SeatService seats;

    public TrainController(TrainService trains, BookingService bookings, SeatService seats) {
        this.trains = trains;
        this.bookings = bookings;
        this.seats = seats;
    }

    /** Public: station autocomplete (old StationSearchServlet, used by jQuery UI). */
    @GetMapping("/stations")
    public List<String> stations(@RequestParam(defaultValue = "") String term) {
        return trains.searchStations(term);
    }

    /** Logged-in users only, same as the old TrainListServlet. */
    @GetMapping("/trains/search")
    public List<TrainSearchResult> search(@RequestParam String source, @RequestParam String destination) {
        return trains.search(source, destination);
    }

    /** Fare + segment info for the passenger form (old BookingServlet doGet). */
    @GetMapping("/trains/{trainId}/quote")
    public QuoteResponse quote(@PathVariable Integer trainId,
                               @RequestParam String source,
                               @RequestParam String destination,
                               @RequestParam(defaultValue = "SL") String classCode) {
        return bookings.quote(trainId, source, destination, classCode);
    }

    /** Booked seat numbers for the seat map (old SeatAvailabilityServlet). */
    @GetMapping("/trains/{trainId}/booked-seats")
    public List<Integer> bookedSeats(@PathVariable Integer trainId,
                                     @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
                                     @RequestParam String coach) {
        return seats.bookedSeats(trainId, date, coach);
    }
}
