import Avatar from './Avatar.jsx';
import Icon from './Icon.jsx';
import { useAuth } from './useAuth.js';

function Group({ title, children }) {
  return (
    <section className="space-y-2">
      <h2 className="px-1 text-xs font-bold uppercase tracking-wider text-navy-soft">{title}</h2>
      <div className="divide-y divide-line overflow-hidden rounded-3xl bg-paper">{children}</div>
    </section>
  );
}

function Row({ icon, title, sub, onClick, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-14 w-full items-center gap-3 px-3 py-2 text-left ${danger ? 'text-ruby' : ''}`}
    >
      <span
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${
          danger ? 'bg-ruby/10' : 'bg-sand text-coral-deep'
        }`}
      >
        <Icon name={icon} size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold">{title}</span>
        {sub && <span className="block truncate text-xs text-navy-soft">{sub}</span>}
      </span>
      {!danger && <Icon name="chev" size={16} />}
    </button>
  );
}

export default function Settings({ onEdit, onNotifications }) {
  const { user, logout } = useAuth();
  return (
    <div className="space-y-4 pb-4">
      <button
        type="button"
        onClick={onEdit}
        className="flex w-full items-center gap-3 rounded-3xl bg-paper p-3 text-left"
      >
        <Avatar user={user} size={48} />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-bold">{user.displayName}</span>
          <span className="block truncate text-xs text-navy-soft">
            @{user.username} · {user.email}
          </span>
        </span>
        <Icon name="chev" size={16} />
      </button>

      <Group title="Conta">
        <Row icon="bell" title="Notificações" sub="O que queres receber" onClick={onNotifications} />
      </Group>

      <Group title="Sobre">
        <div className="flex min-h-14 items-center gap-3 px-3 py-2 text-sm">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sand text-coral-deep">
            <Icon name="info" size={18} />
          </span>
          <span>Come Together: UniPVC. Só para estudantes, staff e Erasmus com email institucional.</span>
        </div>
        <Row icon="logout" title="Terminar sessão" danger onClick={logout} />
      </Group>
    </div>
  );
}