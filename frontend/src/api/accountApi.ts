import { apiRequest } from "./apiClient";
import type { NotificationRow, SearchResult } from "./types";

export async function listNotifications(): Promise<NotificationRow[]> {
  const { notifications } = await apiRequest<{ notifications: NotificationRow[] }>({ method: "GET", path: "/notifications" });
  return notifications;
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
