import { defineStore } from 'pinia';
import {
  getNotificationsApi,
  getUnreadCountApi,
  markAsReadApi,
  markAllAsReadApi,
} from '@/api/notification';
import type { Notification } from '@/types/entities';

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    list: [] as Notification[],
    unreadCount: 0,
  }),
  getters: {
    unreadList: (state) => state.list.filter((n) => !n.isRead),
  },
  actions: {
    async fetchList() {
      this.list = await getNotificationsApi();
      return this.list;
    },
    async fetchUnreadCount() {
      const result = await getUnreadCountApi();
      this.unreadCount = result.count;
      return result.count;
    },
    async markAsRead(id: number, isRead: boolean = true) {
      const updated = await markAsReadApi(id, isRead);
      const idx = this.list.findIndex((n) => n.id === id);
      if (idx !== -1) {
        this.list[idx] = updated;
      }
      if (isRead) {
        this.unreadCount = Math.max(0, this.unreadCount - 1);
      } else {
        this.unreadCount += 1;
      }
      return updated;
    },
    async markAllAsRead() {
      await markAllAsReadApi();
      this.list.forEach((n) => {
        n.isRead = true;
      });
      this.unreadCount = 0;
    },
    prepend(notification: Notification) {
      this.list.unshift(notification);
      if (!notification.isRead) {
        this.unreadCount += 1;
      }
    },
  },
});
