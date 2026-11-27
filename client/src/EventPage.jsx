import { useEffect, useState } from 'react';
import { api } from './api.js';
import { useAuth } from './useAuth.js';
import Avatar from './Avatar.jsx';
import Icon from './Icon.jsx';
import Notice from './Notice.jsx';
import CommunityBadge from './CommunityBadge.jsx';
import ReportButton from './ReportButton.jsx';
import PhotoGallery from './PhotoGallery.jsx';
import PhotoManager from './PhotoManager.jsx';
import { goingText, whenLong } from './format.js';
import { emitEventChange } from './eventsBus.js';

function Fact({ icon, label, children }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-paper p-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sand text-coral-deep">
        <Icon name={icon} size={18} />
      </span>
      <div className="min-w-0">
        <p className="m-0 text-[11px] font-bold uppercase tracking-wider text-navy-soft">{label}</p>
        <div className="text-sm font-semibold leading-snug">{children}</div>
      </div>
    </div>
  );
}

function EventSkeleton() {
  return (
    <div className="space-y-4 pb-4" aria-busy="true">
      <p className="sr-only" role="status">
        A carregar evento…
      </p>
      <div className="space-y-3">
        <div className="skeleton h-5 w-28 rounded-full" />
        <div className="skeleton h-9 w-4/5 rounded-2xl" />
        <div className="skeleton h-4 w-1/2 rounded-full" />
      </div>
      <div className="grid gap-2">
        <div className="skeleton h-16 w-full rounded-2xl" />
        <div className="skeleton h-16 w-full rounded-2xl" />
        <div className="skeleton h-16 w-full rounded-2xl" />
      </div>
      <div className="skeleton h-13 w-full rounded-full" />
    </div>
  );
}

const btn =
  'flex h-13 w-full items-center justify-center gap-2 rounded-full text-[15px] font-bold transition active:scale-[0.98] disabled:opacity-40';

function BackButton({ onBack }) {
  return (
    <button
      type="button"
      onClick={onBack}
      aria-label="Voltar"
      className="hit grid h-10 w-10 place-items-center rounded-full bg-paper text-navy shadow-sm transition active:scale-90"
    >
      <Icon name="back" size={22} />
    </button>
  );
}

const topPad = 'pt-[calc(env(safe-area-inset-top)+2rem)] lg:pt-10';

export default function EventPage({ id, onBack, onUser, onCommunity, reload = 0 }) {
  const { getToken } = useAuth();
  const [token] = useState(getToken);
  const [res, setRes] = useState({ id: null, event: null, error: '' });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [managing, setManaging] = useState(false);

  useEffect(() => {
    let live = true;
    api(`/events/${id}`, { token })
      .then((d) => live && setRes({ id, event: d.event, error: '' }))
      .catch((err) => live && setRes({ id, event: null, error: err.message }));
    return () => {
      live = false;
    };
  }, [id, token, reload]);

  const plain = (child) => (
    <div className={`space-y-4 px-5 lg:px-8 ${topPad}`}>
      <BackButton onBack={onBack} />
      {child}
    </div>
  );

  if (res.id !== id) return plain(<EventSkeleton />);

  if (res.error || !res.event) {
    return plain(
      <Notice danger icon="info" title="Evento indisponível" text={res.error || 'Evento não encontrado.'} />
    );
  }

  const e = res.event;
  const people = e.attendeesPreview || [];
  const photos = e.photos || [];
  const canEdit = e.isMine && !e.cancelled;

  async function toggleGoing() {
    setBusy(true);
    setMsg('');
    try {
      await api(`/events/${id}/going`, { method: e.isGoing ? 'DELETE' : 'POST', token });
      const d = await api(`/events/${id}`, { token });
      setRes({ id, event: d.event, error: '' });
      emitEventChange({ type: 'going', id, going: d.event.isGoing });
    } catch (err) {
      setMsg(err.message);
    }
    setBusy(false);
  }

  async function cancel() {
    setBusy(true);
    setMsg('');
    try {
      await api(`/events/${id}/cancel`, { method: 'POST', token });
      setRes((r) => ({ ...r, event: { ...r.event, cancelled: true } }));
      emitEventChange({ type: 'cancelled', id });
      setConfirming(false);
    } catch (err) {
      setMsg(err.message);
    }
    setBusy(false);
  }

  return (
    <main className="pb-4">
      <div className={`space-y-4 px-5 lg:px-8 ${topPad}`}>
      <BackButton onBack={onBack} />
      <div>
        {e.origin === 'official' ? (
          <span className="mb-3 inline-flex items-center rounded-lg border border-navy/20 bg-paper px-2.5 py-1.5 text-xs font-semibold">
            Organizado pela UniPVC
          </span>
        ) : e.community ? (
          <div className="mb-3 inline-flex max-w-full items-center gap-2 rounded-full bg-paper px-3 py-1.5 shadow-sm">
            <span className="shrink-0 text-xs text-navy-soft">Organizado por</span>
            <button
              type="button"
              onClick={() => onCommunity(e.community.id)}
              className="hit flex min-w-0 items-center gap-2 text-xs font-semibold"
            >
              <CommunityBadge name={e.community.name} size={22} />
              <span className="truncate">{e.community.name}</span>
            </button>
          </div>
        ) : (
          e.organizer?.displayName && (
            <div className="mb-3 inline-flex max-w-full items-center gap-2 rounded-full bg-paper px-3 py-1.5 shadow-sm">
              <span className="shrink-0 text-xs text-navy-soft">Organizado por</span>
              <button
                type="button"
                disabled={!e.organizer.username}
                onClick={() => onUser(e.organizer.username)}
                className="hit flex min-w-0 items-center gap-2 text-xs font-semibold"
              >
                <Avatar user={e.organizer} size={22} />
                <span className="truncate">{e.organizer.displayName}</span>
              </button>
            </div>
          )
        )}
        <h1 className="m-0 break-words font-display text-[32px] font-bold leading-[1.05]">{e.title}</h1>
        <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider">
          <span className="rounded-full bg-paper px-2.5 py-1">{e.school}</span>
          {e.isPrivate && <span className="rounded-full bg-navy px-2.5 py-1 text-paper">Só membros</span>}
          {e.cancelled && <span className="rounded-full bg-ruby px-2.5 py-1 text-white">Cancelado</span>}
          {!e.cancelled && e.ended && <span className="rounded-full bg-sand-deep px-2.5 py-1">Terminou</span>}
        </div>
      </div>
      <div className="grid gap-2">
        <Fact icon="cal" label="Quando">{whenLong(e.startsAt, e.endsAt)}</Fact>
        {e.location?.name && <Fact icon="pin" label="Onde">{e.location.name}</Fact>}
        <div className="flex items-center gap-3 rounded-2xl bg-paper p-3">
          {people.length > 0 ? (
            <div className="flex shrink-0 -space-x-3 pl-1">
              {people.slice(0, 5).map((a, i) => (
                <Avatar key={a.username || a.id || i} user={a} size={40} ring />
              ))}
            </div>
          ) : (
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sand text-coral-deep">
              <Icon name="users" size={18} />
            </span>
          )}
          <p className="m-0 text-sm">{goingText(e.attendeesCount)}</p>
        </div>
      </div>
      {(e.description || photos.length > 0 || canEdit) && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="m-0 font-display text-xl font-bold">Sobre o evento</h2>
            {canEdit && (
              <button
                type="button"
                onClick={() => setManaging(true)}
                className="hit flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-paper px-3.5 text-xs font-bold text-navy shadow-sm"
              >
                <Icon name={photos.length ? 'edit' : 'plus'} size={14} />
                {photos.length ? 'Gerir fotos' : 'Adicionar fotos'}
              </button>
            )}
          </div>
          {e.description && (
            <p className="m-0 whitespace-pre-line break-words text-sm leading-relaxed text-navy-soft">{e.description}</p>
          )}
          <PhotoGallery photos={photos} coverId={e.coverPhoto} title={e.title} />
        </section>
      )}
      {managing && (
        <PhotoManager
          eventId={id}
          photos={photos}
          coverId={e.coverPhoto}
          token={token}
          onChange={(d) => setRes((r) => ({ ...r, event: { ...r.event, ...d } }))}
          onClose={() => setManaging(false)}
        />
      )}
      {e.ticketUrl && (
        <a
          href={e.ticketUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`${btn} border-2 border-navy text-navy`}
        >
          Bilhetes / inscrição <Icon name="ext" size={16} />
        </a>
      )}
      {e.cancelled && <p className="m-0 text-center text-sm font-semibold text-ruby">Este evento foi cancelado.</p>}
      {!e.cancelled && e.ended && <p className="m-0 text-center text-sm text-navy-soft">Este evento já terminou.</p>}
      {!e.cancelled && !e.ended && (
        <div className="space-y-2">
          <button
            type="button"
            disabled={busy}
            onClick={toggleGoing}
            aria-pressed={!!e.isGoing}
            className={`${btn} ${e.isGoing ? 'bg-navy text-paper' : 'bg-coral-deep text-white'}`}
          >
            {e.isGoing && <Icon name="check" size={16} />} Eu vou
          </button>
          <p className="m-0 text-center text-xs text-navy-soft">«Eu vou» é só um sinal de interesse, não é uma reserva.</p>
        </div>
      )}
      {e.isMine &&
        !e.cancelled &&
        (confirming ? (
          <div className="space-y-3 rounded-3xl bg-paper p-4">
            <p className="m-0 text-center text-sm font-semibold">Cancelar este evento?</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => setConfirming(false)}
                className={`${btn} border border-navy/20 text-navy`}
              >
                Voltar
              </button>
              <button type="button" disabled={busy} onClick={cancel} className={`${btn} bg-ruby text-white`}>
                Sim, cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => setConfirming(true)}
            className={`${btn} border border-ruby text-ruby`}
          >
            Cancelar evento
          </button>
        ))}
      {!e.isMine && <ReportButton targetType="event" targetId={id} />}
      {msg && (
        <p role="alert" className="m-0 text-center text-sm text-ruby">
          {msg}
        </p>
      )}
      </div>
    </main>
  );
}
