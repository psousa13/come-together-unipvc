import { useEffect, useState } from 'react';
import { api } from './api.js';
import { useAuth } from './useAuth.js';
import Avatar from './Avatar.jsx';

export default function Profile({ username, onEdit, onOpen }) {
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

  if (error && !profile) return <p style={{ color: 'crimson' }}>{error}</p>;
  if (!profile) return null;

  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Avatar user={profile} size={72} />
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0 }}>{profile.displayName}</h2>
          <div className="muted">
            @{profile.username}
            {profile.school ? ` · ${profile.school}` : ''}
          </div>
        </div>
        {profile.isMe ? (
          <button onClick={onEdit}>Editar</button>
        ) : (
          <button onClick={toggleFollow} disabled={busy}>
            {profile.isFollowing ? 'A seguir' : 'Seguir'}
          </button>
        )}
      </div>

      {profile.bio && <p>{profile.bio}</p>}

      <div style={{ display: 'flex', gap: 16, margin: '8px 0' }}>
        <button type="button" onClick={() => showList('followers')}>
          {profile.followersCount} seguidores
        </button>
        <button type="button" onClick={() => showList('following')}>
          {profile.followingCount} a seguir
        </button>
      </div>

      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      {list && (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {list.users.length === 0 && <li className="muted">Ninguém ainda.</li>}
          {list.users.map((u) => (
            <li key={u.id}>
              <button
                type="button"
                onClick={() => onOpen(u.username)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}
              >
                <Avatar user={u} size={28} />
                <span>{u.displayName}</span>
                <span className="muted">@{u.username}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}