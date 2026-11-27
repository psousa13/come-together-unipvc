import { useCallback, useEffect, useState } from 'react';
import { api } from './api.js';
import { connectSocket } from './socket.js';
import { useAuth } from './useAuth.js';
import { emitEventChange } from './eventsBus.js';

export function useNotifications(uid) {
  const { getToken } = useAuth();
  const [state, setState] = useState({ uid: null, list: [] });

  useEffect(() => {
    if (!uid) return undefined;
    const token = getToken();
    const socket = connectSocket(token);
    let first = true;

    const load = () =>
      api('/notifications', { token })
        .then((data) => {
          setState((s) => {
            const ids = new Set(data.notifications.map((x) => x.id));
            const extra = s.uid === uid ? s.list.filter((x) => !ids.has(x.id)) : [];
            return { uid, list: [...extra, ...data.notifications] };
          });
        })
        .catch(() => {});

    load();

    socket.on('connect', () => {
      if (first) first = false;
      else {
        load();
        emitEventChange({ type: 'created' });
      }
    });

    socket.on('event:changed', (m) => {
      emitEventChange({ type: m.type === 'cancelled' ? 'cancelled' : 'created', id: m.id });
    });

    socket.on('notification', (n) => {
      setState((s) => {
        const base = s.uid === uid ? s.list : [];
        if (base.some((x) => x.id === n.id)) return s;
        return { uid, list: [n, ...base] };
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [uid, getToken]);

  const list = state.uid === uid ? state.list : [];
  const unread = list.filter((n) => !n.read).length;

  const markAllRead = useCallback(() => {
    setState((s) => ({ ...s, list: s.list.map((n) => ({ ...n, read: true })) }));
    api('/notifications/read-all', { method: 'POST', token: getToken() }).catch(() => {});
  }, [getToken]);

  return { list, unread, markAllRead };
}