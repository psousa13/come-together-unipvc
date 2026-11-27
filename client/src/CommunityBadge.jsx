const TONES = ['bg-navy', 'bg-coral-deep', 'bg-navy-soft', 'bg-ruby'];

export default function CommunityBadge({ name, size = 56 }) {
  const sum = [...name].reduce((a, ch) => a + ch.charCodeAt(0), 0);
  const letters = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-2xl font-display font-bold text-paper ${TONES[sum % TONES.length]}`}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {letters}
    </span>
  );
}
