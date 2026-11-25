import { useEffect, useState } from 'react';
import { api } from './api.js';
import { useAuth } from './useAuth.js';
import Icon from './Icon.jsx';
import Notice from './Notice.jsx';
import { REASON_LABEL } from './reports.js';

const FMT = { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' };
const btn = 'h-11 rounded-full px-4 text-sm font-bold transition active:scale-95 disabled:opacity-40';

function ReportCard({ r, busy, onAct }) {
  const target = r.event
    ? `«${r.event.title}»`
    : r.user
      ? `@${r.user.username}${r.user.displayName ? ` (${r.user.displayName})` : ''}`
      : 'Alvo removido';
  const by = r.reporter?.username ? `@${r.reporter.username}` : 'utilizador removido';

  function cancelEvent() {
    if (window.confirm('Cancelar este evento? Não é possível desfazer.')) onAct(r, 'resolved', true);
  }

  return (
    <li className="space-y-3 rounded-3xl bg-paper p-4">
      <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider">
        <span className="rounded-full bg-navy px-2.5 py-1 text-paper">
          {r.targetType === 'event' ? 'Evento' : 'Perfil'}
        </span>
        <span className="rounded-full bg-sand-deep px-2.5 py-1">{REASON_LABEL[r.reason] || r.reason}</span>
        {r.event?.cancelled && <span className="rounded-full bg-ruby px-2.5 py-1 text-white">Cancelado</span>}
      </div>
      <p className="m-0 break-words font-display text-lg font-bold leading-snug">{target}</p>
      {r.details && <p className="m-0 whitespace-pre-line break-words text-sm text-navy-soft">{r.details}</p>}
      <p className="m-0 text-xs text-navy-soft">
        Denunciado por {by} · {new Date(r.createdAt).toLocaleString('pt-PT', FMT)}
      </p>
      <div className="flex flex-wrap gap-2">
        {r.event && !r.event.cancelled && (
          <button type="button" disabled={busy} onClick={cancelEvent} className={`${btn} border border-ruby text-ruby`}>
            Cancelar evento
          </button>
        )}
        <button type="button" disabled={busy} onClick={() => onAct(r, 'resolved', false)} className={`${btn} bg-navy text-paper`}>
          Resolver
        </button>
        <button type="button" disabled={busy} onClick={() => onAct(r, 'dismissed', false)} className={`${btn} border border-navy/20 text-navy`}>
          Ignorar
        </button>
      </div>
    </li>
  );
}

export default function Admin() {
  const { user, logout, getToken } = useAuth();
  const [token] = useState(getToken);
  const [reports, setReports] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let live = true;
    api('/reports', { token })
      .then((d) => live && setReports(d.reports))
      .catch((err) => live && setLoadError(err.message));
    return () => {
      live = false;
    };
  }, [token]);

  async function act(r, status, cancelEvent) {
    setBusy(r.id);
    setError('');
    try {
      if (cancelEvent) await api(`/events/${r.event.id}/cancel`, { method: 'POST', token });
      await api(`/reports/${r.id}`, { method: 'PATCH', token, body: { status } });
      setReports((list) => list.filter((x) => x.id !== r.id));
    } catch (err) {
      setError(err.message);
    }
    setBusy('');
  }

  return (
    <div className="mx-auto min-h-dvh max-w-[640px] px-5 pb-10 pt-[max(env(safe-area-inset-top),2rem)]">
      <header className="flex items-end gap-3 pb-4">
        <div className="min-w-0 flex-1">
          <h1 className="m-0 font-display text-[30px] font-bold leading-none">Administração</h1>
          <p className="mt-1.5 truncate text-sm text-navy-soft">
            {user.displayName} · {reports ? `${reports.length} denúncia(s) aberta(s)` : 'Denúncias'}
          </p>
        </div>
        <button
          type="button"
          onClick={logout}
          title="Terminar sessão"
          aria-label="Terminar sessão"
          className="hit grid h-10 w-10 place-items-center rounded-full bg-paper shadow-sm"
        >
          <Icon name="logout" size={18} />
        </button>
      </header>

      {loadError && <Notice danger icon="info" title="Não foi possível carregar" text={loadError} />}

      {!loadError && reports === null && (
        <div className="space-y-2" aria-busy="true">
          <p className="sr-only" role="status">
            A carregar denúncias…
          </p>
          <div className="skeleton h-36 rounded-3xl" />
          <div className="skeleton h-36 rounded-3xl" />
        </div>
      )}

      {reports && reports.length === 0 && (
        <Notice
          icon="check"
          title="Sem denúncias abertas"
          text="Quando alguém denunciar um evento ou um perfil, aparece aqui."
        />
      )}

      {reports && reports.length > 0 && (
        <ul className="m-0 list-none space-y-3 p-0">
          {reports.map((r) => (
            <ReportCard key={r.id} r={r} busy={busy === r.id} onAct={act} />
          ))}
        </ul>
      )}

      {error && (
        <p role="alert" className="mt-4 text-center text-sm font-semibold text-ruby">
          {error}
        </p>
      )}
    </div>
  );
}