export default function Avatar({ user, size = 40, ring }) {
  const cls = ring ? (size >= 80 ? 'border-4 border-paper' : 'border-2 border-paper') : '';
  const box = { width: size, height: size };

  if (user.avatar) {
    return (
      <img
        src={user.avatar}
        alt=""
        className={`shrink-0 rounded-full bg-sand-deep object-cover ${cls}`}
        style={box}
      />
    );
  }

  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full bg-navy-soft font-bold text-paper ${cls}`}
      style={{ ...box, fontSize: size * 0.38 }}
      aria-hidden="true"
    >
      {(user.displayName || '?').charAt(0).toUpperCase()}
    </span>
  );
}