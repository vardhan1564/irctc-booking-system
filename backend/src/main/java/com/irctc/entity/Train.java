package com.irctc.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalTime;

@Entity
@Table(name = "trains")
@Getter
@Setter
public class Train {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "train_id")
    private Integer id;

    @Column(name = "train_name", length = 100)
    private String trainName;

    @Column(name = "train_number", length = 10)
    private String trainNumber;

    @Column(name = "source", length = 100)
    private String source;

    @Column(name = "destination", length = 100)
    private String destination;

    @Column(name = "departure_time")
    private LocalTime departureTime;

    @Column(name = "arrival_time")
    private LocalTime arrivalTime;

    @Column(name = "total_seats")
    private Integer totalSeats;

    @Column(name = "available_seats")
    private Integer availableSeats;

    @Column(name = "fare_per_km", precision = 10, scale = 2)
    private BigDecimal farePerKm;
}
