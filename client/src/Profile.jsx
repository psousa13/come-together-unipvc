import { useEffect, useState } from 'react';
import { api } from './api.js';
import { useAuth } from './useAuth.js';
import Avatar from './Avatar.jsx';
import Icon from './Icon.jsx';

const outline =
  'hit flex items-center justify-center gap-1.5 rounded-full border border-navy/30 py-2.5 text-sm font-bold transition hover:bg-paper active:scale-95';

export default function Profile({ username, onEdit, onOpen, onFind }) {
  const { getToken } = useAuth();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [list, setList] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api(`/users/${encodeURIComponent(username)}`, { token: getToken() })
      .then((data) => setProfile(data.user))
      .catch((err) => setError(err.message));
  }, [username, getToken]);

  async function toggleFollow() {
    setBusy(true);
    try {
      const data = await api(`/users/${profile.username}/follow`, {
        method: profile.isFollowing ? 'DELETE' : 'POST',
        token: getToken(),
      });
      setProfile((p) => ({ ...p, isFollowing: data.following, followersCount: data.followersCount }));
      setList(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function showList(kind) {
    if (list?.kind === kind) {
      setList(null);
      return;
    }
    try {
      const data = await api(`/users/${profile.username}/${kind}`, { token: getToken() });
      setList({ kind, users: data.users });
    } catch (err) {
      setError(err.message);
    }
  }

  if (error && !profile) return <p className="text-sm text-ruby">{error}</p>;
  if (!profile) return null;

  const where = [profile.school, profile.course].filter(Boolean).join(' · ');
  const counts = [
    ['followers', profile.followersCount, 'Seguidores'],
    ['following', profile.followingCount, 'A seguir'],
  ];

  return (
    <section className="space-y-4 pb-4">
      <div className="flex flex-col items-center text-center">
        <Avatar user={profile} size={112} ring />
        <h2 className="mt-3 font-display text-2xl font-bold leading-tight">{profile.displayName}</h2>
        <p className="text-sm text-navy-soft">@{profile.username}</p>
        {where && <p className="mt-0.5 text-sm font-semibold">{where}</p>}
        {profile.memberType && profile.memberType !== 'Estudante' && (
          <span className="mt-1 rounded-full bg-sand-deep px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider">
            {profile.memberType}
          </span>
        )}
        {profile.bio && <p className="mt-2 max-w-[280px] text-sm">{profile.bio}</p>}

        <div className="mt-4 flex items-center gap-8">
          {counts.map(([kind, n, label]) => (
            <button
              key={kind}
              type="button"
              onClick={() => showList(kind)}
              aria-pressed={list?.kind === kind}
              className="hit text-center"
            >
              <div className="font-display text-xl font-bold leading-none">{n.toLocaleString('pt-PT')}</div>
              <div className="mt-1 text-xs text-navy-soft">{label}</div>
            </button>
          ))}
        </div>

        {profile.isMe ? (
          <div className="mt-4 grid w-full max-w-[340px] grid-cols-2 gap-2.5">
            <button type="button" onClick={onEdit} className={outline}>
              <Icon name="edit" size={16} /> Editar perfil
            </button>
            <button
              type="button"
              onClick={onFind}
              className="hit flex items-center justify-center gap-1.5 rounded-full bg-gold py-2.5 text-sm font-bold text-navy transition active:scale-95"
            >
              <Icon name="search" size={16} /> Encontrar pessoas
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={toggleFollow}
            disabled={busy}
            aria-pressed={profile.isFollowing}
            className={`mt-4 rounded-full px-6 py-2.5 text-sm font-bold transition active:scale-95 disabled:opacity-50 ${
              profile.isFollowing ? 'border border-navy/30' : 'bg-coral-deep text-white'
            }`}
          >
            {profile.isFollowing ? 'A seguir' : 'Seguir'}
          </button>
        )}
      </div>

      {error && <p className="text-center text-sm text-ruby">{error}</p>}

      {list && (
        <ul className="m-0 list-none space-y-2 p-0">
          {list.users.length === 0 && (
            <li className="rounded-3xl border border-dashed border-navy/25 p-5 text-center text-sm text-navy-soft">
              Ninguém ainda.
            </li>
          )}
          {list.users.map((u) => (
            <li key={u.id}>
              <button
                type="button"
                onClick={() => onOpen(u.username)}
                className="flex w-full items-center gap-3 rounded-3xl bg-paper p-3 text-left"
              >
                <Avatar user={u} size={40} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">{u.displayName}</span>
                  <span className="block truncate text-xs text-navy-soft">
                    @{u.username}
                    {u.school ? ` · ${u.school}` : ''}
                  </span>
                </span>
                <Icon name="chev" size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}