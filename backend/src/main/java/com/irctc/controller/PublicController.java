package com.irctc.controller;

import com.irctc.dto.MiscDtos.*;
import com.irctc.service.ChatService;
import com.irctc.service.LiveStatusService;
import com.irctc.service.PnrService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/** Endpoints that work without login: PNR status, live train status, AI chat, health check. */
@RestController
@RequestMapping("/api")
public class PublicController {

    private final PnrService pnr;
    private final LiveStatusService live;
    private final ChatService chat;

    public PublicController(PnrService pnr, LiveStatusService live, ChatService chat) {
        this.pnr = pnr;
        this.live = live;
        this.chat = chat;
    }

    @GetMapping("/pnr/{pnr}")
    public PnrResult pnr(@PathVariable String pnr) {
        return this.pnr.lookup(pnr);
    }

    @GetMapping("/live-status/{trainNo}")
    public LiveStatus live(@PathVariable String trainNo, @RequestParam(defaultValue = "0") int startDay) {
        return live.track(trainNo, startDay);
    }

    @PostMapping("/chat")
    public ChatResponse chat(@Valid @RequestBody ChatRequest req) {
        return new ChatResponse(chat.ask(req.message().trim()));
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "UP");
    }
}
