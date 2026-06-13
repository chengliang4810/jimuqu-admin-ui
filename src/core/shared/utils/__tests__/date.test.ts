import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone.js';
import utc from 'dayjs/plugin/utc.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { formatDate, formatDateTime, isDate, isDayjsObject } from '../date';

dayjs.extend(utc);
dayjs.extend(timezone);

describe('dateUtils', () => {
  const sampleISO = '2024-10-30T12:34:56Z';
  const sampleTimestamp = Date.parse(sampleISO);

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ===============================
  // formatDate
  // ===============================
  describe('formatDate', () => {
    it('should format a valid ISO date string', () => {
      const formatted = formatDate(sampleISO, 'YYYY/MM/DD');
      expect(formatted).toMatch(/2024\/10\/30/);
    });

    it('should format a timestamp correctly', () => {
      const formatted = formatDate(sampleTimestamp);
      expect(formatted).toMatch(/2024-10-30/);
    });

    it('should format a Date object', () => {
      const formatted = formatDate(new Date(sampleISO));
      expect(formatted).toMatch(/2024-10-30/);
    });

    it('should format a dayjs object', () => {
      const formatted = formatDate(dayjs(sampleISO));
      expect(formatted).toMatch(/2024-10-30/);
    });

    it('should return original input if date is invalid', () => {
      const invalid = 'not-a-date';
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const formatted = formatDate(invalid);
      expect(formatted).toBe(invalid);
      expect(spy).toHaveBeenCalledOnce();
    });

    it('should apply given format', () => {
      const formatted = formatDate(sampleISO, 'YYYY-MM-DD HH:mm');
      expect(formatted).toMatch(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}/);
    });
  });

  // ===============================
  // formatDateTime
  // ===============================
  describe('formatDateTime', () => {
    it('should format date into full datetime', () => {
      const result = formatDateTime(sampleISO);
      expect(result).toMatch(/2024-10-30 \d{2}:\d{2}:\d{2}/);
    });
  });

  // ===============================
  // isDate
  // ===============================
  describe('isDate', () => {
    it('should return true for Date instances', () => {
      expect(isDate(new Date())).toBe(true);
    });

    it('should return false for non-Date values', () => {
      expect(isDate('2024-10-30')).toBe(false);
      expect(isDate(null)).toBe(false);
      expect(isDate(undefined)).toBe(false);
    });
  });

  // ===============================
  // isDayjsObject
  // ===============================
  describe('isDayjsObject', () => {
    it('should return true for dayjs objects', () => {
      expect(isDayjsObject(dayjs())).toBe(true);
    });

    it('should return false for other values', () => {
      expect(isDayjsObject(new Date())).toBe(false);
      expect(isDayjsObject('string')).toBe(false);
    });
  });
});
