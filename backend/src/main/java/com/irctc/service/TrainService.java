package com.irctc.service;

import com.irctc.dto.TrainDtos.TrainSearchResult;
import com.irctc.entity.Train;
import com.irctc.entity.TrainStop;
import com.irctc.exception.ApiException;
import com.irctc.repository.TrainSearchDao;
import com.irctc.repository.TrainStopRepository;
import com.irctc.util.FareCalculator;
import com.irctc.util.StationName;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.List;

/** Replaces StationSearchServlet, TrainListServlet and the route/fare logic of BookingServlet. */
@Service
@Transactional(readOnly = true)
public class TrainService {

    private final TrainSearchDao searchDao;
    private final TrainStopRepository stops;

    public TrainService(TrainSearchDao searchDao, TrainStopRepository stops) {
        this.searchDao = searchDao;
        this.stops = stops;
    }

    public List<String> searchStations(String term) {
        if (term == null || term.trim().length() < 2) return List.of();
        return searchDao.searchStations(term.trim());
    }

    public List<TrainSearchResult> search(String sourceRaw, String destinationRaw) {
        StationName src = StationName.parse(sourceRaw);
        StationName dst = StationName.parse(destinationRaw);
        if (src.code().isBlank() || dst.code().isBlank()) {
            throw ApiException.badRequest("Please choose both source and destination stations.");
        }
        if (src.code().equalsIgnoreCase(dst.code())) {
            throw ApiException.badRequest("Source and destination cannot be the same.");
        }
        return searchDao.search(src.name(), src.code(), dst.name(), dst.code(),
                        FareCalculator.DIRECT_TRAIN_BASE_FARE)
                .stream()
                .map(r -> new TrainSearchResult(r.trainId(), r.trainName(), r.trainNumber(),
                        r.departureTime(), r.arrivalTime(), r.segmentDeparture(), r.segmentArrival(),
                        r.availableSeats(), r.ticketPrice()))
                .toList();
    }

    /** Distance-based base fare (SL) and segment times for a journey between two stations. */
    public record Route(BigDecimal baseFare, LocalTime segmentDeparture, LocalTime segmentArrival) {}

    public Route resolveRoute(Train train, String sourceRaw, String destinationRaw) {
        StationName src = StationName.parse(sourceRaw);
        StationName dst = StationName.parse(destinationRaw);

        TrainStop from = first(stops.findStop(train.getId(), src.name(), src.code()));
        TrainStop to = first(stops.findStop(train.getId(), dst.name(), dst.code()));

        if (from != null && to != null && from.getStopNumber() < to.getStopNumber()) {
            int distance = to.getDistanceFromSource() - from.getDistanceFromSource();
            return new Route(FareCalculator.baseFare(train.getFarePerKm(), distance),
                    from.getDepartureTime(), to.getArrivalTime());
        }

        // Train without configured stops: allowed only for its own end-to-end route.
        // (The old code showed a fare of 0.00 here and then crashed on "Proceed to Payment".)
        if (!stops.existsByTrainId(train.getId())
                && matches(train.getSource(), src) && matches(train.getDestination(), dst)) {
            return new Route(FareCalculator.DIRECT_TRAIN_BASE_FARE,
                    train.getDepartureTime(), train.getArrivalTime());
        }
        throw ApiException.badRequest("Route details not found for this train.");
    }

    /** Segment times for display; falls back to the train's own times if stops are missing. */
    public LocalTime[] segmentTimesOrDefault(Train train, String source, String destination) {
        try {
            Route r = resolveRoute(train, source, destination);
            return new LocalTime[]{r.segmentDeparture(), r.segmentArrival()};
        } catch (ApiException e) {
            return new LocalTime[]{train.getDepartureTime(), train.getArrivalTime()};
        }
    }

    private static boolean matches(String value, StationName s) {
        return value != null && (value.equalsIgnoreCase(s.name()) || value.equalsIgnoreCase(s.code()));
    }

    private static TrainStop first(List<TrainStop> list) {
        return list.isEmpty() ? null : list.get(0);
    }
}
