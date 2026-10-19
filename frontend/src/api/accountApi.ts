import { apiRequest } from "./apiClient";
import type { NotificationRow, SearchResult } from "./types";

// the newest notifications, and how many are unread in total (not only in the returned page)
export async function listNotifications(limit = 30): Promise<{ notifications: NotificationRow[]; unreadCount: number }> {
  return apiRequest<{ notifications: NotificationRow[]; unreadCount: number }>({ method: "GET", path: `/notifications?limit=${limit}` });
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiRequest<{ updated: number }>({ method: "PUT", path: "/notifications/read-all" });
}

export function markNotificationRead(id: string): Promise<void> {
  return apiRequest<void>({ method: "PUT", path: `/notifications/${id}/read` });
}

export async function searchProject(projectId: string, query: string): Promise<SearchResult[]> {
  const { results } = await apiRequest<{ results: SearchResult[] }>({
    method: "GET",
    path: `/search/${projectId}?q=${encodeURIComponent(query)}`,
  });
  return results;
}

// transferTo is needed when you are the only admin of a shared project
export function deleteAccount(userId: string, transferTo?: string): Promise<void> {
  return apiRequest<void>({ method: "DELETE", path: `/users/${userId}`, body: transferTo ? { transferTo } : {} });
}
