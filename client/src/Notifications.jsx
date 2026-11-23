import Icon from './Icon.jsx';

const FMT = { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' };

export default function Notifications({ list, fresh, onOpen }) {
  if (list.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-navy/25 p-6 text-center text-sm text-navy-soft">
        Ainda não tens notificações.
      </div>
    );
  }
  return (
    <ul className="m-0 list-none space-y-2 p-0">
      {list.map((n) => (
        <li key={n.id}>
          <button
            type="button"
            onClick={() => onOpen(n.eventId)}
            className={`flex w-full items-start gap-3 rounded-3xl p-4 text-left ${
              fresh.includes(n.id) ? 'bg-paper ring-1 ring-ruby/40' : 'bg-paper/60'
            }`}
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-navy text-paper">
              <Icon name="user" size={18} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm">
                <strong>{n.actorName}</strong> vai ao teu evento «{n.eventTitle}»
              </span>
              <span className="mt-1 block text-xs text-navy-soft">
                {new Date(n.createdAt).toLocaleString('pt-PT', FMT)}
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}