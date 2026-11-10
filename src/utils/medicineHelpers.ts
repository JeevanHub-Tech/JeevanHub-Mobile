// src/utils/medicineHelpers.ts
import { BACKEND_URL } from '../config';
import type { MedicineItem, MedicineRetailerInfo } from '../types/patient';

export function resolveMedicineImageUrl(imgPath?: string | null): string | null {
  if (!imgPath) return null;
  const trimmed = imgPath.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const clean = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${BACKEND_URL}${clean}`;
}

export function getMedicineThumbUrl(medicine?: Partial<MedicineItem> | null): string | null {
  if (!medicine) return null;
  const first = (medicine.images || []).filter(Boolean)[0] || medicine.image;
  return resolveMedicineImageUrl(first);
}

export function getRetailerDisplayName(
  retailer?: MedicineRetailerInfo | string | null
): string {
  if (!retailer || typeof retailer === 'string') return 'JeevanHub Verified Pharmacy';
  if (retailer.BusinessName && retailer.BusinessName.trim()) {
    return retailer.BusinessName.trim();
  }
  const full = `${retailer.firstName || ''} ${retailer.lastName || ''}`.trim();
  return full || 'JeevanHub Verified Pharmacy';
}

export function isRetailerVerified(
  retailer?: MedicineRetailerInfo | string | null
): boolean {
  if (!retailer || typeof retailer === 'string') return false;
  return Boolean(retailer.adminVerification?.isVerified);
}

export function formatInr(amount?: number | null): string {
  const num = Number(amount);
  if (!Number.isFinite(num)) return '₹0.00';
  return `₹${num.toFixed(2)}`;
}

