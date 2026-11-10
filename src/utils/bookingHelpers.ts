// src/utils/bookingHelpers.ts

export function getBookingDate(b: any): Date {
  const raw = b?.dateOfAppointment || b?.date;
  if (!raw) return new Date();
  const d = new Date(raw);
  return isNaN(d.getTime()) ? new Date() : d;
}

export function isBookingToday(b: any): boolean {
  const d = getBookingDate(b);
  const now = new Date();
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
}

export function isBookingCompleted(b: any): boolean {
  if (b?.status === 'completed') return true;
  if (b?.requestAccept === 'denied' || b?.status === 'cancelled') return false;

  const d = getBookingDate(b);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

  // Past dates before today are considered completed if accepted
  if (d < startOfToday) {
    return b?.requestAccept === 'accepted' || b?.status === 'confirmed';
  }

  // Today or future dates:
  // Completed if doctor entered diagnosis, prescribed supplements, or status was marked completed
  if (
    Boolean(b?.diagnosis && String(b.diagnosis).trim()) ||
    (Array.isArray(b?.recommendedSupplements) && b.recommendedSupplements.length > 0)
  ) {
    return true;
  }

  return false;
}

export function isBookingUpcoming(b: any): boolean {
  if (b?.requestAccept === 'denied' || b?.status === 'cancelled') return false;
  if (isBookingCompleted(b)) return false;
  return true;
}

export function formatBookingDate(b: any): string {
  const d = getBookingDate(b);
  const now = new Date();

  if (isBookingToday(b)) {
    return 'Today';
  }

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (
    d.getDate() === tomorrow.getDate() &&
    d.getMonth() === tomorrow.getMonth() &&
    d.getFullYear() === tomorrow.getFullYear()
  ) {
    return 'Tomorrow';
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear()
  ) {
    return 'Yesterday';
  }

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthName = months[d.getMonth()];
  const day = d.getDate();
  if (d.getFullYear() !== now.getFullYear()) {
    return `${day} ${monthName} ${d.getFullYear()}`;
  }
  return `${day} ${monthName}`;
}

export function formatBookingTime(b: any): string {
  // If time is explicitly set
  if (b?.time && typeof b.time === 'string' && b.time.trim() && !b.time.includes('undefined')) {
    return cleanTimeSlot(b.time);
  }
  // If timeSlot is set (e.g. "11:30 AM" or "11:30" or "11:30 - 12:00")
  if (b?.timeSlot && typeof b.timeSlot === 'string' && b.timeSlot.trim()) {
    return cleanTimeSlot(b.timeSlot);
  }

  // Fallback to dateOfAppointment
  const d = getBookingDate(b);
  if (!isNaN(d.getTime())) {
    let hours = d.getHours();
    const minutes = d.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
    const hrStr = hours < 10 ? `0${hours}` : `${hours}`;
    return `${hrStr}:${minStr} ${ampm}`;
  }

  return '10:00 AM';
}

function cleanTimeSlot(str: string): string {
  const first = str.split('-')[0].trim();
  // If first is "11:30", convert to 12-hour AM/PM
  if (!first.toLowerCase().includes('am') && !first.toLowerCase().includes('pm')) {
    const parts = first.split(':');
    if (parts.length >= 2) {
      let h = parseInt(parts[0], 10);
      const m = parts[1].slice(0, 2);
      if (!isNaN(h)) {
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12;
        h = h ? h : 12;
        const hrStr = h < 10 ? `0${h}` : `${h}`;
        return `${hrStr}:${m} ${ampm}`;
      }
    }
  }
  return first;
}

export function getBookingMode(b: any): 'Online Video' | 'In-Clinic' {
  if (b?.consultationType) {
    const ct = String(b.consultationType).toLowerCase();
    if (ct.includes('person') || ct.includes('clinic')) return 'In-Clinic';
    if (ct.includes('online') || ct.includes('video')) return 'Online Video';
  }
  if ((b?.meetLink && b.meetLink !== 'no') || b?.dailyRoomUrl) {
    return 'Online Video';
  }
  return 'In-Clinic';
}

export function getBookingFee(b: any, fallbackPrice?: number): number {
  return Number(b?.amountPaid || b?.fee || fallbackPrice || 600);
}

export function getBookingComplaints(b: any): string {
  return b?.patientIllness || b?.symptoms || '';
}

export function getBookingStatusLabel(b: any): { label: string; isCompleted: boolean; isDenied: boolean } {
  if (b?.requestAccept === 'denied' || b?.status === 'cancelled') {
    return { label: 'DENIED', isCompleted: false, isDenied: true };
  }
  if (isBookingCompleted(b)) {
    return { label: 'COMPLETED', isCompleted: true, isDenied: false };
  }
  return { label: 'UPCOMING', isCompleted: false, isDenied: false };
}
