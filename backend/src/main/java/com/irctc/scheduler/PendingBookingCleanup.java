package com.irctc.scheduler;

import com.irctc.config.AppProperties;
import com.irctc.entity.Booking;
import com.irctc.repository.BookingRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * NEW. In the old app, if a user closed the tab on the seat/payment page the booking stayed
 * PENDING forever. This job cancels such bookings every minute. The cutoff is longer than the
 * 10-minute UI timer so that a user who is still on Stripe's checkout page is not cancelled.
 */
@Component
public class PendingBookingCleanup {

    private static final Logger log = LoggerFactory.getLogger(PendingBookingCleanup.class);

    private final BookingRepository bookings;
    private final AppProperties props;

    public PendingBookingCleanup(BookingRepository bookings, AppProperties props) {
        this.bookings = bookings;
        this.props = props;
    }

    @Scheduled(fixedDelay = 60_000, initialDelay = 30_000)
    @Transactional
    public void cancelAbandoned() {
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(props.booking().stalePendingMinutes());
        List<Booking> stale = bookings.findByStatusAndCreatedAtBefore(Booking.PENDING, cutoff);
        stale.forEach(b -> b.setStatus(Booking.CANCELLED));
        if (!stale.isEmpty()) {
            log.info("Auto-cancelled {} abandoned PENDING booking(s)", stale.size());
        }
    }
}
