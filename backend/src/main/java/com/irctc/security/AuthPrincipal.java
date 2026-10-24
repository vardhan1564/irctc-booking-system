package com.irctc.security;

/** What we know about the caller after the JWT is verified. Injected with @AuthenticationPrincipal. */
public record AuthPrincipal(Integer id, String role, String name) {
    public static final String ROLE_USER = "USER";
    public static final String ROLE_ADMIN = "ADMIN";
}
