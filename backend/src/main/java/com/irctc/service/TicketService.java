package com.irctc.service;

import com.irctc.config.AppProperties;
import com.irctc.dto.BookingDtos.BookingDto;
import com.irctc.entity.Booking;
import com.irctc.entity.Payment;
import com.irctc.exception.ApiException;
import com.irctc.repository.BookingRepository;
import com.irctc.repository.PaymentRepository;
import com.irctc.util.DtoMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;

/** PDF ticket download (old DownloadTicketServlet) and the background "email my ticket" job. */
@Service
public class TicketService {

    private static final Logger log = LoggerFactory.getLogger(TicketService.class);

    private final BookingRepository bookings;
    private final PaymentRepository payments;
    private final TrainService trainService;
    private final PdfTicketService pdf;
    private final EmailService email;
    private final AppProperties props;

    public TicketService(BookingRepository bookings, PaymentRepository payments, TrainService trainService,
                         PdfTicketService pdf, EmailService email, AppProperties props) {
        this.bookings = bookings;
        this.payments = payments;
        this.trainService = trainService;
        this.pdf = pdf;
        this.email = email;
        this.props = props;
    }

    @Transactional(readOnly = true)
    public byte[] downloadForUser(Integer userId, Integer bookingId) {
        Booking b = bookings.findWithDetailsById(bookingId)
                .filter(x -> x.getUser().getId().equals(userId))
                .orElseThrow(() -> ApiException.notFound("Booking not found or you do not have permission to view it."));
        if (Booking.PENDING.equals(b.getStatus())) {
            throw ApiException.badRequest("Ticket is available only after payment.");
        }
        byte[] bytes = render(b);
        if (bytes == null) throw new IllegalStateException("PDF generation failed");
        return bytes;
    }

    /** Runs on a background thread after the payment transaction commits. */
    @Async
    @Transactional(readOnly = true)
    public void emailTicketAsync(Integer bookingId) {
        try {
            Booking b = bookings.findWithDetailsById(bookingId).orElse(null);
            if (b == null) return;
            BookingDto dto = dto(b);
            Payment p = payments.findFirstByBooking_IdOrderByIdDesc(bookingId).orElse(null);
            byte[] bytes = pdf.generate(dto, p != null ? p.getTransactionId() : null, p != null ? p.getPaymentMode() : null);
            email.sendBookingConfirmation(dto, bytes);
        } catch (Exception e) {
            log.error("Could not email ticket for PNR {}", bookingId, e); // booking is already confirmed; never fail it
        }
    }

    private byte[] render(Booking b) {
        Payment p = payments.findFirstByBooking_IdOrderByIdDesc(b.getId()).orElse(null);
        return pdf.generate(dto(b), p != null ? p.getTransactionId() : null, p != null ? p.getPaymentMode() : null);
    }

    private BookingDto dto(Booking b) {
        LocalTime[] t = trainService.segmentTimesOrDefault(b.getTrain(), b.getSegmentSource(), b.getSegmentDestination());
        return DtoMapper.toDto(b, t[0], t[1], true, false, props.booking().holdMinutes());
    }
}
