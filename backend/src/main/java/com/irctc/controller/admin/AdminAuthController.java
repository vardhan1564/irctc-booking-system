package com.irctc.controller.admin;

import com.irctc.dto.AuthDtos.AdminAuthResponse;
import com.irctc.dto.AuthDtos.AdminLoginRequest;
import com.irctc.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/auth")
public class AdminAuthController {

    private final AuthService auth;

    public AdminAuthController(AuthService auth) {
        this.auth = auth;
    }

    @PostMapping("/login")
    public AdminAuthResponse login(@Valid @RequestBody AdminLoginRequest req) {
        return auth.adminLogin(req);
    }
}
