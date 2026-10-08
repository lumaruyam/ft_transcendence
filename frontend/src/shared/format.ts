const rtf = new Intl.RelativeTimeFormat("fr", { numeric: "auto" });
const dateFmt = new Intl.DateTimeFormat("fr", { day: "numeric", month: "long", year: "numeric" });
const dateShortFmt = new Intl.DateTimeFormat("fr", { day: "numeric", month: "short", year: "numeric" });
const dateTimeFmt = new Intl.DateTimeFormat("fr", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31536000],
  ["month", 2592000],
  ["week", 604800],
  ["day", 86400],
  ["hour", 3600],
  ["minute", 60],
];

// e.g. "il y a 3 heures"
export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "";
  const seconds = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
  const abs = Math.abs(seconds);
  if (abs < 45) return "à l'instant";
  for (const [unit, size] of UNITS) {
    if (abs >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return rtf.format(Math.round(seconds / 60), "minute");
}

export function formatDate(iso: string | null | undefined): string {
  return iso ? dateFmt.format(new Date(iso)) : "";
}

export function formatDateShort(iso: string | null | undefined): string {
  return iso ? dateShortFmt.format(new Date(iso)) : "";
}

export function formatDateTime(iso: string | null | undefined): string {
  return iso ? dateTimeFmt.format(new Date(iso)) : "";
}

export function greeting(name: string): string {
  const hour = new Date().getHours();
  const word = hour < 5 || hour >= 18 ? "Bonsoir" : "Bonjour";
  return `${word}, ${name.split(/\s+/)[0]}`;
}

export const ROLE_LABEL = { admin: "Administrateur", member: "Membre", viewer: "Lecteur" } as const;
export const ROLE_HINT = {
  admin: "Gère le projet, les membres et les clés API",
  member: "Crée et modifie les cartes, les notes et le tableau blanc",
  viewer: "Consulte seulement",
} as const;
