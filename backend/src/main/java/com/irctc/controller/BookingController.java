package com.irctc.controller;

import com.irctc.dto.BookingDtos.*;
import com.irctc.dto.MiscDtos.MessageResponse;
import com.irctc.security.AuthPrincipal;
import com.irctc.service.BookingService;
import com.irctc.service.TicketService;
import jakarta.validation.Valid;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookings;
    private final TicketService tickets;

    public BookingController(BookingService bookings, TicketService tickets) {
        this.bookings = bookings;
        this.tickets = tickets;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CreateBookingResponse create(@AuthenticationPrincipal AuthPrincipal me,
                                        @Valid @RequestBody CreateBookingRequest req) {
        return bookings.create(me.id(), req);
    }

    /** "My Bookings" (CONFIRMED + CANCELLED). */
    @GetMapping
    public List<BookingDto> mine(@AuthenticationPrincipal AuthPrincipal me) {
        return bookings.myBookings(me.id());
    }

    @GetMapping("/{id}")
    public BookingDto one(@AuthenticationPrincipal AuthPrincipal me, @PathVariable Integer id) {
        return bookings.getForUser(me.id(), id);
    }

    @PostMapping("/{id}/cancel")
    public MessageResponse cancel(@AuthenticationPrincipal AuthPrincipal me, @PathVariable Integer id) {
        bookings.cancelByUser(me.id(), id);
        return new MessageResponse("Booking PNR " + id + " has been successfully cancelled.");
    }

    @GetMapping("/{id}/ticket")
    public ResponseEntity<byte[]> ticket(@AuthenticationPrincipal AuthPrincipal me, @PathVariable Integer id) {
        byte[] pdf = tickets.downloadForUser(me.id(), id);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
                        .filename("IRCTC_Ticket_PNR_" + id + ".pdf").build().toString())
                .body(pdf);
    }
}
