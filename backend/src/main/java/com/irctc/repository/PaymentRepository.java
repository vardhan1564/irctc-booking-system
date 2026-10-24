package com.irctc.repository;

import com.irctc.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Integer> {
    Optional<Payment> findFirstByBooking_IdOrderByIdDesc(Integer bookingId);
}
