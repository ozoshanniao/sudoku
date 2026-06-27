import { describe, it, expect } from 'vitest';
import { formatLocalDateKey, getPreviousLocalDateKey } from './localDate';

describe('Local Date Utilities', () => {
  describe('formatLocalDateKey', () => {
    it('should format a normal date correctly, padding months and days', () => {
      const date = new Date(2026, 5, 22); // June 22, 2026 (Month is 0-indexed)
      expect(formatLocalDateKey(date)).toBe('2026-06-22');
      
      const date2 = new Date(2026, 11, 5); // Dec 5, 2026
      expect(formatLocalDateKey(date2)).toBe('2026-12-05');
      
      const date3 = new Date(2026, 0, 1); // Jan 1, 2026
      expect(formatLocalDateKey(date3)).toBe('2026-01-01');
    });
  });

  describe('getPreviousLocalDateKey', () => {
    it('should handle a normal consecutive day', () => {
      const date = new Date(2026, 5, 22); // June 22, 2026
      expect(getPreviousLocalDateKey(date)).toBe('2026-06-21');
    });

    it('should handle crossing month boundaries', () => {
      const date = new Date(2026, 2, 1); // March 1, 2026
      expect(getPreviousLocalDateKey(date)).toBe('2026-02-28'); // Non-leap year
      
      const date2 = new Date(2026, 5, 1); // June 1, 2026
      expect(getPreviousLocalDateKey(date2)).toBe('2026-05-31');
    });

    it('should handle leap year boundaries', () => {
      const date = new Date(2024, 2, 1); // March 1, 2024
      expect(getPreviousLocalDateKey(date)).toBe('2024-02-29'); // Leap year
    });

    it('should handle year boundaries', () => {
      const date = new Date(2026, 0, 1); // Jan 1, 2026
      expect(getPreviousLocalDateKey(date)).toBe('2025-12-31');
    });
  });
});
