// src/types/notification.ts

export type NotificationType =
  | 'order'
  | 'payment'
  | 'delivery'
  | 'system'
  | 'appointment'
  | 'diet'
  | 'diet_plan'
  | 'yoga'
  | 'dispute'
  | 'review';

export interface AppNotification {
  _id: string;
  userId: string;
  role: 'doctor' | 'admin' | 'patient' | 'retailer';
  orderId: string;
  type: NotificationType;
  message: string;
  isRead: boolean;
  createdAt: string;
}
