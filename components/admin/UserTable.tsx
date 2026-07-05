import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBan, faCheck, faPenToSquare } from "@fortawesome/free-solid-svg-icons";

import type { UserProfile } from "@/types/profile";

type Props = {
  users: UserProfile[];
  loading: boolean;
  saving: boolean;
  onEdit: (user: UserProfile) => void;
  onToggleActive: (user: UserProfile) => void;
};

export function UserTable({ users, loading, saving, onEdit, onToggleActive }: Props) {
  if (loading) {
    return <div className="p-6 text-sm text-slate-500">Carregando…</div>;
  }

  if (users.length === 0) {
    return <div className="p-6 text-sm text-slate-500">Nenhum usuário encontrado.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-2 font-medium">E-mail</th>
            <th className="px-4 py-2 font-medium">Nome</th>
            <th className="px-4 py-2 font-medium">Papel</th>
            <th className="px-4 py-2 font-medium">Status</th>
            <th className="px-4 py-2 font-medium">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-slate-50">
              <td className="px-4 py-2 text-slate-900">{user.email}</td>
              <td className="px-4 py-2 text-slate-600">{user.full_name ?? "—"}</td>
              <td className="px-4 py-2">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    user.role === "admin"
                      ? "bg-indigo-100 text-indigo-800"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {user.role === "admin" ? "Admin" : "Usuário"}
                </span>
              </td>
              <td className="px-4 py-2">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    user.active
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-rose-100 text-rose-800"
                  }`}
                >
                  {user.active ? "Ativo" : "Inativo"}
                </span>
              </td>
              <td className="px-4 py-2">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(user)}
                    className="inline-flex items-center gap-1.5 rounded-button border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                  >
                    <FontAwesomeIcon icon={faPenToSquare} className="w-3" aria-hidden />
                    Editar
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => onToggleActive(user)}
                    className={`inline-flex items-center gap-1.5 rounded-button border px-2 py-1 text-xs disabled:opacity-50 ${
                      user.active
                        ? "border-rose-200 text-rose-600 hover:bg-rose-50"
                        : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                    }`}
                  >
                    <FontAwesomeIcon
                      icon={user.active ? faBan : faCheck}
                      className="w-3"
                      aria-hidden
                    />
                    {user.active ? "Inativar" : "Ativar"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
