// src/api/cart.ts
import { apiClient } from './client';
import { PatientCartResponse } from '../types/cart';

export const cartApi = {
  async getCart(patientId: string): Promise<PatientCartResponse> {
    const response = await apiClient.get<PatientCartResponse>(`/api/cart/${patientId}`);
    return response.data;
  },

  async updateQuantity(
    patientId: string,
    medicineId: string,
    action: 'increment' | 'decrement',
    doctorId?: string | null
  ): Promise<any> {
    if (doctorId) {
      const response = await apiClient.put(`/api/cart/doctor/${doctorId}/update-quantity`, {
        patientId,
        medicineId,
        action,
      });
      return response.data;
    }
    const response = await apiClient.put('/api/cart/update-quantity', {
      patientId,
      medicineId,
      action,
    });
    return response.data;
  },

  async removeItem(
    patientId: string,
    medicineId: string,
    doctorId?: string | null
  ): Promise<any> {
    if (doctorId) {
      const response = await apiClient.delete(`/api/cart/doctor/${doctorId}/remove-item`, {
        data: { patientId, medicineId },
      });
      return response.data;
    }
    const response = await apiClient.delete('/api/cart/remove', {
      data: { patientId, medicineId },
    });
    return response.data;
  },

  async addToCart(patientId: string, medicineId: string, quantity: number = 1): Promise<any> {
    const response = await apiClient.post('/api/cart/add', {
      patientId,
      medicineId,
      quantity,
    });
    return response.data;
  },

  async moveDoctorCartToDefault(patientId: string, doctorId: string): Promise<any> {
    const response = await apiClient.post(`/api/cart/doctor/${doctorId}/move-to-default`, {
      patientId,
    });
    return response.data;
  },
};
