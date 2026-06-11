import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { APP_USERS } from '../auth/users';
import { Field } from '../components/Field';

export function LoginScreen() {
  const login = useAuthStore((s) => s.login);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [failed, setFailed] = useState(false);

  function submit() {
    const ok = login(username, password);
    if (!ok) {
      setFailed(true);
      setPassword('');
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 pb-16">
      <div className="eyebrow mb-3 text-center">Silver Platter · Phase 2</div>

      <div className="panel brackets px-6 py-9 text-center">
        <span className="bk bk-tl" />
        <span className="bk bk-tr" />
        <span className="bk bk-bl" />
        <span className="bk bk-br" />
        <div className="font-display text-[26px] font-semibold tracking-[0.12em] text-ink-1">
          SILVER PLATTER
        </div>
        <div className="eyebrow mt-2">CM Site Walk</div>
      </div>

      <form
        className="panel mt-5 space-y-4 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className="eyebrow">Operator · Authentication</div>
        <Field label="Username">
          <select
            className="input"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setFailed(false);
            }}
          >
            <option value="">SELECT OPERATOR</option>
            {APP_USERS.map((u) => (
              <option key={u.username} value={u.username}>
                {u.username.toUpperCase()}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Password">
          <input
            type="password"
            className="input"
            value={password}
            autoComplete="current-password"
            onChange={(e) => {
              setPassword(e.target.value);
              setFailed(false);
            }}
          />
        </Field>
        {failed && <span className="chip chip-alert">Credentials Not Recognized</span>}
        <button type="submit" className="btn btn-primary w-full" disabled={!username || !password}>
          Authenticate
        </button>
      </form>

      <div className="mt-6 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-ink-4">
        Silver Platter · V{__APP_VERSION__}
      </div>
    </div>
  );
}
