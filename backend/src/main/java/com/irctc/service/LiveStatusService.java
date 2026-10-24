package com.irctc.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.irctc.dto.MiscDtos.LiveStatus;
import com.irctc.exception.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

/** Port of LiveStatusServlet; returns a flat, null-safe DTO instead of raw JSON to the page. */
@Service
public class LiveStatusService {

    private final RailApiService railApi;

    public LiveStatusService(RailApiService railApi) {
        this.railApi = railApi;
    }

    public LiveStatus track(String trainNo, int startDay) {
        if (trainNo == null || !trainNo.trim().matches("\\d{5}")) {
            throw ApiException.badRequest("Please enter a valid 5-digit train number.");
        }
        if (startDay < 0 || startDay > 2) startDay = 0;
        if (!railApi.isEnabled()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Live train tracking is not configured on this server.");
        }
        JsonNode res = railApi.liveTrainStatus(trainNo.trim(), startDay);
        if (res == null || !res.path("success").asBoolean(false)) {
            String msg = res != null && res.hasNonNull("message") ? res.get("message").asText()
                    : "Could not track train " + trainNo;
            throw ApiException.notFound(msg);
        }
        JsonNode d = res.path("data");
        JsonNode next = d.path("next_stoppage_info");
        return new LiveStatus(
                d.path("train_name").asText(""),
                d.path("train_number").asText(trainNo),
                d.path("delay").asInt(0),
                d.path("distance_from_source").asDouble(0),
                d.path("total_distance").asDouble(0),
                next.path("next_stoppage").asText(""),
                next.path("next_stoppage_time_diff").asText("").replace("in ", ""),
                d.path("current_station_name").asText(""),
                d.path("eta").asText(""));
    }
}
