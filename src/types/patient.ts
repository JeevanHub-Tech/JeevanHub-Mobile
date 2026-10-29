// src/types/patient.ts

export interface SlotTemplate {
  _id?: string;
  startTime: string; // e.g. "10:00"
  duration: number; // in minutes
  fee?: number;
  consultationType?: 'Online' | 'In-Person' | 'Both';
  sessionType?: '1-to-1' | 'Group';
  maxCapacity?: number;
  isDisabled?: boolean;
}

export interface DoctorProfile {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  specialization: string[];
  designation?: string;
  education?: string;
  college?: string;
  experience?: number;
  price?: number;
  profileImage?: string;
  rating?: number;
  reviewCount?: number;
  gender?: string;
  address?: string;
  zipCode?: string;
  introduction?: string;
  languages?: string[];
  availableSlots?: {
    Monday?: SlotTemplate[];
    Tuesday?: SlotTemplate[];
    Wednesday?: SlotTemplate[];
    Thursday?: SlotTemplate[];
    Friday?: SlotTemplate[];
    Saturday?: SlotTemplate[];
    Sunday?: SlotTemplate[];
  };
}

export interface Appointment {
  _id: string;
  doctorId: string | DoctorProfile;
  patientId: string;
  patientName?: string;
  doctorName?: string;
  doctorSpecialization?: string[];
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  consultationType: 'Online' | 'In-Person';
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  fee: number;
  notes?: string;
  meetingLink?: string;
  createdAt?: string;
}

export interface CreateBookingPayload {
  doctorId: string;
  patientId: string;
  patientEmail: string;
  patientPhone: string;
  patientName: string;
  date: string;
  timeSlot: string;
  consultationType: 'Online' | 'In-Person';
  symptoms?: string;
  fee: number;
}

export interface DoshaScores {
  vata: number;
  pitta: number;
  kapha: number;
}

export interface DoshaResult {
  dominantDosha: 'Vata' | 'Pitta' | 'Kapha' | 'Vata-Pitta' | 'Pitta-Kapha' | 'Vata-Kapha' | 'Tridoshic';
  scores: DoshaScores;
  description: string;
  dietRecommendations: {
    favor: string[];
    avoid: string[];
  };
  lifestyleTips: string[];
  recommendedHerbs: string[];
}

export interface MedicalRecordItem {
  _id?: string;
  fileName: string;
  url: string;
  uploadedAt: string;
  ocr?: {
    status: 'pending' | 'processing' | 'done' | 'failed';
    doctorName?: string;
    prescriptionDate?: string;
    medicines?: Array<{
      name: string;
      dosage?: string;
      frequency?: string;
      duration?: string;
      instructions?: string;
    }>;
    rawText?: string;
  };
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}
