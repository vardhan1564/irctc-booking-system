package com.irctc.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;

/** food_orders is write-only from the app, so a tiny JdbcTemplate DAO is enough. */
@Repository
public class FoodOrderDao {

    private final JdbcTemplate jdbc;

    public FoodOrderDao(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public boolean existsByPaymentId(String paymentId) {
        Integer n = jdbc.queryForObject("SELECT COUNT(*) FROM food_orders WHERE payment_id = ?",
                Integer.class, paymentId);
        return n != null && n > 0;
    }

    public void insert(int bookingId, String contactName, String contactPhone,
                       BigDecimal totalAmount, String items, String paymentId) {
        jdbc.update("INSERT INTO food_orders (booking_id, contact_name, contact_phone, total_amount, " +
                        "items_json, payment_id, order_status) VALUES (?, ?, ?, ?, ?, ?, 'PLACED')",
                bookingId, contactName, contactPhone, totalAmount, items, paymentId);
    }
}
