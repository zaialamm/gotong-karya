import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a number to an IDR currency string.
 * e.g., 100000 -> "Rp 100.000"
 * @param value The number to format.
 * @returns Formatted IDR string or "Rp " if value is invalid/undefined.
 */
export function formatToIDR(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) {
    return 'Rp ';
  }
  // Ensure we are dealing with integers for typical IDR display without decimals for large amounts
  // If decimals are needed, toLocaleString('id-ID', { style: 'currency', currency: 'IDR' }) is more robust
  // but might include 'Rp' differently or add unwanted decimals like ,00.
  // For "Rp 1.234.567" format:
  return `Rp ${Math.floor(value).toLocaleString('id-ID')}`;
}

/**
 * Parses an IDR currency string back to a number.
 * e.g., "Rp 100.000" -> 100000
 * @param value The IDR string to parse.
 * @returns The parsed number, or NaN if parsing fails.
 */
export function parseFromIDR(value: string): number {
  if (!value) return NaN;
  // Remove "Rp" prefix (case-insensitive), spaces, and all dots (thousand separators).
  const numericString = value.replace(/Rp\s*|\./gi, '').trim();
  // If commas were used as decimal separators, they'd need specific handling.
  // Assuming integer input or that dots are thousand separators.
  const number = parseInt(numericString, 10);
  return isNaN(number) ? NaN : number;
}
