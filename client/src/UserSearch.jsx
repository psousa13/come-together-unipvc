import { useRef, useState } from 'react';
import { api } from './api.js';
import { useAuth } from './useAuth.js';
import Avatar from './Avatar.jsx';
import Icon from './Icon.jsx';
import Notice from './Notice.jsx';
import { field } from './ui.js';

export default function UserSearch({ onOpen }) {
  const { getToken } = useAuth();
  const [q, setQ] = useState('');
  const [users, setUsers] = useState([]);
  const [status, setStatus] = useState('idle');
  const timer = useRef(null);
  const seq = useRef(0);

  function change(e) {
    const value = e.target.value;
    const term = value.trim();
    setQ(value);
    clearTimeout(timer.current);
    seq.current += 1;
    const mine = seq.current;
    if (term.length < 2) {
      setUsers([]);
      setStatus('idle');
      return;
    }
    setStatus('loading');
    timer.current = setTimeout(async () => {
      try {
        const data = await api(`/users?q=${encodeURIComponent(term)}`, { token: getToken() });
        if (mine !== seq.current) return;
        setUsers(data.users);
        setStatus('done');
      } catch {
        if (mine !== seq.current) return;
        setUsers([]);
        setStatus('error');
      }
    }, 300);
  }

  return (
    <div className="space-y-3 pb-4">
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-navy-soft">
          <Icon name="search" size={18} />
        </span>
        <input
          value={q}
          onChange={change}
          placeholder="Nome ou @username"
          aria-label="Procurar pessoas"
          inputMode="search"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          autoFocus
          className={`${field} pl-11`}
        />
      </div>

      <div aria-live="polite" className="space-y-2">
        {status === 'idle' && (
          <p className="m-0 px-1 text-xs text-navy-soft">Escreve pelo menos 2 caracteres.</p>
        )}
        {status === 'loading' && (
          <div aria-hidden="true" className="space-y-2">
            <div className="h-[68px] animate-pulse rounded-3xl bg-paper" />
            <div className="h-[68px] animate-pulse rounded-3xl bg-paper" />
          </div>
        )}
        {status === 'error' && (
          <Notice icon="info" title="Não foi possível pesquisar" text="Verifica a ligação e tenta outra vez." />
        )}
        {status === 'done' && users.length === 0 && (
          <Notice icon="search" title="Ninguém encontrado" text="Experimenta outro nome ou username." />
        )}
        {status === 'done' && users.length > 0 && (
          <ul className="m-0 list-none space-y-2 p-0">
            {users.map((u) => (
              <li key={u.id}>
                <button
                  type="button"
                  onClick={() => onOpen(u.username)}
                  className="flex w-full items-center gap-3 rounded-3xl bg-paper p-3 text-left transition active:scale-[0.98]"
                >
                  <Avatar user={u} size={44} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold">{u.displayName}</span>
                    <span className="block truncate text-sm text-navy-soft">
                      @{u.username}
                      {u.school ? ` · ${u.school}` : ''}
                    </span>
                  </span>
                  <span className="text-navy-soft">
                    <Icon name="chev" size={18} />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}