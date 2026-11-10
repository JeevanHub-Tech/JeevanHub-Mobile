// src/types/doctor.ts
export type { DoctorProfile } from './patient';

export interface SlotItem {
  _id?: string;
  startTime: string; // "09:00", "10:30"
  duration: number; // in minutes (e.g. 30)
  fee?: number;
  consultationType?: 'Online' | 'In-Person' | 'Both';
  sessionType?: '1-to-1' | 'Group';
  maxCapacity?: number;
  isDisabled?: boolean;
}

export type DayOfWeek =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday';

export type WeeklySlots = Record<DayOfWeek, SlotItem[]>;

export interface ScheduleOverride {
  _id?: string;
  date: string;
  type: 'cancelled' | 'rescheduled' | 'added';
  newStartTime?: string;
  newDuration?: number;
}

export interface PrescribedSupplement {
  _id?: string;
  medicineId?: string;
  medicineName: string;
  dosage: string; // e.g. "1 tablet"
  frequency?: string; // "Twice daily"
  timing?: string; // "After meals (Samana Vayu)"
  anupana?: string; // "Warm water / Milk / Honey"
  duration?: string; // "14 days"
  instructions?: string;
  published?: boolean;
}

export interface DoctorAppointment {
  _id: string;
  doctorId: string;
  patientId:
    | string
    | {
        _id: string;
        firstName: string;
        lastName: string;
        phone?: string;
        email?: string;
        gender?: string;
        dob?: string;
        address?: string;
      };
  patientName?: string;
  patientPhone?: string;
  patientEmail?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  dateOfAppointment?: string;
  timeSlot?: string;
  consultationType: 'Online' | 'In-Person';
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  requestAccept?: 'pending' | 'accepted' | 'denied';
  fee: number;
  notes?: string;
  symptoms?: string;
  meetingLink?: string;
  meetLink?: string;
  dailyRoomUrl?: string;
  rating?: number | null;
  review?: string;
  recommendedSupplements?: PrescribedSupplement[];
  createdAt?: string;
}

export interface MedicineCatalogItem {
  _id: string;
  name: string;
  category?: string;
  price?: number;
  description?: string;
  ingredients?: string[];
  dosageForm?: string; // tablet, churna, taila, asava, arishta
}

export interface PatientDossier {
  patient: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    gender?: string;
    dob?: string;
    address?: string;
    zipCode?: string;
  };
  doshaAssessment?: {
    dominantDosha: string;
    scores: {
      vata: number;
      pitta: number;
      kapha: number;
    };
  } | null;
  medicalHistory?: Array<{
    fileName: string;
    url: string;
    uploadedAt: string;
    ocr?: {
      status: string;
      doctorName?: string;
      medicines?: Array<{
        name: string;
        dosage?: string;
        frequency?: string;
        duration?: string;
      }>;
    };
  }>;
  consultations: DoctorAppointment[];
}

export interface DoctorStats {
  todayAppointmentsCount: number;
  upcomingAppointmentsCount: number;
  completedAppointmentsCount: number;
  totalEarnings: number;
  rating: number;
  reviewCount: number;
}
