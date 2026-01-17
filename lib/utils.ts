import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDateTimeGregorian(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return dateStr
    
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).replace(',', '')
  } catch (e) {
    return dateStr
  }
}
