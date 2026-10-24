package com.irctc.util;

import java.nio.charset.StandardCharsets;

/**
 * PDFBox's standard Helvetica font only supports WinAnsi characters. A passenger name typed in
 * Hindi or an emoji would crash PDF generation in the old code; we replace such characters.
 */
public final class PdfText {
    private PdfText() {}

    public static String safe(String text) {
        if (text == null) return "";
        StringBuilder sb = new StringBuilder(text.length());
        var encoder = StandardCharsets.ISO_8859_1.newEncoder();
        for (char c : text.toCharArray()) {
            sb.append(encoder.canEncode(c) && c >= 32 ? c : '?');
        }
        return sb.toString();
    }
}
