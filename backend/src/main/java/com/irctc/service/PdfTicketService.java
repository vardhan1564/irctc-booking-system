package com.irctc.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.irctc.dto.BookingDtos.BookingDto;
import com.irctc.dto.BookingDtos.PassengerDto;
import com.irctc.util.FareCalculator;
import com.irctc.util.PdfText;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.apache.pdfbox.pdmodel.graphics.image.LosslessFactory;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.awt.*;
import java.awt.geom.Point2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

/**
 * Port of PdfTicketUtil (same "Electronic Reservation Slip" design).
 * Changes: reads logos from the classpath instead of ServletContext, prints the real travel class
 * (old version always printed "SLEEPER (SL)"), and survives non-Latin passenger names.
 */
@Service
public class PdfTicketService {

    private static final Logger log = LoggerFactory.getLogger(PdfTicketService.class);

    private static final PDType1Font FONT_BOLD = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
    private static final PDType1Font FONT_REGULAR = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
    private static final Color PRIMARY_BLUE = new Color(0, 51, 102);
    private static final Color ACCENT_ORANGE = new Color(251, 121, 43);
    private static final Color GRAY_TEXT = new Color(85, 85, 85);
    private static final Color LIGHT_GRAY_BG = new Color(240, 240, 240);
    private static final Color PAGE_BG = new Color(233, 236, 239);

    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("dd-MMM-yyyy", Locale.ENGLISH);
    private static final DateTimeFormatter DATE_TIME = DateTimeFormatter.ofPattern("dd-MMM-yyyy HH:mm:ss", Locale.ENGLISH);
    private static final DateTimeFormatter TIME = DateTimeFormatter.ofPattern("HH:mm");

    public byte[] generate(BookingDto b, String transactionId, String paymentMode) {
        try (PDDocument doc = new PDDocument(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            PDPage page = new PDPage(PDRectangle.A4);
            doc.addPage(page);

            float pageH = page.getMediaBox().getHeight();
            float pageW = page.getMediaBox().getWidth();
            float margin = 40, radius = 8;
            float cardX = margin, cardY = margin;
            float cardW = pageW - 2 * margin, cardH = pageH - 2 * margin;
            float contentX = cardX + 20, contentW = cardW - 40;

            try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
                cs.setNonStrokingColor(PAGE_BG);
                cs.addRect(0, 0, pageW, pageH);
                cs.fill();

                cs.setNonStrokingColor(Color.WHITE);
                roundedRect(cs, cardX, cardY, cardW, cardH, radius, true, true, true, true);
                cs.fill();

                float barH = 5, headerH = 55;
                float headerY = cardY + cardH - barH - headerH;
                cs.setNonStrokingColor(ACCENT_ORANGE);
                roundedRect(cs, cardX, cardY + cardH - barH, cardW, barH, radius, true, true, false, false);
                cs.fill();

                PDImageXObject gradient = LosslessFactory.createFromImage(doc, gradient((int) cardW, (int) headerH));
                cs.drawImage(gradient, cardX, headerY, cardW, headerH);

                drawLogo(doc, cs, "ticket-assets/irctc-logo.jpg", cardX + 15, headerY + 12);
                drawLogo(doc, cs, "ticket-assets/ir-logo.png", cardX + cardW - 45, headerY + 12);

                String title = "Electronic Reservation Slip (ERS)";
                float titleW = FONT_BOLD.getStringWidth(title) / 1000 * 16;
                text(cs, title, FONT_BOLD, 16, Color.WHITE, cardX + (cardW - titleW) / 2, headerY + headerH / 2 - 6);

                float y = headerY - 25;

                // QR code
                try {
                    String qr = String.format("PNR: %d\nTrain: %s\nFrom: %s\nTo: %s\nDate: %s",
                            b.bookingId(), b.trainNumber(), b.segmentSource(), b.segmentDestination(), b.journeyDate());
                    BitMatrix m = new QRCodeWriter().encode(qr, BarcodeFormat.QR_CODE, 90, 90);
                    PDImageXObject qrImg = LosslessFactory.createFromImage(doc, MatrixToImageWriter.toBufferedImage(m));
                    cs.drawImage(qrImg, contentX, y - 90, 90, 90);
                } catch (Exception e) {
                    log.warn("Could not generate QR code for PNR {}", b.bookingId());
                }

                text(cs, "PNR:", FONT_REGULAR, 12, GRAY_TEXT, contentX + 110, y - 20);
                text(cs, String.valueOf(b.bookingId()), FONT_BOLD, 22, Color.BLACK, contentX + 110, y - 45);
                text(cs, "Train:", FONT_REGULAR, 12, GRAY_TEXT, contentX + 110, y - 70);
                text(cs, b.trainNumber() + " / " + b.trainName(), FONT_BOLD, 12, PRIMARY_BLUE, contentX + 110, y - 90);
                y -= 110;

                String journey = DATE.format(b.journeyDate());
                String arrivalDate = journey;
                if (b.arrivalTime() != null && b.departureTime() != null && b.arrivalTime().isBefore(b.departureTime())) {
                    arrivalDate = DATE.format(b.journeyDate().plusDays(1));
                }
                float col1 = contentX, col2 = contentX + 270;

                label(cs, "From:", col1, y);  value(cs, b.segmentSource(), col1, y - 15);
                label(cs, "To:", col2, y);    value(cs, b.segmentDestination(), col2, y - 15);
                y -= 35;
                label(cs, "Departure:", col1, y);
                value(cs, fmt(b.departureTime()) + " on " + journey, col1, y - 15);
                label(cs, "Arrival:", col2, y);
                value(cs, fmt(b.arrivalTime()) + " on " + arrivalDate, col2, y - 15);
                y -= 35;
                label(cs, "Booking Date:", col1, y);
                value(cs, b.createdAt() != null ? DATE_TIME.format(b.createdAt()) : "-", col1, y - 15);
                label(cs, "Class:", col2, y);
                value(cs, FareCalculator.classLabel(b.classCode()), col2, y - 15);
                y -= 50;

                sectionHeader(cs, "Passenger Details", contentX, y);
                y -= 25;
                float xName = contentX + 5, xAge = contentX + 220, xGender = contentX + 270,
                        xStatus = contentX + 330, xSeat = contentX + 400;
                cs.setNonStrokingColor(LIGHT_GRAY_BG);
                cs.addRect(contentX, y - 4, contentW, 18);
                cs.fill();
                row(cs, y, FONT_BOLD, xName, xAge, xGender, xStatus, xSeat, "Name", "Age", "Gender", "Status", "Coach/Seat");
                y -= 15;
                for (PassengerDto p : b.passengers()) {
                    String seat = "CNF";
                    if (p.seatNumber() != null && p.seatNumber() > 0) {
                        seat = p.coachCode() + " / " + p.seatNumber() + (p.berthType() != null ? " [" + p.berthType() + "]" : "");
                    }
                    String status = "CANCELLED".equals(b.status()) ? "CAN" : "CNF";
                    row(cs, y, FONT_REGULAR, xName, xAge, xGender, xStatus, xSeat,
                            p.name(), String.valueOf(p.age()), p.gender(), status, seat);
                    y -= 15;
                }

                y -= 20;
                sectionHeader(cs, "Payment Details", contentX, y);
                y -= 25;
                label(cs, "Total Fare:", col1, y);
                text(cs, String.format("INR %.2f", b.totalAmount()), FONT_BOLD, 14, Color.BLACK, col1, y - 20);
                label(cs, "Transaction ID:", col2, y);
                value(cs, transactionId != null ? transactionId : "-", col2, y - 15);
                label(cs, "Payment Mode:", col2, y - 35);
                value(cs, paymentMode != null ? paymentMode : "-", col2, y - 50);

                y = cardY + 65;
                sectionHeader(cs, "Important Instructions", contentX, y);
                y -= 20;
                text(cs, "1. Prescribed Original ID proof is required while travelling.", FONT_REGULAR, 8, Color.BLACK, contentX, y);
                y -= 12;
                text(cs, "2. Passengers having fully waitlisted e-tickets are not allowed to board the train.", FONT_REGULAR, 8, Color.BLACK, contentX, y);
                y -= 12;
                text(cs, "3. This is a demo ticket generated for learning purposes only.", FONT_REGULAR, 8, Color.BLACK, contentX, y);
            }
            doc.save(out);
            return out.toByteArray();
        } catch (IOException e) {
            log.error("PDF generation failed for PNR {}", b.bookingId(), e);
            return null;
        }
    }

    // ------------------------------------------------------------------ drawing helpers

    private static String fmt(java.time.LocalTime t) {
        return t == null ? "--:--" : TIME.format(t);
    }

    private void drawLogo(PDDocument doc, PDPageContentStream cs, String path, float x, float y) {
        try (InputStream in = new ClassPathResource(path).getInputStream()) {
            PDImageXObject img = PDImageXObject.createFromByteArray(doc, in.readAllBytes(), path);
            cs.drawImage(img, x, y, 30, 30);
        } catch (IOException e) {
            log.debug("Logo {} not found, skipping", path);
        }
    }

    private static void text(PDPageContentStream cs, String s, PDType1Font font, float size, Color color,
                             float x, float y) throws IOException {
        cs.beginText();
        cs.setFont(font, size);
        cs.setNonStrokingColor(color);
        cs.newLineAtOffset(x, y);
        cs.showText(PdfText.safe(s));
        cs.endText();
    }

    private static void label(PDPageContentStream cs, String s, float x, float y) throws IOException {
        text(cs, s, FONT_REGULAR, 10, GRAY_TEXT, x, y);
    }

    private static void value(PDPageContentStream cs, String s, float x, float y) throws IOException {
        text(cs, s, FONT_BOLD, 12, Color.BLACK, x, y);
    }

    private static void row(PDPageContentStream cs, float y, PDType1Font font, float x1, float x2, float x3,
                            float x4, float x5, String c1, String c2, String c3, String c4, String c5) throws IOException {
        text(cs, c1, font, 10, Color.BLACK, x1, y);
        text(cs, c2, font, 10, Color.BLACK, x2, y);
        text(cs, c3, font, 10, Color.BLACK, x3, y);
        text(cs, c4, font, 10, Color.BLACK, x4, y);
        text(cs, c5, font, 10, Color.BLACK, x5, y);
    }

    private static void sectionHeader(PDPageContentStream cs, String s, float x, float y) throws IOException {
        text(cs, s, FONT_BOLD, 14, ACCENT_ORANGE, x, y);
        cs.setStrokingColor(ACCENT_ORANGE);
        cs.setLineWidth(0.5f);
        cs.moveTo(x, y - 5);
        cs.lineTo(x + 200, y - 5);
        cs.stroke();
    }

    private static BufferedImage gradient(int w, int h) {
        BufferedImage img = new BufferedImage(w, h, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = img.createGraphics();
        g.setPaint(new LinearGradientPaint(new Point2D.Float(0, 0), new Point2D.Float(w, 0),
                new float[]{0f, 0.2f, 0.8f, 1f},
                new Color[]{Color.WHITE, PRIMARY_BLUE, PRIMARY_BLUE, Color.WHITE}));
        g.fillRect(0, 0, w, h);
        g.dispose();
        return img;
    }

    private static void roundedRect(PDPageContentStream cs, float x, float y, float w, float h, float r,
                                    boolean tl, boolean tr, boolean bl, boolean br) throws IOException {
        cs.moveTo(x + (bl ? r : 0), y);
        cs.lineTo(x + w - (br ? r : 0), y);
        if (br) cs.curveTo(x + w - r, y, x + w, y, x + w, y + r); else cs.lineTo(x + w, y);
        cs.lineTo(x + w, y + h - (tr ? r : 0));
        if (tr) cs.curveTo(x + w, y + h - r, x + w, y + h, x + w - r, y + h); else cs.lineTo(x + w, y + h);
        cs.lineTo(x + (tl ? r : 0), y + h);
        if (tl) cs.curveTo(x + r, y + h, x, y + h, x, y + h - r); else cs.lineTo(x, y + h);
        cs.lineTo(x, y + (bl ? r : 0));
        if (bl) cs.curveTo(x, y + r, x, y, x + r, y); else cs.lineTo(x, y);
    }
}
