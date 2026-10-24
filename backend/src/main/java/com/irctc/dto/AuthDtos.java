package com.irctc.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public final class AuthDtos {
    private AuthDtos() {}

    public record RegisterRequest(
            @NotBlank @Size(max = 100) String fullName,
            @NotBlank @Email String email,
            @NotBlank @Size(min = 6, max = 64, message = "must be at least 6 characters") String password,
            @NotBlank String confirmPassword,
            @NotBlank @Pattern(regexp = "^[0-9+\\- ]{10,15}$", message = "must be a valid phone number") String phone,
            @NotBlank String gender,
            @NotBlank @Size(max = 255) String address,
            String verificationMethod) {}

    public record LoginRequest(@NotBlank @Email String email, @NotBlank String password) {}

    public record VerifyOtpRequest(@NotBlank @Email String email,
                                   @NotBlank @Pattern(regexp = "\\d{6}", message = "must be 6 digits") String otp) {}

    public record ResendOtpRequest(@NotBlank @Email String email) {}

    public record UpdateProfileRequest(
            @NotBlank @Size(max = 100) String fullName,
            @NotBlank @Pattern(regexp = "^[0-9+\\- ]{10,15}$", message = "must be a valid phone number") String phone,
            @NotBlank @Size(max = 255) String address) {}

    public record AdminLoginRequest(@NotBlank String username, @NotBlank String password) {}

    public record UserDto(Integer id, String fullName, String email, String phone, String gender,
                          Integer age, String address, boolean verified, boolean blocked,
                          LocalDateTime createdAt) {}

    public record AdminDto(Integer id, String username, String fullName) {}

    public record AuthResponse(String token, UserDto user) {}

    public record AdminAuthResponse(String token, AdminDto admin) {}

    public record RegisterResponse(String message, String method, String email) {}
}
