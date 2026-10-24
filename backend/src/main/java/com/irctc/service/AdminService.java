package com.irctc.service;

import com.irctc.config.AppProperties;
import com.irctc.dto.AuthDtos.UserDto;
import com.irctc.dto.BookingDtos.BookingDto;
import com.irctc.dto.MiscDtos.DashboardStats;
import com.irctc.dto.TrainDtos.TrainDto;
import com.irctc.dto.TrainDtos.TrainRequest;
import com.irctc.entity.Booking;
import com.irctc.entity.Train;
import com.irctc.entity.User;
import com.irctc.exception.ApiException;
import com.irctc.repository.BookingRepository;
import com.irctc.repository.TrainRepository;
import com.irctc.repository.UserRepository;
import com.irctc.util.DtoMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Admin "Control Room". Replaces AdminDashboardServlet, ManageTrainServlet, ManageUsersServlet,
 * ViewBookingsServlet and the generic AdminActionServlet ("God Mode") switch statement.
 */
@Service
@Transactional
public class AdminService {

    private final UserRepository users;
    private final TrainRepository trains;
    private final BookingRepository bookings;
    private final BookingService bookingService;
    private final AppProperties props;

    public AdminService(UserRepository users, TrainRepository trains, BookingRepository bookings,
                        BookingService bookingService, AppProperties props) {
        this.users = users;
        this.trains = trains;
        this.bookings = bookings;
        this.bookingService = bookingService;
        this.props = props;
    }

    @Transactional(readOnly = true)
    public DashboardStats stats() {
        return new DashboardStats(bookings.totalConfirmedRevenue(), users.count(),
                users.countByBlockedTrue(), trains.count());
    }

    // ---------------- trains

    @Transactional(readOnly = true)
    public List<TrainDto> listTrains() {
        return trains.findAllByOrderByTrainNameAsc().stream().map(DtoMapper::toDto).toList();
    }

    @Transactional(readOnly = true)
    public TrainDto getTrain(Integer id) {
        return DtoMapper.toDto(findTrain(id));
    }

    public TrainDto createTrain(TrainRequest r) {
        if (trains.existsByTrainNumber(r.trainNumber().trim())) {
            throw ApiException.conflict("A train with number " + r.trainNumber() + " already exists.");
        }
        Train t = new Train();
        apply(t, r);
        return DtoMapper.toDto(trains.save(t));
    }

    public TrainDto updateTrain(Integer id, TrainRequest r) {
        Train t = findTrain(id);
        if (trains.existsByTrainNumberAndIdNot(r.trainNumber().trim(), id)) {
            throw ApiException.conflict("Another train already uses number " + r.trainNumber() + ".");
        }
        apply(t, r);
        return DtoMapper.toDto(t);
    }

    public void deleteTrain(Integer id) {
        trains.delete(findTrain(id));
        trains.flush(); // surface FK errors here so GlobalExceptionHandler returns a clear 409
    }

    private void apply(Train t, TrainRequest r) {
        if (r.availableSeats() > r.totalSeats()) {
            throw ApiException.badRequest("Available seats cannot exceed total seats.");
        }
        t.setTrainNumber(r.trainNumber().trim());
        t.setTrainName(r.trainName().trim());
        t.setSource(r.source().trim());
        t.setDestination(r.destination().trim());
        t.setDepartureTime(r.departureTime());
        t.setArrivalTime(r.arrivalTime());
        t.setTotalSeats(r.totalSeats());
        t.setAvailableSeats(r.availableSeats());
        t.setFarePerKm(r.fare());
    }

    private Train findTrain(Integer id) {
        return trains.findById(id).orElseThrow(() -> ApiException.notFound("Train not found for ID: " + id));
    }

    // ---------------- users

    @Transactional(readOnly = true)
    public List<UserDto> listUsers() {
        return users.findAllByOrderByFullNameAsc().stream().map(DtoMapper::toDto).toList();
    }

    public UserDto setBlocked(Integer userId, boolean blocked) {
        User u = users.findById(userId).orElseThrow(() -> ApiException.notFound("User #" + userId + " not found."));
        u.setBlocked(blocked);
        return DtoMapper.toDto(u);
    }

    public void deleteUser(Integer userId) {
        User u = users.findById(userId).orElseThrow(() -> ApiException.notFound("User #" + userId + " not found."));
        users.delete(u);
        users.flush();
    }

    // ---------------- bookings

    @Transactional(readOnly = true)
    public List<BookingDto> listBookings() {
        return bookings.findAllByOrderByCreatedAtDesc().stream()
                .map(b -> DtoMapper.toDto(b, null, null, false, true, props.booking().holdMinutes()))
                .toList();
    }

    /** Old version only flipped the status; now the seats are also returned to the train. */
    public void forceCancel(Integer bookingId) {
        Booking b = bookings.findByIdForUpdate(bookingId)
                .orElseThrow(() -> ApiException.notFound("PNR " + bookingId + " not found."));
        if (Booking.CANCELLED.equals(b.getStatus())) {
            throw ApiException.badRequest("PNR " + bookingId + " is already cancelled.");
        }
        bookingService.cancel(b);
    }
}
