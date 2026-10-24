import { useEffect, useRef, useState } from 'react';
import { trainApi } from '../api';

/**
 * Replaces jQuery UI autocomplete. Debounced (250 ms) so we don't call the API on every keystroke,
 * and fully keyboard accessible (Up/Down/Enter/Escape).
 */
export default function StationAutocomplete({ id, value, onChange, placeholder, required }) {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const skipNext = useRef(false);

  useEffect(() => {
    if (skipNext.current) { skipNext.current = false; return undefined; }
    const term = value.trim();
    if (term.length < 2) { setItems([]); setOpen(false); return undefined; }
    let cancelled = false;
    const t = setTimeout(() => {
      trainApi.stations(term)
        .then((list) => { if (!cancelled) { setItems(list); setOpen(list.length > 0); setActive(-1); } })
        .catch(() => { if (!cancelled) setItems([]); });
    }, 250);
    return () => { cancelled = true; clearTimeout(t); };
  }, [value]);

  const choose = (v) => {
    skipNext.current = true;
    onChange(v);
    setOpen(false);
  };

  const onKeyDown = (e) => {
    if (!open) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, items.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter' && active >= 0) { e.preventDefault(); choose(items[active]); }
    else if (e.key === 'Escape') setOpen(false);
  };

  return (
    <div className="ac-wrap">
      <input type="text" id={id} className="form-control w-100" placeholder={placeholder} required={required}
             value={value} autoComplete="off" role="combobox" aria-expanded={open} aria-controls={`${id}-list`}
             onChange={(e) => onChange(e.target.value)} onKeyDown={onKeyDown}
             onBlur={() => setTimeout(() => setOpen(false), 150)} onFocus={() => items.length && setOpen(true)} />
      {open && (
        <ul className="ac-list" id={`${id}-list`} role="listbox">
          {items.map((it, i) => (
            <li key={it} role="option" aria-selected={i === active} className={i === active ? 'active' : ''}
                onMouseDown={(e) => { e.preventDefault(); choose(it); }}>
              {it}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
