// Mirrors backend auth.validation.ts, with one message per field.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PASSWORD_LENGTH = 8;

export function validateEmail(email: string): string | null {
  if (!email.trim()) return "Entrez votre adresse e-mail.";
  if (!EMAIL_RE.test(email.trim())) return "Cette adresse e-mail ne semble pas valide.";
  return null;
}

export function validateName(name: string): string | null {
  return name.trim() ? null : "Entrez le nom à afficher.";
}

export interface PasswordChecks {
  length: boolean;
  letter: boolean;
  digit: boolean;
}

export function passwordChecks(password: string): PasswordChecks {
  return {
    length: password.length >= MIN_PASSWORD_LENGTH,
    letter: /[a-zA-Z]/.test(password),
    digit: /[0-9]/.test(password),
  };
}

export function validateNewPassword(password: string): string | null {
  const checks = passwordChecks(password);
  if (!password) return "Choisissez un mot de passe.";
  if (!checks.length) return `Le mot de passe doit faire au moins ${MIN_PASSWORD_LENGTH} caractères.`;
  if (!checks.letter || !checks.digit) return "Le mot de passe doit contenir au moins une lettre et un chiffre.";
  return null;
}
