package com.irctc.service;

import com.irctc.config.AppProperties;
import com.irctc.config.StripeConfig;
import com.irctc.dto.BookingDtos.BookingDto;
import com.irctc.dto.PaymentDtos.*;
import com.irctc.entity.Booking;
import com.irctc.exception.ApiException;
import com.irctc.repository.UserRepository;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Replaces PaymentServlet (dummy pay), StripeSessionServlet and StripeCallbackServlet.
 *
 * NOT @Transactional on purpose: it orchestrates calls to BookingService, whose methods each run
 * in their own transaction (e.g. expireIfStale must commit even when we then return an error).
 */
@Service
public class PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);
    private static final String META_TYPE = "type";
    private static final String TYPE_TICKET = "TICKET";

    private final BookingService bookingService;
    private final UserRepository users;
    private final StripeConfig stripe;
    private final AppProperties props;

    public PaymentService(BookingService bookingService, UserRepository users, StripeConfig stripe,
                          AppProperties props) {
        this.bookingService = bookingService;
        this.users = users;
        this.stripe = stripe;
        this.props = props;
    }

    public PaymentResult payDummy(Integer userId, DummyPaymentRequest r) {
        ensureNotExpired(userId, r.bookingId());
        String payer = users.findById(userId).map(u -> u.getEmail()).orElse(null);
        BookingDto b = bookingService.confirm(userId, r.bookingId(), r.seatNumbers(),
                new BookingService.PaymentInfo("CARD", "Dummy Card Payment",
                        "txn_" + System.currentTimeMillis(), payer),
                true);
        return new PaymentResult(b.bookingId(), b.status());
    }

    public StripeSessionResponse createStripeSession(Integer userId, StripeSessionRequest r) {
        if (!stripe.isEnabled()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Stripe is not configured on the server. Please use Dummy Pay.");
        }
        ensureNotExpired(userId, r.bookingId());
        Booking b = bookingService.requirePayable(userId, r.bookingId(), r.seatNumbers());

        long amountInPaise = b.getTotalAmount().multiply(BigDecimal.valueOf(100))
                .setScale(0, java.math.RoundingMode.HALF_UP).longValue();
        String seats = r.seatNumbers() == null ? "" :
                r.seatNumbers().stream().map(String::valueOf).collect(Collectors.joining(","));
        String base = props.frontendUrl();

        SessionCreateParams params = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setSuccessUrl(base + "/payment/stripe-success?session_id={CHECKOUT_SESSION_ID}")
                .setCancelUrl(base + "/booking/" + b.getId() + "/payment?error=cancelled")
                .setClientReferenceId(String.valueOf(b.getId()))
                .setCustomerEmail(b.getPrimaryEmail())
                // Stripe requires at least 30 minutes; our own 10-minute rule is enforced before this point.
                .setExpiresAt(Instant.now().plusSeconds(31 * 60).getEpochSecond())
                .putMetadata(META_TYPE, TYPE_TICKET)
                .putMetadata("bookingId", String.valueOf(b.getId()))
                .putMetadata("userId", String.valueOf(userId))
                .putMetadata("seats", seats)
                .addLineItem(SessionCreateParams.LineItem.builder()
                        .setQuantity(1L)
                        .setPriceData(SessionCreateParams.LineItem.PriceData.builder()
                                .setCurrency("inr")
                                .setUnitAmount(amountInPaise) // amount comes from the DB, never from the browser
                                .setProductData(SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                        .setName("Train Booking #" + b.getId())
                                        .setDescription("Ticket for " + b.getTrain().getTrainName())
                                        .build())
                                .build())
                        .build())
                .build();
        try {
            return new StripeSessionResponse(Session.create(params).getUrl());
        } catch (StripeException e) {
            log.error("Stripe session creation failed", e);
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Payment gateway error: " + e.getMessage());
        }
    }

    /** Called by the React "stripe-success" page with the session_id Stripe put in the redirect URL. */
    public PaymentResult confirmStripe(Integer userId, StripeConfirmRequest r) {
        if (!stripe.isEnabled()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Stripe is not configured on the server.");
        }
        Session s;
        try {
            s = Session.retrieve(r.sessionId());
        } catch (StripeException e) {
            throw ApiException.badRequest("Could not verify the payment with Stripe.");
        }
        if (!TYPE_TICKET.equals(s.getMetadata().get(META_TYPE))) {
            throw ApiException.badRequest("This payment session is not for a train ticket.");
        }
        if (!"paid".equals(s.getPaymentStatus())) {
            throw new ApiException(HttpStatus.PAYMENT_REQUIRED,
                    "Payment not successful. Status: " + s.getPaymentStatus());
        }
        Integer bookingId = Integer.valueOf(s.getMetadata().get("bookingId"));
        String payer = s.getCustomerDetails() != null ? s.getCustomerDetails().getEmail() : null;

        // Strict = false: the user has already paid, so if a chosen seat was taken meanwhile we
        // auto-assign another one instead of failing.
        BookingDto b = bookingService.confirm(userId, bookingId, parseSeats(s.getMetadata().get("seats")),
                new BookingService.PaymentInfo("STRIPE", "Stripe Session: " + s.getId(),
                        s.getPaymentIntent(), payer),
                false);
        return new PaymentResult(b.bookingId(), b.status());
    }

    private void ensureNotExpired(Integer userId, Integer bookingId) {
        if (bookingService.expireIfStale(userId, bookingId)) {
            throw new ApiException(HttpStatus.GONE,
                    "Session Expired. You exceeded the " + props.booking().holdMinutes() + "-minute booking limit.");
        }
    }

    private static List<Integer> parseSeats(String csv) {
        if (csv == null || csv.isBlank()) return List.of();
        return Arrays.stream(csv.split(",")).map(String::trim).filter(x -> !x.isEmpty())
                .map(Integer::valueOf).toList();
    }
}
