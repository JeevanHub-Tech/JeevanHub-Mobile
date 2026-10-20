// src/types/auth.ts

export type UserRole = 'patient' | 'doctor' | 'admin' | 'retailer';

export interface User {
  id: string;
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: UserRole;
  profileImage?: string;
  gender?: string;
  age?: number;
  dob?: string;
  zipCode?: string;
  // Doctor specific fields
  registrationNumber?: string;
  specialization?: string[] | string;
  experience?: number;
  education?: string;
  designation?: string;
  price?: number;
  approvalStatus?: string;
  upiId?: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: User;
  forcePasswordReset?: boolean;
}

export interface RegisterPatientPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  countryCode?: string;
  dob?: string;
  gender: string;
  zipCode: string;
  password: string;
}

export interface RegisterDoctorPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  countryCode?: string;
  dob?: string;
  gender: string;
  zipCode: string;
  registrationNumber: string;
  specialization: string;
  experience: number;
  education: string;
  designation: string;
  price: number;
  upiId?: string;
  password: string;
  certificateUri?: string;
  certificateFileName?: string;
  certificateMimeType?: string;
}
