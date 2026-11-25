import { useState } from 'react';
import { useAuth } from './useAuth.js';
import { api } from './api.js';

const ITEMS = [
  {
    k: 'going',
    label: 'Alguém vai ao meu evento',
    hint: 'Recebes um aviso quando alguém marca «Eu vou» num evento teu.',
  },
  {
    k: 'reminders',
    label: 'Lembretes de eventos',
    hint: 'Aviso cerca de 1 hora antes dos eventos a que vais.',
  },
];

function Switch({ on, onChange, label, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className="grid h-11 w-14 shrink-0 place-items-center disabled:opacity-50"
    >
      <span className={`relative block h-7 w-12 rounded-full transition-colors ${on ? 'bg-coral-deep' : 'bg-navy/25'}`}>
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
            on ? 'left-6' : 'left-1'
          }`}
        />
      </span>
    </button>
  );
}

export default function NotificationSettings() {
  const { user, updateUser, getToken } = useAuth();
  const [saving, setSaving] = useState(null);
  const [error, setError] = useState('');
  const prefs = user.notificationPrefs ?? { going: true, reminders: true };

  async function change(key, value) {
    setError('');
    setSaving(key);
    try {
      const data = await api('/users/me', {
        method: 'PATCH',
        token: getToken(),
        body: { notificationPrefs: { [key]: value } },
      });
      updateUser(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-4 pb-4">
      <section className="space-y-2">
        <h2 className="px-1 text-xs font-bold uppercase tracking-wider text-navy-soft">Tipos</h2>
        <div className="divide-y divide-line overflow-hidden rounded-3xl bg-paper">
          {ITEMS.map((item) => (
            <div key={item.k} className="flex min-h-14 items-center gap-2 py-1 pl-3">
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold">{item.label}</span>
                <span className="block text-xs text-navy-soft">{item.hint}</span>
              </span>
              <Switch
                on={prefs[item.k] !== false}
                onChange={(v) => change(item.k, v)}
                label={item.label}
                disabled={saving === item.k}
              />
            </div>
          ))}
        </div>
      </section>
      {error && (
        <p role="alert" className="px-1 text-sm text-ruby">
          {error}
        </p>
      )}
    </div>
  );
}