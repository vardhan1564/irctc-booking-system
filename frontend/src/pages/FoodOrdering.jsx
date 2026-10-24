import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { foodApi } from '../api';
import { errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Alert, Loader } from '../components/Common';

function FoodRow({ item, qty, onAdd, onQty, onInfo }) {
  return (
    <div className="menu-item">
      <div className={`item-icon ${item.type === 'VEG' ? 'veg' : 'non-veg'}`} title={item.type === 'VEG' ? 'Veg' : 'Non-veg'}>
        <i className="bi bi-circle-fill" />
      </div>
      <div className="item-content">
        <button type="button" className="item-title" onClick={() => onInfo(item)}>
          {item.name} <i className="bi bi-info-circle-fill text-muted small ms-1" style={{ fontSize: '0.7em' }} />
        </button>
        <div className="item-desc">{item.description}</div>
      </div>
      <div className="item-action">
        <span className="item-price">&#8377;{item.price}</span>
        {qty > 0 ? (
          <div className="qty-control">
            <button type="button" className="qty-btn" aria-label={`Remove one ${item.name}`} onClick={() => onQty(item, -1)}>-</button>
            <span className="qty-val">{qty}</span>
            <button type="button" className="qty-btn" aria-label={`Add one ${item.name}`} onClick={() => onQty(item, 1)}>+</button>
          </div>
        ) : (
          <button type="button" className="btn btn-add" onClick={() => onAdd(item)}>ADD</button>
        )}
      </div>
    </div>
  );
}

const SECTIONS = [
  { key: 'b', title: 'Breakfast', icon: 'bi-sunrise', match: (c) => c === 'BREAKFAST' },
  { key: 'm', title: 'Lunch & Dinner', icon: 'bi-disc', match: (c) => ['MEALS', 'LUNCH', 'DINNER'].includes(c) },
  { key: 's', title: 'Snacks', icon: 'bi-cup-hot', match: (c) => ['SNACKS', 'ALL_DAY'].includes(c) },
];

/** Port of foodOrdering.jsp + FoodOrderingServlet + Food Stripe servlets. Bootstrap JS widgets became React state. */
export default function FoodOrdering() {
  const { pnr } = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const full = params.get('view') === 'full';
  const [menu, setMenu] = useState(null);
  const [error, setError] = useState('');
  const [cart, setCart] = useState({}); // id -> { item, qty }
  const [drawer, setDrawer] = useState(false);
  const [info, setInfo] = useState(null);
  const [openSection, setOpenSection] = useState('b');
  const [toast, setToast] = useState(null);
  const [contact, setContact] = useState({ name: user?.fullName || '', phone: user?.phone || '' });
  const [paying, setPaying] = useState(false);
  const confirmed = useRef(false);

  useEffect(() => {
    setMenu(null);
    foodApi.menu(pnr, full).then(setMenu).catch((e) => setError(errorMessage(e)));
  }, [pnr, full]);

  // Returning from Stripe
  useEffect(() => {
    const sid = params.get('session_id');
    if (params.get('error') === 'cancelled') setToast({ type: 'danger', text: 'Payment was cancelled.' });
    if (sid && !confirmed.current) {
      confirmed.current = true;
      foodApi.confirm(sid)
        .then((r) => setToast({ type: 'success', text: r.message }))
        .catch((e) => setToast({ type: 'danger', text: errorMessage(e) }))
        .finally(() => setParams(full ? { view: 'full' } : {}, { replace: true }));
    }
  }, [params, setParams, full]);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  const add = (item) => setCart((c) => ({ ...c, [item.id]: { item, qty: (c[item.id]?.qty || 0) + 1 } }));
  const changeQty = (item, d) => setCart((c) => {
    const q = (c[item.id]?.qty || 0) + d;
    const next = { ...c };
    if (q <= 0) delete next[item.id]; else next[item.id] = { item, qty: q };
    return next;
  });

  const entries = Object.values(cart);
  const totalQty = entries.reduce((s, e) => s + e.qty, 0);
  const total = entries.reduce((s, e) => s + e.qty * Number(e.item.price), 0);

  const pay = async () => {
    setPaying(true);
    try {
      const body = { pnr: String(pnr), contactName: contact.name, contactPhone: contact.phone,
        cart: Object.fromEntries(entries.map((e) => [e.item.id, e.qty])) };
      const { url } = await foodApi.checkout(body);
      window.location.href = url;
    } catch (e) {
      setToast({ type: 'danger', text: `Payment Error: ${errorMessage(e)}` });
      setPaying(false);
    }
  };

  const row = (it) => <FoodRow key={it.id} item={it} qty={cart[it.id]?.qty || 0} onAdd={add} onQty={changeQty} onInfo={setInfo} />;

  if (error) return <div className="container main-container mt-4"><div className="card-form mx-auto"><Alert>{error}</Alert>
    <button type="button" className="btn btn-secondary" onClick={() => navigate('/bookings')}>Back to My Bookings</button></div></div>;

  return (
    <div className="page-food container main-container mt-4">
      <div className="card-form mx-auto w-form-2xl" style={{ overflow: 'hidden' }}>
        <div className="food-header">
          <div className="header-title"><i className="bi bi-cup-hot-fill text-warning me-2" /> Meals on Wheels</div>
          <div className="context-bar">
            <div className="text-muted small">PNR: <strong className="text-dark fs-6 ms-1">{pnr}</strong></div>
            <div className="d-flex align-items-center gap-2">
              {menu && <div className="badge bg-light text-dark border px-3 py-2">{menu.mealCategory.replace('_', ' ')} MENU</div>}
              {full
                ? <button type="button" className="btn btn-sm btn-primary fw-bold" onClick={() => setParams({})}>Smart View</button>
                : <button type="button" className="btn btn-sm btn-outline-secondary fw-bold" onClick={() => setParams({ view: 'full' })}>Full Menu</button>}
            </div>
          </div>
        </div>

        {!menu ? <Loader text="Loading menu..." /> : full ? (
          <div className="accordion">
            {SECTIONS.map((s) => (
              <div className="accordion-item" key={s.key}>
                <h2 className="accordion-header">
                  <button type="button" className={`accordion-button${openSection === s.key ? '' : ' collapsed'}`}
                          aria-expanded={openSection === s.key} onClick={() => setOpenSection(openSection === s.key ? null : s.key)}>
                    <i className={`bi ${s.icon} me-2`} /> {s.title}
                  </button>
                </h2>
                {openSection === s.key && (
                  <div className="accordion-collapse collapse show"><div className="accordion-body">
                    {menu.items.filter((it) => s.match(it.category)).map(row)}
                  </div></div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="menu-list">
            {menu.items.length ? menu.items.map(row) : (
              <div className="text-center py-5 text-muted"><h5>Kitchen Closed</h5><p>No items available. Try Full Menu.</p></div>
            )}
          </div>
        )}
      </div>

      {totalQty > 0 && !drawer && (
        <div className="cart-bar">
          <div className="d-flex align-items-center gap-3">
            <div className="bg-success rounded-circle d-flex align-items-center justify-content-center" style={{ width: 35, height: 35 }}>
              <i className="bi bi-basket2-fill" />
            </div>
            <div>
              <div className="fw-bold text-white" style={{ fontSize: '0.85rem', letterSpacing: 0.5 }}>{totalQty} ITEM{totalQty !== 1 ? 'S' : ''}</div>
              <div className="fw-bold text-warning fs-6">₹{total}</div>
            </div>
          </div>
          <button type="button" className="btn btn-light rounded-pill fw-bold text-dark px-4" onClick={() => setDrawer(true)}>
            Checkout <i className="bi bi-chevron-right ms-1" />
          </button>
        </div>
      )}

      {drawer && (
        <>
          <div className="react-backdrop" onClick={() => setDrawer(false)} />
          <aside className="react-offcanvas cart-drawer" role="dialog" aria-modal="true" aria-label="Your cart">
            <div className="offcanvas-header">
              <h5 className="offcanvas-title fw-bold"><i className="bi bi-basket3-fill text-warning me-2" /> Your Cart</h5>
              <button type="button" className="btn-close" aria-label="Close" onClick={() => setDrawer(false)} />
            </div>
            <div className="offcanvas-body d-flex flex-column">
              <div className="flex-grow-1 overflow-auto">
                {entries.map(({ item, qty }) => (
                  <div className="cart-item-row" key={item.id}>
                    <div><div className="cart-item-name">{item.name}</div><div className="small text-muted">₹{item.price} x {qty}</div></div>
                    <div className="cart-item-price">₹{Number(item.price) * qty}</div>
                  </div>
                ))}
              </div>
              <div className="cart-summary shadow-sm border-top">
                <div className="d-flex justify-content-between mb-2"><span className="text-muted">Subtotal</span><span className="fw-bold">₹{total}</span></div>
                <hr />
                <h6 className="fw-bold mb-3">Contact Details</h6>
                <div className="mb-3">
                  <input type="text" className="form-control mb-2" placeholder="Receiver Name" aria-label="Receiver name"
                         value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} />
                  <input type="tel" className="form-control" placeholder="Phone Number" aria-label="Phone number"
                         value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} />
                </div>
                <button type="button" className="btn btn-orange w-100 py-3 fw-bold shadow" onClick={pay}
                        disabled={paying || !contact.name.trim() || !contact.phone.trim()}>
                  {paying ? <><span className="spinner-border spinner-border-sm me-2" /> Processing...</> : <>PAY NOW <i className="bi bi-credit-card-2-front-fill ms-2" /></>}
                </button>
              </div>
            </div>
          </aside>
        </>
      )}

      {info && (
        <>
          <div className="react-backdrop" onClick={() => setInfo(null)} />
          <div className="react-modal" onClick={() => setInfo(null)}>
            <div className="modal-content border-0 shadow-lg" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">Food Details</h5>
                <button type="button" className="btn-close" aria-label="Close" onClick={() => setInfo(null)} />
              </div>
              <div className="modal-body p-4">
                <div className="d-flex align-items-center mb-3">
                  <span className={`item-icon ${info.type === 'VEG' ? 'veg' : 'non-veg'} me-2`}><i className="bi bi-circle-fill" /></span>
                  <span className="badge bg-secondary">{info.category}</span>
                </div>
                <h4 className="fw-bold text-irctc mb-2">{info.name}</h4>
                <h3 className="text-success fw-bold mb-3">₹{info.price}</h3>
                <div className="bg-light p-3 rounded border mb-3">
                  <h6 className="fw-bold text-muted text-uppercase small">Contents &amp; Description</h6>
                  <p className="mb-0" style={{ fontSize: '0.95rem', color: '#555', lineHeight: 1.6 }}>{info.description}</p>
                </div>
                <button type="button" className="btn btn-orange w-100 py-3 fw-bold rounded-pill shadow-sm"
                        onClick={() => { if (!cart[info.id]) add(info); setInfo(null); }}>Add to Order</button>
              </div>
            </div>
          </div>
        </>
      )}

      {toast && (
        <div className={`toast show align-items-center text-white bg-${toast.type} border-0 toast-float`} role="alert">
          <div className="d-flex">
            <div className="toast-body fs-6">
              <i className={`bi ${toast.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2`} />{toast.text}
            </div>
            <button type="button" className="btn-close btn-close-white me-2 m-auto" aria-label="Close" onClick={() => setToast(null)} />
          </div>
        </div>
      )}
    </div>
  );
}
