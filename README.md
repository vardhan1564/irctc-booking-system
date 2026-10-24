# 🚆 IRCTC Booking System — Spring Boot + React

A full-stack train ticket booking application inspired by IRCTC. Users can search trains, pick seats, pay online, download a PDF e-ticket, check PNR and live running status, order food, and chat with an AI assistant. Admins get a separate panel to manage trains, users and bookings.

> Educational project. Not affiliated with IRCTC or Indian Railways.

![Java](https://img.shields.io/badge/Java-17-orange?logo=openjdk)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3-6DB33F?logo=springboot)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![MySQL](https://img.shields.io/badge/MySQL-8-4479A1?logo=mysql)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## ✨ Features

**Passengers**
- Register with email OTP verification, then log in with JWT
- Search trains between stations, with station autocomplete
- Class-wise fare quotes and an interactive coach seat map
- Pay with Stripe (test mode) or the built-in Dummy Pay
- PDF e-ticket with QR code, emailed and downloadable
- Booking history and cancellation
- PNR status and live train running status
- E-catering (order food for your journey)
- "Disha" AI assistant (Google Gemini)

**Admins**
- Dashboard with booking and revenue stats
- Add, edit and delete trains
- Block or unblock users
- View and force-cancel bookings

**Under the hood**
- Stateless JWT security with separate user and admin roles
- BCrypt password hashing
- Scheduled cleanup of unpaid bookings after the 10-minute hold window
- All secrets read from environment variables

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router 6, Axios, Bootstrap 5 |
| Backend | Java 17, Spring Boot 3.3, Spring Security (JWT), Spring Data JPA / Hibernate |
| Database | MySQL 8 |
| Integrations | Stripe, Gmail SMTP, RapidAPI (PNR / live status), Google Gemini |
| Other | PDFBox, ZXing (QR codes), Lombok |
| DevOps | Docker, Docker Compose, nginx, GitHub Actions |

---

## 📁 Project Structure

```
.
├── backend/                 Spring Boot REST API
│   ├── src/main/java/com/irctc/
│   │   ├── config/          Security, CORS, app properties
│   │   ├── controller/      REST endpoints (user + admin)
│   │   ├── service/         Business logic
│   │   ├── repository/      JPA repositories
│   │   ├── entity/          JPA entities
│   │   ├── dto/             Request / response objects
│   │   ├── security/        JWT filter and service
│   │   └── scheduler/       Background jobs
│   ├── database/            schema.sql, sample_data.sql
│   ├── Dockerfile
│   └── pom.xml
├── frontend/                React single-page app
│   ├── src/
│   │   ├── api/             Axios client
│   │   ├── components/      Shared UI components
│   │   ├── pages/           Route pages (user + admin)
│   │   ├── context/         Auth context
│   │   └── layouts/
│   ├── nginx.conf
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── .env.example
```

---

## 🚀 Getting Started

### Option 1: Docker (recommended)

You only need [Docker](https://docs.docker.com/get-docker/) installed.

```bash
git clone https://github.com/vardhan1564/irctc-booking-system.git
cd irctc-booking-system

cp .env.example .env          # set JWT_SECRET at minimum
docker compose up --build
```

| Service | URL |
|---|---|
| Web app | http://localhost:3000 |
| Admin panel | http://localhost:3000/admin/login (`admin` / `admin123`) |
| API health check | http://localhost:8080/api/health |
| MySQL | `localhost:3307` (user `root`, password from `.env`) |

The database schema and demo data load automatically on first start. To reset everything, run `docker compose down -v`.

### Option 2: Run locally

**Prerequisites:** Java 17+, Maven 3.9+, Node 18+, MySQL 8

**1. Database**
```bash
mysql -u root -p < backend/database/schema.sql
mysql -u root -p < backend/database/sample_data.sql
```

**2. Backend** (runs on http://localhost:8080)
```bash
cd backend
cp .env.example .env          # set DB_PASSWORD and JWT_SECRET
mvn spring-boot:run
```

**3. Frontend** (runs on http://localhost:5173)
```bash
cd frontend
npm install
npm run dev
```
Vite proxies `/api` to the backend, so you don't need any CORS setup in development.

> 💡 If `MAIL_USERNAME` is blank, OTPs and verification links are printed in the backend console, so you can test sign-up without Gmail. Stripe, RapidAPI and Gemini are optional too: each feature shows a clear message when its key is missing, and Dummy Pay always works.

---

## ⚙️ Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` | ✅ | MySQL connection |
| `JWT_SECRET` | ✅ | At least 32 characters; signs login tokens |
| `FRONTEND_URL`, `CORS_ORIGINS` | prod | Email links, Stripe redirects, allowed origins |
| `MAIL_USERNAME`, `MAIL_PASSWORD` | – | Gmail address + App Password for OTPs and tickets |
| `STRIPE_SECRET_KEY` | – | Stripe test key (`sk_test_...`) |
| `RAPIDAPI_KEY`, `RAPIDAPI_HOST` | – | Real PNR and live train status |
| `GEMINI_API_KEY` | – | AI assistant |
| `VITE_API_BASE_URL` (frontend) | prod | Backend URL when it is hosted separately |

---

## 🔌 REST API

| Method | Endpoint | Auth |
|---|---|---|
| POST | `/api/auth/register`, `/api/auth/verify-otp`, `/api/auth/login` | – |
| GET/PUT | `/api/users/me` | USER |
| GET | `/api/stations?term=` | – |
| GET | `/api/trains/search?source=&destination=` | USER |
| GET | `/api/trains/{id}/quote`, `/api/trains/{id}/booked-seats` | USER |
| POST/GET | `/api/bookings`, `/api/bookings/{id}` | USER |
| POST | `/api/bookings/{id}/cancel` | USER |
| GET | `/api/bookings/{id}/ticket` (PDF) | USER |
| POST | `/api/payments/dummy`, `/api/payments/stripe/session` | USER |
| GET | `/api/pnr/{pnr}`, `/api/live-status/{trainNo}` | – |
| POST | `/api/chat` | – |
| GET/POST | `/api/food/menu`, `/api/food/checkout` | USER |
| POST | `/api/admin/auth/login` | – |
| GET | `/api/admin/dashboard` | ADMIN |
| CRUD | `/api/admin/trains` | ADMIN |
| GET/POST | `/api/admin/users`, `/api/admin/bookings` | ADMIN |

Errors always come back as `{"message": "..."}` with the matching HTTP status.

---

## 📦 Production Build

```bash
cd frontend && npm run build        # static files in frontend/dist
cd backend  && mvn clean package    # runnable jar in backend/target
java -jar target/irctc-backend-2.0.0.jar
```

---

## 👥 Authors

| Name | GitHub |
|---|---|
| **Vardhan** | [@vardhan1564](https://github.com/vardhan1564) |
| **Ashutosh** | [@axhutosh](https://github.com/axhutosh) |

## 📄 License

This project is licensed under the [MIT License](LICENSE).
