import { useState } from 'react';
import { api } from './api.js';
import { useAuth } from './useAuth.js';
import Avatar from './Avatar.jsx';
import Icon from './Icon.jsx';
import { whenShort } from './format.js';

export default function EventRow({ e, onOpen }) {
  const { getToken } = useAuth();
  const [change, setChange] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const on = change?.from === e ? change.going : e.isGoing;
  const host = e.origin === 'official' ? 'UniPVC' : e.organizer?.displayName || 'Membro';

  async function toggle(ev) {
    ev.stopPropagation();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await api(`/events/${e.id}/going`, { method: on ? 'DELETE' : 'POST', token: getToken() });
      setChange({ from: e, going: !on });
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  }

  return (
    <article
      onClick={() => onOpen(e.id)}
      onKeyDown={(ev) => {
        if (ev.key === 'Enter' && ev.target === ev.currentTarget) onOpen(e.id);
      }}
      tabIndex={0}
      className="flex cursor-pointer gap-3 rounded-3xl bg-paper p-2.5 pr-3 outline-none transition focus-visible:ring-2 focus-visible:ring-coral-deep"
    >
      {e.thumb ? (
        <img src={e.thumb} alt="" className="h-[104px] w-[104px] shrink-0 rounded-2xl bg-sand-deep object-cover" />
      ) : (
        <span className="grid h-[104px] w-[104px] shrink-0 place-items-center rounded-2xl bg-sand-deep text-navy-soft">
          <Icon name="cal" size={28} />
        </span>
      )}
      <div className="flex min-w-0 flex-1 flex-col items-start overflow-hidden py-1">
        <span className="flex max-w-full items-center gap-2 text-xs font-semibold">
          <Avatar user={{ displayName: host }} size={22} />
          <span className="truncate">{host}</span>
        </span>
        <h3 className="m-0 mt-1.5 break-words font-display text-[17px] font-bold leading-tight">{e.title}</h3>
        <p className="m-0 mt-auto pt-1 text-[11px] font-semibold uppercase tracking-wider text-ruby">
          {whenShort(e.startsAt)}
        </p>
        {e.location?.name && (
          <p className="m-0 flex max-w-full items-center gap-1 text-xs text-navy-soft">
            <Icon name="pin" size={12} /> <span className="truncate">{e.location.name}</span>
          </p>
        )}
        {error && (
          <p role="alert" className="m-0 text-xs font-semibold text-ruby">
            {error}
          </p>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end justify-end py-1">
        {!e.ended && (
          <button
            type="button"
            onClick={toggle}
            disabled={busy}
            aria-pressed={on}
            aria-label={on ? 'Remover «Eu vou»' : 'Eu vou'}
            className={`hit grid h-9 w-9 place-items-center rounded-full transition active:scale-90 ${
              on ? 'bg-coral-deep text-white' : 'bg-navy text-paper'
            }`}
          >
            <Icon name={on ? 'check' : 'plus'} size={18} />
          </button>
        )}
      </div>
    </article>
  );
}