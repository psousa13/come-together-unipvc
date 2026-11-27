import { useState } from 'react';
import Icon from './Icon.jsx';
import Modal from './Modal.jsx';

const WIDE = 'col-span-6 aspect-video lg:aspect-[21/9]';
const HALF = 'col-span-3 aspect-[4/3]';
const THIRD = 'col-span-2 aspect-square lg:aspect-[4/3]';
const LAYOUTS = {
  1: [WIDE],
  2: [HALF, HALF],
  3: ['col-span-4 row-span-2', THIRD, THIRD],
  4: [WIDE, THIRD, THIRD, THIRD],
  5: [HALF, HALF, THIRD, THIRD, THIRD],
};

const round = 'grid h-11 w-11 place-items-center rounded-full bg-paper text-navy';

export default function PhotoGallery({ photos, coverId, title }) {
  const [open, setOpen] = useState(null);
  if (!photos.length) return null;

  const list = [...photos].sort((a, b) => Number(b.id === coverId) - Number(a.id === coverId));
  const layout = LAYOUTS[Math.min(list.length, 5)];
  const current = open === null ? null : list[open];
  const step = (n) => setOpen((i) => (i + n + list.length) % list.length);

  return (
    <>
      <ul className="m-0 grid list-none grid-cols-6 gap-2 p-0">
        {list.slice(0, 5).map((photo, i) => (
          <li key={photo.id} className={`relative ${layout[i]}`}>
            <button
              type="button"
              onClick={() => setOpen(i)}
              aria-label={`Ver foto ${i + 1} de ${list.length}`}
              className="absolute inset-0 overflow-hidden rounded-2xl border-0 bg-sand-deep p-0 shadow-[0_14px_28px_-8px_rgba(10,25,60,0.45),0_3px_8px_rgba(10,25,60,0.2)]"
            >
              <img src={photo.src} alt="" className="block h-full w-full object-cover" />
            </button>
          </li>
        ))}
      </ul>
      {current && (
        <Modal
          label={`Fotos de ${title}`}
          onClose={() => setOpen(null)}
          onKeyDown={(ev) => {
            if (ev.key === 'ArrowLeft') step(-1);
            if (ev.key === 'ArrowRight') step(1);
          }}
          className="m-0 h-dvh max-h-none w-screen max-w-none border-0 bg-navy p-0 text-paper"
        >
          <div className="pointer-events-none flex h-full flex-col gap-3 p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-[calc(env(safe-area-inset-top)+1rem)]">
            <div className="flex items-center justify-between">
              <p className="m-0 text-sm font-bold">
                {open + 1} / {list.length}
              </p>
              <button
                type="button"
                onClick={() => setOpen(null)}
                aria-label="Fechar"
                className={`${round} pointer-events-auto text-2xl leading-none`}
              >
                ×
              </button>
            </div>
            <img
              src={current.src}
              alt={`${title}, foto ${open + 1}`}
              className="pointer-events-auto min-h-0 w-full flex-1 object-contain"
            />
            {list.length > 1 && (
              <div className="pointer-events-auto flex justify-center gap-4">
                <button type="button" onClick={() => step(-1)} aria-label="Foto anterior" className={round}>
                  <Icon name="back" size={20} />
                </button>
                <button type="button" onClick={() => step(1)} aria-label="Foto seguinte" className={round}>
                  <span className="grid rotate-180">
                    <Icon name="back" size={20} />
                  </span>
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
