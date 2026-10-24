package com.irctc.service;

import com.irctc.dto.BookingDtos.BookingDto;
import com.irctc.dto.BookingDtos.PassengerDto;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.Locale;

/**
 * Port of the old EmailUtil. Same HTML templates; differences:
 *  - JavaMailSender is configured by Spring Boot from application.yml (no manual Session setup)
 *  - @Async replaces "new Thread(() -> ...).start()"
 *  - If MAIL_USERNAME is empty (local development), the OTP / link is printed to the console
 *    so you can still register and test without a Gmail app password.
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("dd-MMM-yyyy", Locale.ENGLISH);
    private static final DateTimeFormatter TIME = DateTimeFormatter.ofPattern("HH:mm");

    private final JavaMailSender mailSender;
    private final String sender;

    public EmailService(JavaMailSender mailSender, @Value("${spring.mail.username:}") String sender) {
        this.mailSender = mailSender;
        this.sender = sender;
    }

    private boolean enabled() {
        return sender != null && !sender.isBlank();
    }

    @Async
    public void sendOtpEmail(String to, String otp) {
        if (!enabled()) {
            log.warn("MAIL NOT CONFIGURED -> OTP for {} is {}", to, otp);
            return;
        }
        String html = "<html><body style='font-family: Arial, sans-serif; color: #333;'>"
                + "<div style='max-width: 500px; margin: auto; border: 1px solid #ddd; border-top: 5px solid #fb792b; border-radius: 8px; overflow: hidden;'>"
                + "<div style='padding: 30px; text-align: center;'>"
                + "<h2 style='color: #003366; margin: 0;'>Verification Code</h2>"
                + "<p style='font-size: 1.1em; color: #555;'>Please use the following OTP to complete your registration:</p>"
                + "<div style='background-color: #f4f4f4; color: #333; font-size: 2em; font-weight: bold; letter-spacing: 5px; padding: 15px; margin: 20px 0; border-radius: 4px;'>"
                + otp + "</div>"
                + "<p style='font-size: 0.9em; color: #777;'>This code is valid for 10 minutes.</p>"
                + "</div></div></body></html>";
        send(to, "Your OTP for IRCTC Clone Registration", html, null, null);
    }

    @Async
    public void sendVerificationEmail(String to, String link) {
        if (!enabled()) {
            log.warn("MAIL NOT CONFIGURED -> verification link for {} is {}", to, link);
            return;
        }
        String html = "<html><body style='font-family: Arial, sans-serif; color: #333;'>"
                + "<div style='max-width: 600px; margin: auto; border: 1px solid #ddd; border-top: 5px solid #fb792b; border-radius: 8px; overflow: hidden;'>"
                + "<div style='background-color: #003366; color: white; padding: 20px; text-align: center;'>"
                + "<h2 style='margin: 0;'>Welcome to IRCTC Clone!</h2></div>"
                + "<div style='padding: 30px;'><p>Hi there,</p>"
                + "<p>Thank you for registering. Please click the button below to verify your email address.</p>"
                + "<div style='text-align: center; margin: 30px 0;'>"
                + "<a href='" + link + "' style='background-color: #fb792b; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;'>Verify My Account</a>"
                + "</div>"
                + "<p style='font-size: 0.9em;'>If the button above doesn't work, copy and paste this link into your browser:</p>"
                + "<p style='background-color: #f9f9f9; padding: 10px; border-radius: 4px; font-size: 0.85em; word-break: break-all;'>" + link + "</p>"
                + "</div></div></body></html>";
        send(to, "Verify Your IRCTC Clone Account", html, null, null);
    }

    /** Called from TicketService's async thread, so it is synchronous itself. */
    public void sendBookingConfirmation(BookingDto b, byte[] pdf) {
        if (!enabled()) {
            log.warn("MAIL NOT CONFIGURED -> skipping ticket email for PNR {}", b.bookingId());
            return;
        }
        send(b.primaryEmail(), "Booking Confirmed! PNR: " + b.bookingId(), bookingHtml(b), pdf,
                "IRCTC_Ticket_PNR_" + b.bookingId() + ".pdf");
    }

    private void send(String to, String subject, String html, byte[] attachment, String attachmentName) {
        if (to == null || to.isBlank()) return;
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, attachment != null, "UTF-8");
            helper.setFrom(sender);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true);
            if (attachment != null) {
                helper.addAttachment(attachmentName, new ByteArrayResource(attachment), "application/pdf");
            }
            mailSender.send(message);
            log.info("Email '{}' sent to {}", subject, to);
        } catch (Exception e) {
            log.error("Failed to send email '{}' to {}", subject, to, e);
        }
    }

    private static String esc(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }

    private String bookingHtml(BookingDto b) {
        String passengerName = b.passengers().isEmpty() ? "Passenger" : esc(b.passengers().get(0).name());
        String journey = b.journeyDate() != null ? DATE.format(b.journeyDate()) : "N/A";
        String dep = b.departureTime() != null ? TIME.format(b.departureTime()) : "N/A";
        String arr = b.arrivalTime() != null ? TIME.format(b.arrivalTime()) : "N/A";
        String arrDate = journey;
        if (b.departureTime() != null && b.arrivalTime() != null && b.arrivalTime().isBefore(b.departureTime())) {
            arrDate = DATE.format(b.journeyDate().plusDays(1));
        }
        StringBuilder sb = new StringBuilder();
        sb.append("<html><body style='font-family: Arial, sans-serif; color: #333; line-height: 1.6;'>")
          .append("<div style='max-width: 600px; margin: auto; border: 1px solid #ddd; border-top: 5px solid #fb792b; border-radius: 8px; overflow: hidden;'>")
          .append("<div style='background-color: #003366; color: white; padding: 20px; text-align: center;'><h2 style='margin: 0;'>Booking Confirmed!</h2></div>")
          .append("<div style='padding: 30px;'>")
          .append("<p>Dear ").append(passengerName).append(",</p>")
          .append("<p>Your train ticket has been successfully booked. Please find the PDF ticket attached for your reference.</p>")
          .append("<div style='text-align: center; margin: 25px 0; background: #f8f9fa; padding: 15px; border-radius: 8px;'>")
          .append("<span style='font-size: 0.9em; color: #777; text-transform: uppercase;'>PNR Number</span><br>")
          .append("<strong style='font-size: 1.8em; color: #003366; letter-spacing: 1px;'>").append(b.bookingId()).append("</strong><br>")
          .append("<span style='font-size: 1em; font-weight: bold; color: #28a745;'>").append(b.status()).append("</span></div>")
          .append("<table style='width: 100%; border-collapse: collapse; margin-bottom: 20px;'>")
          .append(row("Train:", esc(b.trainName()) + " (" + esc(b.trainNumber()) + ")"))
          .append(row("Route:", esc(b.segmentSource()) + " to " + esc(b.segmentDestination())))
          .append(row("Class:", b.classCode()))
          .append(row("Departs:", dep + ", " + journey))
          .append(row("Arrives:", arr + ", " + arrDate))
          .append("</table>")
          .append("<h3 style='color: #003366; font-size: 1.1em; margin-top: 20px;'>Passenger Details</h3>")
          .append("<table style='width: 100%; border-collapse: collapse; font-size: 0.95em; border: 1px solid #eee;'>")
          .append("<tr style='background-color: #f2f2f2;'>")
          .append("<th style='padding: 10px; text-align: left; border-bottom: 2px solid #ddd;'>Name</th>")
          .append("<th style='padding: 10px; text-align: center; border-bottom: 2px solid #ddd;'>Age/Gender</th>")
          .append("<th style='padding: 10px; text-align: right; border-bottom: 2px solid #ddd;'>Coach/Seat</th></tr>");
        for (PassengerDto p : b.passengers()) {
            String seat = "CNF";
            if (p.seatNumber() != null && p.seatNumber() > 0) {
                seat = "<b>" + p.coachCode() + "</b> / " + p.seatNumber()
                        + (p.berthType() != null ? " [" + p.berthType() + "]" : "");
            }
            sb.append("<tr>")
              .append("<td style='padding: 10px; border-bottom: 1px solid #eee;'>").append(esc(p.name())).append("</td>")
              .append("<td style='padding: 10px; text-align: center; border-bottom: 1px solid #eee;'>").append(p.age()).append(" / ").append(esc(p.gender())).append("</td>")
              .append("<td style='padding: 10px; text-align: right; border-bottom: 1px solid #eee;'>").append(seat).append("</td></tr>");
        }
        sb.append("</table>")
          .append("<p style='text-align: right; margin-top: 15px; font-size: 1.2em;'>Total Fare: <strong style='color: #003366;'>&#8377;")
          .append(String.format("%.2f", b.totalAmount())).append("</strong></p>")
          .append("<div style='text-align: center; margin-top: 30px; color: #777; font-size: 0.85em;'><p>Thank you for booking with IRCTC Clone!</p></div>")
          .append("</div></div></body></html>");
        return sb.toString();
    }

    private static String row(String label, String value) {
        return "<tr><td style='padding: 8px; border-bottom: 1px solid #eee;'><strong>" + label
                + "</strong></td><td style='padding: 8px; border-bottom: 1px solid #eee; text-align: right;'>"
                + value + "</td></tr>";
    }
}
