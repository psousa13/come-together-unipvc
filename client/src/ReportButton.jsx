import { useState } from 'react';
import { api } from './api.js';
import { useAuth } from './useAuth.js';
import Icon from './Icon.jsx';
import { REASONS } from './reports.js';
import { label, primary } from './ui.js';

const secondary =
  'flex h-13 w-full items-center justify-center rounded-full border border-navy/20 bg-paper text-[15px] font-bold text-navy transition active:scale-[0.97]';

export default function ReportButton({ targetType, targetId }) {
  const { getToken } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    if (!reason || busy) return;
    setBusy(true);
    setError('');
    try {
      await api('/reports', {
        method: 'POST',
        token: getToken(),
        body: { targetType, targetId, reason, details: details.trim() },
      });
      setDone(true);
      setOpen(false);
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  }

  if (done) {
    return (
      <p role="status" className="m-0 text-center text-xs font-semibold text-navy-soft">
        Denúncia enviada. Obrigado.
      </p>
    );
  }

  if (!open) {
    return (
      <div className="text-center">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="hit inline-flex items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-navy-soft"
        >
          <Icon name="flag" size={14} /> Denunciar
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-3xl bg-paper p-4 text-left">
      <p className={label}>Porquê queres denunciar?</p>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Motivo da denúncia">
        {REASONS.map(([value, text]) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={reason === value}
            onClick={() => setReason(value)}
            className={`h-10 rounded-full px-4 text-sm font-bold ${
              reason === value ? 'border-0 bg-navy text-paper' : 'border border-navy/20 bg-paper text-navy'
            }`}
          >
            {text}
          </button>
        ))}
      </div>
      <div className="space-y-1.5">
        <label htmlFor="rp-details" className={label}>Mais detalhes (opcional)</label>
        <textarea
          id="rp-details"
          value={details}
          maxLength={300}
          rows={3}
          onChange={(e) => setDetails(e.target.value)}
          className="w-full resize-none rounded-2xl border border-line bg-sand/60 px-4 py-3 text-[15px] text-navy outline-none placeholder:text-navy-soft focus:border-coral focus:bg-white"
        />
        <p className="m-0 px-1 text-right text-xs text-navy-soft">{details.length}/300</p>
      </div>
      {error && (
        <p role="alert" className="m-0 text-sm font-semibold text-ruby">
          {error}
        </p>
      )}
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => setOpen(false)} className={secondary}>
          Cancelar
        </button>
        <button type="submit" disabled={!reason || busy} className={primary}>
          {busy ? 'A enviar…' : 'Enviar'}
        </button>
      </div>
    </form>
  );
}