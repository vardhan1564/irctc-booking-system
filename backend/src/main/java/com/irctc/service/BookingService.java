package com.irctc.service;

import com.irctc.config.AppProperties;
import com.irctc.dto.BookingDtos.*;
import com.irctc.entity.*;
import com.irctc.exception.ApiException;
import com.irctc.repository.*;
import com.irctc.util.AfterCommit;
import com.irctc.util.DtoMapper;
import com.irctc.util.FareCalculator;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;

/**
 * Booking lifecycle. Replaces BookingServlet, BookingHistoryServlet, CancelBookingServlet and the
 * DB part of PaymentServlet / StripeCallbackServlet.
 *
 * Key change: the old app kept pendingBookingId, amount, class, seats ... in the HttpSession.
 * Now the booking row itself is the state, and every request carries the bookingId. The server
 * re-reads the amount from the DB, so a user can never tamper with the price.
 */
@Service
@Transactional
public class BookingService {

    private final BookingRepository bookings;
    private final TrainRepository trains;
    private final UserRepository users;
    private final PaymentRepository payments;
    private final TrainService trainService;
    private final SeatService seatService;
    private final TicketService ticketService;
    private final AppProperties props;

    public BookingService(BookingRepository bookings, TrainRepository trains, UserRepository users,
                          PaymentRepository payments, TrainService trainService, SeatService seatService,
                          TicketService ticketService, AppProperties props) {
        this.bookings = bookings;
        this.trains = trains;
        this.users = users;
        this.payments = payments;
        this.trainService = trainService;
        this.seatService = seatService;
        this.ticketService = ticketService;
        this.props = props;
    }

    // ------------------------------------------------------------------ quote + create

    @Transactional(readOnly = true)
    public QuoteResponse quote(Integer trainId, String source, String destination, String classCode) {
        Train train = trains.findById(trainId)
                .orElseThrow(() -> ApiException.notFound("Train details not found."));
        String cls = FareCalculator.normalizeClass(classCode);
        TrainService.Route route = trainService.resolveRoute(train, source, destination);
        int max = Math.max(0, Math.min(props.booking().maxPassengers(), train.getAvailableSeats()));
        return new QuoteResponse(DtoMapper.toDto(train), cls,
                FareCalculator.farePerPassenger(route.baseFare(), cls),
                route.segmentDeparture(), route.segmentArrival(), max);
    }

    public CreateBookingResponse create(Integer userId, CreateBookingRequest r) {
        LocalDate today = LocalDate.now(ZoneId.of(props.timezone()));
        if (r.journeyDate().isBefore(today)) {
            throw ApiException.badRequest("Journey date cannot be in the past.");
        }
        int count = r.passengers().size();
        if (count > props.booking().maxPassengers()) {
            throw ApiException.badRequest("Maximum " + props.booking().maxPassengers() + " passengers per booking.");
        }
        User user = users.findById(userId).orElseThrow(() -> ApiException.notFound("User not found."));
        Train train = trains.findById(r.trainId())
                .orElseThrow(() -> ApiException.notFound("Train or route details not found."));
        if (train.getAvailableSeats() < count) {
            throw ApiException.conflict("Not enough available seats.");
        }
        String cls = FareCalculator.normalizeClass(r.classCode());
        TrainService.Route route = trainService.resolveRoute(train, r.source(), r.destination());
        BigDecimal perPassenger = FareCalculator.farePerPassenger(route.baseFare(), cls);

        Booking b = new Booking();
        b.setUser(user);
        b.setTrain(train);
        b.setBookingDate(today);
        b.setJourneyDate(r.journeyDate());
        b.setPassengerCount(count);
        b.setTotalAmount(perPassenger.multiply(BigDecimal.valueOf(count)));
        b.setPrimaryEmail(r.primaryEmail().trim());
        b.setStatus(Booking.PENDING);
        b.setSegmentSource(r.source().trim());
        b.setSegmentDestination(r.destination().trim());
        b.setClassCode(cls);
        r.passengers().forEach(pr -> {
            Passenger p = new Passenger();
            p.setName(pr.name().trim());
            p.setAge(pr.age());
            p.setGender(pr.gender());
            p.setPhone(blankToNull(pr.phone()));
            p.setEmail(blankToNull(pr.email()));
            b.addPassenger(p);
        });
        bookings.save(b); // booking + passengers saved in ONE transaction (cascade = ALL)

        return new CreateBookingResponse(b.getId(), b.getTotalAmount(),
                b.getCreatedAt().plusMinutes(props.booking().holdMinutes())
                        .atZone(ZoneId.systemDefault()).toOffsetDateTime());
    }

    // ------------------------------------------------------------------ read

    @Transactional(readOnly = true)
    public BookingDto getForUser(Integer userId, Integer bookingId) {
        Booking b = ownedBooking(userId, bookingId);
        return toDto(b, true, false);
    }

    @Transactional(readOnly = true)
    public List<BookingDto> myBookings(Integer userId) {
        return bookings.findByUser_IdAndStatusInOrderByCreatedAtDesc(userId,
                        List.of(Booking.CONFIRMED, Booking.CANCELLED))
                .stream().map(b -> toDto(b, false, false)).toList();
    }

    BookingDto toDto(Booking b, boolean withPassengers, boolean withUser) {
        LocalTime[] t = trainService.segmentTimesOrDefault(b.getTrain(), b.getSegmentSource(), b.getSegmentDestination());
        return DtoMapper.toDto(b, t[0], t[1], withPassengers, withUser, props.booking().holdMinutes());
    }

    // ------------------------------------------------------------------ cancel

    public void cancelByUser(Integer userId, Integer bookingId) {
        Booking b = bookings.findByIdForUpdate(bookingId)
                .filter(x -> x.getUser().getId().equals(userId))
                .orElseThrow(() -> ApiException.notFound("Booking not found or you do not have permission to cancel it."));
        if (Booking.CANCELLED.equals(b.getStatus())) {
            throw ApiException.badRequest("This booking is already cancelled.");
        }
        cancel(b);
    }

    /** Used by user cancel and admin force-cancel. Seats go back ONLY if they were taken. */
    public void cancel(Booking b) {
        if (Booking.CONFIRMED.equals(b.getStatus())) {
            Train t = trains.findByIdForUpdate(b.getTrain().getId())
                    .orElseThrow(() -> ApiException.notFound("Associated train not found."));
            t.setAvailableSeats(t.getAvailableSeats() + b.getPassengerCount());
        }
        // Old bug fixed: cancelling a PENDING booking used to ADD seats that were never subtracted.
        b.setStatus(Booking.CANCELLED);
    }

    // ------------------------------------------------------------------ payment window

    public boolean isExpired(Booking b) {
        return b.getCreatedAt() != null
                && b.getCreatedAt().plusMinutes(props.booking().holdMinutes()).isBefore(LocalDateTime.now());
    }

    /**
     * Marks the booking CANCELLED if its 10-minute window has passed. Runs in its own committed
     * transaction so the cancellation is saved even though the caller then throws an error.
     */
    public boolean expireIfStale(Integer userId, Integer bookingId) {
        Booking b = ownedBooking(userId, bookingId);
        if (Booking.PENDING.equals(b.getStatus()) && isExpired(b)) {
            b.setStatus(Booking.CANCELLED);
            return true;
        }
        return false;
    }

    /** Validates that the booking can still be paid for; returns it (used before creating a Stripe session). */
    @Transactional(readOnly = true)
    public Booking requirePayable(Integer userId, Integer bookingId, List<Integer> seatNumbers) {
        Booking b = ownedBooking(userId, bookingId);
        if (!Booking.PENDING.equals(b.getStatus())) {
            throw ApiException.conflict("This booking is " + b.getStatus().toLowerCase() + " and cannot be paid for.");
        }
        seatService.validateSelection(b, seatNumbers);
        b.getTrain().getTrainName(); // initialise lazy proxy for the caller
        return b;
    }

    // ------------------------------------------------------------------ confirm (after payment)

    public record PaymentInfo(String mode, String details, String transactionId, String payerEmail) {}

    /**
     * The critical transaction. Same steps as the old PaymentServlet, in one @Transactional method:
     * lock booking + train rows, check seats, decrement seats, assign berths, save payment, CONFIRM.
     * Any exception rolls everything back automatically (no manual conn.rollback()).
     */
    public BookingDto confirm(Integer userId, Integer bookingId, List<Integer> seatNumbers,
                              PaymentInfo info, boolean strictSeats) {
        Booking b = bookings.findByIdForUpdate(bookingId)
                .filter(x -> x.getUser().getId().equals(userId))
                .orElseThrow(() -> ApiException.notFound("Booking not found."));

        if (Booking.CONFIRMED.equals(b.getStatus())) {
            return toDto(b, true, false); // idempotent: page refresh / double click
        }
        if (!Booking.PENDING.equals(b.getStatus())) {
            throw ApiException.conflict("This booking is " + b.getStatus().toLowerCase() + " and cannot be confirmed.");
        }

        Train train = trains.findByIdForUpdate(b.getTrain().getId())
                .orElseThrow(() -> ApiException.notFound("Train not found."));
        if (train.getAvailableSeats() < b.getPassengerCount()) {
            throw ApiException.conflict("Seats no longer available.");
        }

        seatService.assign(b, seatNumbers, strictSeats);
        train.setAvailableSeats(train.getAvailableSeats() - b.getPassengerCount());

        Payment p = new Payment();
        p.setBooking(b);
        p.setAmount(b.getTotalAmount());
        p.setPaymentMode(info.mode());
        p.setPaymentModeDetails(info.details());
        p.setPaymentStatus("SUCCESS");
        p.setTransactionId(info.transactionId());
        p.setPayerEmail(info.payerEmail());
        payments.save(p);

        b.setStatus(Booking.CONFIRMED);

        Integer id = b.getId();
        AfterCommit.run(() -> ticketService.emailTicketAsync(id));
        return toDto(b, true, false);
    }

    // ------------------------------------------------------------------ helpers

    private Booking ownedBooking(Integer userId, Integer bookingId) {
        return bookings.findWithDetailsById(bookingId)
                .filter(b -> b.getUser().getId().equals(userId))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND,
                        "Booking not found or you do not have permission to view it."));
    }

    private static String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s.trim();
    }
}
