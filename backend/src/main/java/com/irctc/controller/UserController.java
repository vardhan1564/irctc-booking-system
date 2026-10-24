package com.irctc.controller;

import com.irctc.dto.AuthDtos.UpdateProfileRequest;
import com.irctc.dto.AuthDtos.UserDto;
import com.irctc.security.AuthPrincipal;
import com.irctc.service.UserService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService users;

    public UserController(UserService users) {
        this.users = users;
    }

    @GetMapping("/me")
    public UserDto me(@AuthenticationPrincipal AuthPrincipal me) {
        return users.me(me.id());
    }

    @PutMapping("/me")
    public UserDto update(@AuthenticationPrincipal AuthPrincipal me, @Valid @RequestBody UpdateProfileRequest req) {
        return users.update(me.id(), req);
    }
}
