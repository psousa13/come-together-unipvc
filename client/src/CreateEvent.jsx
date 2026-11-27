import { useState } from 'react';
import PhotoPicker from './PhotoPicker.jsx';
import { api } from './api.js';
import { useAuth } from './useAuth.js';
import Dropdown from './Dropdown.jsx';
import { SCHOOLS } from './schools.js';
import { isPast, toISO } from './format.js';
import { field, label, primary } from './ui.js';

const SCHOOL_OPTIONS = SCHOOLS.map((s) => ({ value: s, label: s }));

function problem(f) {
  if (f.title.trim().length < 3) return 'O nome precisa de pelo menos 3 caracteres.';
  if (!f.school) return 'Escolhe a escola.';
  if (!f.location.trim()) return 'Indica o local.';
  if (!f.date || !f.start || !f.end) return 'Indica a data e as horas.';
  const startsAt = toISO(f.date, f.start);
  const endsAt = toISO(f.date, f.end);
  if (endsAt <= startsAt) return 'A hora de fim tem de ser depois da de início.';
  if (isPast(startsAt)) return 'Escolhe uma data e hora no futuro.';
  return '';
}

export default function CreateEvent({ onDone }) {
  const { user, getToken } = useAuth();
  const [token] = useState(getToken);
  const [f, setF] = useState({
    title: '',
    description: '',
    school: user.school || '',
    location: '',
    date: '',
    start: '20:00',
    end: '22:00',
    ticketUrl: '',
  });
  const [photos, setPhotos] = useState([]);
  const [coverKey, setCoverKey] = useState(null);
  const [preparing, setPreparing] = useState(false);
  const [createdId, setCreatedId] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  const cover = photos.some((p) => p.key === coverKey) ? coverKey : photos[0]?.key;

  async function uploadPhotos(id) {
    let coverId = null;
    for (const photo of photos) {
      const d = await api(`/events/${id}/photos`, {
        method: 'POST',
        body: { data: photo.data, thumb: photo.thumb },
        token,
      });
      if (photo.key === cover) coverId = d.photos[d.photos.length - 1].id;
    }
    if (coverId && cover !== photos[0].key) {
      await api(`/events/${id}/photos/${coverId}/cover`, { method: 'PUT', token });
    }
  }

  async function submit(ev) {
    ev.preventDefault();
    const p = problem(f);
    if (p) {
      setError(p);
      return;
    }
    setError('');
    setBusy(true);
    const body = {
      title: f.title.trim(),
      startsAt: toISO(f.date, f.start),
      endsAt: toISO(f.date, f.end),
      school: f.school,
      location: { name: f.location.trim() },
    };
    if (f.description.trim()) body.description = f.description.trim();
    if (f.ticketUrl.trim()) body.ticketUrl = f.ticketUrl.trim();
    let id;
    try {
      const d = await api('/events', { method: 'POST', body, token });
      id = d.event.id;
    } catch (err) {
      setError(err.message);
      setBusy(false);
      return;
    }
    try {
      await uploadPhotos(id);
      onDone(id);
    } catch (err) {
      setError(`O evento foi criado, mas houve um problema com as fotos: ${err.message}`);
      setCreatedId(id);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5 pb-4">
      <p className="m-0 text-sm text-navy-soft">Fica publicado de imediato, sem aprovação.</p>
      <div className="space-y-1.5">
        <p className={`${label} mb-1.5`}>Fotos (opcional)</p>
        <PhotoPicker
          items={photos.map((p) => ({ key: p.key, src: p.data }))}
          coverKey={cover}
          disabled={busy}
          onPreparing={setPreparing}
          onAdd={(photo) => setPhotos((list) => [...list, { ...photo, key: `${Date.now()}-${Math.random()}` }])}
          onRemove={(key) => setPhotos((list) => list.filter((p) => p.key !== key))}
          onCover={setCoverKey}
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="ce-title" className={label}>Nome</label>
        <input
          id="ce-title"
          value={f.title}
          maxLength={100}
          onChange={set('title')}
          placeholder="Ex.: Piquenique no Jardim do Campus"
          className={field}
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="ce-desc" className={label}>Descrição (opcional)</label>
        <textarea
          id="ce-desc"
          value={f.description}
          maxLength={2000}
          rows={4}
          onChange={set('description')}
          placeholder="O que vai acontecer? O que devem levar?"
          className="w-full resize-none rounded-2xl border border-line bg-sand/60 px-4 py-3 text-base text-navy outline-none placeholder:text-navy-soft focus:border-coral focus:bg-white"
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="ce-school" className={label}>Escola</label>
        <Dropdown
          id="ce-school"
          label="Escola"
          value={f.school}
          onChange={(v) => setF((x) => ({ ...x, school: v }))}
          options={SCHOOL_OPTIONS}
          placeholder="Escolhe a escola"
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="ce-place" className={label}>Local</label>
        <input
          id="ce-place"
          value={f.location}
          maxLength={120}
          onChange={set('location')}
          placeholder="Ex.: Auditório da ESTG"
          className={field}
        />
      </div>
      <div className="grid grid-cols-2 gap-3 [&>:first-child]:col-span-2">
        <div className="space-y-1.5">
          <label htmlFor="ce-date" className={label}>Data</label>
          <input id="ce-date" type="date" value={f.date} onChange={set('date')} className={`${field} block min-w-0 appearance-none`} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="ce-start" className={label}>Início</label>
          <input id="ce-start" type="time" value={f.start} onChange={set('start')} className={`${field} block min-w-0 appearance-none`} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="ce-end" className={label}>Fim</label>
          <input id="ce-end" type="time" value={f.end} onChange={set('end')} className={`${field} block min-w-0 appearance-none`} />
        </div>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="ce-link" className={label}>Ligação para bilhetes/inscrição (opcional)</label>
        <input
          id="ce-link"
          type="url"
          inputMode="url"
          autoCapitalize="none"
          value={f.ticketUrl}
          onChange={set('ticketUrl')}
          placeholder="https://"
          className={field}
        />
      </div>
      {error && (
        <p role="alert" className="m-0 text-sm font-semibold text-ruby">
          {error}
        </p>
      )}
      {createdId ? (
        <button type="button" onClick={() => onDone(createdId)} className={primary}>
          Abrir evento
        </button>
      ) : (
        <button type="submit" disabled={busy || preparing} className={primary}>
          {busy ? 'A publicar…' : 'Publicar evento'}
        </button>
      )}
    </form>
  );
}
