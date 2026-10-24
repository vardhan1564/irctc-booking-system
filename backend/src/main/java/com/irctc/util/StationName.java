package com.irctc.util;

/** Autocomplete values look like "Mumbai Central - MMCT". Splits them into name and code. */
public record StationName(String name, String code) {

    public static StationName parse(String raw) {
        if (raw == null) return new StationName("", "");
        String s = raw.trim();
        int idx = s.lastIndexOf(" - ");
        if (idx > 0) {
            return new StationName(s.substring(0, idx).trim(), s.substring(idx + 3).trim());
        }
        return new StationName(s, s); // user typed a bare name or code
    }
}
