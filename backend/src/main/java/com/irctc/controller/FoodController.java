package com.irctc.controller;

import com.irctc.dto.MiscDtos.*;
import com.irctc.dto.PaymentDtos.StripeSessionResponse;
import com.irctc.security.AuthPrincipal;
import com.irctc.service.FoodService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/food")
public class FoodController {

    private final FoodService food;

    public FoodController(FoodService food) {
        this.food = food;
    }

    @GetMapping("/menu")
    public FoodMenuResponse menu(@AuthenticationPrincipal AuthPrincipal me,
                                 @RequestParam Integer pnr,
                                 @RequestParam(defaultValue = "false") boolean full) {
        return food.getMenu(me.id(), pnr, full);
    }

    @PostMapping("/checkout")
    public StripeSessionResponse checkout(@AuthenticationPrincipal AuthPrincipal me,
                                          @Valid @RequestBody FoodCheckoutRequest req) {
        return food.checkout(me.id(), req);
    }

    @PostMapping("/confirm")
    public MessageResponse confirm(@AuthenticationPrincipal AuthPrincipal me,
                                   @Valid @RequestBody FoodConfirmRequest req) {
        return food.confirm(me.id(), req.sessionId());
    }
}
