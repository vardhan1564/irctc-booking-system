package com.irctc.repository;

import com.irctc.entity.Booking;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Integer> {

    /** "My Bookings" page. EntityGraph loads the train in the same query (avoids N+1). */
    @EntityGraph(attributePaths = {"train"})
    List<Booking> findByUser_IdAndStatusInOrderByCreatedAtDesc(Integer userId, Collection<String> statuses);

    /** Admin "All Bookings" page. */
    @EntityGraph(attributePaths = {"train", "user"})
    List<Booking> findAllByOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = {"train", "user"})
    @Query("select b from Booking b where b.id = :id")
    Optional<Booking> findWithDetailsById(@Param("id") Integer id);

    /** Row lock while confirming / cancelling (replaces getBookingByIdForUpdate). */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select b from Booking b where b.id = :id")
    Optional<Booking> findByIdForUpdate(@Param("id") Integer id);

    @Query("select coalesce(sum(b.totalAmount), 0) from Booking b where b.status = 'CONFIRMED'")
    BigDecimal totalConfirmedRevenue();

    /** Seats already taken in one coach of one train on one date. */
    @Query("select p.seatNumber from Passenger p join p.booking b " +
           "where b.train.id = :trainId and b.journeyDate = :date and p.coachCode = :coach " +
           "and b.status in ('CONFIRMED', 'PENDING') and p.seatNumber > 0")
    List<Integer> findBookedSeats(@Param("trainId") Integer trainId,
                                  @Param("date") LocalDate date,
                                  @Param("coach") String coach);

    List<Booking> findByStatusAndCreatedAtBefore(String status, LocalDateTime cutoff);
}
