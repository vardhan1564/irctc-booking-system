package com.irctc.controller;

import com.irctc.dto.PaymentDtos.*;
import com.irctc.security.AuthPrincipal;
import com.irctc.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService payments;

    public PaymentController(PaymentService payments) {
        this.payments = payments;
    }

    @PostMapping("/dummy")
    public PaymentResult dummy(@AuthenticationPrincipal AuthPrincipal me, @Valid @RequestBody DummyPaymentRequest req) {
        return payments.payDummy(me.id(), req);
    }

    @PostMapping("/stripe/session")
    public StripeSessionResponse stripeSession(@AuthenticationPrincipal AuthPrincipal me,
                                               @Valid @RequestBody StripeSessionRequest req) {
        return payments.createStripeSession(me.id(), req);
    }

    @PostMapping("/stripe/confirm")
    public PaymentResult stripeConfirm(@AuthenticationPrincipal AuthPrincipal me,
                                       @Valid @RequestBody StripeConfirmRequest req) {
        return payments.confirmStripe(me.id(), req);
    }
}
