import { useEffect, useState } from 'react';
import { api } from './api.js';
import { useAuth } from './useAuth.js';
import Dropdown from './Dropdown.jsx';
import Icon from './Icon.jsx';
import { SCHOOLS } from './schools.js';
import { goingText, whenShort } from './format.js';
import { field, primary } from './ui.js';

const VIEWS = [
  ['next', 'Próximos'],
  ['going', 'Eu vou'],
  ['mine', 'Meus'],
  ['past', 'Passados'],
];

const SCHOOL_OPTIONS = [{ value: '', label: 'Todas as escolas' }, ...SCHOOLS.map((s) => ({ value: s, label: s }))];

function queryOf(view, school, q) {
  const p = new URLSearchParams();
  if (view === 'going') p.set('going', '1');
  if (view === 'mine') p.set('mine', '1');
  if (view === 'past') p.set('past', '1');
  if (school) p.set('school', school);
  if (q.trim().length >= 2) p.set('q', q.trim());
  return p.toString();
}

function Card({ e, onOpen }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(e.id)}
      className="flex w-full flex-col gap-1.5 rounded-3xl bg-paper p-4 text-left shadow-sm"
    >
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
        <span className="rounded-full bg-sand px-2.5 py-1">{e.school}</span>
        {e.origin === 'official' && <span className="rounded-full bg-navy px-2.5 py-1 text-paper">UniPVC</span>}
        {e.isGoing && (
          <span className="ml-auto flex items-center gap-1 text-coral-deep">
            <Icon name="check" size={12} /> Eu vou
          </span>
        )}
      </div>
      <h3 className="m-0 font-display text-lg font-bold leading-tight">{e.title}</h3>
      <p className="m-0 text-sm font-semibold">{whenShort(e.startsAt)}</p>
      {e.location?.name && <p className="m-0 text-sm text-navy-soft">{e.location.name}</p>}
      <p className="m-0 text-xs text-navy-soft">{goingText(e.attendeesCount)}</p>
    </button>
  );
}

export default function Events({ onOpen, onCreate }) {
  const { getToken } = useAuth();
  const [token] = useState(getToken);
  const [view, setView] = useState('next');
  const [school, setSchool] = useState('');
  const [q, setQ] = useState('');
  const [term, setTerm] = useState('');
  const [res, setRes] = useState({ key: null, events: [], error: '' });

  useEffect(() => {
    const t = setTimeout(() => setTerm(q), 350);
    return () => clearTimeout(t);
  }, [q]);

  const key = queryOf(view, school, term);

  useEffect(() => {
    let live = true;
    api(`/events?${key}`, { token })
      .then((d) => live && setRes({ key, events: d.events, error: '' }))
      .catch((err) => live && setRes({ key, events: [], error: err.message }));
    return () => {
      live = false;
    };
  }, [key, token]);

  const loading = res.key !== key;

  return (
    <div className="space-y-3 px-5 lg:px-8">
      <button type="button" onClick={onCreate} className={primary}>
        <Icon name="plus" size={18} /> Criar evento
      </button>
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-navy-soft">
          <Icon name="search" size={17} />
        </span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Procurar eventos"
          aria-label="Procurar eventos"
          className={`${field} pl-11`}
        />
      </div>
      <Dropdown
        id="ev-school"
        label="Escola"
        value={school}
        onChange={setSchool}
        options={SCHOOL_OPTIONS}
        placeholder="Todas as escolas"
      />
      <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 lg:mx-0 lg:px-0">
        {VIEWS.map(([k, name]) => (
          <button
            key={k}
            type="button"
            aria-pressed={view === k}
            onClick={() => setView(k)}
            className={`hit shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${
              view === k ? 'bg-navy text-paper' : 'border border-line text-navy'
            }`}
          >
            {name}
          </button>
        ))}
      </div>
      {loading && <p className="m-0 py-6 text-center text-sm text-navy-soft">A carregar…</p>}
      {!loading && res.error && <p className="m-0 py-6 text-center text-sm text-ruby">{res.error}</p>}
      {!loading && !res.error && res.events.length === 0 && (
        <div className="rounded-3xl border border-dashed border-navy/25 p-6 text-center text-sm text-navy-soft">
          Sem eventos para estes filtros.
        </div>
      )}
      <ul className="m-0 list-none space-y-2 p-0">
        {!loading &&
          res.events.map((e) => (
            <li key={e.id}>
              <Card e={e} onOpen={onOpen} />
            </li>
          ))}
      </ul>
    </div>
  );
}