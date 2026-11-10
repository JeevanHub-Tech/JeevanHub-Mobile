// src/api/consultation.ts
import { apiClient } from './client';

export interface DailyJoinResponse {
  url?: string;
  roomUrl?: string;
  token?: string;
  error?: string;
}

export const consultationApi = {
  async getDailyJoinInfo(bookingId: string): Promise<DailyJoinResponse | null> {
    try {
      const response = await apiClient.get<DailyJoinResponse>(`/api/bookings/${bookingId}/daily-join`);
      return response.data;
    } catch (err: any) {
      console.warn('Daily join info error:', err?.response?.data || err.message);
      return null;
    }
  },

  async getBooking(bookingId: string): Promise<any> {
    try {
      const response = await apiClient.get(`/api/bookings/${bookingId}`);
      return response.data.booking || response.data;
    } catch {
      return null;
    }
  },

  async endConsultation(bookingId: string): Promise<any> {
    try {
      const response = await apiClient.put(`/api/bookings/update/${bookingId}`, {
        requestAccept: 'completed',
      });
      return response.data;
    } catch (err) {
      console.error('Error completing booking:', err);
      return null;
    }
  },
};
