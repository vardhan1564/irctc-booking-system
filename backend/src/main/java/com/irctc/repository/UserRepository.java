package com.irctc.repository;

import com.irctc.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Integer> {
    Optional<User> findByEmailIgnoreCase(String email);
    Optional<User> findByVerificationToken(String token);
    boolean existsByEmailIgnoreCase(String email);
    long countByBlockedTrue();
    List<User> findAllByOrderByFullNameAsc();
}
