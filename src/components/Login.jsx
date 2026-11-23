import { useState } from 'react';
import { signIn } from '../lib/store.js';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError('');
    try { await signIn(email, password); }
    catch (err) { setError(err.message === 'Invalid login credentials' ? 'Email or password is wrong.' : err.message); setBusy(false); }
  }

  return (
    <main className="login">
      <form className="window login-box" onSubmit={submit}>
        <h1 className="logo">Team Base</h1>
        <p className="hint">Sign in with the account you created in Supabase.</p>
        <div className="field"><label htmlFor="email">Email</label><input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
        <div className="field"><label htmlFor="pw">Password</label><input id="pw" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn primary" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </main>
  );
}
