import { format, parseISO, differenceInDays, isAfter, isBefore, startOfDay, eachDayOfInterval } from 'date-fns';

export const safeParse = (date: Date | string | null | undefined): Date | null => {
  if (!date) return null;
  if (date instanceof Date) {
    return isNaN(date.getTime()) ? null : date;
  }
  try {
    const parsed = parseISO(date);
    if (parsed && !isNaN(parsed.getTime())) {
      return parsed;
    }
  } catch (e) {}
  return null;
};

export const parseTimeToMinutes = (timePart: string): number => {
  const clean = timePart.trim().toUpperCase();
  const match = clean.match(/(\d+):(\d+)\s*(AM|PM)/);
  if (!match) return 0;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const ampm = match[3];
  
  if (ampm === 'PM' && hours < 12) {
    hours += 12;
  } else if (ampm === 'AM' && hours === 12) {
    hours = 0;
  }
  return hours * 60 + minutes;
};

export const parseTimeRange = (rangeStr: string): { start: number, end: number } | null => {
  if (!rangeStr) return null;
  const parts = rangeStr.split('-');
  if (parts.length !== 2) return null;
  return {
    start: parseTimeToMinutes(parts[0]),
    end: parseTimeToMinutes(parts[1])
  };
};

export const formatDate = (date: Date | string) => {
  try {
    const d = typeof date === 'string' ? safeParse(date) : date;
    if (!d || isNaN(d.getTime())) return '';
    return format(d, 'yyyy-MM-dd');
  } catch (e) {
    return '';
  }
};

export const getTodayStr = () => formatDate(new Date());

export const calculateAttendance = (records: Record<string, any>, initialHeld = 0, initialAttended = 0, startDate?: string, exams: any[] = []) => {
  let totalHeld = initialHeld;
  let totalAttended = initialAttended;

  const start = safeParse(startDate) ? startOfDay(safeParse(startDate)!) : null;

  const isExamDay = (dateStr: string) => {
    return exams.some(e => {
      if (!e.startDate || !e.endDate) return false;
      const startParsed = safeParse(e.startDate);
      const endParsed = safeParse(e.endDate);
      const dParsed = safeParse(dateStr);
      if (!startParsed || !endParsed || !dParsed) {
        return false;
      }
      const start = startOfDay(startParsed);
      const end = startOfDay(endParsed);
      const d = startOfDay(dParsed);
      return d >= start && d <= end;
    });
  };

  Object.entries(records).forEach(([date, record]: [string, any]) => {
    if (start) {
      const parsedDate = safeParse(date);
      if (parsedDate) {
        const d = startOfDay(parsedDate);
        if (isBefore(d, start)) return;
      }
    }
    
    if (!record.isHoliday && !isExamDay(date)) {
      totalHeld += record.held;
      totalAttended += record.attended;
    }
  });

  const percentage = totalHeld > 0 ? (totalAttended / totalHeld) * 100 : 0;
  return { totalHeld, totalAttended, percentage };
};

export const calculateBunkInfo = (totalHeld: number, totalAttended: number, target: number) => {
  if (totalHeld === 0) return { canBunk: 0, mustAttend: 0, status: 'OK' };

  const currentPercentage = (totalAttended / totalHeld) * 100;

  if (currentPercentage >= target) {
    // How many can bunk?
    // (totalAttended) / (totalHeld + x) >= target/100
    // totalAttended >= (target/100) * (totalHeld + x)
    // (totalAttended / (target/100)) - totalHeld >= x
    const canBunk = Math.floor((totalAttended * 100) / target - totalHeld);
    return { canBunk: Math.max(0, canBunk), mustAttend: 0, status: 'SAFE' };
  } else {
    // How many must attend?
    // (totalAttended + x) / (totalHeld + x) >= target/100
    // (totalAttended + x) * 100 >= target * (totalHeld + x)
    // 100*totalAttended + 100x >= target*totalHeld + target*x
    // (100 - target)x >= target*totalHeld - 100*totalAttended
    // x >= (target*totalHeld - 100*totalAttended) / (100 - target)
    const mustAttend = Math.ceil((target * totalHeld - 100 * totalAttended) / (100 - target));
    return { canBunk: 0, mustAttend: Math.max(0, mustAttend), status: 'WARNING' };
  }
};
