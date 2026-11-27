import { useState } from 'react';
import Icon from './Icon.jsx';
import { resizePhoto } from './image.js';

const LIMIT = 5;

export default function PhotoPicker({ items, coverKey, disabled, onAdd, onRemove, onCover, onPreparing }) {
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const locked = disabled || working;

  async function pick(ev) {
    const files = Array.from(ev.target.files || []);
    ev.target.value = '';
    if (!files.length) return;
    const free = LIMIT - items.length;
    setError(files.length > free ? `Só podes ter ${LIMIT} fotos. As restantes ficaram de fora.` : '');
    setWorking(true);
    onPreparing?.(true);
    try {
      for (const file of files.slice(0, free)) await onAdd(await resizePhoto(file));
    } catch (err) {
      setError(err.message);
    }
    setWorking(false);
    onPreparing?.(false);
  }

  return (
    <div className="flex flex-col gap-2">
      <ul className="m-0 grid list-none grid-cols-2 gap-2 p-0 sm:grid-cols-3">
        {items.map((item, i) => {
          const isCover = item.key === coverKey;
          return (
            <li key={item.key} className="flex flex-col gap-1.5">
              <div
                className={`relative aspect-square overflow-hidden rounded-2xl bg-sand-deep ${
                  isCover ? 'ring-[3px] ring-inset ring-gold' : ''
                }`}
              >
                <img src={item.src} alt={`Foto ${i + 1}`} className="block h-full w-full object-cover" />
                {isCover && (
                  <>
                    <span className="pointer-events-none absolute inset-0 rounded-2xl border-[3px] border-gold" />
                    <span className="absolute bottom-2 left-2 rounded-full bg-gold px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-navy">
                      Capa
                    </span>
                  </>
                )}
                <button
                  type="button"
                  disabled={locked}
                  onClick={() => onRemove(item.key)}
                  aria-label={`Remover foto ${i + 1}`}
                  className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-paper text-lg font-bold leading-none text-navy shadow-sm disabled:opacity-50"
                >
                  ×
                </button>
              </div>
              <button
                type="button"
                disabled={locked || isCover}
                aria-pressed={isCover}
                onClick={() => onCover(item.key)}
                className={`h-9 w-full rounded-full text-xs font-bold ${
                  isCover ? 'bg-navy text-gold' : 'border border-navy/20 bg-paper text-navy disabled:opacity-50'
                }`}
              >
                {isCover ? 'Na lista de eventos' : 'Usar como capa'}
              </button>
            </li>
          );
        })}
        {items.length < LIMIT && (
          <li>
            <label
              className={`flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-coral/60 bg-sand/60 text-center text-sm font-bold text-coral-deep focus-within:outline-2 focus-within:outline-coral-deep ${
                locked ? 'opacity-50' : ''
              }`}
            >
              <span className="grid h-10 w-10 place-items-center rounded-full bg-coral-deep text-white">
                <Icon name="plus" size={20} />
              </span>
              {working ? 'A preparar…' : 'Adicionar'}
              <input type="file" accept="image/*" multiple disabled={locked} onChange={pick} className="sr-only" />
            </label>
          </li>
        )}
      </ul>
      <p className="m-0 flex justify-between gap-3 text-xs text-navy-soft">
        <span>A capa é a foto que aparece na lista de eventos.</span>
        <span className="shrink-0 font-bold">
          {items.length}/{LIMIT}
        </span>
      </p>
      {error && (
        <p role="alert" className="m-0 text-sm font-semibold text-ruby">
          {error}
        </p>
      )}
    </div>
  );
}
