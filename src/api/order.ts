// src/api/order.ts
import { apiClient } from './client';
import { CreateOrderPayload, OrderHistoryItem } from '../types/cart';

export const orderApi = {
  async createOrder(payload: CreateOrderPayload): Promise<any> {
    const response = await apiClient.post('/api/orders', payload);
    return response.data;
  },

  async uploadPaymentProof(orderId: string, imageUri: string, mimeType: string = 'image/jpeg'): Promise<any> {
    const formData = new FormData();
    const filename = imageUri.split('/').pop() || `receipt_${Date.now()}.jpg`;

    formData.append('paymentProof', {
      uri: imageUri,
      name: filename,
      type: mimeType,
    } as any);

    const response = await apiClient.post(`/api/orders/${orderId}/payment-proof`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async getOrdersByPatient(patientId: string): Promise<OrderHistoryItem[]> {
    try {
      const response = await apiClient.get<any>(`/api/orders/getOrdersByBuyerId/${patientId}`);
      const data = response.data;
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.orders)) return data.orders;
      return [];
    } catch (err) {
      console.error('Error fetching patient orders:', err);
      return [];
    }
  },

  async getOrderById(orderId: string): Promise<OrderHistoryItem | null> {
    try {
      const response = await apiClient.get<any>(`/api/orders/${orderId}`);
      return response.data.order || response.data;
    } catch {
      return null;
    }
  },

  async getOrderTracking(orderId: string): Promise<any> {
    try {
      const response = await apiClient.get<any>(`/api/orders/${orderId}/tracking`);
      return response.data;
    } catch {
      return null;
    }
  },

  async submitOrderReview(orderId: string, rating: number, comment?: string): Promise<any> {
    const response = await apiClient.put(`/api/orders/updateOrderReview/${orderId}`, {
      rating,
      comment,
    });
    return response.data;
  },
};
