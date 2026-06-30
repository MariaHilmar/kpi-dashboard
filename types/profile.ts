export type UserRole = "admin" | "user";

export type UserProfile = {
  id: string;
  email: string;
  full_name: string | null;
  /** ID global GitLab vinculado à conta (preferencial para filtro de issues). */
  gitlab_user_id: number | null;
  /** Valor legado de issues.autor (fallback se gitlab_user_id estiver vazio). */
  autor_issues: string | null;
  role: UserRole;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type CreateUserInput = {
  email: string;
  password: string;
  full_name?: string;
  gitlab_user_id?: number | null;
  autor_issues?: string;
  role?: UserRole;
  active?: boolean;
};

export type UpdateUserInput = {
  full_name?: string | null;
  gitlab_user_id?: number | null;
  autor_issues?: string | null;
  role?: UserRole;
  active?: boolean;
  password?: string;
};
