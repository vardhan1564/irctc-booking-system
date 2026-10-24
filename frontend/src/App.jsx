import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import UserLayout from './layouts/UserLayout';
import AdminLayout from './layouts/AdminLayout';
import { RequireAdmin, RequireUser } from './components/Guards';
import Preloader from './components/Preloader';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyOtp from './pages/VerifyOtp';
import VerifyEmail from './pages/VerifyEmail';
import Profile from './pages/Profile';
import Trains from './pages/Trains';
import Booking from './pages/Booking';
import SeatSelection from './pages/SeatSelection';
import Payment from './pages/Payment';
import StripeSuccess from './pages/StripeSuccess';
import BookingSuccess from './pages/BookingSuccess';
import BookingHistory from './pages/BookingHistory';
import PnrStatus from './pages/PnrStatus';
import PnrResult from './pages/PnrResult';
import LiveStatus from './pages/LiveStatus';
import LiveStatusResult from './pages/LiveStatusResult';
import FoodOrdering from './pages/FoodOrdering';
import NotFound from './pages/NotFound';
import AdminLogin from './pages/admin/AdminLogin';
import Dashboard from './pages/admin/Dashboard';
import ManageTrains from './pages/admin/ManageTrains';
import TrainForm from './pages/admin/TrainForm';
import ManageUsers from './pages/admin/ManageUsers';
import ViewBookings from './pages/admin/ViewBookings';

/**
 * Client-side routing replaces the old JSP URLs and servlet redirects.
 *   /jsp/home.jsp           -> /
 *   /TrainListServlet?...   -> /trains?...
 *   /BookingServlet?...     -> /booking?...
 *   /jsp/seatSelection.jsp  -> /booking/:id/seats
 *   /jsp/payment.jsp        -> /booking/:id/payment
 *   /admin/dashboard        -> /admin
 */
export default function App() {
  const user = (el) => <RequireUser>{el}</RequireUser>;
  const { pathname } = useLocation();
  return (
    <>
      {/* Like the old app, only user pages show the train-facts preloader (admin JSPs never included it) */}
      {!pathname.startsWith('/admin') && <Preloader />}
      <Routes>
        <Route element={<UserLayout />}>
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="verify-otp" element={<VerifyOtp />} />
          <Route path="verify-email" element={<VerifyEmail />} />
          <Route path="pnr" element={<PnrStatus />} />
          <Route path="pnr/:pnr" element={<PnrResult />} />
          <Route path="live-status" element={<LiveStatus />} />
          <Route path="live-status/:trainNo" element={<LiveStatusResult />} />

          <Route path="profile" element={user(<Profile />)} />
          <Route path="trains" element={user(<Trains />)} />
          <Route path="booking" element={user(<Booking />)} />
          <Route path="booking/:id/seats" element={user(<SeatSelection />)} />
          <Route path="booking/:id/payment" element={user(<Payment />)} />
          <Route path="booking/:id/success" element={user(<BookingSuccess />)} />
          <Route path="payment/stripe-success" element={user(<StripeSuccess />)} />
          <Route path="bookings" element={user(<BookingHistory />)} />
          <Route path="food/:pnr" element={user(<FoodOrdering />)} />
          <Route path="*" element={<NotFound />} />
        </Route>

        <Route path="admin/login" element={<AdminLogin />} />
        <Route path="admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
          <Route index element={<Dashboard />} />
          <Route path="trains" element={<ManageTrains />} />
          <Route path="trains/new" element={<TrainForm />} />
          <Route path="trains/:id/edit" element={<TrainForm />} />
          <Route path="users" element={<ManageUsers />} />
          <Route path="bookings" element={<ViewBookings />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
      </Routes>
    </>
  );
}
