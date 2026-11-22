import Login from './Login.jsx';
import { useAuth } from './useAuth.js';

export default function App() {
  const { user, loading, logout } = useAuth();

  if (loading) return null;
  if (!user) return <Login />;

  return (
    <main className="card">
      <h1>Olá, {user.displayName}</h1>
      <p className="muted">{user.role === 'admin' ? 'Administração' : user.email}</p>
      <button onClick={logout}>Terminar sessão</button>
    </main>
  );
}
