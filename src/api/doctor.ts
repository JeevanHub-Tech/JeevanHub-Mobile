// src/api/doctor.ts
import { apiClient } from './client';
import {
  DayOfWeek,
  DoctorAppointment,
  DoctorProfile,
  MedicineCatalogItem,
  PatientDossier,
  SlotItem,
} from '../types/doctor';

export const doctorApi = {
  // ─── Practice & Bookings ───────────────────────────────────────────────────
  async getDoctorBookings(doctorId: string): Promise<DoctorAppointment[]> {
    try {
      const response = await apiClient.get<any>(`/api/bookings/doctor/${doctorId}`);
      const data = response.data;
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.bookings)) return data.bookings;
      return [];
    } catch (err) {
      console.error('Error fetching doctor bookings:', err);
      return [];
    }
  },

  async getBookingById(bookingId: string): Promise<DoctorAppointment | null> {
    try {
      const response = await apiClient.get<any>(`/api/bookings/${bookingId}`);
      return response.data.booking || response.data;
    } catch {
      return null;
    }
  },

  async updateBookingStatus(bookingId: string, status: 'accepted' | 'completed' | 'denied'): Promise<any> {
    const response = await apiClient.put(`/api/bookings/update/${bookingId}`, {
      requestAccept: status,
    });
    return response.data;
  },

  async getDailyJoinInfo(bookingId: string): Promise<{ url?: string; roomUrl?: string } | null> {
    try {
      const response = await apiClient.get<{ url?: string; roomUrl?: string }>(
        `/api/bookings/${bookingId}/daily-join`
      );
      const url = response.data?.url || response.data?.roomUrl;
      return url ? { url, roomUrl: url } : response.data;
    } catch {
      return null;
    }
  },

  async getDailyJoinUrl(bookingId: string): Promise<string> {
    const response = await apiClient.get<{ url?: string; roomUrl?: string }>(
      `/api/bookings/${bookingId}/daily-join`
    );
    const url = response.data?.url || response.data?.roomUrl;
    if (!url) {
      throw new Error('Video room URL was not returned by server.');
    }
    return url;
  },

  async getDoctorReviews(doctorId: string): Promise<DoctorAppointment[]> {
    try {
      const response = await apiClient.get<{ bookings?: DoctorAppointment[] }>(
        `/api/bookings/doctor/reviews/${doctorId}`
      );
      return Array.isArray(response.data?.bookings) ? response.data.bookings : [];
    } catch {
      return [];
    }
  },

  // ─── Slot & Availability Management ────────────────────────────────────────
  async getDoctorProfile(doctorId: string): Promise<any> {
    const response = await apiClient.get<any>(`/api/doctors/getDoctorById/${doctorId}`);
    return response.data.doctor || response.data;
  },

  async addSlotTemplate(day: DayOfWeek, slot: SlotItem): Promise<any> {
    const response = await apiClient.post('/api/doctors/slots/template', {
      day,
      startTime: slot.startTime,
      duration: slot.duration,
      fee: slot.fee,
      consultationType: slot.consultationType || 'Online',
      sessionType: slot.sessionType || '1-to-1',
      maxCapacity: slot.maxCapacity || 1,
    });
    return response.data;
  },

  async toggleDisableDay(day: DayOfWeek, disable: boolean): Promise<any> {
    const response = await apiClient.put(`/api/doctors/slots/template/${day}/toggle-disable-all`, {
      disable,
    });
    return response.data;
  },

  async deleteSlotTemplate(day: DayOfWeek, slotId: string): Promise<any> {
    const response = await apiClient.delete(`/api/doctors/slots/template/${day}/${slotId}`);
    return response.data;
  },

  async editSlotTemplate(day: DayOfWeek, slotId: string, updates: Partial<SlotItem>): Promise<any> {
    const response = await apiClient.put(`/api/doctors/slots/template/${day}/${slotId}`, updates);
    return response.data;
  },

  async cancelDateSlots(dateStr: string, reason?: string): Promise<any> {
    const response = await apiClient.post('/api/doctors/slots/cancel-date', {
      date: dateStr,
      reason,
    });
    return response.data;
  },

  // ─── Medicine Catalog & Prescriptions ──────────────────────────────────────
  async searchMedicines(query: string = ''): Promise<MedicineCatalogItem[]> {
    try {
      const response = await apiClient.get<any>('/api/medicines', {
        params: query ? { search: query } : undefined,
      });
      const data = response.data;
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.medicines)) return data.medicines;
      if (data && Array.isArray(data.data)) return data.data;
      return [];
    } catch {
      return [];
    }
  },

  async addSupplementToBooking(
    bookingId: string,
    supplement: {
      medicineId?: string;
      medicineName?: string;
      dosage: string;
      instructions: string;
    }
  ): Promise<any> {
    const response = await apiClient.post(`/api/bookings/${bookingId}/supplements`, supplement);
    return response.data;
  },

  async deleteSupplement(bookingId: string, supplementId: string): Promise<any> {
    const response = await apiClient.delete(`/api/bookings/${bookingId}/supplements/${supplementId}`);
    return response.data;
  },

  async updateDiagnosis(bookingId: string, diagnosis: string): Promise<any> {
    const response = await apiClient.put(`/api/bookings/${bookingId}/diagnosis`, { diagnosis });
    return response.data;
  },

  async publishPrescription(bookingId: string): Promise<any> {
    const response = await apiClient.post(`/api/bookings/${bookingId}/notify-prescription`);
    return response.data;
  },

  // ─── Patient Dossier & Medical Vault Access ────────────────────────────────
  async getPatientDossier(patientId: string): Promise<PatientDossier | null> {
    try {
      // 1. Get patient record & details
      const patientRes = await apiClient.get<any>(`/api/patients/getPatient/${patientId}`);
      const patient = patientRes.data.patient || patientRes.data;

      // 2. Get past consultations with this doctor
      let consultations: DoctorAppointment[] = [];
      try {
        const historyRes = await apiClient.get<any>(`/api/bookings/history/patient/${patientId}`);
        consultations = historyRes.data.bookings || [];
      } catch {
        // Fallback
      }

      // 3. Get Dosha profile
      let doshaAssessment = null;
      try {
        const doshaRes = await apiClient.get<any>(`/api/ayurveda/dosha-assessment/patient/${patientId}`);
        doshaAssessment = doshaRes.data.assessment || null;
      } catch {
        // Optional
      }

      // 4. Get Medical Records Vault
      let medicalHistory: any[] = [];
      try {
        const vaultRes = await apiClient.get<any>(`/api/patients/${patientId}/medical-history`);
        medicalHistory = vaultRes.data.medicalHistory || vaultRes.data.records || [];
      } catch {
        // Optional
      }

      return {
        patient,
        doshaAssessment,
        medicalHistory,
        consultations,
      };
    } catch (err) {
      console.error('Error fetching patient dossier:', err);
      return null;
    }
  },

  // ─── Profile & Clinical Settings ───────────────────────────────────────────
  async updateDoctorProfile(doctorId: string, updates: any): Promise<any> {
    const response = await apiClient.put(`/api/doctors/updateDoctor/${doctorId}`, updates);
    return response.data;
  },
};
