package com.irctc.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.irctc.config.AppProperties;
import com.irctc.entity.Train;
import com.irctc.repository.TrainRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

/**
 * "Disha" AI assistant. Port of ChatServlet + GeminiService: the prompt is grounded with the
 * local train table so answers about schedules come from our own data (a simple form of RAG).
 */
@Service
public class ChatService {

    private static final Logger log = LoggerFactory.getLogger(ChatService.class);

    private final TrainRepository trains;
    private final RestClient client;
    private final String apiKey;
    private final String model;

    public ChatService(TrainRepository trains, AppProperties props) {
        this.trains = trains;
        this.apiKey = props.gemini().apiKey();
        this.model = props.gemini().model();
        SimpleClientHttpRequestFactory rf = new SimpleClientHttpRequestFactory();
        rf.setConnectTimeout(5_000);
        rf.setReadTimeout(30_000);
        this.client = RestClient.builder().requestFactory(rf)
                .baseUrl("https://generativelanguage.googleapis.com").build();
    }

    @Transactional(readOnly = true)
    public String ask(String userMessage) {
        if (apiKey == null || apiKey.isBlank()) {
            return "I am currently offline (the AI key is not configured on the server). "
                    + "You can still search trains, check PNR status and track live trains from the home page.";
        }
        String prompt = buildContext() + "\n\nUser Query: \"" + userMessage + "\"\nDisha's Answer:";
        Map<String, Object> body = Map.of("contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))));
        try {
            JsonNode res = client.post()
                    .uri("/v1beta/models/{model}:generateContent?key={key}", model, apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(JsonNode.class);
            JsonNode cand = res == null ? null : res.path("candidates").path(0);
            if (cand == null || cand.isMissingNode()) {
                return "I couldn't generate a response. Please try again.";
            }
            String finish = cand.path("finishReason").asText("STOP");
            if (!"STOP".equals(finish)) {
                return "I cannot answer that query due to safety guidelines.";
            }
            return cand.path("content").path("parts").path(0).path("text").asText("I couldn't generate a response.");
        } catch (Exception e) {
            log.warn("Gemini call failed: {}", e.getMessage());
            return "I am currently unavailable. Please try again in a moment.";
        }
    }

    private String buildContext() {
        StringBuilder sb = new StringBuilder()
                .append("You are 'Disha', the AI assistant for the IRCTC Clone app. ")
                .append("You have access to a LOCAL DATABASE of trains and general travel knowledge. ")
                .append("Be concise, helpful, and use emojis 🚆.\n\n### 🚆 LOCAL TRAIN DATABASE:\n");
        List<Train> list = trains.findAllByOrderByTrainNameAsc();
        if (list.isEmpty()) {
            sb.append("(Database empty. Rely on general knowledge).\n");
        }
        for (Train t : list) {
            sb.append(String.format("- [Train #%s] %s: %s to %s. Departs: %s, Arrives: %s. Seats: %d. Base Fare: %.2f/km%n",
                    t.getTrainNumber(), t.getTrainName(), t.getSource(), t.getDestination(),
                    t.getDepartureTime(), t.getArrivalTime(), t.getAvailableSeats(), t.getFarePerKm()));
        }
        return sb.append("\n### 🧠 GUIDELINES:\n")
                .append("1. Check the 'Local Database' first for schedules.\n")
                .append("2. If a train isn't found locally, say: 'I don't have that route in my local system, but typically trains run there. Please check official sources.'\n")
                .append("3. You can answer general questions about tourism, food, and safety.\n")
                .append("4. App Features: PNR Status, Live Status, Seat Selection are available on the home page.\n")
                .toString();
    }
}
