import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatKg = (kg: number) =>
  kg >= 1000
    ? `${(kg / 1000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} t`
    : `${Math.round(kg).toLocaleString("fr-FR")} kg`;

export const formatTons = (kg: number, digits = 1) =>
  (kg / 1000).toLocaleString("fr-FR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);
