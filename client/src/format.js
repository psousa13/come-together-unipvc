const DAY = new Intl.DateTimeFormat('pt-PT', { weekday: 'short', day: 'numeric', month: 'short' });
const LONG = new Intl.DateTimeFormat('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' });
const HOUR = new Intl.DateTimeFormat('pt-PT', { hour: '2-digit', minute: '2-digit' });

export const whenShort = (iso) => {
  const d = new Date(iso);
  return `${DAY.format(d)} · ${HOUR.format(d)}`;
};

export function whenLong(from, to) {
  const a = new Date(from);
  const b = new Date(to);
  if (a.toDateString() === b.toDateString()) {
    return `${LONG.format(a)}, ${HOUR.format(a)} às ${HOUR.format(b)}`;
  }
  return `${whenShort(from)} → ${whenShort(to)}`;
}

export const toISO = (date, time) => new Date(`${date}T${time}`).toISOString();

export const isPast = (iso) => Date.parse(iso) <= Date.now();

export function goingText(n) {
  if (!n) return 'Ainda ninguém marcou «Eu vou»';
  if (n === 1) return '1 pessoa vai';
  return `${n} pessoas vão`;
}
