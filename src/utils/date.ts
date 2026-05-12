import { format, parseISO, differenceInMinutes } from 'date-fns';

export const formatTime = (dateString: string) => {
  try {
    return format(parseISO(dateString), 'h:mm a');
  } catch {
    return 'N/A';
  }
};

export const formatDate = (dateString: string) => {
  try {
    return format(parseISO(dateString), "EEE, MMM d, h:mm a");
  } catch {
    return 'N/A';
  }
};

export const calculateDuration = (startTime: string, endTime: string) => {
  try {
    const start = parseISO(startTime);
    const end = parseISO(endTime);
    const diff = differenceInMinutes(end, start);
    return `${diff} min`;
  } catch {
    return '0 min';
  }
};
