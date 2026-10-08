// Turns API errors into messages for the user.
import { ApiError } from "../api/apiClient";

const MESSAGES: Record<string, string> = {
  network_error: "Impossible de joindre le serveur. Vérifiez votre connexion.",
  invalid_credentials: "E-mail ou mot de passe incorrect.",
  email_already_registered: "Un compte existe déjà avec cet e-mail.",
  forbidden: "Vous n'avez pas les droits pour faire cela.",
  owner_required: "Seul le propriétaire du projet peut faire cela.",
  last_admin: "Il doit toujours rester au moins un administrateur.",
  owner_role_immutable: "Le propriétaire du projet doit rester administrateur.",
  cannot_remove_owner: "Le propriétaire ne peut pas être retiré du projet. Transférez d'abord la propriété.",
  not_a_project_member: "Cette personne doit d'abord être membre du projet.",
  project_not_found: "Ce projet n'existe pas ou vous n'y avez pas accès.",
  user_not_found: "Cet utilisateur n'existe pas.",
  invite_not_found: "Ce lien d'invitation n'est pas valide.",
  invite_revoked: "Ce lien d'invitation a été révoqué.",
  invite_expired: "Ce lien d'invitation a expiré.",
  invite_exhausted: "Ce lien d'invitation a atteint son nombre maximal d'utilisations.",
  already_member: "Vous faites déjà partie de ce projet.",
  already_revoked: "Ce lien est déjà révoqué.",
  api_key_not_found: "Cette clé n'existe plus.",
  rate_limit_exceeded: "Trop de requêtes. Patientez un instant puis réessayez.",
};

export function errorMessage(err: unknown, fallback = "Une erreur est survenue. Réessayez."): string {
  if (err instanceof ApiError) {
    if (err.status === 429) return "Trop de tentatives. Patientez une minute puis réessayez.";
    if (err.status >= 500) return "Le serveur a rencontré un problème. Réessayez dans un instant.";
    if (MESSAGES[err.code]) return MESSAGES[err.code];
    if (err.status === 403) return MESSAGES.forbidden;
    if (err.details.length > 0) return err.details.join(" ");
  }
  return fallback;
}
