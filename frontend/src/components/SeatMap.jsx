import { useMemo } from 'react';
import { buildLayout } from '../utils/seatLayout';

/** Port of seatmap.js. Seats are <button>s, so the map works with keyboard and screen readers. */
export default function SeatMap({ classCode, booked = [], selected = [], max, onToggle }) {
  const bays = useMemo(() => buildLayout(classCode), [classCode]);
  const bookedSet = useMemo(() => new Set(booked), [booked]);
  const selectedNos = new Set(selected.map((s) => s.no));

  const seat = (s, extraClass = '') => {
    const isBooked = bookedSet.has(s.no);
    const isSel = selectedNos.has(s.no);
    return (
      <button key={s.no} type="button" className={`seat ${isBooked ? 'booked' : ''} ${isSel ? 'selected' : ''} ${extraClass}`}
              disabled={isBooked} aria-pressed={isSel}
              aria-label={`Seat ${s.no}, ${s.type}${isBooked ? ', booked' : isSel ? ', selected' : ''}`}
              onClick={() => onToggle(s, selected.length >= max && !isSel)}>
        <span className="seat-num">{s.no}</span>
        <span className="seat-label">{s.type}</span>
      </button>
    );
  };

  return (
    <div id="seat-map-container" className="coach-container">
      {bays.map((bay, i) =>
        bay.kind === 'BERTH' ? (
          <div className="coach-bay" key={i}>
            <div className="main-berths">
              {bay.main.map((col, c) => <div className="berth-column" key={c}>{col.map((s) => seat(s))}</div>)}
            </div>
            <div className="side-berths">
              <div className="berth-column">{bay.side.map((s) => seat(s))}</div>
            </div>
          </div>
        ) : (
          <div className="coach-bay" style={{ justifyContent: 'center' }} key={i}>
            <div className="cabin-box" style={bay.kind === 'COUPE' ? { width: 140 } : undefined}>
              <div className="text-center small text-muted mb-2" style={{ fontWeight: 'bold', letterSpacing: 1 }}>{bay.label}</div>
              <div className="main-berths" style={{ justifyContent: bay.kind === 'COUPE' ? 'center' : 'space-between' }}>
                {bay.main.map((col, c) => <div className="berth-column" key={c}>{col.map((s) => seat(s))}</div>)}
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}
