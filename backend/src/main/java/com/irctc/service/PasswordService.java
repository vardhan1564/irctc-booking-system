package com.irctc.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

/**
 * BCrypt hashing with transparent migration.
 * The old app stored passwords in plain text ("SELECT * FROM users WHERE email=? AND password=?").
 * Existing rows still work: on a successful login with a legacy plain-text password, the caller
 * re-saves it as a BCrypt hash. After everyone has logged in once, no plain text remains.
 */
@Service
public class PasswordService {

    private final PasswordEncoder encoder;

    public PasswordService(PasswordEncoder encoder) {
        this.encoder = encoder;
    }

    public String hash(String raw) {
        return encoder.encode(raw);
    }

    public boolean isHashed(String stored) {
        return stored != null && stored.matches("^\\$2[aby]\\$\\d{2}\\$.{53}$");
    }

    public boolean matches(String raw, String stored) {
        if (raw == null || stored == null) return false;
        if (isHashed(stored)) {
            return encoder.matches(raw, stored);
        }
        // Legacy plain-text row: constant-time comparison
        return MessageDigest.isEqual(raw.getBytes(StandardCharsets.UTF_8), stored.getBytes(StandardCharsets.UTF_8));
    }
}
