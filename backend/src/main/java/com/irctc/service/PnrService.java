package com.irctc.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.irctc.dto.MiscDtos.PnrPassenger;
import com.irctc.dto.MiscDtos.PnrResult;
import com.irctc.entity.Booking;
import com.irctc.entity.Passenger;
import com.irctc.exception.ApiException;
import com.irctc.repository.BookingRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Port of PublicPnrServlet. Short numbers = our own bookings, 10 digits = real IRCTC via RapidAPI.
 * Both are normalised into one PnrResult shape so React needs a single page for both.
 */
@Service
public class PnrService {

    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("dd-MMM-yyyy", Locale.ENGLISH);

    private final BookingRepository bookings;
    private final RailApiService railApi;

    public PnrService(BookingRepository bookings, RailApiService railApi) {
        this.bookings = bookings;
        this.railApi = railApi;
    }

    @Transactional(readOnly = true)
    public PnrResult lookup(String rawPnr) {
        String pnr = rawPnr == null ? "" : rawPnr.trim();
        if (!pnr.matches("\\d{1,10}")) {
            throw ApiException.badRequest("Invalid PNR Format. Use 10 digits for real trains or your Booking ID.");
        }
        return pnr.length() < 10 ? local(Integer.parseInt(pnr)) : live(pnr);
    }

    private PnrResult local(int id) {
        Booking b = bookings.findWithDetailsById(id)
                .filter(x -> !Booking.PENDING.equals(x.getStatus()))
                .orElseThrow(() -> ApiException.notFound("PNR not found."));
        boolean confirmed = Booking.CONFIRMED.equals(b.getStatus());
        List<PnrPassenger> pax = new ArrayList<>();
        for (Passenger p : b.getPassengerList()) {
            pax.add(new PnrPassenger(p.getName(), b.getStatus(),
                    confirmed ? p.getCoachCode() : null,
                    confirmed && p.getSeatNumber() != null ? String.valueOf(p.getSeatNumber()) : null,
                    confirmed ? p.getBerthType() : null));
        }
        return new PnrResult("LOCAL", String.valueOf(b.getId()),
                b.getTrain().getTrainNumber() + " / " + b.getTrain().getTrainName(),
                DATE.format(b.getJourneyDate()), b.getSegmentSource(), b.getSegmentDestination(),
                b.getStatus(), pax);
    }

    private PnrResult live(String pnr) {
        if (!railApi.isEnabled()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Live IRCTC PNR lookup is not configured on this server.");
        }
        JsonNode res = railApi.pnrStatus(pnr);
        boolean ok = res != null && (res.path("success").asBoolean(false) || res.path("status").asBoolean(false));
        if (!ok || !res.has("data")) {
            throw ApiException.notFound("PNR not found.");
        }
        JsonNode d = res.path("data");
        List<PnrPassenger> pax = new ArrayList<>();
        int i = 1;
        for (JsonNode p : d.path("passengers")) {
            pax.add(new PnrPassenger("Passenger " + i++,
                    p.path("currentStatus").asText("-"),
                    p.path("coach").asText(null),
                    p.has("berth") ? p.path("berth").asText() : null,
                    null));
        }
        return new PnrResult("API", pnr,
                d.path("trainNumber").asText("") + " / " + d.path("trainName").asText(""),
                d.path("journeyDate").asText(""),
                d.path("source").asText(""), d.path("destination").asText(""),
                null, pax);
    }
}
