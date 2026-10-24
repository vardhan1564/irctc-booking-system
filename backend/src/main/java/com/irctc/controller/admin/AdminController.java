package com.irctc.controller.admin;

import com.irctc.dto.AuthDtos.UserDto;
import com.irctc.dto.BookingDtos.BookingDto;
import com.irctc.dto.MiscDtos.DashboardStats;
import com.irctc.dto.MiscDtos.MessageResponse;
import com.irctc.dto.TrainDtos.TrainDto;
import com.irctc.dto.TrainDtos.TrainRequest;
import com.irctc.service.AdminService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Every endpoint here requires ROLE_ADMIN (see SecurityConfig: "/api/admin/**" hasRole ADMIN).
 * The old "God Mode" AdminActionServlet used one URL with an "action" parameter and a switch;
 * now each action is its own REST endpoint with the right HTTP verb.
 */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService admin;

    public AdminController(AdminService admin) {
        this.admin = admin;
    }

    @GetMapping("/dashboard")
    public DashboardStats dashboard() {
        return admin.stats();
    }

    // ---- trains
    @GetMapping("/trains")
    public List<TrainDto> trains() {
        return admin.listTrains();
    }

    @GetMapping("/trains/{id}")
    public TrainDto train(@PathVariable Integer id) {
        return admin.getTrain(id);
    }

    @PostMapping("/trains")
    @ResponseStatus(HttpStatus.CREATED)
    public TrainDto createTrain(@Valid @RequestBody TrainRequest req) {
        return admin.createTrain(req);
    }

    @PutMapping("/trains/{id}")
    public TrainDto updateTrain(@PathVariable Integer id, @Valid @RequestBody TrainRequest req) {
        return admin.updateTrain(id, req);
    }

    @DeleteMapping("/trains/{id}")
    public MessageResponse deleteTrain(@PathVariable Integer id) {
        admin.deleteTrain(id);
        return new MessageResponse("Train deleted successfully.");
    }

    // ---- users
    @GetMapping("/users")
    public List<UserDto> users() {
        return admin.listUsers();
    }

    @PostMapping("/users/{id}/block")
    public UserDto block(@PathVariable Integer id) {
        return admin.setBlocked(id, true);
    }

    @PostMapping("/users/{id}/unblock")
    public UserDto unblock(@PathVariable Integer id) {
        return admin.setBlocked(id, false);
    }

    @DeleteMapping("/users/{id}")
    public MessageResponse deleteUser(@PathVariable Integer id) {
        admin.deleteUser(id);
        return new MessageResponse("User #" + id + " deleted.");
    }

    // ---- bookings
    @GetMapping("/bookings")
    public List<BookingDto> bookings() {
        return admin.listBookings();
    }

    @PostMapping("/bookings/{id}/force-cancel")
    public MessageResponse forceCancel(@PathVariable Integer id) {
        admin.forceCancel(id);
        return new MessageResponse("PNR " + id + " cancelled.");
    }
}
