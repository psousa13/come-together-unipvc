import { useState } from 'react';
import { api } from './api.js';
import { useAuth } from './useAuth.js';
import Avatar from './Avatar.jsx';

const SCHOOLS = [
  ['ESA', 'ESA – Agrária'],
  ['ESCE', 'ESCE – Ciências Empresariais'],
  ['ESDL', 'ESDL – Desporto e Lazer'],
  ['ESE', 'ESE – Educação'],
  ['ESS', 'ESS – Saúde'],
  ['ESTG', 'ESTG – Tecnologia e Gestão'],
];

function resizeImage(file, size = 256) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const side = Math.min(img.width, img.height);
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      canvas
        .getContext('2d')
        .drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Imagem inválida.'));
    };
    img.src = url;
  });
}

const field = { display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 };

export default function ProfileForm({ mode, onDone, onCancel }) {
  const { user, getToken, updateUser, logout } = useAuth();
  const onboarding = mode === 'onboarding';
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [username, setUsername] = useState(user.username || '');
  const [school, setSchool] = useState(user.school || '');
  const [bio, setBio] = useState(user.bio || '');
  const [avatar, setAvatar] = useState(user.avatar || '');
  const [error, setError] = useState('');
  const [hint, setHint] = useState('');
  const [busy, setBusy] = useState(false);

  async function checkUsername() {
    const value = username.trim().toLowerCase();
    if (!value || value === user.username) {
      setHint('');
      return;
    }
    try {
      const data = await api(`/users/username-available?username=${encodeURIComponent(value)}`, {
        token: getToken(),
      });
      setHint(data.available ? 'Disponível.' : 'Indisponível ou inválido.');
    } catch {
      setHint('');
    }
  }

  async function pickImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setAvatar(await resizeImage(file));
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const data = await api('/users/me', {
        method: 'PATCH',
        token: getToken(),
        body: { displayName, username, school, bio, avatar },
      });
      updateUser(data.user);
      onDone?.(data.user.username);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="card">
      <h1>{onboarding ? 'Completa o teu perfil' : 'Editar perfil'}</h1>
      <form onSubmit={submit}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <Avatar user={{ avatar, displayName }} size={64} />
          <div>
            <input type="file" accept="image/*" onChange={pickImage} />
            {avatar && (
              <button type="button" onClick={() => setAvatar('')}>
                Remover
              </button>
            )}
          </div>
        </div>

        <label style={field}>
          Nome
          <input value={displayName} maxLength={50} onChange={(e) => setDisplayName(e.target.value)} required />
        </label>

        <label style={field}>
          Username
          <input
            value={username}
            maxLength={20}
            placeholder="joaofernandes"
            onChange={(e) => {
              setUsername(e.target.value);
              setHint('');
            }}
            onBlur={checkUsername}
            required
          />
          {hint && <span className="muted">{hint}</span>}
        </label>

        <label style={field}>
          Escola
          <select value={school} onChange={(e) => setSchool(e.target.value)}>
            <option value="">—</option>
            {SCHOOLS.map(([code, label]) => (
              <option key={code} value={code}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label style={field}>
          Bio
          <textarea value={bio} maxLength={160} rows={2} onChange={(e) => setBio(e.target.value)} />
          <span className="muted">{bio.length}/160</span>
        </label>

        {error && <p style={{ color: 'crimson' }}>{error}</p>}

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" disabled={busy}>
            Guardar
          </button>
          {onboarding ? (
            <button type="button" onClick={logout}>
              Sair
            </button>
          ) : (
            <button type="button" onClick={onCancel}>
              Cancelar
            </button>
          )}
        </div>
      </form>
    </main>
  );
}