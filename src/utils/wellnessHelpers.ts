// src/utils/wellnessHelpers.ts
import type {
  Appointment,
  PlanDoctorReview,
  WellnessProfile,
} from '../types/patient';
import { extractYouTubeId } from './blogContent';

export function computeBmi(
  heightCm?: number | string | null,
  weightKg?: number | string | null
): number | null {
  const h = Number(heightCm);
  const w = Number(weightKg);
  if (!h || !w || h <= 0 || w <= 0) return null;
  const m = h / 100;
  return Number((w / (m * m)).toFixed(1));
}

export function getBmiCategory(bmi: number | null): string {
  if (bmi === null) return 'Unknown';
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}

export function isWellnessProfileFilled(profile?: WellnessProfile | null): boolean {
  if (!profile) return false;
  const bd = profile.basicDetails || {};
  const hi = profile.healthInfo || {};
  const cond = hi.conditions || {};
  const ls = profile.lifestyle || {};
  const fh = profile.foodHabits || {};
  return Boolean(
    bd.heightCm ||
      bd.weightKg ||
      bd.bodyType ||
      cond.diabetes ||
      cond.highBP ||
      cond.obesityFocus ||
      cond.skinDisease ||
      cond.jointPainArthritis ||
      cond.digestiveIssues ||
      cond.respiratoryIssues ||
      cond.other?.length ||
      hi.medications?.length ||
      hi.allergies?.length ||
      ls.activityLevel ||
      ls.sleepHours ||
      ls.sleepQuality ||
      ls.stressLevel ||
      ls.exerciseHabits ||
      ls.workRoutine ||
      fh.dietType ||
      (fh.regionalPreference && fh.regionalPreference !== 'no_preference') ||
      fh.preferredFoods?.length ||
      fh.dislikedFoods?.length ||
      fh.eatingTimings ||
      fh.waterIntakeLiters ||
      profile.season?.current
  );
}

export function resolvePlanDoctorReview(
  status?: string,
  doctorReview?: PlanDoctorReview
): {
  isDoctorApproved: boolean;
  isDoctorModified: boolean;
  doctorName: string;
  reviewedDate: string;
  notes: string;
} {
  const isDoctorApproved = Boolean(
    doctorReview?.published || status === 'doctor_approved'
  );
  const isDoctorModified = Boolean(
    isDoctorApproved || status === 'ai_modified'
  );

  let doctorName = doctorReview?.doctorName || '';
  if (!doctorName && doctorReview?.reviewedBy) {
    if (typeof doctorReview.reviewedBy === 'object') {
      const full = `${doctorReview.reviewedBy.firstName || ''} ${
        doctorReview.reviewedBy.lastName || ''
      }`.trim();
      if (full) {
        doctorName = /^dr\.?\s+/i.test(full) ? full : `Dr. ${full}`;
      }
    } else if (typeof doctorReview.reviewedBy === 'string') {
      doctorName = doctorReview.reviewedBy;
    }
  }
  if (!doctorName) doctorName = 'your Ayurvedic doctor';

  let reviewedDate = '';
  if (doctorReview?.reviewedAt) {
    const d = new Date(doctorReview.reviewedAt);
    if (!Number.isNaN(d.getTime())) {
      reviewedDate = d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }
  }

  return {
    isDoctorApproved,
    isDoctorModified,
    doctorName,
    reviewedDate,
    notes: doctorReview?.notes || '',
  };
}

export function getAsanaVideoMeta(name: string, link?: string): {
  watchUrl: string;
  thumbnailUrl?: string;
  isDirectVideo: boolean;
} {
  const trimmed = (link || '').trim();
  const ytId = trimmed ? extractYouTubeId(trimmed) : null;
  if (ytId) {
    return {
      watchUrl: `https://www.youtube.com/watch?v=${ytId}`,
      thumbnailUrl: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
      isDirectVideo: true,
    };
  }
  if (trimmed && /^https?:\/\//i.test(trimmed)) {
    return {
      watchUrl: trimmed,
      isDirectVideo: true,
    };
  }
  return {
    watchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(
      `${name} yoga asana tutorial`
    )}`,
    isDirectVideo: false,
  };
}

export function getBookingDoctorName(booking: Appointment): string {
  const docObj = typeof booking.doctorId === 'object' ? booking.doctorId : null;
  const raw =
    booking.doctorName ||
    (docObj
      ? `${docObj.firstName || ''} ${docObj.lastName || ''}`.trim()
      : '');
  if (!raw) return 'Ayurvedic Specialist';
  return /^dr\.?\s+/i.test(raw) ? raw : `Dr. ${raw}`;
}

export function getBookingDisplayDate(booking: Appointment): string {
  const raw = booking.dateOfAppointment || booking.date;
  if (!raw) return '';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return String(raw);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function getBookingDisplayTime(booking: Appointment): string {
  return booking.timeSlot || booking.time || '';
}

export function getBookingDietFee(booking?: Appointment | null): number {
  if (!booking) return 299;
  const docObj = typeof booking.doctorId === 'object' ? booking.doctorId : null;
  if (docObj?.dietPlanFee !== undefined && docObj.dietPlanFee !== null) {
    return Number(docObj.dietPlanFee);
  }
  if (booking.dietPlanFee && Number(booking.dietPlanFee) > 0) {
    return Number(booking.dietPlanFee);
  }
  return 299;
}

export function isBookingAccepted(booking: Appointment): boolean {
  const ra = booking.requestAccept?.toLowerCase();
  if (ra) return ra === 'accepted';
  return booking.status === 'confirmed' || booking.status === 'completed';
}

export function getBookingTimestamp(booking: Appointment): number | null {
  const rawDate = booking.dateOfAppointment || booking.date;
  if (!rawDate) return null;

  let year: number;
  let month: number;
  let day: number;

  const isoDateMatch = String(rawDate).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoDateMatch) {
    year = Number(isoDateMatch[1]);
    month = Number(isoDateMatch[2]) - 1;
    day = Number(isoDateMatch[3]);
  } else {
    const parsed = new Date(rawDate);
    if (Number.isNaN(parsed.getTime())) return null;
    year = parsed.getFullYear();
    month = parsed.getMonth();
    day = parsed.getDate();
  }

  const rawTime = (booking.timeSlot || booking.time || '').trim();
  const timeMatch = rawTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (timeMatch) {
    let hours = Number(timeMatch[1]);
    const minutes = Number(timeMatch[2]);
    const meridiem = timeMatch[3]?.toUpperCase();
    if (meridiem === 'PM' && hours < 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;
    return new Date(year, month, day, hours, minutes, 0, 0).getTime();
  }

  return new Date(year, month, day, 23, 59, 59, 999).getTime();
}

export function resolveBookingStatus(
  booking: Appointment
): 'pending' | 'confirmed' | 'completed' | 'cancelled' {
  if (booking.status === 'completed' || booking.status === 'cancelled') {
    return booking.status;
  }
  const ra = booking.requestAccept?.toLowerCase();
  if (ra === 'denied') return 'cancelled';

  const scheduledMs = getBookingTimestamp(booking);
  if (scheduledMs !== null && scheduledMs + 3600000 < Date.now()) {
    return 'completed';
  }

  if (ra === 'pending' || booking.status === 'pending') return 'pending';
  return 'confirmed';
}
