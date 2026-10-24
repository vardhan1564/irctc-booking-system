package com.irctc.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalTime;

@Entity
@Table(name = "train_stops")
@Getter
@Setter
public class TrainStop {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "stop_id")
    private Integer id;

    @Column(name = "train_id")
    private Integer trainId;

    @Column(name = "station_code", length = 10)
    private String stationCode;

    @Column(name = "station_name", length = 100)
    private String stationName;

    @Column(name = "stop_number")
    private Integer stopNumber;

    @Column(name = "arrival_time")
    private LocalTime arrivalTime;

    @Column(name = "departure_time")
    private LocalTime departureTime;

    @Column(name = "distance_from_source")
    private Integer distanceFromSource;
}
