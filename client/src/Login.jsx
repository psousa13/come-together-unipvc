import { useState } from 'react';
import { api } from './api.js';
import { useAuth } from './useAuth.js';

export default function Login() {
  const { login } = useAuth();
  const [step, setStep] = useState('email'); // email | code | password
  const [email, setEmail] = useState('');
  const [secret, setSecret] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (step === 'email') {
        const data = await api('/auth/request-code', { method: 'POST', body: { email } });
        setSecret('');
        setStep(data.requiresPassword ? 'password' : 'code');
      } else if (step === 'code') {
        const data = await api('/auth/verify-code', { method: 'POST', body: { email, code: secret } });
        login(data.token, data.user);
      } else {
        const data = await api('/auth/admin-login', { method: 'POST', body: { password: secret } });
        login(data.token, data.user);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function back() {
    setStep('email');
    setSecret('');
    setError('');
  }

  return (
    <main className="card">
      <h1>Come Together</h1>
      <p className="muted">Eventos e comunidades da UniPVC.</p>
      <form onSubmit={submit}>
        <input
          type="text"
          placeholder="Email institucional"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={step !== 'email'}
          autoFocus
        />
        {step === 'code' && (
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="Código de 6 dígitos"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            autoFocus
          />
        )}
        {step === 'password' && (
          <input
            type="password"
            placeholder="Palavra-passe"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            autoFocus
          />
        )}
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={busy || !email}>
          {step === 'email' ? 'Continuar' : 'Entrar'}
        </button>
        {step !== 'email' && (
          <button type="button" className="link" onClick={back}>
            Voltar
          </button>
        )}
      </form>
    </main>
  );
}
