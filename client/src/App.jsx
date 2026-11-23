import { useState } from 'react';
import Login from './Login.jsx';
import { useAuth } from './useAuth.js';
import { api } from './api.js';
import Avatar from './Avatar.jsx';
import Profile from './Profile.jsx';
import ProfileForm from './ProfileForm.jsx';

function UserSearch({ onOpen }) {
  const { getToken } = useAuth();
  const [q, setQ] = useState('');
  const [users, setUsers] = useState([]);

  async function change(e) {
    const value = e.target.value;
    setQ(value);
    if (value.trim().length < 2) {
      setUsers([]);
      return;
    }
    try {
      const data = await api(`/users?q=${encodeURIComponent(value.trim())}`, { token: getToken() });
      setUsers(data.users);
    } catch {
      setUsers([]);
    }
  }

  return (
    <div>
      <input value={q} onChange={change} placeholder="Procurar pessoas" style={{ width: '100%' }} />
      <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0 0' }}>
        {users.map((u) => (
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
    </div>
  );
}

export default function App() {
  const { user, loading, logout } = useAuth();
  const [view, setView] = useState({ name: 'home' });

  if (loading) return null;
  if (!user) return <Login />;

  if (user.role === 'admin') {
    return (
      <main className="card">
        <h1>Olá, {user.displayName}</h1>
        <p className="muted">Administração</p>
        <button onClick={logout}>Terminar sessão</button>
      </main>
    );
  }

  if (!user.username) return <ProfileForm mode="onboarding" />;

  const open = (username) => setView({ name: 'profile', username, n: Date.now() });

  if (view.name === 'edit') {
    return <ProfileForm mode="edit" onDone={open} onCancel={() => open(user.username)} />;
  }

  return (
    <main className="card">
      <nav style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button onClick={() => setView({ name: 'home' })}>Início</button>
        <button onClick={() => open(user.username)}>Perfil</button>
        <button onClick={logout}>Sair</button>
      </nav>

      {view.name === 'home' && (
        <>
          <h1>Olá, {user.displayName}</h1>
          <UserSearch onOpen={open} />
        </>
      )}

      {view.name === 'profile' && (
        <Profile
          key={view.n}
          username={view.username}
          onEdit={() => setView({ name: 'edit' })}
          onOpen={open}
        />
      )}
    </main>
  );
}