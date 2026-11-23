import { useEffect, useRef, useState } from 'react';
import Icon from './Icon.jsx';

export default function Dropdown({ id, value, onChange, options, placeholder, label }) {
  const [open, setOpen] = useState(false);
  const [up, setUp] = useState(false);
  const root = useRef(null);
  const list = useRef(null);
  const cur = value ? options.find((o) => o.value === value) : undefined;

  useEffect(() => {
    if (!open) return;
    list.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
    const away = (e) => {
      if (!root.current?.contains(e.target)) setOpen(false);
    };
    const esc = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', away);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('pointerdown', away);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  function show() {
    const r = root.current.getBoundingClientRect();
    const below = window.innerHeight - r.bottom;
    setUp(below < 280 && r.top > below);
    setOpen(true);
  }

  function move(d) {
    const i = options.findIndex((o) => o.value === value);
    const start = i < 0 ? (d > 0 ? -1 : options.length) : i;
    const next = options[Math.min(options.length - 1, Math.max(0, start + d))];
    if (next) onChange(next.value);
  }

  function key(e) {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    if (!open) return show();
    move(e.key === 'ArrowDown' ? 1 : -1);
  }

  return (
    <div ref={root} className="relative">
      <button
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-label={label}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={key}
        className={`flex h-13 w-full items-center gap-2 rounded-2xl border bg-sand/60 px-4 text-left text-[15px] outline-none transition ${
          open ? 'border-coral bg-white' : 'border-line'
        }`}
      >
        <span className={`min-w-0 flex-1 truncate ${cur ? 'text-navy' : 'text-navy-soft'}`}>
          {cur ? cur.label : placeholder}
        </span>
        <span className={`text-navy-soft transition-transform ${open ? 'rotate-180' : ''}`}>
          <Icon name="down" size={18} />
        </span>
      </button>
      {open && (
        <ul
          ref={list}
          id={`${id}-list`}
          role="listbox"
          aria-label={label}
          className={`absolute inset-x-0 z-[60] m-0 max-h-64 list-none overflow-y-auto rounded-2xl border border-line bg-white p-1 shadow-[0_16px_32px_-12px_rgba(1,18,40,0.35)] ${
            up ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          }`}
        >
          {options.map((o) => {
            const on = o.value === value;
            return (
              <li key={o.value || 'none'} role="option" aria-selected={on}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  className={`flex min-h-11 w-full items-center gap-2 rounded-xl px-3 py-2 text-left ${
                    on ? 'bg-sand' : 'hover:bg-sand/60'
                  }`}
                >
                  <span className={`min-w-0 flex-1 text-sm leading-snug ${on ? 'font-bold' : 'font-semibold'}`}>
                    {o.label}
                  </span>
                  {on && (
                    <span className="text-coral-deep">
                      <Icon name="check" size={16} />
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}