import { useRef, useState } from 'react';
import { Access, Setup } from './Access.jsx';
import { useAuth } from './useAuth.js';
import Icon from './Icon.jsx';
import UserSearch from './UserSearch.jsx';
import Profile from './Profile.jsx';
import ProfileForm from './ProfileForm.jsx';
import Settings from './Settings.jsx';
import NotificationSettings from './NotificationSettings.jsx';
import Events from './Events.jsx';
import EventPage from './EventPage.jsx';
import CreateEvent from './CreateEvent.jsx';
import Notifications from './Notifications.jsx';
import Admin from './Admin.jsx';
import PullToRefresh from './PullToRefresh.jsx';
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
  Início: { icon: 'home', text: 'O feed de publicações e avaliações chega em breve.' },
  Comunidades: { icon: 'users', text: 'As comunidades chegam em breve.' },
};
const PROFILE_PAGES = ['edit', 'find', 'settings', 'notifsettings'];
const order = NAV.map(([label]) => label);
const SLIDE_MS = 440;

function Soon({ icon, text }) {
  return (
    <div className="mx-5 flex flex-col items-center gap-2 rounded-3xl bg-paper/60 px-6 py-10 text-center lg:mx-8">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-navy text-paper">
        <Icon name={icon} size={22} />
      </span>
      <h2 className="m-0 font-display text-xl font-bold">Em breve</h2>
      <p className="m-0 max-w-xs text-sm text-navy-soft">{text}</p>
    </div>
  );
}

function Header({ tab, user, unread, onBell, onSettings, onCreate }) {
  const head = HEAD[tab];
  return (
    <header className="flex items-end gap-3 px-5 pb-3 pt-[calc(env(safe-area-inset-top)+2rem)] lg:h-32 lg:px-8 lg:pt-0">
      <div className="min-w-0 flex-1">
        <h1 className="m-0 truncate font-display text-[30px] font-bold leading-none">
          {head.title}
          {tab === 'Início' && <em className="font-medium text-ruby">{user.displayName.split(' ')[0]}</em>}
        </h1>
        <p className="mt-1.5 truncate text-sm text-navy-soft">{head.sub}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {tab === 'Eventos' && (
          <button
            type="button"
            onClick={onCreate}
            aria-label="Criar evento"
            className="hit flex h-10 items-center gap-1.5 rounded-full bg-coral-deep px-4 text-sm font-bold text-white shadow-sm"
          >
            <Icon name="plus" size={16} /> Criar
          </button>
        )}
        {tab === 'Perfil' && (
          <button
            type="button"
            onClick={onSettings}
            title="Definições"
            aria-label="Definições"
            className="hit grid h-10 w-10 place-items-center rounded-full bg-paper shadow-sm"
          >
            <Icon name="gear" size={20} />
          </button>
        )}
        <div className="relative">
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
      </div>
    </header>
  );
}

function BackBar({ onBack, title }) {
  return (
    <div className="flex items-center gap-2 px-5 pb-3 pt-[calc(env(safe-area-inset-top)+2rem)] lg:px-8 lg:pt-10">
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
  const { user, loading } = useAuth();
  const [tab, setTab] = useState('Início');
  const [stack, setStack] = useState([]);
  const [trans, setTrans] = useState(null);
  const [ticks, setTicks] = useState({});
  const [fresh, setFresh] = useState([]);
  const scroller = useRef(null);
  const seq = useRef(0);
  const lock = useRef(false);
  const notif = useNotifications(user && user.username && user.role !== 'admin' ? user.id : null);

  if (loading) return null;
  if (!user) return <Access />;
  if (user.role === 'admin') return <Admin />;
  if (!user.username) return <Setup />;

  const top = stack[stack.length - 1] ?? null;
  const page = trans?.kind === 'tab' ? null : top;
  const layer = page ? `p${page.k}` : tab;
  const toTop = () => scroller.current?.scrollTo({ top: 0, behavior: 'smooth' });
  const bump = (k) => setTicks((t) => ({ ...t, [k]: (t[k] ?? 0) + 1 }));

  const run = (t, after) => {
    lock.current = true;
    setTrans(t);
    const ms = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : SLIDE_MS;
    setTimeout(() => {
      after();
      setTrans(null);
      lock.current = false;
    }, ms);
  };

  const go = (k) => {
    if (lock.current) return;
    if (k === tab && !page) {
      toTop();
      return;
    }
    if (k === tab) {
      const leaving = page;
      setStack([leaving]);
      run({ kind: 'pop', key: `p${leaving.k}` }, () => setStack([]));
      return;
    }
    const dir = order.indexOf(k) > order.indexOf(tab) ? 'fwd' : 'back';
    setTab(k);
    run({ kind: 'tab', from: layer, to: k, dir }, () => setStack([]));
  };
  const showPage = (p) => {
    if (lock.current) return;
    const entry = { ...p, k: ++seq.current };
    setStack((s) => [...s, entry]);
    run({ kind: 'push', key: `p${entry.k}` }, () => {});
  };
  const replacePage = (p) => {
    if (lock.current || !top) return;
    const old = top;
    const entry = { ...p, k: ++seq.current };
    setStack((s) => [...s, entry]);
    run({ kind: 'push', key: `p${entry.k}` }, () => setStack((s) => s.filter((x) => x.k !== old.k)));
  };
  const back = () => {
    if (lock.current || !page) return;
    const leaving = page;
    run({ kind: 'pop', key: `p${leaving.k}` }, () => {
      setStack((s) => s.filter((x) => x.k !== leaving.k));
      if (leaving.t === 'edit') bump('Perfil');
    });
  };
  const openUser = (username) => showPage({ t: 'user', username });
  const openEvent = (id) => showPage({ t: 'event', id });
  const openBell = () => {
    setFresh(notif.list.filter((x) => !x.read).map((x) => x.id));
    notif.markAllRead();
    showPage({ t: 'notifications' });
  };

  const tabView = (k) => (
    <>
      <Header
        tab={k}
        user={user}
        unread={notif.unread}
        onBell={openBell}
        onSettings={() => showPage({ t: 'settings' })}
        onCreate={() => showPage({ t: 'create' })}
      />
      {k === 'Perfil' ? (
        <div className="px-5 lg:px-8">
          <Profile
            username={user.username}
            reload={ticks.Perfil ?? 0}
            onOpen={openUser}
            onFind={() => showPage({ t: 'find' })}
          />
        </div>
      ) : k === 'Eventos' ? (
        <Events onOpen={openEvent} reload={ticks.Eventos ?? 0} />
      ) : (
        <Soon {...SOON[k]} />
      )}
    </>
  );

  const pageView = (p) => {
    const rl = ticks[`p${p.k}`] ?? 0;
    if (p.t === 'edit') {
      return (
        <>
          <BackBar onBack={back} title="Editar perfil" />
          <div className="px-5 lg:px-8">
            <ProfileForm onDone={() => back()} onCancel={back} />
          </div>
        </>
      );
    }
    if (p.t === 'settings') {
      return (
        <>
          <BackBar onBack={back} title="Definições" />
          <div className="px-5 lg:px-8">
            <Settings
              onEdit={() => showPage({ t: 'edit' })}
              onNotifications={() => showPage({ t: 'notifsettings' })}
            />
          </div>
        </>
      );
    }
    if (p.t === 'notifsettings') {
      return (
        <>
          <BackBar onBack={back} title="Notificações" />
          <div className="px-5 lg:px-8">
            <NotificationSettings />
          </div>
        </>
      );
    }
    if (p.t === 'find') {
      return (
        <>
          <BackBar onBack={back} title="Encontrar pessoas" />
          <div className="px-5 lg:px-8">
            <UserSearch onOpen={openUser} />
          </div>
        </>
      );
    }
    if (p.t === 'user') {
      return (
        <>
          <BackBar onBack={back} title="Perfil" />
          <div className="px-5 lg:px-8">
            <Profile
              username={p.username}
              reload={rl}
              onOpen={openUser}
              onFind={() => showPage({ t: 'find' })}
              onChange={() => bump('Perfil')}
            />
          </div>
        </>
      );
    }
    if (p.t === 'notifications') {
      return (
        <>
          <BackBar onBack={back} title="Notificações" />
          <div className="px-5 lg:px-8">
            <Notifications list={notif.list} fresh={fresh} onOpen={openEvent} />
          </div>
        </>
      );
    }
    if (p.t === 'event') {
      return <EventPage id={p.id} reload={rl} onBack={back} onUser={openUser} />;
    }
    if (p.t === 'create') {
      return (
        <>
          <BackBar onBack={back} title="Criar evento" />
          <div className="px-5 lg:px-8">
            <CreateEvent onDone={(id) => replacePage({ t: 'event', id })} />
          </div>
        </>
      );
    }
    return null;
  };

  const isUp = (key) => stack.some((x) => `p${x.k}` === key && x.t === 'event');
  const underOf = (key) => {
    const i = stack.findIndex((x) => `p${x.k}` === key);
    return i > 0 ? `p${stack[i - 1].k}` : tab;
  };
  const layerState = (key) => {
    let show = key === tab || key === layer;
    let cls = '';
    if (trans?.kind === 'tab') {
      show = key === trans.from || key === trans.to;
      if (key === trans.to) cls = `tab-in-${trans.dir}`;
      else if (key === trans.from) cls = `tab-out-${trans.dir}`;
    } else if (trans) {
      show = key === trans.key || key === underOf(trans.key);
      if (key === trans.key) cls = (trans.kind === 'push' ? 'over-in' : 'over-out') + (isUp(key) ? '-up' : '');
    }
    const dim = show && key !== layer && trans?.kind !== 'tab' && trans?.kind !== 'pop'; return { hidden: !show, cls, dim };
  };
  const attach = (key) => (el) => {
    if (el && key === layer) scroller.current = el;
  };
  const wrap = (key, children) => {
    const s = layerState(key);
    return (
      <div
        key={key}
        ref={attach(key)}
        data-hidden={s.hidden}
        inert={s.hidden || key !== layer}
        className={`layer app-content no-scrollbar ${/^p\d+$/.test(key) ? 'sheet-layer' : ''} ${s.dim ? 'dim' : ''} ${isUp(key) ? 'sheet-up' : ''} ${s.cls}`}
      >
        <div className="mx-auto w-full max-w-[480px] lg:max-w-[1280px] lg:pl-[16.5rem]"><div className="lg:mx-auto lg:max-w-[920px]">{children}</div></div>
      </div>
    );
  };

  const eventPage = page?.t === 'event' || page?.t === 'create';
  const profilePage = PROFILE_PAGES.includes(page?.t);
  const formPage = page?.t === 'create' || page?.t === 'edit';
  const canRefresh = page ? page.t === 'event' || page.t === 'user' : tab === 'Eventos' || tab === 'Perfil';

  return (
    <div className="app-shell relative mx-auto flex h-dvh max-w-[480px] flex-col lg:max-w-[1280px] lg:flex-row">
      <div className="min-h-0 flex-1">
        {NAV.map(([label]) => wrap(label, tabView(label)))}
        {stack.map((p) => wrap(`p${p.k}`, pageView(p)))}
      </div>
      <PullToRefresh key={layer} scrollRef={scroller} enabled={canRefresh} onRefresh={() => bump(layer)} />
      <nav
        aria-label="Navegação principal"
        className={`floating-nav absolute inset-x-3 bottom-[max(calc(env(safe-area-inset-bottom)_-_0.5rem),0.5rem)] z-50 grid-cols-4 rounded-full p-1.5 lg:static lg:order-first lg:m-6 lg:mr-0 lg:mt-10 lg:w-60 lg:shrink-0 lg:grid-cols-1 lg:self-start lg:rounded-3xl ${formPage ? 'hidden lg:grid' : 'grid'}`}
      >
        {NAV.map(([label, icon]) => {
          const active =
            tab === label &&
            (!page || (eventPage && label === 'Eventos') || (profilePage && label === 'Perfil'));
          return (
            <button
              key={label}
              type="button"
              onClick={() => go(label)}
              aria-current={active ? 'page' : undefined}
              className={`flex h-12 min-w-0 flex-col items-center justify-center gap-0.5 rounded-full border-0 text-[10px] font-semibold outline-none lg:flex-row lg:justify-start lg:gap-3 lg:px-5 lg:text-sm ${
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