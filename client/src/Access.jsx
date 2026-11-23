import { useEffect, useRef, useState } from 'react';
import { api } from './api.js';
import { useAuth } from './useAuth.js';
import Avatar from './Avatar.jsx';
import Dropdown from './Dropdown.jsx';
import Icon from './Icon.jsx';
import { resizeImage } from './image.js';
import { COURSES, MEMBER_TYPES, SCHOOLS, SCHOOL_NAMES } from './schools.js';
import { buzz, field, label, primary } from './ui.js';
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HANDLE = /^[a-z0-9._]{3,20}$/;
const ORDER = ['splash', 'login', 'code'];

const errorText = (err) =>
  err.status
    ? err.message
    : 'Sem ligação ao servidor. Se estava a dormir, tenta outra vez dentro de um minuto.';

function Mark({ size = 44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="18" cy="24" r="13" fill="none" stroke="#e2a923" strokeWidth="3" />
      <circle cx="30" cy="24" r="13" fill="none" stroke="#7f9fdb" strokeWidth="3" />
    </svg>
  );
}

function Screen({ step, onBack, footer, children }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-[480px] lg:max-w-[640px] flex-col bg-sand pt-[calc(max(env(safe-area-inset-top),3.25rem)+0.75rem)]">
      <div className="flex items-center gap-3 px-5">
        <button
          type="button"
          onClick={onBack}
          aria-label="Voltar"
          className="grid h-11 w-11 place-items-center rounded-full bg-paper shadow-sm transition-transform duration-100 active:scale-90"
        >
          <Icon name="back" size={22} />
        </button>
        {step && (
          <div className="flex flex-1 items-center gap-2" role="img" aria-label={`Passo ${step} de 3`}>
            {[1, 2, 3].map((i) => (
              <span key={i} className="h-1.5 flex-1 overflow-hidden rounded-full bg-navy/15">
                <span
                  className="block h-full origin-left rounded-full bg-navy transition-transform duration-500 ease-[cubic-bezier(.2,.8,.2,1)]"
                  style={{ transform: `scaleX(${i <= step ? 1 : 0})` }}
                />
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="mt-6 flex flex-1 flex-col px-5 pb-6">{children}</div>
      {footer && (
        <div className="glass-bar sticky bottom-0 z-10 px-5 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3">
          {footer}
        </div>
      )}
    </div>
  );
}

function Splash({ onStart }) {
  const delay = (ms) => ({ animationDelay: `${ms}ms`, animationFillMode: 'backwards' });
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-navy text-paper">
      <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col justify-between px-5 pb-8 pt-[calc(max(env(safe-area-inset-top),3.25rem)+0.75rem)] lg:my-auto lg:grid lg:max-w-[1120px] lg:flex-none lg:grid-cols-[1.25fr_1fr] lg:items-end lg:gap-x-20 lg:gap-y-10 lg:px-10 lg:py-16">
        <div className="relative flex items-center gap-2 lg:col-span-2">
          <Mark />
          <span className="text-sm font-bold uppercase tracking-[0.2em] text-gold">UniPVC</span>
        </div>
        <p
          className="rise relative self-end text-right text-xs font-bold uppercase tracking-[0.2em] text-sky lg:col-start-2 lg:row-start-2 lg:self-start lg:text-left lg:text-sm"
          style={delay(80)}
        >
          Estudantes<br />Staff<br />Erasmus
        </p>
        <h1
          className="rise relative font-display text-[72px] font-bold leading-[0.9] tracking-[-0.035em] lg:col-start-1 lg:row-span-3 lg:row-start-2 lg:text-[148px]"
          style={delay(160)}
        >
          Come <em className="block font-medium text-gold">Together</em>
        </h1>
        <p
          className="rise relative max-w-[250px] self-end text-right text-base leading-snug text-sand-deep lg:col-start-2 lg:row-start-3 lg:max-w-[420px] lg:self-start lg:text-left lg:text-xl"
          style={delay(240)}
        >
          Eventos e comunidades do teu campus, num só lugar. Uma app fechada, só para quem faz parte da UniPVC.
        </p>
        <button
          type="button"
          onClick={onStart}
          className="glass-btn rise relative flex h-14 w-full items-center justify-center gap-2 rounded-full text-[15px] font-bold text-paper transition-transform duration-100 active:scale-[0.97] lg:col-start-2 lg:row-start-4 lg:max-w-[380px]"
          style={delay(320)}
        >
          <Icon name="mail" size={20} /> Entrar com email institucional
        </button>
      </div>
    </div>
  );
}
function Msg({ id, error, hint }) {
  return (
    <p
      id={id}
      role={error ? 'alert' : undefined}
      className={`flex items-start gap-1.5 px-1 text-sm ${error ? 'font-semibold text-ruby' : 'text-navy-soft'}`}
    >
      {error ? (
        <>
          <Icon name="info" size={16} />
          <span>{error}</span>
        </>
      ) : (
        hint
      )}
    </p>
  );
}
function Login({ email, setEmail, onBack, onCode }) {
  const { login } = useAuth();
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const [pwError, setPwError] = useState('');
  const [busy, setBusy] = useState(false);
  const adminMode = email.trim() === 'admin';

  async function submit(e) {
    e.preventDefault();
    const value = email.trim();

    if (!adminMode && !EMAIL.test(value)) {
      buzz([30, 40, 30]);
      setError('Introduz um email válido.');
      return;
    }

    setBusy(true);
    try {
      if (adminMode) {
        const data = await api('/auth/admin-login', {
          method: 'POST',
          body: { password: pw },
        });
        login(data.token, data.user);
        return;
      }

      await api('/auth/request-code', {
        method: 'POST',
        body: { email: value },
      });
      onCode();
    } catch (err) {
      buzz([30, 40, 30]);
      if (adminMode) setPwError(errorText(err));
      else setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen
      step={1}
      onBack={onBack}
      footer={
        <button
          type="submit"
          form="login-form"
          disabled={busy || !email.trim() || (adminMode && !pw)}
          className={primary}
        >
          {busy ? 'A enviar…' : adminMode ? 'Entrar' : 'Enviar código'}
        </button>
      }
    >
      <h1 className="m-0 font-display text-[30px] font-bold leading-tight">
        Entra com o teu email institucional
      </h1>
      <p className="mt-2 text-[15px] leading-snug text-navy-soft">
        Enviamos-te um código de 6 dígitos para confirmar que fazes parte da UniPVC.
      </p>

      <form id="login-form" onSubmit={submit} className="mt-6 space-y-3" noValidate>
        <div key={error} className={`space-y-1.5 ${error ? 'shake' : ''}`}>
          <label htmlFor="em" className={label}>Email institucional</label>
          <input
            id="em"
            type="text"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            autoFocus
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError('');
            }}
            placeholder="nome.apelido@ipvc.pt"
            aria-invalid={!!error}
            aria-describedby="em-msg"
            className={`${field} ${error ? 'border-ruby' : ''}`}
          />
          <Msg
            id="em-msg"
            error={error}
            hint="Usa o email da escola, que termina em @ipvc.pt."
          />
        </div>

        {adminMode && (
          <div key={pwError} className={`space-y-1.5 ${pwError ? 'shake' : ''}`}>
            <label htmlFor="pw" className={label}>Palavra-passe</label>
            <input
              id="pw"
              type="password"
              autoComplete="current-password"
              value={pw}
              onChange={(e) => {
                setPw(e.target.value);
                setPwError('');
              }}
              aria-invalid={!!pwError}
              aria-describedby="pw-msg"
              className={`${field} ${pwError ? 'border-ruby' : ''}`}
            />
            <Msg id="pw-msg" error={pwError} hint="Acesso de administração." />
          </div>
        )}
      </form>

      {error && (
        <p className="mt-4 rounded-2xl bg-paper p-3 text-sm text-navy-soft">
          A Come Together é uma app fechada. Se és estudante, docente, staff ou Erasmus da UniPVC e ainda não tens email institucional, fala com os Serviços Académicos.
        </p>
      )}
    </Screen>
  );
}

function Code({ email, onBack }) {
  const { login } = useAuth();
  const [digits, setDigits] = useState(Array(6).fill(''));
  const [secs, setSecs] = useState(30);
  const [sent, setSent] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const refs = useRef([]);
  const code = digits.join('');

  useEffect(() => {
    if (secs <= 0) return;
    const t = window.setTimeout(() => setSecs((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secs]);

  async function verify(value) {
    setChecking(true);
    setError('');
    buzz(12);

    try {
      const data = await api('/auth/verify-code', {
        method: 'POST',
        body: { email, code: value },
      });
      login(data.token, data.user);
    } catch (err) {
      buzz([30, 40, 30]);
      setError(errorText(err));
      setDigits(Array(6).fill(''));
      refs.current[0]?.focus();
    } finally {
      setChecking(false);
    }
  }

  function put(i, v) {
    const d = v.replace(/\D/g, '');
    if (!d || checking) return;

    const next = [...digits];
    d.split('')
      .slice(0, 6 - i)
      .forEach((c, k) => {
        next[i + k] = c;
      });

    setDigits(next);
    setError('');
    refs.current[Math.min(i + d.length, 5)]?.focus();

    if (next.every(Boolean)) verify(next.join(''));
  }

  async function resend() {
    setSecs(30);
    setSent(true);
    setError('');

    try {
      await api('/auth/request-code', {
        method: 'POST',
        body: { email },
      });
    } catch (err) {
      setSent(false);
      setError(errorText(err));
    }
  }

  return (
    <Screen
      step={2}
      onBack={onBack}
      footer={
        <button
          type="button"
          disabled={code.length !== 6 || checking}
          onClick={() => verify(code)}
          className={primary}
        >
          {checking ? 'A verificar…' : 'Confirmar'}
        </button>
      }
    >
      <h1 className="m-0 font-display text-[30px] font-bold leading-tight">
        Introduz o código
      </h1>
      <p className="mt-2 text-[15px] leading-snug text-navy-soft">
        Enviámos um código de 6 dígitos para <b className="text-navy">{email}</b>.
      </p>

      <div
        key={error}
        className={`mt-6 flex justify-between gap-2 ${error ? 'shake' : ''}`}
        role="group"
        aria-label="Código de 6 dígitos"
      >
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            value={d}
            inputMode="numeric"
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            autoFocus={i === 0}
            disabled={checking}
            aria-label={`Dígito ${i + 1}`}
            onChange={(e) => put(i, e.target.value)}
            onPaste={(e) => {
              e.preventDefault();
              put(0, e.clipboardData.getData('text'));
            }}
            onKeyDown={(e) => {
              if (e.key === 'Backspace' && !digits[i] && i > 0) {
                setDigits((c) => c.map((x, k) => (k === i - 1 ? '' : x)));
                refs.current[i - 1]?.focus();
              }
            }}
            className={`h-14 w-full min-w-0 rounded-2xl border-2 text-center font-display text-2xl font-bold outline-none transition-[transform,background-color,border-color,color] duration-150 focus:scale-[1.06] focus:border-coral-deep ${
              checking
                ? 'border-navy bg-navy text-gold'
                : error
                  ? 'border-ruby bg-white'
                  : 'border-line bg-white'
            }`}
          />
        ))}
      </div>

      <div className="mt-3" aria-live="polite">
        <Msg
          error={error}
          hint={
            checking
              ? 'A verificar…'
              : sent
                ? 'Código reenviado. Verifica o email e a pasta de spam.'
                : 'O código demora uns segundos. Verifica também a pasta de spam.'
          }
        />
      </div>

      <button
        type="button"
        disabled={secs > 0}
        onClick={resend}
        className="mt-2 h-12 border-0 bg-transparent text-sm font-bold text-coral-deep disabled:text-navy-soft"
      >
        {secs > 0 ? `Reenviar código em ${secs} s` : 'Reenviar código'}
      </button>
    </Screen>
  );
}

function useHandleStatus(value, token) {
  const [check, setCheck] = useState({ value: '', available: false });
  const valid = HANDLE.test(value);
  useEffect(() => {
    if (!valid) return;
    let alive = true;
    const t = window.setTimeout(async () => {
      try {
        const data = await api(`/users/username-available?username=${encodeURIComponent(value)}`, { token });
        if (alive) setCheck({ value, available: data.available });
      } catch {
        if (alive) setCheck({ value, available: false });
      }
    }, 400);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [value, valid, token]);
  if (!value) return 'idle';
  if (!valid) return 'invalid';
  if (check.value !== value) return 'checking';
  return check.available ? 'ok' : 'taken';
}

function HandleField({ value, onChange, status }) {
  const msg = {
    idle: 'Entre 3 e 20 caracteres: letras minúsculas, números, ponto e _. Podes mudar mais tarde.',
    checking: 'A verificar disponibilidade…',
    ok: `@${value} está disponível.`,
    taken: `@${value} não está disponível.`,
    invalid: 'Usa 3 a 20 caracteres: letras minúsculas, números, ponto ou _.',
  }[status];
  const bad = status === 'taken' || status === 'invalid';
  const tone = status === 'ok' ? 'text-[#1c6b43]' : bad ? 'font-semibold text-ruby' : 'text-navy-soft';
  return (
    <div className="space-y-1.5">
      <label htmlFor="hd" className={label}>Nome de utilizador</label>
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-navy-soft">@</span>
        <input
          id="hd"
          value={value}
          onChange={(e) => onChange(e.target.value.toLowerCase().replace(/\s/g, ''))}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          maxLength={20}
          aria-invalid={bad}
          aria-describedby="hd-msg"
          className={`${field} pl-9 pr-11 ${bad ? 'border-ruby' : status === 'ok' ? 'border-[#1c6b43]' : ''}`}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2">
          {status === 'checking' && (
            <i className="block h-4 w-4 animate-spin rounded-full border-2 border-navy/20 border-t-navy" />
          )}
          {status === 'ok' && (
            <span className="text-[#1c6b43]">
              <Icon name="check" size={20} />
            </span>
          )}
          {bad && (
            <span className="text-ruby">
              <Icon name="close" size={18} />
            </span>
          )}
        </span>
      </div>
      <p id="hd-msg" aria-live="polite" className={`m-0 px-1 text-xs ${tone}`}>{msg}</p>
    </div>
  );
}
export function Setup() {
  const { user, getToken, updateUser, logout } = useAuth();
  const local = user.email.split('@')[0].split(/[._-]/).filter(Boolean);
  const [name, setName] = useState(local.map((w) => w[0].toUpperCase() + w.slice(1)).join(' ').slice(0, 30));
  const [handle, setHandle] = useState(local.join('.').toLowerCase().replace(/[^a-z0-9._]/g, '').slice(0, 20));
  const [memberType, setMemberType] = useState('Estudante');
  const [school, setSchool] = useState('');
  const [course, setCourse] = useState('');
  const [photo, setPhoto] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);
  const status = useHandleStatus(handle, getToken());
  const ok = name.trim().length >= 2 && status === 'ok' && !!school;
  const courses = memberType !== 'Staff' ? COURSES[school] : undefined;

  async function pick(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      setPhoto(await resizeImage(file));
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }

  async function submit(e) {
    e.preventDefault();
    if (!ok || busy) return;
    setBusy(true);
    setError('');
    try {
      const data = await api('/users/me', {
        method: 'PATCH',
        token: getToken(),
        body: {
          displayName: name.trim(),
          username: handle,
          school,
          memberType,
          course: courses ? course : '',
          avatar: photo,
          bio: '',
        },
      });
      updateUser(data.user);
    } catch (err) {
      buzz([30, 40, 30]);
      setError(errorText(err));
      setBusy(false);
    }
  }

  return (
    <Screen
      step={3}
      onBack={logout}
      footer={
        <button type="submit" form="setup-form" disabled={!ok || busy} className={primary}>
          {busy ? 'A guardar…' : 'Começar'}
        </button>
      }
    >
      <h1 className="m-0 font-display text-[30px] font-bold leading-tight">Cria o teu perfil</h1>
      <p className="mt-2 text-[15px] leading-snug text-navy-soft">É assim que os outros membros da UniPVC te vão ver.</p>
      <form id="setup-form" className="mt-5 space-y-5" onSubmit={submit}>
        <div>
          <p className={`${label} mb-1.5`}>Foto (opcional)</p>
          <div className="flex items-center gap-3">
            <Avatar user={{ avatar: photo, displayName: name }} size={64} />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="h-11 rounded-full border border-navy/20 bg-paper px-4 text-sm font-bold text-navy"
            >
              {photo ? 'Mudar' : 'Escolher foto'}
            </button>
            {photo && (
              <button
                type="button"
                onClick={() => setPhoto('')}
                className="h-11 rounded-full border-0 bg-transparent px-2 text-sm font-bold text-navy-soft"
              >
                Remover
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={pick} />
          </div>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="sn" className={label}>Nome</label>
          <input
            id="sn"
            value={name}
            maxLength={30}
            onChange={(e) => setName(e.target.value)}
            placeholder="Como queres aparecer"
            className={field}
          />
        </div>
        <HandleField value={handle} onChange={setHandle} status={status} />
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
          <label htmlFor="se" className={label}>Escola</label>
          <Dropdown
            id="se"
            value={school}
            onChange={(v) => {
              setSchool(v);
              setCourse('');
            }}
            label="Escola"
            placeholder="Escolhe a tua escola"
            options={SCHOOLS.map((k) => ({ value: k, label: `${k} · ${SCHOOL_NAMES[k]}` }))}
          />
        </div>
        {courses && (
          <div className="rise space-y-1.5">
            <label htmlFor="sc" className={label}>Curso na {school}</label>
            <Dropdown
              id="sc"
              value={course}
              onChange={setCourse}
              label={`Curso na ${school}`}
              placeholder="Escolhe o teu curso (opcional)"
              options={[{ value: '', label: 'Prefiro não indicar' }, ...courses.map((c) => ({ value: c, label: c }))]}
            />
          </div>
        )}
        {error && <Msg error={error} />}
      </form>
    </Screen>
  );
}
export function Access() {
  const [view, setView] = useState({ stage: 'splash', dir: 'slide-fwd' });
  const [email, setEmail] = useState('');
  const { stage, dir } = view;
  const go = (next) =>
    setView((v) => ({
      stage: next,
      dir: ORDER.indexOf(next) >= ORDER.indexOf(v.stage) ? 'slide-fwd' : 'slide-back',
    }));
  return (
    <div key={stage} className={dir}>
      {stage === 'splash' && <Splash onStart={() => go('login')} />}
      {stage === 'login' && (
        <Login email={email} setEmail={setEmail} onBack={() => go('splash')} onCode={() => go('code')} />
      )}
      {stage === 'code' && <Code email={email.trim()} onBack={() => go('login')} />}
    </div>
  );
}