export function PasswordInput({ value, onChange, error }: { value: string; onChange: (v: string) => void; error?: string }) {
  return <div className="field">
    <label htmlFor="password">Contraseña</label>
    <input id="password" name="password" placeholder="Contraseña" autoComplete="current-password" type="password" value={value} onChange={e => onChange(e.target.value)} aria-invalid={!!error} aria-describedby={error ? 'password-error' : undefined} />
    {error && <p className="error" id="password-error">{error}</p>}
  </div>;
}
