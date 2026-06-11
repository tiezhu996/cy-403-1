import { http } from './http';
import type { Notification } from '@/types/entities';

export function getNotificationsApi() {
  return http.get<unknown, Notification[]>('/notifications');
}

export function getUnreadCountApi() {
  return http.get<unknown, { count: number }>('/notifications/unread-count');
}

export function markAsReadApi(id: number, isRead: boolean) {
  return http.patch<unknown, Notification>(`/notifications/${id}/read`, { isRead });
}

export function markAllAsReadApi() {
  return http.post<unknown, { success: boolean }>('/notifications/read-all');
}
