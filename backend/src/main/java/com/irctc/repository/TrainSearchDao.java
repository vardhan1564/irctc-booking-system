package com.irctc.repository;

import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.sql.Time;
import java.time.LocalTime;
import java.util.List;

/**
 * Queries that are clearer as hand-written SQL than as JPQL:
 *  - the multi-stop train search (self-join on train_stops + UNION for direct trains)
 *  - station autocomplete on the "stations" table (no entity / primary key needed)
 */
@Repository
public class TrainSearchDao {

    private final NamedParameterJdbcTemplate jdbc;

    public TrainSearchDao(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public record SearchRow(Integer trainId, String trainName, String trainNumber, String source,
                            String destination, LocalTime departureTime, LocalTime arrivalTime,
                            Integer availableSeats, LocalTime segmentDeparture, LocalTime segmentArrival,
                            BigDecimal ticketPrice) {}

    /** Same logic as the old TrainDAOImpl.findTrains(): price = distance * fare_per_km. */
    private static final String SEARCH_SQL = """
            SELECT * FROM (
                SELECT t.train_id, t.train_name, t.train_number, t.source, t.destination,
                       t.departure_time, t.arrival_time, t.available_seats,
                       s_from.departure_time AS segment_dep_time,
                       s_to.arrival_time     AS segment_arr_time,
                       (s_to.distance_from_source - s_from.distance_from_source) * t.fare_per_km AS ticket_price
                FROM trains t
                JOIN train_stops s_from ON t.train_id = s_from.train_id
                JOIN train_stops s_to   ON t.train_id = s_to.train_id
                WHERE (s_from.station_name = :srcName OR s_from.station_code = :srcCode)
                  AND (s_to.station_name   = :dstName OR s_to.station_code   = :dstCode)
                  AND s_from.stop_number < s_to.stop_number
                  AND t.available_seats > 0
                UNION
                SELECT t.train_id, t.train_name, t.train_number, t.source, t.destination,
                       t.departure_time, t.arrival_time, t.available_seats,
                       t.departure_time AS segment_dep_time,
                       t.arrival_time   AS segment_arr_time,
                       :directFare      AS ticket_price
                FROM trains t
                LEFT JOIN train_stops ts ON t.train_id = ts.train_id
                WHERE t.source IN (:srcName, :srcCode)
                  AND t.destination IN (:dstName, :dstCode)
                  AND t.available_seats > 0
                  AND ts.train_id IS NULL
            ) AS combined_results
            ORDER BY segment_dep_time ASC
            """;

    public List<SearchRow> search(String srcName, String srcCode, String dstName, String dstCode,
                                  BigDecimal directFare) {
        MapSqlParameterSource p = new MapSqlParameterSource()
                .addValue("srcName", srcName).addValue("srcCode", srcCode)
                .addValue("dstName", dstName).addValue("dstCode", dstCode)
                .addValue("directFare", directFare);

        return jdbc.query(SEARCH_SQL, p, (rs, i) -> new SearchRow(
                rs.getInt("train_id"),
                rs.getString("train_name"),
                rs.getString("train_number"),
                rs.getString("source"),
                rs.getString("destination"),
                toLocalTime(rs.getTime("departure_time")),
                toLocalTime(rs.getTime("arrival_time")),
                rs.getInt("available_seats"),
                toLocalTime(rs.getTime("segment_dep_time")),
                toLocalTime(rs.getTime("segment_arr_time")),
                rs.getBigDecimal("ticket_price")));
    }

    /** Station autocomplete: matches name, code or city prefix. Returns "Name - CODE". */
    public List<String> searchStations(String term) {
        String sql = """
                SELECT station_code, MAX(station_name) AS station_name
                FROM stations
                WHERE station_name LIKE :q OR station_code LIKE :q OR city_name LIKE :q
                GROUP BY station_code
                LIMIT 15
                """;
        return jdbc.query(sql, new MapSqlParameterSource("q", term + "%"),
                (rs, i) -> {
                    String name = rs.getString("station_name");
                    return (name == null ? "" : name.trim()) + " - " + rs.getString("station_code");
                });
    }

    private static LocalTime toLocalTime(Time t) {
        return t == null ? null : t.toLocalTime();
    }
}
