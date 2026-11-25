import { useEffect, useState } from 'react';
import { api } from './api.js';
import { useAuth } from './useAuth.js';
import Dropdown from './Dropdown.jsx';
import Icon from './Icon.jsx';
import Notice from './Notice.jsx';
import { SCHOOLS } from './schools.js';
import { goingText, whenShort } from './format.js';
import { field } from './ui.js';

const VIEWS = [
  ['next', 'Próximos'],
  ['going', 'Eu vou'],
  ['mine', 'Meus'],
  ['past', 'Passados'],
];

const SCHOOL_OPTIONS = [{ value: '', label: 'Todas' }, ...SCHOOLS.map((s) => ({ value: s, label: s }))];

function queryOf(view, school, q) {
  const p = new URLSearchParams();
  if (view === 'going') p.set('going', '1');
  if (view === 'mine') p.set('mine', '1');
  if (view === 'past') p.set('past', '1');
  if (school) p.set('school', school);
  if (q.trim().length >= 2) p.set('q', q.trim());
  return p.toString();
}

function dayParts(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return {
    day: d.toLocaleDateString('pt-PT', { day: 'numeric' }),
    month: d.toLocaleDateString('pt-PT', { month: 'short' }).replace('.', ''),
  };
}

function Card({ e, onOpen }) {
  const d = dayParts(e.startsAt);
  return (
    <button
      type="button"
      onClick={() => onOpen(e.id)}
      className="lift flex w-full gap-3 rounded-3xl bg-paper p-3 text-left shadow-sm"
    >
      {d && (
        <div
          aria-hidden="true"
          className="flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-navy text-paper"
        >
          <span className="font-display text-2xl font-bold leading-none">{d.day}</span>
          <span className="mt-1 text-[10px] font-bold uppercase tracking-wider text-gold">{d.month}</span>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
          <span className="rounded-full bg-sand px-2.5 py-1">{e.school}</span>
          {e.origin === 'official' && <span className="rounded-full bg-navy px-2.5 py-1 text-paper">UniPVC</span>}
          {e.isGoing && (
            <span className="ml-auto flex items-center gap-1 text-coral-deep">
              <Icon name="check" size={12} /> Eu vou
            </span>
          )}
        </div>
        <h3 className="m-0 break-words font-display text-lg font-bold leading-tight">{e.title}</h3>
        <p className="m-0 text-sm font-semibold">{whenShort(e.startsAt)}</p>
        {e.location?.name && <p className="m-0 break-words text-sm text-navy-soft">{e.location.name}</p>}
        <p className="m-0 text-xs text-navy-soft">{goingText(e.attendeesCount)}</p>
      </div>
    </button>
  );
}

function SkeletonCard() {
  return (
    <div className="flex gap-3 rounded-3xl bg-paper p-3 shadow-sm">
      <div className="skeleton h-16 w-14 shrink-0 rounded-2xl" />
      <div className="flex flex-1 flex-col gap-2.5 py-1">
        <div className="skeleton h-3 w-24 rounded-full" />
        <div className="skeleton h-5 w-4/5 rounded-full" />
        <div className="skeleton h-3 w-1/2 rounded-full" />
      </div>
    </div>
  );
}

export default function Events({ onOpen, reload }) {
  const { getToken } = useAuth();
  const [token] = useState(getToken);
  const [view, setView] = useState('next');
  const [school, setSchool] = useState('');
  const [q, setQ] = useState('');
  const [term, setTerm] = useState('');
  const [retry, setRetry] = useState(0);
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
  }, [key, token, retry, reload]);

  const loading = res.key !== key;
  const filtered = view !== 'next' || school !== '' || term.trim().length >= 2;

  function clearFilters() {
    setView('next');
    setSchool('');
    setQ('');
    setTerm('');
  }

  function tryAgain() {
    setRes((r) => ({ ...r, key: null }));
    setRetry((x) => x + 1);
  }

  return (
    <div className="space-y-3 px-5 lg:px-8">
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-navy-soft">
            <Icon name="search" size={17} />
          </span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Procurar"
            aria-label="Procurar eventos"
            className={`${field} pl-11`}
          />
        </div>
        <div className="w-32 shrink-0">
          <Dropdown
            id="ev-school"
            label="Escola"
            value={school}
            onChange={setSchool}
            options={SCHOOL_OPTIONS}
            placeholder="Todas"
          />
        </div>
      </div>
      <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 py-1 lg:mx-0 lg:px-0">
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
      {loading && (
        <div className="space-y-2" aria-busy="true">
          <p className="sr-only" role="status">
            A carregar eventos…
          </p>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}
      {!loading && res.error && (
        <Notice
          danger
          icon="bell"
          title="Não foi possível carregar"
          text={res.error}
          action="Tentar de novo"
          onAction={tryAgain}
        />
      )}
      {!loading && !res.error && res.events.length === 0 && (
        <Notice
          icon="cal"
          title={filtered ? 'Nada encontrado' : 'Ainda sem eventos'}
          text={
            filtered
              ? 'Experimenta outros filtros ou outra pesquisa.'
              : 'Sê a primeira pessoa a criar um evento no campus.'
          }
          action={filtered ? 'Limpar filtros' : undefined}
          onAction={clearFilters}
        />
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