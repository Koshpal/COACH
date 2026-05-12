import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

export const IST_TIMEZONE = 'Asia/Kolkata';

export function utcToIST(utcDate: string | Date) {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  return toZonedTime(date, IST_TIMEZONE);
}

export function formatToIST(utcDate: string | Date, formatStr = 'hh:mm a') {
  const istDate = utcToIST(utcDate);
  return format(istDate, formatStr);
}

export function formatTimeIST(utcDate: string | Date) {
  return formatToIST(utcDate, 'hh:mm a');
}

export function formatDateIST(utcDate: string | Date) {
  return formatToIST(utcDate, 'dd MMM yyyy');
}

export function formatDateTimeIST(utcDate: string | Date) {
  return formatToIST(utcDate, 'dd MMM yyyy, hh:mm a');
}
