package com.irctc.service;

import com.irctc.config.AppProperties;
import com.irctc.dto.AuthDtos.*;
import com.irctc.entity.Admin;
import com.irctc.entity.User;
import com.irctc.exception.ApiException;
import com.irctc.repository.AdminRepository;
import com.irctc.repository.UserRepository;
import com.irctc.security.AuthPrincipal;
import com.irctc.security.JwtService;
import com.irctc.util.AfterCommit;
import com.irctc.util.DtoMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.Locale;
import java.util.UUID;

/**
 * Replaces LoginServlet, RegisterServlet, VerifyOtpServlet, VerifyEmailServlet and AdminLoginServlet.
 */
@Service
@Transactional
public class AuthService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository users;
    private final AdminRepository admins;
    private final PasswordService passwords;
    private final JwtService jwt;
    private final EmailService email;
    private final AppProperties props;

    public AuthService(UserRepository users, AdminRepository admins, PasswordService passwords,
                       JwtService jwt, EmailService email, AppProperties props) {
        this.users = users;
        this.admins = admins;
        this.passwords = passwords;
        this.jwt = jwt;
        this.email = email;
        this.props = props;
    }

    public RegisterResponse register(RegisterRequest r) {
        if (!r.password().equals(r.confirmPassword())) {
            throw ApiException.badRequest("Passwords do not match.");
        }
        String emailAddr = r.email().trim().toLowerCase(Locale.ROOT);
        if (users.existsByEmailIgnoreCase(emailAddr)) {
            throw ApiException.conflict("Email already in use. Please try another.");
        }
        String method = "LINK".equalsIgnoreCase(r.verificationMethod()) ? "LINK" : "OTP";
        String token = "OTP".equals(method) ? newOtp() : UUID.randomUUID().toString();

        User u = new User();
        u.setFullName(r.fullName().trim());
        u.setEmail(emailAddr);
        u.setPassword(passwords.hash(r.password()));
        u.setPhone(r.phone().trim());
        u.setGender(r.gender().toUpperCase(Locale.ROOT));
        u.setAddress(r.address().trim());
        u.setVerified(false);
        u.setBlocked(false);
        u.setVerificationToken(token);
        users.save(u);

        if ("OTP".equals(method)) {
            AfterCommit.run(() -> email.sendOtpEmail(emailAddr, token));
            return new RegisterResponse("We have sent a 6-digit code to " + emailAddr + ".", method, emailAddr);
        }
        String link = props.frontendUrl() + "/verify-email?token=" + token;
        AfterCommit.run(() -> email.sendVerificationEmail(emailAddr, link));
        return new RegisterResponse("Registration successful! A verification link has been sent to "
                + emailAddr + ". Please check your inbox.", method, emailAddr);
    }

    public MessageText verifyOtp(VerifyOtpRequest r) {
        User u = users.findByEmailIgnoreCase(r.email().trim())
                .orElseThrow(() -> ApiException.badRequest("Invalid OTP. Please check and try again."));
        if (u.isVerifiedUser()) {
            return new MessageText("Account already verified. Please login.");
        }
        // Old code looked the OTP up across ALL users (two users could share an OTP). Now it is per email.
        if (u.getVerificationToken() == null || !u.getVerificationToken().equals(r.otp().trim())) {
            throw ApiException.badRequest("Invalid OTP. Please check and try again.");
        }
        markVerified(u);
        return new MessageText("Account verified successfully! Please login.");
    }

    public MessageText verifyEmailLink(String token) {
        if (token == null || token.isBlank()) {
            throw ApiException.badRequest("Invalid verification link.");
        }
        User u = users.findByVerificationToken(token)
                .orElseThrow(() -> ApiException.badRequest("Invalid or expired verification link."));
        markVerified(u);
        return new MessageText("Email verified successfully! You can now login.");
    }

    /** NEW: the old "Resend" link on verifyOtp.jsp pointed to "#". */
    public MessageText resendOtp(ResendOtpRequest r) {
        users.findByEmailIgnoreCase(r.email().trim()).ifPresent(u -> {
            if (!u.isVerifiedUser()) {
                String otp = newOtp();
                u.setVerificationToken(otp);
                String to = u.getEmail();
                AfterCommit.run(() -> email.sendOtpEmail(to, otp));
            }
        });
        // Same answer whether or not the email exists (prevents account enumeration)
        return new MessageText("If that account is awaiting verification, a new code has been sent.");
    }

    public AuthResponse login(LoginRequest r) {
        User u = users.findByEmailIgnoreCase(r.email().trim())
                .orElseThrow(AuthService::invalidCredentials);
        // Password is checked BEFORE "blocked" so strangers cannot probe which emails are blocked.
        if (!passwords.matches(r.password(), u.getPassword())) {
            throw invalidCredentials();
        }
        if (!passwords.isHashed(u.getPassword())) {
            u.setPassword(passwords.hash(r.password())); // transparent upgrade of legacy plain text
        }
        if (u.isBlockedUser()) {
            throw ApiException.forbidden("Access Denied: Your account has been BLOCKED by the Administrator.");
        }
        if (!u.isVerifiedUser()) {
            throw ApiException.forbidden("Please verify your email address before logging in.");
        }
        String token = jwt.generate(u.getId(), AuthPrincipal.ROLE_USER, u.getFullName());
        return new AuthResponse(token, DtoMapper.toDto(u));
    }

    public AdminAuthResponse adminLogin(AdminLoginRequest r) {
        Admin a = admins.findByUsername(r.username().trim())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid username or password."));
        if (!passwords.matches(r.password(), a.getPassword())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid username or password.");
        }
        if (!passwords.isHashed(a.getPassword())) {
            a.setPassword(passwords.hash(r.password()));
        }
        String token = jwt.generate(a.getId(), AuthPrincipal.ROLE_ADMIN, a.getFullName());
        return new AdminAuthResponse(token, DtoMapper.toDto(a));
    }

    private void markVerified(User u) {
        u.setVerified(true);
        u.setVerificationToken(null);
    }

    private static String newOtp() {
        return String.format("%06d", RANDOM.nextInt(1_000_000));
    }

    private static ApiException invalidCredentials() {
        return new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password. Please try again.");
    }

    /** Small wrapper so controllers can return {"message": "..."}. */
    public record MessageText(String message) {}
}
