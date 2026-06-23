export const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
};

export const formatDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getRemainingHoursToday = (): number => {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimeFloat = currentHour + currentMinute / 60.0;
  const officeEndHour = 18.0; // 6:00 PM
  const remaining = officeEndHour - currentTimeFloat;
  return Math.min(8.0, Math.max(0.0, remaining));
};

export const calculateWorkingHours = (
  startDateStr: string,
  endDateStr: string,
  holidays: string[]
): number => {
  if (!startDateStr || !endDateStr) return 0;
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
    return 0;
  }

  const holidaysSet = new Set(holidays);
  let totalHours = 0;
  const current = new Date(start);
  const todayStr = formatDateString(new Date());

  while (current <= end) {
    const currentStr = formatDateString(current);
    if (!isWeekend(current) && !holidaysSet.has(currentStr)) {
      if (currentStr === todayStr) {
        totalHours += getRemainingHoursToday();
      } else {
        totalHours += 8.0;
      }
    }
    current.setDate(current.getDate() + 1);
  }

  return totalHours;
};

export const calculateEndDate = (
  startDateStr: string,
  estimatedHours: number,
  holidays: string[]
): string => {
  if (!startDateStr) return '';
  const start = new Date(startDateStr);
  if (isNaN(start.getTime()) || estimatedHours <= 0) {
    return startDateStr;
  }

  const holidaysSet = new Set(holidays);
  let remainingHours = estimatedHours;
  const current = new Date(start);
  const todayStr = formatDateString(new Date());
  let lastWorkingDay = new Date(start);

  while (remainingHours > 0) {
    const currentStr = formatDateString(current);
    if (isWeekend(current) || holidaysSet.has(currentStr)) {
      current.setDate(current.getDate() + 1);
      continue;
    }

    lastWorkingDay = new Date(current);
    let capacity = 8.0;
    if (currentStr === todayStr) {
      capacity = getRemainingHoursToday();
    }

    if (capacity <= 0) {
      current.setDate(current.getDate() + 1);
      continue;
    }

    if (remainingHours <= capacity) {
      remainingHours = 0;
    } else {
      remainingHours -= capacity;
      current.setDate(current.getDate() + 1);
    }
  }

  return formatDateString(lastWorkingDay);
};
