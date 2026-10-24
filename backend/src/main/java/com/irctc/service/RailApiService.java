package com.irctc.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.irctc.config.AppProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/**
 * Port of the old TrainService (RapidAPI "irctc-api2").
 * The API key used to be hard-coded in the Java source; it now comes from RAPIDAPI_KEY.
 */
@Service
public class RailApiService {

    private static final Logger log = LoggerFactory.getLogger(RailApiService.class);

    private final RestClient client;
    private final boolean enabled;

    public RailApiService(AppProperties props) {
        String key = props.rapidapi().key();
        String host = props.rapidapi().host();
        this.enabled = key != null && !key.isBlank();

        SimpleClientHttpRequestFactory rf = new SimpleClientHttpRequestFactory();
        rf.setConnectTimeout(5_000);
        rf.setReadTimeout(15_000);

        this.client = RestClient.builder()
                .requestFactory(rf)
                .baseUrl("https://" + host)
                .defaultHeader("x-rapidapi-key", enabled ? key : "")
                .defaultHeader("x-rapidapi-host", host)
                .build();
    }

    public boolean isEnabled() {
        return enabled;
    }

    public JsonNode pnrStatus(String pnr) {
        return call("/pnrStatus?pnr={pnr}", pnr);
    }

    /** startDay: 0 = today, 1 = yesterday, 2 = day before. */
    public JsonNode liveTrainStatus(String trainNo, int startDay) {
        return call("/liveTrain?trainNumber={t}&startDay={d}", trainNo, startDay);
    }

    private JsonNode call(String uri, Object... vars) {
        if (!enabled) return null;
        try {
            return client.get().uri(uri, vars).retrieve().body(JsonNode.class);
        } catch (RestClientException e) {
            log.warn("RapidAPI call {} failed: {}", uri, e.getMessage());
            return null;
        }
    }
}
