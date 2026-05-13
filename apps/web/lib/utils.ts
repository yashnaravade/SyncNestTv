import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { isAxiosError } from "axios";

/**
 * Utility function to merge Tailwind CSS classes
 * Handles conflicts between class names properly
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Human-readable message from NestJS / axios error responses
 */
export function getApiErrorMessage(err: unknown, fallback = "Something went wrong. Please try again.") {
  if (!isAxiosError(err)) {
    return err instanceof Error ? err.message : fallback;
  }
  const data = err.response?.data as { message?: string | string[] } | undefined;
  if (!data?.message) return fallback;
  if (Array.isArray(data.message)) return data.message.join(". ");
  return data.message;
}