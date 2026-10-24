package com.irctc.service;

import com.irctc.dto.AuthDtos.UpdateProfileRequest;
import com.irctc.dto.AuthDtos.UserDto;
import com.irctc.entity.User;
import com.irctc.exception.ApiException;
import com.irctc.repository.UserRepository;
import com.irctc.util.DtoMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Replaces UpdateProfileServlet + the profile data that profile.jsp read from the session. */
@Service
@Transactional
public class UserService {

    private final UserRepository users;

    public UserService(UserRepository users) {
        this.users = users;
    }

    @Transactional(readOnly = true)
    public UserDto me(Integer userId) {
        return DtoMapper.toDto(find(userId));
    }

    public UserDto update(Integer userId, UpdateProfileRequest r) {
        User u = find(userId);
        u.setFullName(r.fullName().trim());
        u.setPhone(r.phone().trim());
        u.setAddress(r.address().trim());
        return DtoMapper.toDto(u); // email is intentionally not editable (same as before)
    }

    private User find(Integer id) {
        return users.findById(id).orElseThrow(() -> ApiException.notFound("User not found."));
    }
}
