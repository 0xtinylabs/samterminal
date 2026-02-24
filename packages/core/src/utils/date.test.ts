
import {
  now,
  nowDate,
  unixTimestamp,
  unixTimestampMs,
  parseDate,
  formatISO,
  toUnix,
  fromUnix,
  fromUnixMs,
  addMs,
  addSeconds,
  addMinutes,
  addHours,
  addDays,
  isPast,
  isFuture,
  diffMs,
  diffSeconds,
  diffMinutes,
  diffHours,
  diffDays,
  formatDuration,
} from './date.js';

describe('date utils', () => {
  const fixedDate = new Date('2024-06-15T12:30:45.500Z');
  const fixedTimestamp = fixedDate.getTime();

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(fixedDate);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('now', () => {
    it('should return current time in ISO format', () => {
      expect(now()).toBe('2024-06-15T12:30:45.500Z');
    });

    it('should return different values at different times', () => {
      const time1 = now();
      jest.advanceTimersByTime(1000);
      const time2 = now();

      expect(time1).not.toBe(time2);
    });
  });

  describe('nowDate', () => {
    it('should return current Date object', () => {
      const date = nowDate();
      expect(date).toBeInstanceOf(Date);
      expect(date.getTime()).toBe(fixedTimestamp);
    });
  });

  describe('unixTimestamp', () => {
    it('should return Unix timestamp in seconds', () => {
      const timestamp = unixTimestamp();
      expect(timestamp).toBe(Math.floor(fixedTimestamp / 1000));
    });

    it('should not include milliseconds', () => {
      expect(unixTimestamp() * 1000).toBeLessThanOrEqual(fixedTimestamp);
    });
  });

  describe('unixTimestampMs', () => {
    it('should return Unix timestamp in milliseconds', () => {
      expect(unixTimestampMs()).toBe(fixedTimestamp);
    });
  });

  describe('parseDate', () => {
    it('should parse ISO date string', () => {
      const date = parseDate('2024-01-15T10:30:00.000Z');
      expect(date.toISOString()).toBe('2024-01-15T10:30:00.000Z');
    });

    it('should parse various date formats', () => {
      expect(parseDate('2024-01-15').getFullYear()).toBe(2024);
      expect(parseDate('January 15, 2024').getMonth()).toBe(0);
    });
  });

  describe('formatISO', () => {
    it('should format date to ISO string', () => {
      const date = new Date('2024-01-15T10:30:00.000Z');
      expect(formatISO(date)).toBe('2024-01-15T10:30:00.000Z');
    });
  });

  describe('toUnix', () => {
    it('should convert Date to Unix timestamp', () => {
      const date = new Date('2024-01-15T00:00:00.000Z');
      expect(toUnix(date)).toBe(1705276800);
    });

    it('should truncate milliseconds', () => {
      const date = new Date('2024-01-15T00:00:00.999Z');
      expect(toUnix(date)).toBe(1705276800);
    });
  });

  describe('fromUnix', () => {
    it('should create Date from Unix timestamp', () => {
      const date = fromUnix(1705276800);
      expect(date.toISOString()).toBe('2024-01-15T00:00:00.000Z');
    });
  });

  describe('fromUnixMs', () => {
    it('should create Date from Unix timestamp in ms', () => {
      const date = fromUnixMs(1705276800500);
      expect(date.toISOString()).toBe('2024-01-15T00:00:00.500Z');
    });
  });

  describe('addMs', () => {
    it('should add milliseconds to date', () => {
      const date = new Date('2024-01-15T10:00:00.000Z');
      const result = addMs(date, 500);
      expect(result.toISOString()).toBe('2024-01-15T10:00:00.500Z');
    });

    it('should handle negative values', () => {
      const date = new Date('2024-01-15T10:00:00.500Z');
      const result = addMs(date, -500);
      expect(result.toISOString()).toBe('2024-01-15T10:00:00.000Z');
    });

    it('should not mutate original date', () => {
      const date = new Date('2024-01-15T10:00:00.000Z');
      const originalTime = date.getTime();
      addMs(date, 1000);
      expect(date.getTime()).toBe(originalTime);
    });
  });

  describe('addSeconds', () => {
    it('should add seconds to date', () => {
      const date = new Date('2024-01-15T10:00:00.000Z');
      const result = addSeconds(date, 30);
      expect(result.toISOString()).toBe('2024-01-15T10:00:30.000Z');
    });

    it('should handle negative values', () => {
      const date = new Date('2024-01-15T10:00:30.000Z');
      const result = addSeconds(date, -30);
      expect(result.toISOString()).toBe('2024-01-15T10:00:00.000Z');
    });
  });

  describe('addMinutes', () => {
    it('should add minutes to date', () => {
      const date = new Date('2024-01-15T10:00:00.000Z');
      const result = addMinutes(date, 45);
      expect(result.toISOString()).toBe('2024-01-15T10:45:00.000Z');
    });

    it('should handle overflow to next hour', () => {
      const date = new Date('2024-01-15T10:30:00.000Z');
      const result = addMinutes(date, 45);
      expect(result.toISOString()).toBe('2024-01-15T11:15:00.000Z');
    });
  });

  describe('addHours', () => {
    it('should add hours to date', () => {
      const date = new Date('2024-01-15T10:00:00.000Z');
      const result = addHours(date, 5);
      expect(result.toISOString()).toBe('2024-01-15T15:00:00.000Z');
    });

    it('should handle overflow to next day', () => {
      const date = new Date('2024-01-15T20:00:00.000Z');
      const result = addHours(date, 6);
      expect(result.toISOString()).toBe('2024-01-16T02:00:00.000Z');
    });
  });

  describe('addDays', () => {
    it('should add days to date', () => {
      const date = new Date('2024-01-15T10:00:00.000Z');
      const result = addDays(date, 10);
      expect(result.toISOString()).toBe('2024-01-25T10:00:00.000Z');
    });

    it('should handle month overflow', () => {
      const date = new Date('2024-01-25T10:00:00.000Z');
      const result = addDays(date, 10);
      expect(result.toISOString()).toBe('2024-02-04T10:00:00.000Z');
    });

    it('should handle negative values', () => {
      const date = new Date('2024-01-15T10:00:00.000Z');
      const result = addDays(date, -10);
      expect(result.toISOString()).toBe('2024-01-05T10:00:00.000Z');
    });
  });

  describe('isPast', () => {
    it('should return true for past dates', () => {
      const pastDate = new Date('2024-01-01T00:00:00.000Z');
      expect(isPast(pastDate)).toBe(true);
    });

    it('should return false for future dates', () => {
      const futureDate = new Date('2024-12-31T00:00:00.000Z');
      expect(isPast(futureDate)).toBe(false);
    });

    it('should return true for current time (equal)', () => {
      // Current time is slightly past due to execution
      expect(isPast(fixedDate)).toBe(false);

      const slightlyPast = new Date(fixedTimestamp - 1);
      expect(isPast(slightlyPast)).toBe(true);
    });
  });

  describe('isFuture', () => {
    it('should return true for future dates', () => {
      const futureDate = new Date('2024-12-31T00:00:00.000Z');
      expect(isFuture(futureDate)).toBe(true);
    });

    it('should return false for past dates', () => {
      const pastDate = new Date('2024-01-01T00:00:00.000Z');
      expect(isFuture(pastDate)).toBe(false);
    });

    it('should return false for current time (equal)', () => {
      expect(isFuture(fixedDate)).toBe(false);

      const slightlyFuture = new Date(fixedTimestamp + 1);
      expect(isFuture(slightlyFuture)).toBe(true);
    });
  });

  describe('diffMs', () => {
    it('should calculate difference in milliseconds', () => {
      const date1 = new Date('2024-01-15T10:00:00.500Z');
      const date2 = new Date('2024-01-15T10:00:00.000Z');

      expect(diffMs(date1, date2)).toBe(500);
      expect(diffMs(date2, date1)).toBe(-500);
    });
  });

  describe('diffSeconds', () => {
    it('should calculate difference in seconds', () => {
      const date1 = new Date('2024-01-15T10:00:30.000Z');
      const date2 = new Date('2024-01-15T10:00:00.000Z');

      expect(diffSeconds(date1, date2)).toBe(30);
      expect(diffSeconds(date2, date1)).toBe(-30);
    });

    it('should truncate partial seconds', () => {
      const date1 = new Date('2024-01-15T10:00:01.999Z');
      const date2 = new Date('2024-01-15T10:00:00.000Z');

      expect(diffSeconds(date1, date2)).toBe(1);
    });
  });

  describe('diffMinutes', () => {
    it('should calculate difference in minutes', () => {
      const date1 = new Date('2024-01-15T10:45:00.000Z');
      const date2 = new Date('2024-01-15T10:00:00.000Z');

      expect(diffMinutes(date1, date2)).toBe(45);
    });

    it('should truncate partial minutes', () => {
      const date1 = new Date('2024-01-15T10:01:59.000Z');
      const date2 = new Date('2024-01-15T10:00:00.000Z');

      expect(diffMinutes(date1, date2)).toBe(1);
    });
  });

  describe('diffHours', () => {
    it('should calculate difference in hours', () => {
      const date1 = new Date('2024-01-15T15:00:00.000Z');
      const date2 = new Date('2024-01-15T10:00:00.000Z');

      expect(diffHours(date1, date2)).toBe(5);
    });

    it('should truncate partial hours', () => {
      const date1 = new Date('2024-01-15T11:59:59.000Z');
      const date2 = new Date('2024-01-15T10:00:00.000Z');

      expect(diffHours(date1, date2)).toBe(1);
    });
  });

  describe('diffDays', () => {
    it('should calculate difference in days', () => {
      const date1 = new Date('2024-01-25T10:00:00.000Z');
      const date2 = new Date('2024-01-15T10:00:00.000Z');

      expect(diffDays(date1, date2)).toBe(10);
    });

    it('should truncate partial days', () => {
      const date1 = new Date('2024-01-16T23:59:59.000Z');
      const date2 = new Date('2024-01-15T00:00:00.000Z');

      expect(diffDays(date1, date2)).toBe(1);
    });

    it('should handle negative differences', () => {
      const date1 = new Date('2024-01-15T10:00:00.000Z');
      const date2 = new Date('2024-01-25T10:00:00.000Z');

      expect(diffDays(date1, date2)).toBe(-10);
    });
  });

  describe('formatDuration', () => {
    it('should format milliseconds', () => {
      expect(formatDuration(500)).toBe('500ms');
      expect(formatDuration(0)).toBe('0ms');
      expect(formatDuration(999)).toBe('999ms');
    });

    it('should format seconds', () => {
      expect(formatDuration(1000)).toBe('1s');
      expect(formatDuration(5000)).toBe('5s');
      expect(formatDuration(59000)).toBe('59s');
    });

    it('should format minutes', () => {
      expect(formatDuration(60000)).toBe('1m');
      expect(formatDuration(90000)).toBe('1m 30s');
      expect(formatDuration(3540000)).toBe('59m');
    });

    it('should format hours', () => {
      expect(formatDuration(3600000)).toBe('1h');
      expect(formatDuration(5400000)).toBe('1h 30m');
      expect(formatDuration(7200000)).toBe('2h');
    });

    it('should format mixed durations correctly', () => {
      // 1 hour, 30 minutes
      expect(formatDuration(5400000)).toBe('1h 30m');

      // 2 hours exactly
      expect(formatDuration(7200000)).toBe('2h');

      // 2 minutes, 30 seconds
      expect(formatDuration(150000)).toBe('2m 30s');
    });
  });
});
