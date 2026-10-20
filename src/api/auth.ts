// src/api/auth.ts
import { apiClient } from './client';
import {
  LoginResponse,
  RegisterDoctorPayload,
  RegisterPatientPayload,
  User,
  UserRole,
} from '../types/auth';

export const authApi = {
  // Login user (patient, doctor, admin, retailer)
  async login(email: string, password: string, role: UserRole): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/api/auth/login', {
      email,
      password,
      role,
    });
    return response.data;
  },

  // Register patient
  async registerPatient(payload: RegisterPatientPayload): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/api/auth/register/patient', {
      ...payload,
      countryCode: payload.countryCode || '+91',
    });
    return response.data;
  },

  // Register doctor (multipart upload including certificate)
  async registerDoctor(payload: RegisterDoctorPayload): Promise<LoginResponse> {
    const formData = new FormData();

    formData.append('firstName', payload.firstName);
    formData.append('lastName', payload.lastName);
    formData.append('email', payload.email);
    formData.append('phone', payload.phone);
    formData.append('countryCode', payload.countryCode || '+91');
    formData.append('registrationNumber', payload.registrationNumber);
    formData.append('specialization', payload.specialization);
    formData.append('experience', String(payload.experience));
    formData.append('education', payload.education);
    formData.append('designation', payload.designation);
    formData.append('price', String(payload.price));
    formData.append('gender', payload.gender);
    formData.append('zipCode', payload.zipCode);
    formData.append('password', payload.password);

    if (payload.dob) formData.append('dob', payload.dob);
    if (payload.upiId) formData.append('upiId', payload.upiId);

    // Attach certificate file if picked
    if (payload.certificateUri) {
      const filename = payload.certificateFileName || 'certificate.jpg';
      const type = payload.certificateMimeType || 'image/jpeg';

      formData.append('certificate', {
        uri: payload.certificateUri,
        name: filename,
        type,
      } as any);
    }

    const response = await apiClient.post<LoginResponse>('/api/auth/register/doctor', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  // Fetch current logged-in user profile
  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<{ user: User }>('/api/auth/user');
    return response.data.user;
  },

  // Logout
  async logout(): Promise<void> {
    try {
      await apiClient.post('/api/auth/logout');
    } catch {
      // Best-effort logout
    }
  },
};
