// src/api/patient.ts
import { apiClient } from './client';
import {
  Appointment,
  CreateBookingPayload,
  DoctorProfile,
  DoshaResult,
  MedicalRecordItem,
} from '../types/patient';

export const patientApi = {
  // ─── Doctor Discovery ────────────────────────────────────────────────────────
  async getDoctors(): Promise<DoctorProfile[]> {
    try {
      const response = await apiClient.get<any>('/api/doctors/allDoctors');
      // Backend may return array or { doctors: [...] }
      const data = response.data;
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.doctors)) return data.doctors;
      if (data && Array.isArray(data.data)) return data.data;
      return [];
    } catch (err) {
      console.warn('Fallback to publicDoctors');
      const fallback = await apiClient.get<any>('/api/doctors/publicDoctors');
      const data = fallback.data;
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.doctors)) return data.doctors;
      return [];
    }
  },

  async getDoctorById(id: string): Promise<DoctorProfile> {
    const response = await apiClient.get<any>(`/api/doctors/getDoctorById/${id}`);
    const data = response.data;
    return data.doctor || data.data || data;
  },

  async getDoctorSlots(doctorId: string, dateStr: string): Promise<any> {
    try {
      const response = await apiClient.get(`/api/doctors/${doctorId}/slots/${dateStr}`);
      return response.data;
    } catch {
      return { slots: [] };
    }
  },

  // ─── Appointments & Booking ──────────────────────────────────────────────────
  async createBooking(payload: CreateBookingPayload): Promise<Appointment> {
    const response = await apiClient.post<any>('/api/bookings', payload);
    return response.data.booking || response.data;
  },

  async getPatientBookings(patientId: string): Promise<Appointment[]> {
    try {
      const response = await apiClient.get<any>(`/api/bookings/patient/${patientId}`);
      const data = response.data;
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.bookings)) return data.bookings;
      return [];
    } catch {
      return [];
    }
  },

  // ─── Ayurveda Prakriti & Wellness ────────────────────────────────────────────
  async getDoshaAssessment(): Promise<DoshaResult | null> {
    try {
      const response = await apiClient.get<any>('/api/ayurveda/dosha-assessment');
      return response.data?.assessment || null;
    } catch {
      return null;
    }
  },

  async submitDoshaAssessment(assessmentData: any): Promise<any> {
    const response = await apiClient.post<any>('/api/ayurveda/dosha-assessment', assessmentData);
    return response.data;
  },

  // ─── Medical Vault / Records ─────────────────────────────────────────────────
  async getMedicalHistory(patientId: string): Promise<MedicalRecordItem[]> {
    try {
      const response = await apiClient.get<any>(`/api/patients/${patientId}/medical-history`);
      const data = response.data;
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.records)) return data.records;
      if (data && Array.isArray(data.medicalHistory)) return data.medicalHistory;
      return [];
    } catch {
      return [];
    }
  },

  async uploadMedicalRecord(patientId: string, file: { uri: string; name: string; type: string }): Promise<any> {
    const formData = new FormData();
    formData.append('documents', {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as any);

    const response = await apiClient.post(`/api/patients/${patientId}/medical-history`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // ─── Sanjeevani AI Assistant ─────────────────────────────────────────────────
  async sendChatMessage(userId: string, message: string): Promise<{ reply: string }> {
    const response = await apiClient.post<{ response?: string; reply?: string; message?: string }>('/api/chat/message', {
      userId,
      message,
      isRegistered: true,
      userRole: 'patient',
    });

    const reply = response.data.response || response.data.reply || response.data.message || 'I am listening. How can I assist your health journey?';
    return { reply };
  },
};
