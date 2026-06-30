type PasswordFieldsProps = {
  password: string;
  confirm: string;
  onPasswordChange: (value: string) => void;
  onConfirmChange: (value: string) => void;
  passwordLabel?: string;
  confirmLabel?: string;
  passwordId?: string;
  confirmId?: string;
};

export function PasswordFields({
  password,
  confirm,
  onPasswordChange,
  onConfirmChange,
  passwordLabel = "Nova senha",
  confirmLabel = "Confirmar nova senha",
  passwordId = "password",
  confirmId = "confirm-password",
}: PasswordFieldsProps) {
  return (
    <>
      <div>
        <label htmlFor={passwordId} className="mb-1 block text-sm font-medium text-slate-700">
          {passwordLabel}
        </label>
        <input
          id={passwordId}
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-govbr-blue focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor={confirmId} className="mb-1 block text-sm font-medium text-slate-700">
          {confirmLabel}
        </label>
        <input
          id={confirmId}
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => onConfirmChange(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-govbr-blue focus:outline-none"
        />
      </div>
    </>
  );
}
