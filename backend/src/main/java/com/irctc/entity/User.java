package com.irctc.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@Setter
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Integer id;

    @Column(name = "full_name", length = 100)
    private String fullName;

    @Column(name = "email", unique = true, length = 150)
    private String email;

    /** BCrypt hash (old rows may still be plain text; they are upgraded on next login). */
    @Column(name = "password", length = 255)
    private String password;

    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "gender", length = 10)
    private String gender;

    @Column(name = "age")
    private Integer age;

    @Column(name = "address", length = 255)
    private String address;

    @Column(name = "city", length = 100)
    private String city;

    @Column(name = "state", length = 100)
    private String state;

    @Column(name = "pincode", length = 10)
    private String pincode;

    @Column(name = "is_verified")
    private Boolean verified = false;

    @Column(name = "verification_token", length = 100)
    private String verificationToken;

    @Column(name = "is_blocked")
    private Boolean blocked = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public boolean isVerifiedUser() { return Boolean.TRUE.equals(verified); }
    public boolean isBlockedUser()  { return Boolean.TRUE.equals(blocked); }
}
