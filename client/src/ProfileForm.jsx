import { useRef, useState } from 'react';
import { api } from './api.js';
import { useAuth } from './useAuth.js';
import Avatar from './Avatar.jsx';
import Dropdown from './Dropdown.jsx';
import Icon from './Icon.jsx';
import { resizeImage } from './image.js';
import { COURSES, MEMBER_TYPES, SCHOOLS, SCHOOL_NAMES } from './schools.js';
import { field, label, primary } from './ui.js';

const SCHOOL_OPTIONS = [
  { value: '', label: 'Sem escola' },
  ...SCHOOLS.map((k) => ({ value: k, label: `${k} · ${SCHOOL_NAMES[k]}` })),
];

const secondary =
  'flex h-13 w-full items-center justify-center rounded-full border border-navy/20 bg-paper text-[15px] font-bold text-navy transition active:scale-[0.97]';

export default function ProfileForm({ onDone, onCancel }) {
  const { user, getToken, updateUser } = useAuth();
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [username, setUsername] = useState(user.username || '');
  const [memberType, setMemberType] = useState(user.memberType || '');
  const [school, setSchool] = useState(user.school || '');
  const [course, setCourse] = useState(user.course || '');
  const [bio, setBio] = useState(user.bio || '');
  const [avatar, setAvatar] = useState(user.avatar || '');
  const [error, setError] = useState('');
  const [hint, setHint] = useState({ text: '', tone: '' });
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  const base = memberType !== 'Staff' ? COURSES[school] : undefined;
  const courses = base && course && !base.includes(course) ? [course, ...base] : base;

  async function checkUsername() {
    const value = username.trim().toLowerCase();
    if (!value || value === user.username) {
      setHint({ text: '', tone: '' });
      return;
    }
    try {
      const data = await api(`/users/username-available?username=${encodeURIComponent(value)}`, {
        token: getToken(),
      });
      setHint(
        data.available
          ? { text: `@${value} está disponível.`, tone: 'ok' }
          : { text: `@${value} não está disponível ou é inválido.`, tone: 'bad' },
      );
    } catch {
      setHint({ text: '', tone: '' });
    }
  }

  async function pickImage(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
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
        body: {
          displayName: displayName.trim(),
          username,
          school,
          memberType,
          course: courses ? course : '',
          bio,
          avatar,
        },
      });
      updateUser(data.user);
      onDone?.(data.user.username);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const tone = hint.tone === 'ok' ? 'text-[#1c6b43]' : hint.tone === 'bad' ? 'font-semibold text-ruby' : 'text-navy-soft';

  return (
    <form onSubmit={submit} className="space-y-5 pb-4">
      <div>
        <p className={`${label} mb-1.5`}>Foto</p>
        <div className="flex items-center gap-3">
          <Avatar user={{ avatar, displayName }} size={64} />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="h-11 rounded-full border border-navy/20 bg-paper px-4 text-sm font-bold text-navy"
          >
            {avatar ? 'Mudar' : 'Escolher foto'}
          </button>
          {avatar && (
            <button
              type="button"
              onClick={() => setAvatar('')}
              className="h-11 rounded-full border-0 bg-transparent px-2 text-sm font-bold text-navy-soft"
            >
              Remover
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickImage} />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="pf-name" className={label}>Nome</label>
        <input
          id="pf-name"
          value={displayName}
          maxLength={50}
          onChange={(e) => setDisplayName(e.target.value)}
          required
          className={field}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="pf-user" className={label}>Nome de utilizador</label>
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-navy-soft">@</span>
          <input
            id="pf-user"
            value={username}
            maxLength={20}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            aria-describedby="pf-user-msg"
            onChange={(e) => {
              setUsername(e.target.value.toLowerCase().replace(/\s/g, ''));
              setHint({ text: '', tone: '' });
            }}
            onBlur={checkUsername}
            required
            className={`${field} pl-9`}
          />
        </div>
        <p id="pf-user-msg" aria-live="polite" className={`m-0 px-1 text-xs ${tone}`}>
          {hint.text}
        </p>
      </div>

      <div className="space-y-1.5">
        <p className={label}>Sou</p>
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Tipo de membro">
          {MEMBER_TYPES.map((r) => (
            <button
              key={r}
              type="button"
              role="radio"
              aria-checked={memberType === r}
              onClick={() => setMemberType(r)}
              className={`h-11 rounded-full text-sm font-bold ${
                memberType === r ? 'border-0 bg-navy text-paper' : 'border border-navy/20 bg-paper text-navy'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="pf-school" className={label}>Escola</label>
        <Dropdown
          id="pf-school"
          label="Escola"
          value={school}
          onChange={(v) => {
            setSchool(v);
            setCourse('');
          }}
          options={SCHOOL_OPTIONS}
          placeholder="Escolhe a tua escola"
        />
      </div>

      {courses && (
        <div className="space-y-1.5">
          <label htmlFor="pf-course" className={label}>Curso na {school}</label>
          <Dropdown
            id="pf-course"
            label={`Curso na ${school}`}
            value={course}
            onChange={setCourse}
            options={[{ value: '', label: 'Prefiro não indicar' }, ...courses.map((c) => ({ value: c, label: c }))]}
            placeholder="Escolhe o teu curso (opcional)"
          />
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="pf-bio" className={label}>Bio</label>
        <textarea
          id="pf-bio"
          value={bio}
          maxLength={160}
          rows={3}
          onChange={(e) => setBio(e.target.value)}
          className="w-full resize-none rounded-2xl border border-line bg-sand/60 px-4 py-3 text-base text-navy outline-none placeholder:text-navy-soft focus:border-coral focus:bg-white"
        />
        <p className="m-0 px-1 text-right text-xs text-navy-soft">{bio.length}/160</p>
      </div>

      {error && (
        <p role="alert" className="m-0 flex items-start gap-1.5 text-sm font-semibold text-ruby">
          <Icon name="info" size={16} />
          <span>{error}</span>
        </p>
      )}

      <div className="space-y-2">
        <button type="submit" disabled={busy} className={primary}>
          {busy ? 'A guardar…' : 'Guardar'}
        </button>
        <button type="button" onClick={onCancel} className={secondary}>
          Cancelar
        </button>
      </div>
    </form>
  );
}