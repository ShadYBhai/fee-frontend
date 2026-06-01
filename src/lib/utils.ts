import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import dayjs from 'dayjs';

/** Merge Tailwind classes safely — OLA-inspired pattern */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format rupee amount: ₹1,500 */
export function formatMoney(amount: number | string): string {
  const num = typeof amount === 'number' ? amount : parseFloat(String(amount)) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function monthName(month: number): string {
  return MONTHS[month - 1] ?? '';
}

export function monthShort(month: number): string {
  return monthName(month).slice(0, 3);
}

/** "June 2026" or "Jan–Mar 2026" */
export function formatPeriod(mFrom: number, yFrom: number, mTo: number, yTo: number): string {
  if (mFrom === mTo && yFrom === yTo) return `${monthName(mFrom)} ${yFrom}`;
  if (yFrom === yTo) return `${monthShort(mFrom)}–${monthShort(mTo)} ${yFrom}`;
  return `${monthShort(mFrom)} ${yFrom} – ${monthShort(mTo)} ${yTo}`;
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—';
  return dayjs(date).format('D MMM YYYY');
}

export function getCurrentMonth() {
  return new Date().getMonth() + 1;
}

export function getCurrentYear() {
  return new Date().getFullYear();
}

export function calcMonthsBetween(mFrom: number, yFrom: number, mTo: number, yTo: number): number {
  return (yTo - yFrom) * 12 + (mTo - mFrom) + 1;
}

/** Build WhatsApp deep-link with pre-filled message */
export function buildWhatsAppLink(mobile: string, message: string): string {
  const clean = mobile.replace(/\D/g, '');
  const number = clean.length === 10 ? `91${clean}` : clean;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
