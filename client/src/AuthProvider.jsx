import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from './api.js';
import { AuthContext } from './AuthContext.js';

const KEY = 'ct_token';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem(KEY)));

  useEffect(() => {
    const token = localStorage.getItem(KEY);
    if (!token) return;
    api('/auth/me', { token })
      .then((data) => setUser(data.user))
      .catch((err) => {
        // Only drop the token if the server rejected it; network errors
        // (e.g. a cancelled request on reload) must keep the session.
        if (err.status === 401) localStorage.removeItem(KEY);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback((token, nextUser) => {
    localStorage.setItem(KEY, token);
    setUser(nextUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(KEY);
    setUser(null);
  }, []);

  const getToken = useCallback(() => localStorage.getItem(KEY), []);

  const value = useMemo(
    () => ({ user, loading, login, logout, updateUser: setUser, getToken }),
    [user, loading, login, logout, getToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}