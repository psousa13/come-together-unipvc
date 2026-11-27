import { useEffect, useState } from 'react';
import { api } from './api.js';
import { useAuth } from './useAuth.js';
import Icon from './Icon.jsx';
import Notice from './Notice.jsx';
import CommunityBadge from './CommunityBadge.jsx';
import { membersText, statusOf } from './communities.js';
import { field } from './ui.js';

const VIEWS = [
  ['all', 'Todas'],
  ['mine', 'As minhas'],
];

function queryOf(view, q) {
  const p = new URLSearchParams();
  if (view === 'mine') p.set('mine', '1');
  if (q.trim().length >= 2) p.set('q', q.trim());
  return p.toString();
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 rounded-3xl bg-paper p-3 shadow-sm">
      <div className="skeleton h-14 w-14 shrink-0 rounded-2xl" />
      <div className="flex flex-1 flex-col gap-2.5">
        <div className="skeleton h-5 w-3/5 rounded-full" />
        <div className="skeleton h-3 w-24 rounded-full" />
      </div>
    </div>
  );
}

function CommunityRow({ c, onOpen }) {
  const status = statusOf(c);
  return (
    <button
      type="button"
      onClick={() => onOpen(c.id)}
      className="flex w-full items-center gap-3 rounded-3xl bg-paper p-3 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-coral-deep"
    >
      <CommunityBadge name={c.name} />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-display text-[17px] font-bold leading-tight">{c.name}</span>
        {c.description && <span className="mt-0.5 line-clamp-2 block text-xs text-navy-soft">{c.description}</span>}
        <span className="mt-1 block text-[11px] font-semibold uppercase tracking-wider text-navy-soft">
          {membersText(c.membersCount)}
          {c.isPrivate ? ' · Privada' : ''}
        </span>
      </span>
      {status && (
        <span className="shrink-0 rounded-full bg-sand px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-coral-deep">
          {status}
        </span>
      )}
    </button>
  );
}

export default function Communities({ onOpen, reload }) {
  const { getToken } = useAuth();
  const [token] = useState(getToken);
  const [view, setView] = useState('all');
  const [q, setQ] = useState('');
  const [term, setTerm] = useState('');
  const [retry, setRetry] = useState(0);
  const [res, setRes] = useState({ key: null, list: [], error: '' });

  useEffect(() => {
    const t = setTimeout(() => setTerm(q), 350);
    return () => clearTimeout(t);
  }, [q]);

  const key = queryOf(view, term);

  useEffect(() => {
    let live = true;
    api(`/communities?${key}`, { token })
      .then((d) => live && setRes({ key, list: d.communities, error: '' }))
      .catch((err) => live && setRes({ key, list: [], error: err.message }));
    return () => {
      live = false;
    };
  }, [key, token, retry, reload]);

  const loading = res.key !== key;
  const filtered = view !== 'all' || term.trim().length >= 2;

  function clearFilters() {
    setView('all');
    setQ('');
    setTerm('');
  }

  function tryAgain() {
    setRes((r) => ({ ...r, key: null }));
    setRetry((x) => x + 1);
  }

  return (
    <div className="space-y-3 px-5 lg:px-8">
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-navy-soft">
          <Icon name="search" size={17} />
        </span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Procurar comunidades"
          aria-label="Procurar comunidades"
          className={`${field} pl-11`}
        />
      </div>
      <div className="flex gap-2 py-1">
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
            A carregar comunidades…
          </p>
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
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
      {!loading && !res.error && res.list.length === 0 && (
        <Notice
          icon="users"
          title={filtered ? 'Nada encontrado' : 'Ainda sem comunidades'}
          text={
            view === 'mine' && term.trim().length < 2
              ? 'Ainda não fazes parte de nenhuma comunidade.'
              : filtered
                ? 'Experimenta outra pesquisa.'
                : 'Cria a primeira comunidade do campus.'
          }
          action={filtered ? 'Limpar filtros' : undefined}
          onAction={clearFilters}
        />
      )}
      {!loading && !res.error && (
        <ul className="m-0 list-none space-y-2 p-0">
          {res.list.map((c) => (
            <li key={c.id}>
              <CommunityRow c={c} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
