package com.irctc.service;

import com.irctc.config.AppProperties;
import com.irctc.config.StripeConfig;
import com.irctc.dto.MiscDtos.*;
import com.irctc.dto.PaymentDtos.StripeSessionResponse;
import com.irctc.entity.Booking;
import com.irctc.entity.FoodItem;
import com.irctc.exception.ApiException;
import com.irctc.repository.BookingRepository;
import com.irctc.repository.FoodItemRepository;
import com.irctc.repository.FoodOrderDao;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.*;

/**
 * e-Catering. Port of FoodOrderingServlet, FoodStripeSessionServlet and FoodPaymentCallback.
 * New: only the owner of a CONFIRMED booking can order food for it (old servlet accepted any PNR),
 * and prices use BigDecimal instead of double.
 */
@Service
public class FoodService {

    private final FoodItemRepository menu;
    private final FoodOrderDao orders;
    private final BookingRepository bookings;
    private final StripeConfig stripe;
    private final AppProperties props;

    public FoodService(FoodItemRepository menu, FoodOrderDao orders, BookingRepository bookings,
                       StripeConfig stripe, AppProperties props) {
        this.menu = menu;
        this.orders = orders;
        this.bookings = bookings;
        this.stripe = stripe;
        this.props = props;
    }

    @Transactional(readOnly = true)
    public FoodMenuResponse getMenu(Integer userId, Integer pnr, boolean fullMenu) {
        requireOwnedConfirmed(userId, pnr);
        String mealCategory = fullMenu ? "FULL_MENU" : currentMealCategory();

        List<FoodItem> items;
        if (fullMenu) {
            items = menu.findAllByOrderByCategoryAsc();
        } else {
            String queryCat = "DINNER".equals(mealCategory) ? "LUNCH" : mealCategory; // same as old servlet
            items = menu.findByCategoryIn(List.of(queryCat, "ALL_DAY", "SNACKS"));
        }

        Set<String> seen = new HashSet<>();
        List<FoodItemDto> result = new ArrayList<>();
        for (FoodItem f : items) {
            if (fullMenu && !seen.add(f.getItemName())) continue; // de-duplicate by name
            String cat = ("LUNCH".equals(f.getCategory()) || "DINNER".equals(f.getCategory())) ? "MEALS" : f.getCategory();
            result.add(com.irctc.util.DtoMapper.toDto(f, cat));
        }
        return new FoodMenuResponse(pnr, mealCategory, result);
    }

    private String currentMealCategory() {
        LocalTime now = LocalTime.now(ZoneId.of(props.timezone()));
        if (now.isAfter(LocalTime.of(5, 0)) && now.isBefore(LocalTime.of(11, 0))) return "BREAKFAST";
        if (now.isAfter(LocalTime.of(11, 0)) && now.isBefore(LocalTime.of(16, 0))) return "LUNCH";
        if (now.isAfter(LocalTime.of(18, 0)) && now.isBefore(LocalTime.of(23, 0))) return "DINNER";
        return "ALL_DAY";
    }

    @Transactional(readOnly = true)
    public StripeSessionResponse checkout(Integer userId, FoodCheckoutRequest r) {
        if (!stripe.isEnabled()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Online payment is not configured on this server.");
        }
        int pnr = parsePnr(r.pnr());
        requireOwnedConfirmed(userId, pnr);

        BigDecimal total = BigDecimal.ZERO;
        StringBuilder desc = new StringBuilder();
        for (Map.Entry<Integer, Integer> e : r.cart().entrySet()) {
            int qty = e.getValue() == null ? 0 : e.getValue();
            if (qty <= 0) continue;
            if (qty > 20) throw ApiException.badRequest("Maximum 20 of one item per order.");
            FoodItem item = menu.findById(e.getKey())
                    .orElseThrow(() -> ApiException.badRequest("A menu item is no longer available."));
            total = total.add(item.getPrice().multiply(BigDecimal.valueOf(qty))); // price from DB, not browser
            if (!desc.isEmpty()) desc.append(", ");
            desc.append(qty).append("x ").append(item.getItemName());
        }
        if (total.signum() <= 0) throw ApiException.badRequest("Your cart is empty.");

        String items = desc.length() > 480 ? desc.substring(0, 477) + "..." : desc.toString();
        String base = props.frontendUrl();
        SessionCreateParams params = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setSuccessUrl(base + "/food/" + pnr + "?session_id={CHECKOUT_SESSION_ID}")
                .setCancelUrl(base + "/food/" + pnr + "?error=cancelled")
                .putMetadata("type", "FOOD")
                .putMetadata("pnr", String.valueOf(pnr))
                .putMetadata("userId", String.valueOf(userId))
                .putMetadata("name", r.contactName().trim())
                .putMetadata("phone", r.contactPhone().trim())
                .putMetadata("items", items)
                .putMetadata("total", total.toPlainString())
                .addLineItem(SessionCreateParams.LineItem.builder()
                        .setQuantity(1L)
                        .setPriceData(SessionCreateParams.LineItem.PriceData.builder()
                                .setCurrency("inr")
                                .setUnitAmount(total.multiply(BigDecimal.valueOf(100)).setScale(0, RoundingMode.HALF_UP).longValue())
                                .setProductData(SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                        .setName("e-Catering Order (PNR: " + pnr + ")")
                                        .setDescription(items)
                                        .build())
                                .build())
                        .build())
                .build();
        try {
            return new StripeSessionResponse(Session.create(params).getUrl());
        } catch (StripeException e) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Payment gateway error: " + e.getMessage());
        }
    }

    @Transactional
    public MessageResponse confirm(Integer userId, String sessionId) {
        if (!stripe.isEnabled()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Online payment is not configured on this server.");
        }
        Session s;
        try {
            s = Session.retrieve(sessionId);
        } catch (StripeException e) {
            throw ApiException.badRequest("Could not verify the payment with Stripe.");
        }
        Map<String, String> m = s.getMetadata();
        if (!"FOOD".equals(m.get("type")) || !String.valueOf(userId).equals(m.get("userId"))) {
            throw ApiException.badRequest("This payment session does not belong to you.");
        }
        if (!"paid".equals(s.getPaymentStatus())) {
            throw new ApiException(HttpStatus.PAYMENT_REQUIRED, "Payment was not completed.");
        }
        String paymentId = s.getPaymentIntent();
        if (!orders.existsByPaymentId(paymentId)) { // idempotent: refreshing the page won't double-order
            orders.insert(Integer.parseInt(m.get("pnr")), m.get("name"), m.get("phone"),
                    new BigDecimal(m.get("total")), m.get("items"), paymentId);
        }
        return new MessageResponse("Order Placed Successfully!");
    }

    private void requireOwnedConfirmed(Integer userId, Integer pnr) {
        Booking b = bookings.findWithDetailsById(pnr)
                .filter(x -> x.getUser().getId().equals(userId))
                .orElseThrow(() -> ApiException.notFound("Booking not found."));
        if (!Booking.CONFIRMED.equals(b.getStatus())) {
            throw ApiException.badRequest("Food can be ordered only for confirmed bookings.");
        }
    }

    private static int parsePnr(String pnr) {
        try {
            return Integer.parseInt(pnr.trim());
        } catch (NumberFormatException e) {
            throw ApiException.badRequest("Invalid PNR.");
        }
    }
}
