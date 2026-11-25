export const field =
  'h-13 w-full rounded-2xl border border-line bg-sand/60 px-4 text-base text-navy outline-none placeholder:text-navy-soft focus:border-coral focus:bg-white';

export const label = 'px-1 text-[11px] font-bold uppercase tracking-[0.14em] text-navy-soft';

export const primary =
  'flex h-13 w-full items-center justify-center gap-2 rounded-full bg-coral-deep text-[15px] font-bold text-white transition-[transform,opacity] duration-100 active:scale-[0.97] disabled:opacity-40';

export function buzz(pattern) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    return;
  }
}