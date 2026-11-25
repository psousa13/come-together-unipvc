import { useEffect, useState } from 'react';

const LIMIT = 80;
const TRIGGER = 56;

export default function PullToRefresh({ scrollRef, enabled, onRefresh }) {
  const [pull, setPull] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !enabled) return;
    let from = null;
    let distance = 0;
    let working = false;
    let timer;

    const reset = () => {
      from = null;
      distance = 0;
      setPull(0);
    };
    const start = (e) => {
      const blocked = e.target.closest('input, textarea, [role="listbox"]');
      if (working || blocked || e.touches.length !== 1 || el.scrollTop > 0) return;
      from = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const move = (e) => {
      if (!from) return;
      const dx = e.touches[0].clientX - from.x;
      const dy = e.touches[0].clientY - from.y;
      if (e.touches.length !== 1 || el.scrollTop > 0 || dy <= 0 || (distance === 0 && Math.abs(dx) > dy)) {
        reset();
        return;
      }
      if (e.cancelable) e.preventDefault();
      distance = Math.min(dy * 0.5, LIMIT);
      setPull(distance);
    };
    const end = () => {
      if (!from) return;
      const go = distance >= TRIGGER;
      reset();
      if (!go) return;
      working = true;
      setBusy(true);
      onRefresh((x) => x + 1);
      timer = setTimeout(() => {
        working = false;
        setBusy(false);
      }, 800);
    };

    el.addEventListener('touchstart', start, { passive: true });
    el.addEventListener('touchmove', move, { passive: false });
    el.addEventListener('touchend', end);
    el.addEventListener('touchcancel', reset);
    return () => {
      clearTimeout(timer);
      el.removeEventListener('touchstart', start);
      el.removeEventListener('touchmove', move);
      el.removeEventListener('touchend', end);
      el.removeEventListener('touchcancel', reset);
    };
  }, [scrollRef, enabled, onRefresh]);

  if (!busy && pull === 0) return null;

  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-[calc(env(safe-area-inset-top)+0.75rem)] z-40 flex justify-center lg:hidden"
      style={{
        opacity: busy ? 1 : Math.min(pull / TRIGGER, 1),
        transform: `translateY(${busy ? TRIGGER / 2 : pull / 2}px)`,
      }}
    >
      <span className="grid h-10 w-10 place-items-center rounded-full bg-paper shadow-floating">
        <span
          className={`block h-5 w-5 rounded-full border-2 border-navy/20 border-t-navy ${busy ? 'animate-spin' : ''}`}
          style={busy ? undefined : { transform: `rotate(${pull * 4}deg)` }}
        />
      </span>
      {busy && (
        <span className="sr-only" role="status">
          A atualizar
        </span>
      )}
    </div>
  );
}