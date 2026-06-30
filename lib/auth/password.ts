/** Valida par de senhas; retorna mensagem de erro ou null se OK. */
export function validatePasswordPair(password: string, confirm: string): string | null {
  if (password.length < 6) {
    return "A senha deve ter pelo menos 6 caracteres.";
  }
  if (password !== confirm) {
    return "As senhas não coincidem.";
  }
  return null;
}
