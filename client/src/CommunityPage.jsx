import { useEffect, useState } from 'react';
import { api } from './api.js';
import { useAuth } from './useAuth.js';
import Avatar from './Avatar.jsx';
import Icon from './Icon.jsx';
import Notice from './Notice.jsx';
import CommunityBadge from './CommunityBadge.jsx';
import { CommunityForm } from './CreateCommunity.jsx';
import { membersText } from './communities.js';

const btn =
  'flex h-13 w-full items-center justify-center gap-2 rounded-full text-[15px] font-bold transition active:scale-[0.98] disabled:opacity-40';
const small = 'hit rounded-full px-3 py-1.5 text-xs font-bold disabled:opacity-40';
const topPad = 'pt-[calc(env(safe-area-inset-top)+2rem)] lg:pt-10';

function BackButton({ onBack }) {
  return (
    <button
      type="button"
      onClick={onBack}
      aria-label="Voltar"
      className="hit grid h-10 w-10 place-items-center rounded-full bg-sand text-navy shadow-sm transition active:scale-90"
    >
      <Icon name="back" size={22} />
    </button>
  );
}

function Skeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      <p className="sr-only" role="status">
        A carregar comunidade…
      </p>
      <div className="flex items-center gap-4">
        <div className="skeleton h-18 w-18 rounded-2xl" />
        <div className="flex flex-1 flex-col gap-2.5">
          <div className="skeleton h-7 w-3/4 rounded-2xl" />
          <div className="skeleton h-4 w-1/3 rounded-full" />
        </div>
      </div>
      <div className="skeleton h-13 w-full rounded-full" />
      <div className="skeleton h-16 w-full rounded-2xl" />
      <div className="skeleton h-16 w-full rounded-2xl" />
    </div>
  );
}

function Person({ p, me, onUser, children }) {
  return (
    <li className="rounded-2xl bg-sand/70 p-2.5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onUser(p.username)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <Avatar user={p} size={40} />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">
              {p.displayName || p.username}
              {p.username === me && <span className="font-normal text-navy-soft"> (tu)</span>}
            </span>
            <span className="block truncate text-xs text-navy-soft">@{p.username}</span>
          </span>
        </button>
        {p.isAdmin && (
          <span className="shrink-0 rounded-full bg-gold/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
            Admin
          </span>
        )}
      </div>
      {children && <div className="mt-2 flex flex-wrap gap-2 pl-[52px]">{children}</div>}
    </li>
  );
}

export default function CommunityPage({ id, onBack, onUser, reload = 0 }) {
  const { user, getToken } = useAuth();
  const [token] = useState(getToken);
  const [res, setRes] = useState({ id: null, community: null, error: '' });
  const [tick, setTick] = useState(0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [leaving, setLeaving] = useState(false);
  const [removing, setRemoving] = useState('');
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    let live = true;
    api(`/communities/${id}`, { token })
      .then((d) => live && setRes({ id, community: d.community, error: '' }))
      .catch((err) => live && setRes({ id, community: null, error: err.message }));
    return () => {
      live = false;
    };
  }, [id, token, reload, tick]);

  const plain = (child) => (
    <div className={`space-y-4 px-5 lg:px-8 ${topPad}`}>
      <BackButton onBack={onBack} />
      {child}
    </div>
  );

  if (res.id !== id) return plain(<Skeleton />);
  if (res.error || !res.community) {
    return plain(
      <Notice danger icon="info" title="Comunidade indisponível" text={res.error || 'Comunidade não encontrada.'} />
    );
  }

  const c = res.community;
  const me = user.username;
  const canSee = !c.isPrivate || c.isMember || c.canManage;
  const hidden = c.membersCount - c.members.length;

  async function act(path, method, body) {
    setBusy(true);
    setMsg('');
    try {
      await api(`/communities/${id}${path}`, { method, body, token });
      setTick((t) => t + 1);
      return true;
    } catch (err) {
      setMsg(err.message);
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function save(body) {
    await api(`/communities/${id}`, { method: 'PATCH', body, token });
    setEditing(false);
    setTick((t) => t + 1);
  }

  async function leave() {
    if (await act('/join', 'DELETE')) setLeaving(false);
  }

  async function remove(username) {
    if (await act(`/members/${username}`, 'DELETE')) setRemoving('');
  }

  return (
    <main className="pb-4">
      <div className={`space-y-5 px-5 lg:px-8 ${topPad}`}>
        <div className="flex items-center justify-between">
          <BackButton onBack={onBack} />
          {c.canManage && (
            <button
              type="button"
              onClick={() => setEditing((x) => !x)}
              className="hit flex h-9 items-center gap-1.5 rounded-full bg-sand px-3.5 text-xs font-bold text-navy shadow-sm"
            >
              <Icon name={editing ? 'close' : 'edit'} size={14} />
              {editing ? 'Fechar' : 'Editar'}
            </button>
          )}
        </div>

        {editing ? (
          <section className="space-y-3">
            <h2 className="m-0 font-display text-xl font-bold">Editar comunidade</h2>
            <CommunityForm key={tick} initial={c} submitText="Guardar" busyText="A guardar…" onSubmit={save} />
          </section>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <CommunityBadge name={c.name} size={72} />
              <div className="min-w-0 flex-1">
                <h1 className="m-0 break-words font-display text-[28px] font-bold leading-[1.05]">{c.name}</h1>
                <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider">
                  <span className="rounded-full bg-sand px-2.5 py-1">{c.isPrivate ? 'Privada' : 'Pública'}</span>
                  <span className="rounded-full bg-sand px-2.5 py-1">{membersText(c.membersCount)}</span>
                  {c.isAdmin && <span className="rounded-full bg-navy px-2.5 py-1 text-paper">És admin</span>}
                </div>
              </div>
            </div>
            {c.description && <p className="m-0 break-words text-sm leading-relaxed text-navy-soft">{c.description}</p>}
          </div>
        )}

        {!c.isMember && !c.hasRequested && (
          <button
            type="button"
            disabled={busy}
            onClick={() => act('/join', 'POST')}
            className={`${btn} bg-coral-deep text-white`}
          >
            {c.isPrivate ? 'Pedir para entrar' : 'Entrar na comunidade'}
          </button>
        )}
        {!c.isMember && c.hasRequested && (
          <div className="space-y-2 rounded-3xl bg-sand/70 p-4 text-center">
            <p className="m-0 text-sm font-semibold">Pedido enviado</p>
            <p className="m-0 text-xs text-navy-soft">Um administrador tem de aprovar a tua entrada.</p>
            <button
              type="button"
              disabled={busy}
              onClick={() => act('/join', 'DELETE')}
              className={`${small} border border-line text-navy`}
            >
              Cancelar pedido
            </button>
          </div>
        )}

        {c.canManage && c.requests.length > 0 && (
          <section className="space-y-2">
            <h2 className="m-0 font-display text-xl font-bold">Pedidos ({c.requests.length})</h2>
            <ul className="m-0 list-none space-y-2 p-0">
              {c.requests.map((p) => (
                <Person key={p.username} p={p} me={me} onUser={onUser}>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => act(`/requests/${p.username}`, 'POST')}
                    className={`${small} bg-coral-deep text-white`}
                  >
                    Aceitar
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => act(`/requests/${p.username}`, 'DELETE')}
                    className={`${small} border border-line text-navy`}
                  >
                    Recusar
                  </button>
                </Person>
              ))}
            </ul>
          </section>
        )}

        <section className="space-y-2">
          <h2 className="m-0 font-display text-xl font-bold">Membros</h2>
          {canSee ? (
            <>
              <ul className="m-0 list-none space-y-2 p-0">
                {c.members.map((p) => {
                  const manage = c.canManage && p.username !== me;
                  return (
                    <Person key={p.username} p={p} me={me} onUser={onUser}>
                      {manage && (
                        <>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => act(`/admins/${p.username}`, p.isAdmin ? 'DELETE' : 'POST')}
                            className={`${small} border border-line text-navy`}
                          >
                            {p.isAdmin ? 'Retirar admin' : 'Tornar admin'}
                          </button>
                          {!p.isAdmin &&
                            (removing === p.username ? (
                              <>
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => remove(p.username)}
                                  className={`${small} bg-ruby text-white`}
                                >
                                  Sim, remover
                                </button>
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => setRemoving('')}
                                  className={`${small} border border-line text-navy`}
                                >
                                  Não
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => setRemoving(p.username)}
                                className={`${small} border border-ruby text-ruby`}
                              >
                                Remover
                              </button>
                            ))}
                        </>
                      )}
                    </Person>
                  );
                })}
              </ul>
              {hidden > 0 && <p className="m-0 text-center text-xs text-navy-soft">e mais {hidden}</p>}
            </>
          ) : (
            <p className="m-0 rounded-2xl bg-sand/70 p-4 text-center text-sm text-navy-soft">
              Esta comunidade é privada. Entra para veres quem faz parte.
            </p>
          )}
        </section>

        {c.isMember &&
          (leaving ? (
            <div className="space-y-3 rounded-3xl bg-sand/70 p-4">
              <p className="m-0 text-center text-sm font-semibold">Sair desta comunidade?</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setLeaving(false)}
                  className={`${btn} border border-navy/20 text-navy`}
                >
                  Voltar
                </button>
                <button type="button" disabled={busy} onClick={leave} className={`${btn} bg-ruby text-white`}>
                  Sim, sair
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => setLeaving(true)}
              className={`${btn} border border-ruby text-ruby`}
            >
              Sair da comunidade
            </button>
          ))}

        {msg && (
          <p role="alert" className="m-0 text-center text-sm text-ruby">
            {msg}
          </p>
        )}
      </div>
    </main>
  );
}
