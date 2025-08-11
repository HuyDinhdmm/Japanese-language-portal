import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { AxiosError } from 'axios';
import { toast } from 'sonner';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function handleApiError(error: unknown) {
  if (error instanceof AxiosError) {
    const message = error.response?.data?.message || error.message;
    toast.error(message);
    return message;
  }
  
  const message = error instanceof Error ? error.message : 'An error occurred';
  toast.error(message);
  return message;
}

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateTime(date: string) {
  return new Date(date).toLocaleString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
