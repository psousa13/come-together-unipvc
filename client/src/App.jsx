import { useRef, useState } from 'react';
import { Access, Setup } from './Access.jsx';
import { useAuth } from './useAuth.js';
import { api } from './api.js';
import Avatar from './Avatar.jsx';
import Icon from './Icon.jsx';
import Profile from './Profile.jsx';
import ProfileForm from './ProfileForm.jsx';
import Events from './Events.jsx';
import EventPage from './EventPage.jsx';
import CreateEvent from './CreateEvent.jsx';
import Notifications from './Notifications.jsx';
import { useNotifications } from './useNotifications.js';

const NAV = [
  ['Início', 'home'],
  ['Eventos', 'cal'],
  ['Comunidades', 'users'],
  ['Perfil', 'user'],
];

const TODAY = new Date().toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' });
const HEAD = {
  Início: { title: 'Olá, ', sub: `UniPVC · ${TODAY}` },
  Eventos: { title: 'Eventos', sub: 'O que se passa no campus' },
  Comunidades: { title: 'Comunidades', sub: 'Grupos de estudantes, staff e Erasmus' },
  Perfil: { title: 'Perfil', sub: 'A tua conta e atividade' },
};
const SOON = {
  Início: 'O feed de publicações e avaliações chega em breve.',
  Comunidades: 'As comunidades chegam em breve.',
};

function Soon({ text }) {
  return (
    <div className="mx-5 rounded-3xl border border-dashed border-navy/25 p-6 text-center text-sm text-navy-soft lg:mx-8">
      {text}
    </div>
  );
}

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
    <div className="space-y-2">
      <input
        value={q}
        onChange={change}
        placeholder="Procurar pessoas"
        aria-label="Procurar pessoas"
        className="w-full rounded-full border border-line bg-paper px-5 py-3 outline-none"
      />
      <ul className="m-0 list-none space-y-2 p-0">
        {users.map((u) => (
          <li key={u.id}>
            <button
              type="button"
              onClick={() => onOpen(u.username)}
              className="flex w-full items-center gap-3 rounded-3xl bg-paper p-3 text-left"
            >
              <Avatar user={u} size={40} />
              <span className="font-bold">{u.displayName}</span>
              <span className="text-sm text-navy-soft">@{u.username}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Header({ tab, user, unread, onBell }) {
  const head = HEAD[tab];
  return (
    <header className="flex items-end gap-3 px-5 pb-4 pt-[max(env(safe-area-inset-top),2rem)] lg:h-32 lg:px-8 lg:pt-0">
      <div className="min-w-0 flex-1">
        <h1 className="m-0 truncate font-display text-[30px] font-bold leading-none">
          {head.title}
          {tab === 'Início' && <em className="font-medium text-ruby">{user.displayName.split(' ')[0]}</em>}
        </h1>
        <p className="mt-1.5 truncate text-sm text-navy-soft">{head.sub}</p>
      </div>
      <div className="relative shrink-0">
        <button
          type="button"
          onClick={onBell}
          title="Notificações"
          aria-label={unread > 0 ? `Notificações (${unread} por ler)` : 'Notificações'}
          className="hit grid h-10 w-10 place-items-center rounded-full bg-navy text-paper shadow-sm"
        >
          <Icon name="bell" size={18} />
        </button>
        {unread > 0 && (
          <span className="pointer-events-none absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-ruby px-1 text-[11px] font-bold leading-none text-paper">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </div>
    </header>
  );
}

function BackBar({ onBack, title }) {
  return (
    <div className="flex items-center gap-2 px-5 pb-3 pt-[max(env(safe-area-inset-top),2rem)] lg:px-8 lg:pt-10">
      <button
        type="button"
        onClick={onBack}
        aria-label="Voltar"
        className="hit grid h-10 w-10 place-items-center rounded-full bg-navy text-paper"
      >
        <Icon name="back" size={18} />
      </button>
      <h2 className="m-0 font-display text-xl font-bold">{title}</h2>
    </div>
  );
}

export default function App() {
  const { user, loading, logout } = useAuth();
  const [tab, setTab] = useState('Início');
  const [page, setPage] = useState(null);
  const [n, setN] = useState(0);
  const scroller = useRef(null);
  const [fresh, setFresh] = useState([]);
  const notif = useNotifications(user && user.username && user.role !== 'admin' ? user.id : null);

  if (loading) return null;
  if (!user) return <Access />;
  if (user.role === 'admin') {
    return (
      <div className="grid min-h-dvh place-items-center px-5">
        <main className="card">
          <h1>Olá, {user.displayName}</h1>
          <p className="muted">Administração</p>
          <button onClick={logout}>Terminar sessão</button>
        </main>
      </div>
    );
  }
  if (!user.username) return <Setup />;

  const toTop = () => scroller.current?.scrollTo({ top: 0 });
  const go = (k) => {
    setTab(k);
    setPage(null);
    toTop();
  };
  const showPage = (p) => {
    setPage(p);
    setN((x) => x + 1);
    toTop();
  };
  const openUser = (username) => showPage({ t: 'user', username });
  const openEvent = (id) => showPage({ t: 'event', id });
  const openBell = () => {
    setFresh(notif.list.filter((x) => !x.read).map((x) => x.id));
    notif.markAllRead();
    showPage({ t: 'notifications' });
  };
  const ownProfile = () => {
    setTab('Perfil');
    setN((x) => x + 1);
    showPage(null);
  };
  const back = () => showPage(null);

  let content;
  if (page?.t === 'edit') {
    content = (
      <>
        <BackBar onBack={ownProfile} title="Editar perfil" />
        <div className="legacy px-5 lg:px-8">
          <ProfileForm mode="edit" onDone={ownProfile} onCancel={ownProfile} />
        </div>
      </>
    );
  } else if (page?.t === 'find') {
    content = (
      <>
        <BackBar onBack={back} title="Encontrar pessoas" />
        <div className="px-5 lg:px-8">
          <UserSearch onOpen={openUser} />
        </div>
      </>
    );
  } else if (page?.t === 'user') {
    content = (
      <>
        <BackBar onBack={back} title="Perfil" />
        <div className="legacy px-5 lg:px-8">
          <Profile
            key={n}
            username={page.username}
            onEdit={() => showPage({ t: 'edit' })}
            onOpen={openUser}
          />
        </div>
      </>
    );
  } else if (page?.t === 'notifications') {
    content = (
      <>
        <BackBar onBack={back} title="Notificações" />
        <div className="px-5 lg:px-8">
          <Notifications list={notif.list} fresh={fresh} onOpen={openEvent} />
        </div>
      </>
    );
  } else if (page?.t === 'event') {
    content = (
      <>
        <BackBar onBack={back} title="Evento" />
        <div className="px-5 lg:px-8">
          <EventPage key={page.id} id={page.id} />
        </div>
      </>
    );
  } else if (page?.t === 'create') {
    content = (
      <>
        <BackBar onBack={back} title="Criar evento" />
        <div className="px-5 lg:px-8">
          <CreateEvent onDone={openEvent} />
        </div>
      </>
    );
  } else {
    content = (
      <>
        <Header tab={tab} user={user} unread={notif.unread} onBell={openBell} />
        {tab === 'Perfil' ? (
          <div className="legacy space-y-4 px-5 lg:px-8">
            <Profile
              key={n}
              username={user.username}
              onEdit={() => showPage({ t: 'edit' })}
              onOpen={openUser}
            />
            <div className="flex gap-2">
              <button type="button" onClick={() => showPage({ t: 'find' })}>
                Encontrar pessoas
              </button>
              <button type="button" onClick={logout}>
                Terminar sessão
              </button>
            </div>
          </div>
        ) : tab === 'Eventos' ? (
          <Events onOpen={openEvent} onCreate={() => showPage({ t: 'create' })} />
        ) : (
          <Soon text={SOON[tab]} />
        )}
      </>
    );
  }

  const eventPage = page?.t === 'event' || page?.t === 'create';

  return (
    <div className="relative mx-auto flex h-dvh max-w-[480px] flex-col bg-sand lg:max-w-[1280px] lg:flex-row">
      <div
        ref={scroller}
        className="app-content no-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-hidden lg:mx-auto lg:max-w-[920px]"
      >
        <div className="rise" key={`${tab}-${page?.t ?? ''}-${page?.username ?? page?.id ?? ''}`}>
          {content}
        </div>
      </div>
      <nav
        aria-label="Navegação principal"
        className="floating-nav absolute inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+1rem)] z-50 grid grid-cols-4 rounded-full p-2 lg:static lg:order-first lg:m-6 lg:mr-0 lg:mt-10 lg:w-60 lg:shrink-0 lg:grid-cols-1 lg:self-start lg:rounded-3xl"
      >
        {NAV.map(([label, icon]) => {
          const active = tab === label && (!page || (eventPage && label === 'Eventos'));
          return (
            <button
              key={label}
              type="button"
              onClick={() => go(label)}
              aria-current={active ? 'page' : undefined}
              className={`flex h-[52px] min-w-0 flex-col items-center justify-center gap-0.5 rounded-full border-0 text-[10px] font-semibold outline-none lg:flex-row lg:justify-start lg:gap-3 lg:px-5 lg:text-sm ${
                active ? 'bg-paper/15 text-gold' : 'bg-transparent text-paper'
              }`}
            >
              <Icon name={icon} size={21} />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}