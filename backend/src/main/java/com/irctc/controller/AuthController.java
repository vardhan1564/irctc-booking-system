package com.irctc.controller;

import com.irctc.dto.AuthDtos.*;
import com.irctc.service.AuthService;
import com.irctc.service.AuthService.MessageText;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService auth;

    public AuthController(AuthService auth) {
        this.auth = auth;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public RegisterResponse register(@Valid @RequestBody RegisterRequest req) {
        return auth.register(req);
    }

    @PostMapping("/verify-otp")
    public MessageText verifyOtp(@Valid @RequestBody VerifyOtpRequest req) {
        return auth.verifyOtp(req);
    }

    @PostMapping("/resend-otp")
    public MessageText resendOtp(@Valid @RequestBody ResendOtpRequest req) {
        return auth.resendOtp(req);
    }

    @GetMapping("/verify-email")
    public MessageText verifyEmail(@RequestParam String token) {
        return auth.verifyEmailLink(token);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req) {
        return auth.login(req);
    }
}
