export default function Avatar({ user, size = 40 }) {
  const style = {
    width: size,
    height: size,
    borderRadius: '50%',
    objectFit: 'cover',
    flexShrink: 0,
  };

  if (user.avatar) return <img src={user.avatar} alt="" style={style} />;

  return (
    <div
      style={{
        ...style,
        display: 'grid',
        placeItems: 'center',
        background: '#8884',
        fontWeight: 600,
        fontSize: size * 0.4,
      }}
    >
      {(user.displayName || '?').charAt(0).toUpperCase()}
    </div>
  );
}