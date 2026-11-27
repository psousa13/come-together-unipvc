export function membersText(n) {
  return n === 1 ? '1 membro' : `${n} membros`;
}

export function statusOf(c) {
  if (c.isAdmin) return 'Admin';
  if (c.isMember) return 'Membro';
  if (c.hasRequested) return 'Pedido enviado';
  return '';
}

export function cleanName(v) {
  return v.trim().replace(/\s+/g, ' ');
}
