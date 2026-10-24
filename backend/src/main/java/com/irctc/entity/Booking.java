package com.irctc.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * A booking (PNR = bookingId). Lifecycle: PENDING -> CONFIRMED -> (optionally) CANCELLED,
 * or PENDING -> CANCELLED when the payment window expires.
 */
@Entity
@Table(name = "bookings")
@Getter
@Setter
public class Booking {

    public static final String PENDING = "PENDING";
    public static final String CONFIRMED = "CONFIRMED";
    public static final String CANCELLED = "CANCELLED";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "booking_id")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "train_id")
    private Train train;

    @Column(name = "booking_date")
    private LocalDate bookingDate;

    @Column(name = "journey_date")
    private LocalDate journeyDate;

    /** Number of passengers (column is called "passengers" in the original schema). */
    @Column(name = "passengers")
    private Integer passengerCount;

    @Column(name = "total_amount", precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "status", length = 20)
    private String status;

    @Column(name = "primary_email", length = 150)
    private String primaryEmail;

    @Column(name = "segment_source", length = 100)
    private String segmentSource;

    @Column(name = "segment_destination", length = 100)
    private String segmentDestination;

    /**
     * NEW column. The old app kept the class only in the HttpSession, so the PDF always printed
     * "SLEEPER (SL)" and the class was lost after logout. Hibernate adds this column automatically.
     */
    @Column(name = "class_code", length = 5)
    private String classCode = "SL";

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id ASC")
    private List<Passenger> passengerList = new ArrayList<>();

    public void addPassenger(Passenger p) {
        p.setBooking(this);
        passengerList.add(p);
    }
}
