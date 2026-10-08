export type Role = "admin" | "member" | "viewer";

export interface Project {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Member {
  projectId?: string;
  userId: string;
  role: Role;
  user: { id: string; name: string; email: string; avatar: string | null; createdAt?: string };
}

export interface Invite {
  id: string;
  projectId: string;
  role: Role;
  maxUses: number | null;
  useCount: number;
  expiresAt: string | null;
  createdAt: string;
  revokedAt: string | null;
}

export interface ApiKeyRow {
  id: string;
  projectId: string | null;
  rateLimit: number;
  createdAt: string;
  userId: string | null;
}

export interface NotificationRow {
  id: string;
  type: string;
  payload: { message?: string; url?: string | null; cardId?: string } & Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
}

export interface SearchResult {
  entityType: "card" | "note" | "attachment";
  entityId: string;
  title: string;
  snippet: string;
}
