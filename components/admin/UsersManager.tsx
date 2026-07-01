"use client";

import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { UserForm, type UserFormState } from "@/components/admin/UserForm";
import { UserTable } from "@/components/admin/UserTable";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { SystemFeedback } from "@/components/ui/SystemFeedback";
import { useSystemFeedback } from "@/hooks/useSystemFeedback";
import type { UserProfile, UserRole } from "@/types/profile";

const emptyForm: UserFormState = {
  email: "",
  password: "",
  full_name: "",
  gitlab_user_id: "",
  role: "user" as UserRole,
  active: true,
};

function displayName(user: Pick<UserProfile, "full_name" | "email">) {
  return user.full_name?.trim() || user.email;
}

function matchesUserFilter(
  user: UserProfile,
  { emailFilter, nameFilter }: { emailFilter: string; nameFilter: string },
): boolean {
  const emailQuery = emailFilter.trim().toLowerCase();
  const nameQuery = nameFilter.trim().toLowerCase();

  if (emailQuery && !user.email.toLowerCase().includes(emailQuery)) {
    return false;
  }

  if (nameQuery) {
    const name = (user.full_name ?? "").trim().toLowerCase();
    if (!name.includes(nameQuery)) {
      return false;
    }
  }

  return true;
}

export function UsersManager() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formFeedback, setFormFeedback] = useState<{
    variant: "success" | "danger" | "warning";
    message: string;
    title?: string;
  } | null>(null);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<UserProfile | null>(null);
  const [form, setForm] = useState<UserFormState>(emptyForm);
  const [editPassword, setEditPassword] = useState("");
  const [userToInactivate, setUserToInactivate] = useState<UserProfile | null>(null);
  const [emailFilter, setEmailFilter] = useState("");
  const [nameFilter, setNameFilter] = useState("");

  const filteredUsers = useMemo(
    () => users.filter((user) => matchesUserFilter(user, { emailFilter, nameFilter })),
    [users, emailFilter, nameFilter],
  );

  const hasActiveFilters = emailFilter.trim().length > 0 || nameFilter.trim().length > 0;

  const { feedback, showSuccess, showError, showWarning, showInfo, clear } = useSystemFeedback();

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = (await res.json()) as { users?: UserProfile[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Falha ao carregar usuários.");
      setUsers(data.users ?? []);
    } catch (err) {
      showError(
        err instanceof Error ? err.message : "Erro ao carregar usuários.",
        "Erro ao carregar",
      );
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  function resetForm() {
    setMode("create");
    setEditing(null);
    setForm(emptyForm);
    setEditPassword("");
    setFormFeedback(null);
  }

  function openCreate() {
    resetForm();
    clear();
  }

  function clearFilters() {
    setEmailFilter("");
    setNameFilter("");
  }

  function openEdit(user: UserProfile) {
    setMode("edit");
    setEditing(user);
    setForm({
      email: user.email,
      password: "",
      full_name: user.full_name ?? "",
      gitlab_user_id: user.gitlab_user_id ? String(user.gitlab_user_id) : "",
      role: user.role,
      active: user.active,
    });
    setEditPassword("");
    setFormFeedback(null);
    showInfo(
      `Editando ${displayName(user)}. Salve as alterações ou escolha outro usuário na tabela.`,
      "Modo de edição",
    );
  }

  function parseGitlabUserId(raw: string): number | null {
    if (!raw.trim()) return null;
    const parsed = Number.parseInt(raw.trim(), 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setFormFeedback(null);
    clear();

    const gitlabRaw = form.gitlab_user_id.trim();
    const parsedGitlabUserId = parseGitlabUserId(gitlabRaw);

    if (gitlabRaw && parsedGitlabUserId == null) {
      setFormFeedback({
        variant: "warning",
        title: "ID GitLab inválido",
        message: "Informe um número inteiro positivo ou deixe o campo em branco.",
      });
      setSaving(false);
      return;
    }

    try {
      if (mode === "create") {
        const res = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: form.email,
            password: form.password,
            full_name: form.full_name || null,
            gitlab_user_id: parsedGitlabUserId,
            role: form.role,
            active: form.active,
          }),
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(data.error ?? "Falha ao criar usuário.");

        showSuccess(
          `O usuário ${form.email} foi incluído${form.active ? " e já pode acessar o dashboard" : ", porém permanece inativo até ser ativado"}.`,
          "Inclusão concluída",
        );
        resetForm();
      } else if (editing) {
        const payload: Record<string, unknown> = {
          full_name: form.full_name || null,
          role: form.role,
          active: form.active,
        };
        if (editPassword.trim()) {
          payload.password = editPassword;
        }

        const res = await fetch(`/api/admin/users/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(data.error ?? "Falha ao atualizar usuário.");

        const passwordNote = editPassword.trim() ? " A senha também foi atualizada." : "";
        showSuccess(
          `As alterações de ${displayName(editing)} foram salvas.${passwordNote}`,
          "Alteração concluída",
        );
        setFormFeedback({
          variant: "success",
          message: "Dados salvos. Você pode continuar editando ou selecionar outro usuário.",
          title: "Sucesso.",
        });
      }

      await loadUsers();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Operação falhou.";
      setFormFeedback({
        variant: "danger",
        message,
        title: "Erro.",
      });
      showError(message, mode === "create" ? "Falha na inclusão" : "Falha na alteração");
    } finally {
      setSaving(false);
    }
  }

  async function executeToggleActive(user: UserProfile) {
    setSaving(true);
    clear();
    setFormFeedback(null);

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !user.active }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Falha ao alterar status.");

      if (user.active) {
        showWarning(
          `${displayName(user)} foi inativado e não poderá mais entrar no sistema.`,
          "Usuário inativado",
        );
      } else {
        showSuccess(
          `${displayName(user)} foi reativado e já pode acessar o dashboard novamente.`,
          "Usuário ativado",
        );
      }

      if (editing?.id === user.id) {
        setForm((current) => ({ ...current, active: !user.active }));
      }

      await loadUsers();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Operação falhou.";
      showError(message, "Falha ao alterar status");
    } finally {
      setSaving(false);
      setUserToInactivate(null);
    }
  }

  function requestToggleActive(user: UserProfile) {
    clear();
    if (user.active) {
      setUserToInactivate(user);
      return;
    }
    void executeToggleActive(user);
  }

  return (
    <>
      {feedback ? (
        <SystemFeedback
          variant={feedback.variant}
          title={feedback.title}
          message={feedback.message}
          onDismiss={clear}
        />
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-900">Usuários cadastrados</h2>
            <button
              type="button"
              onClick={openCreate}
              className="br-button primary small"
            >
              Novo usuário
            </button>
          </div>

          {!loading && users.length === 0 ? (
            <div className="p-4">
              <SystemFeedback
                variant="info"
                title="Nenhum usuário"
                message="Ainda não há usuários cadastrados. Use o botão Novo usuário para incluir o primeiro acesso."
              />
            </div>
          ) : null}

          {!loading && users.length > 0 ? (
            <div className="border-b border-slate-100 px-4 py-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
                <label className="flex min-w-[12rem] flex-1 flex-col gap-1 text-xs">
                  <span className="font-medium text-slate-600">Filtrar por e-mail</span>
                  <input
                    type="search"
                    value={emailFilter}
                    onChange={(event) => setEmailFilter(event.target.value)}
                    placeholder="Ex.: maria@mgi.gov.br"
                    aria-label="Filtrar por e-mail"
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-govbr-blue focus:outline-none"
                  />
                </label>
                <label className="flex min-w-[12rem] flex-1 flex-col gap-1 text-xs">
                  <span className="font-medium text-slate-600">Filtrar por nome</span>
                  <input
                    type="search"
                    value={nameFilter}
                    onChange={(event) => setNameFilter(event.target.value)}
                    placeholder="Ex.: Maria Silva"
                    aria-label="Filtrar por nome"
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-govbr-blue focus:outline-none"
                  />
                </label>
                {hasActiveFilters ? (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="br-button secondary small self-start sm:self-auto"
                  >
                    Limpar filtros
                  </button>
                ) : null}
              </div>
              {hasActiveFilters ? (
                <p className="mt-2 text-xs text-slate-500">
                  {filteredUsers.length} de {users.length} usuário
                  {users.length === 1 ? "" : "s"}
                </p>
              ) : null}
            </div>
          ) : null}

          {!loading && users.length > 0 && filteredUsers.length === 0 ? (
            <div className="p-4">
              <SystemFeedback
                variant="info"
                title="Nenhum resultado"
                message="Nenhum usuário corresponde aos filtros informados. Ajuste o e-mail ou o nome ou limpe os filtros."
              />
            </div>
          ) : null}

          {(loading || filteredUsers.length > 0) && (
            <UserTable
              users={filteredUsers}
              loading={loading}
              saving={saving}
              onEdit={openEdit}
              onToggleActive={requestToggleActive}
            />
          )}
        </section>

        <UserForm
          mode={mode}
          form={form}
          editPassword={editPassword}
          saving={saving}
          feedback={formFeedback}
          onFormChange={(updates) => setForm((f) => ({ ...f, ...updates }))}
          onEditPasswordChange={setEditPassword}
          onSubmit={(e) => void handleSubmit(e)}
          onCancelEdit={mode === "edit" ? openCreate : undefined}
        />
      </div>

      <ConfirmDialog
        open={userToInactivate != null}
        title="Inativar usuário"
        confirmLabel="Inativar"
        confirmVariant="danger"
        loading={saving}
        onCancel={() => setUserToInactivate(null)}
        onConfirm={() => {
          if (userToInactivate) void executeToggleActive(userToInactivate);
        }}
      >
        <p>
          Deseja inativar <strong>{userToInactivate ? displayName(userToInactivate) : ""}</strong> (
          {userToInactivate?.email})?
        </p>
        <p className="mt-3 text-sm text-slate-600">
          Esta ação impede o login no dashboard. Os dados do usuário são preservados e a conta pode
          ser reativada a qualquer momento.
        </p>
      </ConfirmDialog>
    </>
  );
}
