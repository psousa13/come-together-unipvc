import Icon from './Icon.jsx';
import Notice from './Notice.jsx';

const FMT = { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' };

export default function Notifications({ list, fresh, onOpen }) {
  if (list.length === 0) {
    return (
      <Notice
        icon="bell"
        title="Sem notificações"
        text="Aqui aparecem os avisos de quem vai aos teus eventos e os lembretes dos eventos a que vais."
      />
    );
  }
  return (
    <ul className="m-0 list-none space-y-2 p-0">
      {list.map((n) => {
        const isNew = fresh.includes(n.id);
        const reminder = n.type === 'reminder';
        return (
          <li key={n.id}>
            <button
              type="button"
              onClick={() => onOpen(n.eventId)}
              className={`lift flex w-full items-start gap-3 rounded-3xl p-4 text-left ${
                isNew ? 'bg-paper ring-1 ring-ruby/40' : 'bg-paper/60'
              }`}
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-navy text-paper">
                <Icon name={reminder ? 'bell' : 'user'} size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm">
                  {reminder ? (
                    <>
                      O evento «{n.eventTitle}» começa em breve
                    </>
                  ) : (
                    <>
                      <strong>{n.actorName}</strong> vai ao teu evento «{n.eventTitle}»
                    </>
                  )}
                </span>
                <span className="mt-1 block text-xs text-navy-soft">
                  {reminder && n.eventStartsAt
                    ? `Começa a ${new Date(n.eventStartsAt).toLocaleString('pt-PT', FMT)}`
                    : new Date(n.createdAt).toLocaleString('pt-PT', FMT)}
                </span>
              </span>
              {isNew && <span role="img" aria-label="Nova" className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-ruby" />}
            </button>
          </li>
        );
      })}
    </ul>
  );
}