import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { bookingApi } from '../api';
import { errorMessage } from '../api/client';
import { Alert, Loader } from '../components/Common';
import { fmtDate, fmtTime, inrPlain } from '../utils/format';

/** Port of bookingHistory.jsp + BookingHistoryServlet + CancelBookingServlet + DownloadTicketServlet */
export default function BookingHistory() {
  const [list, setList] = useState(null);
  const [msg, setMsg] = useState({});
  const [busyId, setBusyId] = useState(null);

  const load = () => bookingApi.mine().then(setList).catch((e) => { setMsg({ error: errorMessage(e) }); setList([]); });
  useEffect(() => { load(); }, []);

  const cancel = async (id) => {
    if (!window.confirm(`Are you sure you want to cancel PNR ${id}? This action cannot be undone.`)) return;
    setBusyId(id); setMsg({});
    try {
      const r = await bookingApi.cancel(id);
      setMsg({ success: r.message });
      await load();
    } catch (e) {
      setMsg({ error: `Cancellation failed: ${errorMessage(e)}` });
    } finally {
      setBusyId(null);
    }
  };

  const download = async (id) => {
    setBusyId(id); setMsg({});
    try { await bookingApi.downloadTicket(id); } catch (e) { setMsg({ error: `Error downloading ticket: ${errorMessage(e)}` }); } finally { setBusyId(null); }
  };

  return (
    <div className="container main-container mt-4">
      <div className="card-form mb-4 w-form-3xl" style={{ padding: '15px 30px', width: '100%' }}>
        <h2 className="mb-0" style={{ color: 'var(--irctc-blue)', textAlign: 'left' }}>
          <i className="bi bi-ticket-perforated-fill me-2" style={{ color: 'var(--irctc-orange)' }} /> My Bookings
        </h2>
      </div>
      <div className="w-form-3xl"><Alert>{msg.error}</Alert><Alert type="success">{msg.success}</Alert></div>
      {list === null ? <Loader /> : list.length === 0 ? (
        <div className="alert alert-info card-form w-form-3xl" role="alert" style={{ marginLeft: 0 }}>
          <h4 className="alert-heading"><i className="bi bi-info-circle-fill me-2" /> No Bookings Found</h4>
          <p>You have not made any bookings yet. Please search for a train to book a ticket.</p>
          <hr />
          <Link to="/" className="btn btn-primary"><i className="bi bi-search me-1" /> Book a Ticket</Link>
        </div>
      ) : list.map((b) => (
        <div className="booking-card" key={b.bookingId}>
          <div className="booking-header">
            <h5>PNR: <strong>{b.bookingId}</strong> (<span className={`status-${b.status}`}>{b.status}</span>)</h5>
            <span className="text-white-50"><i className="bi bi-calendar3 me-1" /> Booked On: {fmtDate(b.createdAt)}</span>
          </div>
          <div className="booking-body">
            <div className="route"><i className="bi bi-train-front-fill me-2" />{b.trainName} ({b.trainNumber})</div>
            <div className="row booking-info">
              <div className="col-md-6">
                <p><strong style={{ color: 'var(--irctc-blue)' }}><i className="bi bi-geo-alt-fill me-1" /> From:</strong> {b.segmentSource}</p>
                <p><strong style={{ color: 'var(--irctc-blue)' }}><i className="bi bi-geo-alt-fill me-1" /> To:</strong> {b.segmentDestination}</p>
                <p><strong><i className="bi bi-calendar-event me-1" /> Date:</strong> {fmtDate(b.journeyDate)}</p>
              </div>
              <div className="col-md-6">
                <p><strong>Departure:</strong> {fmtTime(b.departureTime)}</p>
                <p><strong>Arrival:</strong> {fmtTime(b.arrivalTime)}</p>
                <p><strong><i className="bi bi-people-fill me-1" /> Passengers:</strong> {b.passengerCount} &bull; {b.classCode}</p>
              </div>
            </div>
            <hr />
            <h5 className="text-end">Total Fare: <span style={{ color: 'var(--irctc-blue)', fontSize: '1.2em' }}>₹{inrPlain(b.totalAmount)}</span></h5>
          </div>
          {b.status === 'CONFIRMED' && (
            <div className="booking-footer">
              <Link to={`/food/${b.bookingId}`} className="btn btn-outline-warning text-dark me-2" title="Order Food">
                <i className="bi bi-basket3-fill text-danger me-1" /> e-Catering
              </Link>
              <button type="button" className="btn btn-secondary me-2" onClick={() => download(b.bookingId)} disabled={busyId === b.bookingId}>
                <i className="bi bi-file-earmark-pdf-fill me-1" /> Download Ticket
              </button>
              <button type="button" className="btn btn-danger" onClick={() => cancel(b.bookingId)} disabled={busyId === b.bookingId}>
                <i className="bi bi-x-circle-fill me-1" /> Cancel Ticket
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
