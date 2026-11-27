import { useEffect, useState } from 'react';
import { api } from './api.js';
import { useAuth } from './useAuth.js';
import Dropdown from './Dropdown.jsx';
import Icon from './Icon.jsx';
import Notice from './Notice.jsx';
import { SCHOOLS } from './schools.js';
import EventRow from './EventRow.jsx';
import { onEventChange } from './eventsBus.js';
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

const cache = new Map();
const NONE = new Set();

function purge(id) {
  cache.forEach((list, k) => cache.set(k, list.filter((x) => x.id !== id)));
}

export default function Events({ onOpen, reload }) {
  const { getToken } = useAuth();
  const [token] = useState(getToken);
  const [view, setView] = useState('next');
  const [school, setSchool] = useState('');
  const [q, setQ] = useState('');
  const [term, setTerm] = useState('');
  const [retry, setRetry] = useState(0);
  const [ping, setPing] = useState(0);
  const [res, setRes] = useState({ key: null, events: [], error: '', enter: NONE });
  const [leaving, setLeaving] = useState(NONE);

  useEffect(() => {
    const t = setTimeout(() => setTerm(q), 350);
    return () => clearTimeout(t);
  }, [q]);

  const key = queryOf(view, school, term);

  useEffect(() => {
    let live = true;
    api(`/events?${key}`, { token })
      .then((d) => {
        cache.set(`${token}|${key}`, d.events);
        if (!live) return;
        setRes((prev) => {
          const known = prev.key === key && !prev.error ? new Set(prev.events.map((x) => x.id)) : null;
          const enter = known ? new Set(d.events.filter((x) => !known.has(x.id)).map((x) => x.id)) : NONE;
          return { key, events: d.events, error: '', enter };
        });
      })
      .catch((err) => {
        if (!live) return;
        setRes((prev) =>
          prev.key === key && prev.events.length > 0 ? prev : { key, events: [], error: err.message, enter: NONE }
        );
      });
    return () => {
      live = false;
    };
  }, [key, token, retry, reload, ping]);

  useEffect(() => {
    return onEventChange((m) => {
      if (m.type === 'created') {
        setPing((x) => x + 1);
      } else if (m.type === 'cancelled') {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          purge(m.id);
          setRes((r) => ({ ...r, events: r.events.filter((x) => x.id !== m.id) }));
        } else {
          setLeaving((s) => new Set(s).add(m.id));
        }
      } else if (m.type === 'going') {
        const patch = (list) => list.map((x) => (x.id === m.id ? { ...x, isGoing: m.going } : x));
        cache.forEach((list, k) => cache.set(k, patch(list)));
        setRes((r) => ({ ...r, events: patch(r.events) }));
        if (view === 'going') setPing((x) => x + 1);
      }
    });
  }, [view]);

  const fresh = res.key === key;
  const cached = cache.get(`${token}|${key}`);
  const events = fresh ? (res.error ? [] : res.events) : (cached ?? []);
  const loading = !fresh && cached === undefined;
  const error = fresh ? res.error : '';
  const enter = fresh ? res.enter : NONE;
  const filtered = view !== 'next' || school !== '' || term.trim().length >= 2;

  function remove(id) {
    purge(id);
    setRes((r) => ({ ...r, events: r.events.filter((x) => x.id !== id) }));
    setLeaving((s) => {
      const next = new Set(s);
      next.delete(id);
      return next;
    });
  }

  function settle(id) {
    setRes((r) => {
      if (!r.enter.has(id)) return r;
      const enter = new Set(r.enter);
      enter.delete(id);
      return { ...r, enter };
    });
  }

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
      {!loading && error && (
        <Notice
          danger
          icon="bell"
          title="Não foi possível carregar"
          text={error}
          action="Tentar de novo"
          onAction={tryAgain}
        />
      )}
      {!loading && !error && events.length === 0 && (
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
      <ul className="m-0 list-none p-0">
        {!loading &&
          events.map((e) => (
            <li
              key={e.id}
              className={leaving.has(e.id) ? 'row-leave' : enter.has(e.id) ? 'row-enter' : undefined}
              onAnimationEnd={(ev) => {
                if (ev.animationName === 'row-shrink') remove(e.id);
                else if (ev.animationName === 'row-grow') settle(e.id);
              }}
            >
              <div className="pb-2">
                <EventRow e={e} onOpen={onOpen} />
              </div>
            </li>
          ))}
      </ul>
    </div>
  );
}