// src/api/notification.ts
import { apiClient } from './client';
import { AppNotification } from '../types/notification';

export const notificationApi = {
  async getNotifications(): Promise<AppNotification[]> {
    try {
      const response = await apiClient.get<AppNotification[]>('/api/notifications');
      return Array.isArray(response.data) ? response.data : [];
    } catch (err) {
      console.error('Error fetching notifications:', err);
      return [];
    }
  },

  async markAllRead(): Promise<any> {
    const response = await apiClient.put('/api/notifications/read-all');
    return response.data;
  },

  async markSingleRead(notificationId: string): Promise<any> {
    const response = await apiClient.put(`/api/notifications/${notificationId}/read`);
    return response.data;
  },

  async deleteNotification(notificationId: string): Promise<any> {
    const response = await apiClient.delete(`/api/notifications/${notificationId}`);
    return response.data;
  },
};
