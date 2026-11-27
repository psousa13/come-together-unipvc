import { useState } from 'react';
import { api } from './api.js';
import Modal from './Modal.jsx';
import PhotoPicker from './PhotoPicker.jsx';
import { primary } from './ui.js';

export default function PhotoManager({ eventId, photos, coverId, token, onChange, onClose }) {
  const [busy, setBusy] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState('');
  const locked = busy || preparing;

  async function send(path, method, body) {
    setError('');
    setBusy(true);
    try {
      onChange(await api(`/events/${eventId}/photos${path}`, { method, body, token }));
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  }

  return (
    <Modal
      label="Gerir fotos"
      onClose={() => !locked && onClose()}
      className="mx-auto mb-0 mt-auto max-h-[88dvh] w-full max-w-[480px] overflow-y-auto overscroll-contain rounded-t-3xl border-0 bg-paper p-0 text-navy backdrop:bg-navy/60 sm:my-auto sm:max-w-[560px] sm:rounded-3xl"
    >
      <div className="flex flex-col gap-4 p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]">
        <h2 className="m-0 font-display text-2xl font-bold">Fotos do evento</h2>
        <PhotoPicker
          items={photos.map((p) => ({ key: p.id, src: p.src }))}
          coverKey={coverId}
          disabled={busy}
          onPreparing={setPreparing}
          onAdd={(photo) => send('', 'POST', photo)}
          onRemove={(key) => send(`/${key}`, 'DELETE')}
          onCover={(key) => send(`/${key}/cover`, 'PUT')}
        />
        {error && (
          <p role="alert" className="m-0 text-sm font-semibold text-ruby">
            {error}
          </p>
        )}
        <p className="sr-only" role="status">
          {locked ? 'A guardar…' : ''}
        </p>
        <button type="button" disabled={locked} onClick={onClose} className={`${primary} shrink-0`}>
          {locked ? 'A guardar…' : 'Concluído'}
        </button>
      </div>
    </Modal>
  );
}
