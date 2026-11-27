import { useState } from 'react';
import { api } from './api.js';
import { useAuth } from './useAuth.js';
import Icon from './Icon.jsx';
import { cleanName } from './communities.js';
import { field, label, primary } from './ui.js';

const PRIVACY = [
  [false, 'Pública', 'Qualquer pessoa pode entrar.'],
  [true, 'Privada', 'Os pedidos para entrar têm de ser aprovados.'],
];

export function CommunityForm({ initial, submitText, busyText, onSubmit }) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [isPrivate, setIsPrivate] = useState(initial?.isPrivate ?? false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(ev) {
    ev.preventDefault();
    const n = cleanName(name);
    if (n.length < 3) {
      setError('O nome precisa de pelo menos 3 caracteres.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      await onSubmit({ name: n, description: description.trim(), isPrivate });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5 pb-4">
      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between">
          <label htmlFor="cc-name" className={label}>Nome</label>
          <span className="px-1 text-[11px] text-navy-soft">{name.length}/40</span>
        </div>
        <input
          id="cc-name"
          value={name}
          maxLength={40}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex.: Clube de Fotografia"
          className={field}
        />
      </div>
      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between">
          <label htmlFor="cc-desc" className={label}>Descrição (opcional)</label>
          <span className="px-1 text-[11px] text-navy-soft">{description.length}/80</span>
        </div>
        <input
          id="cc-desc"
          value={description}
          maxLength={80}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Em poucas palavras, sobre o que é?"
          className={field}
        />
      </div>
      <div className="space-y-1.5">
        <p className={`${label} m-0`}>Quem pode entrar</p>
        <div className="grid grid-cols-2 gap-2">
          {PRIVACY.map(([value, title, text]) => (
            <button
              key={title}
              type="button"
              aria-pressed={isPrivate === value}
              onClick={() => setIsPrivate(value)}
              className={`rounded-2xl border p-3 text-left ${
                isPrivate === value ? 'border-coral-deep bg-white ring-2 ring-coral-deep' : 'border-line bg-sand/60'
              }`}
            >
              <span className="flex items-center gap-1.5 text-sm font-bold">
                {isPrivate === value && <Icon name="check" size={14} />}
                {title}
              </span>
              <span className="mt-1 block text-xs text-navy-soft">{text}</span>
            </button>
          ))}
        </div>
        {initial?.isPrivate && !isPrivate && (
          <p className="m-0 px-1 text-xs text-navy-soft">Ao tornar a comunidade pública, os pedidos pendentes são aceites.</p>
        )}
      </div>
      {error && (
        <p role="alert" className="m-0 text-sm font-semibold text-ruby">
          {error}
        </p>
      )}
      <button type="submit" disabled={busy} className={primary}>
        {busy ? busyText : submitText}
      </button>
    </form>
  );
}

export default function CreateCommunity({ onDone }) {
  const { getToken } = useAuth();
  const [token] = useState(getToken);

  async function create(body) {
    const d = await api('/communities', { method: 'POST', body, token });
    onDone(d.community.id);
  }

  return (
    <div className="space-y-5">
      <p className="m-0 text-sm text-navy-soft">Ficas como administrador da comunidade.</p>
      <CommunityForm submitText="Criar comunidade" busyText="A criar…" onSubmit={create} />
    </div>
  );
}
