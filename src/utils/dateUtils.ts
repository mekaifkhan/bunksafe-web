import { format, parseISO, differenceInDays, isAfter, isBefore, startOfDay, eachDayOfInterval } from 'date-fns';

export const formatDate = (date: Date | string) => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'yyyy-MM-dd');
};

export const getTodayStr = () => formatDate(new Date());

export const calculateAttendance = (records: Record<string, any>, initialHeld = 0, initialAttended = 0, startDate?: string, exams: any[] = []) => {
  let totalHeld = initialHeld;
  let totalAttended = initialAttended;

  const start = startDate ? startOfDay(parseISO(startDate)) : null;

  const isExamDay = (dateStr: string) => {
    return exams.some(e => {
      const start = startOfDay(parseISO(e.startDate));
      const end = startOfDay(parseISO(e.endDate));
      const d = startOfDay(parseISO(dateStr));
      return d >= start && d <= end;
    });
  };

  Object.entries(records).forEach(([date, record]: [string, any]) => {
    if (start) {
      const d = startOfDay(parseISO(date));
      if (isBefore(d, start)) return;
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
