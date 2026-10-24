package com.irctc.security;

import com.irctc.config.AppProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.Optional;

/**
 * Issues and verifies HS256-signed JWTs.
 * Token = header.payload.signature; payload holds sub (id), role and name.
 * The server stores nothing, so the API is stateless and can scale horizontally.
 */
@Service
public class JwtService {

    private final SecretKey key;
    private final long expirationMinutes;

    public JwtService(AppProperties props) {
        String secret = props.jwt().secret();
        if (secret == null || secret.length() < 32) {
            throw new IllegalStateException("app.jwt.secret (JWT_SECRET) must be at least 32 characters long");
        }
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMinutes = props.jwt().expirationMinutes();
    }

    public String generate(Integer id, String role, String name) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(String.valueOf(id))
                .claim("role", role)
                .claim("name", name)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(expirationMinutes, ChronoUnit.MINUTES)))
                .signWith(key)
                .compact();
    }

    public Optional<AuthPrincipal> parse(String token) {
        try {
            Claims c = Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
            return Optional.of(new AuthPrincipal(
                    Integer.valueOf(c.getSubject()),
                    c.get("role", String.class),
                    c.get("name", String.class)));
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty(); // expired, tampered or malformed
        }
    }
}
