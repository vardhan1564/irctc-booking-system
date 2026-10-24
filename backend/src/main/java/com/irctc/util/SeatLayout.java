package com.irctc.util;

/**
 * Coach layouts. MUST stay in sync with frontend/src/utils/seatLayout.js, because the
 * React seat map draws exactly these seat numbers and berth labels.
 *
 *  SL / 3A : 9 bays x 8 berths = 72  -> LB MB UB LB MB UB SL SU
 *  2A      : 9 bays x 6 berths = 54  -> LB UB LB UB SL SU
 *  1A      : Cabin(4) Cabin(4) Coupe(2) x 2 = 20 -> LB UB LB UB ...
 */
public final class SeatLayout {

    private SeatLayout() {}

    public static String coachCode(String classCode) {
        return switch (FareCalculator.normalizeClass(classCode)) {
            case "1A" -> "H1";
            case "2A" -> "A1";
            case "3A" -> "B1";
            default -> "S1";
        };
    }

    public static int maxSeats(String classCode) {
        return switch (FareCalculator.normalizeClass(classCode)) {
            case "1A" -> 20;
            case "2A" -> 54;
            default -> 72;
        };
    }

    public static String berthType(String classCode, int seatNo) {
        String cls = FareCalculator.normalizeClass(classCode);
        if ("1A".equals(cls)) {
            return (seatNo % 2 == 1) ? "LB" : "UB";
        }
        if ("2A".equals(cls)) {
            return switch ((seatNo - 1) % 6) {
                case 0, 2 -> "LB";
                case 1, 3 -> "UB";
                case 4 -> "SL";
                default -> "SU";
            };
        }
        return switch ((seatNo - 1) % 8) {
            case 0, 3 -> "LB";
            case 1, 4 -> "MB";
            case 2, 5 -> "UB";
            case 6 -> "SL";
            default -> "SU";
        };
    }
}
