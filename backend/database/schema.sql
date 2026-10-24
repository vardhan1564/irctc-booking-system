-- =====================================================================
--  IRCTC Clone - MySQL schema (fresh install)
--  Reverse-engineered from the original DAO SQL, plus the new
--  bookings.class_code column. Run:  mysql -u root -p < schema.sql
-- =====================================================================
CREATE DATABASE IF NOT EXISTS irctc CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE irctc;

CREATE TABLE IF NOT EXISTS users (
    user_id            INT AUTO_INCREMENT PRIMARY KEY,
    full_name          VARCHAR(100) NOT NULL,
    email              VARCHAR(150) NOT NULL UNIQUE,
    password           VARCHAR(255) NOT NULL,          -- BCrypt hash (60 chars)
    phone              VARCHAR(20),
    gender             VARCHAR(10),
    age                INT,
    address            VARCHAR(255),
    city               VARCHAR(100),
    state              VARCHAR(100),
    pincode            VARCHAR(10),
    is_verified        BOOLEAN NOT NULL DEFAULT FALSE,
    verification_token VARCHAR(100),
    is_blocked         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_users_token (verification_token)
);

CREATE TABLE IF NOT EXISTS admins (
    admin_id  INT AUTO_INCREMENT PRIMARY KEY,
    username  VARCHAR(50) NOT NULL UNIQUE,
    password  VARCHAR(255) NOT NULL,
    full_name VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS stations (
    station_code VARCHAR(10)  NOT NULL,
    station_name VARCHAR(100) NOT NULL,
    city_name    VARCHAR(100),
    PRIMARY KEY (station_code),
    INDEX idx_station_name (station_name),
    INDEX idx_station_city (city_name)
);

CREATE TABLE IF NOT EXISTS trains (
    train_id        INT AUTO_INCREMENT PRIMARY KEY,
    train_name      VARCHAR(100) NOT NULL,
    train_number    VARCHAR(10)  NOT NULL UNIQUE,
    source          VARCHAR(100) NOT NULL,
    destination     VARCHAR(100) NOT NULL,
    departure_time  TIME,
    arrival_time    TIME,
    total_seats     INT NOT NULL,
    available_seats INT NOT NULL,
    fare_per_km     DECIMAL(10,2) NOT NULL DEFAULT 1.00
);

CREATE TABLE IF NOT EXISTS train_stops (
    stop_id              INT AUTO_INCREMENT PRIMARY KEY,
    train_id             INT NOT NULL,
    station_code         VARCHAR(10),
    station_name         VARCHAR(100),
    stop_number          INT NOT NULL,
    arrival_time         TIME,
    departure_time       TIME,
    distance_from_source INT NOT NULL DEFAULT 0,
    FOREIGN KEY (train_id) REFERENCES trains(train_id) ON DELETE CASCADE,
    INDEX idx_stops_code (station_code),
    INDEX idx_stops_name (station_name)
);

CREATE TABLE IF NOT EXISTS bookings (
    booking_id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id             INT NOT NULL,
    train_id            INT NOT NULL,
    booking_date        DATE,
    journey_date        DATE NOT NULL,
    passengers          INT NOT NULL,
    total_amount        DECIMAL(10,2) NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    primary_email       VARCHAR(150),
    segment_source      VARCHAR(100),
    segment_destination VARCHAR(100),
    class_code          VARCHAR(5) DEFAULT 'SL',
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id)  REFERENCES users(user_id)   ON DELETE CASCADE,
    FOREIGN KEY (train_id) REFERENCES trains(train_id) ON DELETE CASCADE,
    INDEX idx_bookings_user (user_id),
    INDEX idx_bookings_status_created (status, created_at),
    INDEX idx_bookings_train_date (train_id, journey_date)
);

CREATE TABLE IF NOT EXISTS passenger_details (
    passenger_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id   INT NOT NULL,
    name         VARCHAR(100) NOT NULL,
    age          INT,
    gender       VARCHAR(10),
    phone        VARCHAR(20),
    email        VARCHAR(150),
    coach_code   VARCHAR(5),
    seat_number  INT,
    berth_type   VARCHAR(5),
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payments (
    payment_id           INT AUTO_INCREMENT PRIMARY KEY,
    booking_id           INT NOT NULL,
    amount               DECIMAL(10,2) NOT NULL,
    payment_mode         VARCHAR(20),
    payment_mode_details VARCHAR(255),
    payment_status       VARCHAR(20),
    transaction_id       VARCHAR(100),
    payer_email          VARCHAR(150),
    created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS food_menu (
    item_id     INT AUTO_INCREMENT PRIMARY KEY,
    item_name   VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    price       DECIMAL(10,2) NOT NULL,
    type        VARCHAR(10) NOT NULL,      -- VEG / NON_VEG
    category    VARCHAR(20) NOT NULL,      -- BREAKFAST / LUNCH / DINNER / SNACKS / ALL_DAY
    image_url   VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS food_orders (
    order_id      INT AUTO_INCREMENT PRIMARY KEY,
    booking_id    INT NOT NULL,
    contact_name  VARCHAR(100),
    contact_phone VARCHAR(20),
    total_amount  DECIMAL(10,2),
    items_json    TEXT,
    payment_id    VARCHAR(100) UNIQUE,
    order_status  VARCHAR(20) DEFAULT 'PLACED',
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE
);
