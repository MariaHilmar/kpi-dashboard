import { type FormEvent, type ReactNode } from "react";

import { SystemFeedback, type FeedbackVariant } from "@/components/ui/SystemFeedback";
import type { UserRole } from "@/types/profile";

export type UserFormState = {
  email: string;
  password: string;
  full_name: string;
  gitlab_user_id: string;
  role: UserRole;
  active: boolean;
};

type FormFeedback = {
  variant: FeedbackVariant;
  message: string;
  title?: string;
} | null;

type Props = {
  mode: "create" | "edit";
  form: UserFormState;
  editPassword: string;
  saving: boolean;
  feedback: FormFeedback;
  onFormChange: (updates: Partial<UserFormState>) => void;
  onEditPasswordChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
  onCancelEdit?: () => void;
};

export function UserForm({
  mode,
  form,
  editPassword,
  saving,
  feedback,
  onFormChange,
  onEditPasswordChange,
  onSubmit,
  onCancelEdit,
}: Props) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">
        {mode === "create" ? "Incluir usuário" : "Editar usuário"}
      </h2>
      <p className="mt-1 text-xs text-slate-500">
        Apenas administradores gerenciam acessos. Usuários inativos não conseguem entrar.
      </p>

      <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3">
        {mode === "create" ? (
          <>
            <Field label="E-mail" id="email">
              <input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={(e) => onFormChange({ email: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-govbr-blue focus:outline-none"
              />
            </Field>
            <Field label="Senha inicial" id="password">
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={(e) => onFormChange({ password: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-govbr-blue focus:outline-none"
              />
            </Field>
          </>
        ) : (
          <Field label="E-mail" id="email-readonly">
            <input
              id="email-readonly"
              type="email"
              disabled
              value={form.email}
              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm opacity-70"
            />
          </Field>
        )}

        <Field label="Nome de exibição" id="full_name">
          <input
            id="full_name"
            type="text"
            autoComplete="name"
            value={form.full_name}
            onChange={(e) => onFormChange({ full_name: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-govbr-blue focus:outline-none"
          />
          <p className="mt-1 text-xs text-slate-500">
            Nome exibido em telas e relatórios do dashboard.
          </p>
        </Field>

        <Field label="ID GitLab" id="gitlab_user_id">
          <input
            id="gitlab_user_id"
            type="number"
            min={1}
            step={1}
            value={form.gitlab_user_id}
            onChange={(e) => onFormChange({ gitlab_user_id: e.target.value })}
            readOnly={mode === "edit"}
            disabled={mode === "edit"}
            placeholder="ID global do usuário no GitLab"
            className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-govbr-blue focus:outline-none${
              mode === "edit" ? " bg-slate-50 opacity-70" : ""
            }`}
          />
          {mode === "create" ? (
            <p className="mt-1 text-xs text-slate-500">
              Vínculo preferencial com issues (author.id). Preenchido automaticamente pelo
              provisionamento GitLab.
            </p>
          ) : null}
        </Field>

        <Field label="Papel" id="role">
          <select
            id="role"
            value={form.role}
            onChange={(e) => onFormChange({ role: e.target.value as UserRole })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-govbr-blue focus:outline-none"
          >
            <option value="user">Usuário</option>
            <option value="admin">Administrador</option>
          </select>
        </Field>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => onFormChange({ active: e.target.checked })}
          />
          Conta ativa
        </label>

        {mode === "edit" ? (
          <Field label="Nova senha (opcional)" id="edit-password">
            <input
              id="edit-password"
              type="password"
              minLength={6}
              value={editPassword}
              onChange={(e) => onEditPasswordChange(e.target.value)}
              placeholder="Deixe em branco para manter"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-govbr-blue focus:outline-none"
            />
          </Field>
        ) : null}

        {feedback ? (
          <SystemFeedback
            variant={feedback.variant}
            title={feedback.title}
            message={feedback.message}
            mode="inline"
          />
        ) : null}

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="submit"
            disabled={saving}
            className="br-button primary"
          >
            {saving ? "Salvando…" : mode === "create" ? "Criar usuário" : "Salvar alterações"}
          </button>
          {onCancelEdit ? (
            <button
              type="button"
              disabled={saving}
              className="br-button secondary"
              onClick={onCancelEdit}
            >
              Cancelar edição
            </button>
          ) : null}
        </div>
      </form>
    </section>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-medium text-slate-700">
        {label}
      </label>
      {children}
    </div>
  );
}
