import { describe, it, expect } from 'vitest';
import { resolveTheme, isValidTheme } from '../lib/theme';

describe('resolveTheme', () => {
  it('returns light/dark as-is regardless of system preference', () => {
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('light', false)).toBe('light');
    expect(resolveTheme('dark', true)).toBe('dark');
    expect(resolveTheme('dark', false)).toBe('dark');
  });

  it('follows the system preference when theme is "system"', () => {
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
  });
});

describe('isValidTheme', () => {
  it('accepts the 3 known values', () => {
    expect(isValidTheme('light')).toBe(true);
    expect(isValidTheme('dark')).toBe(true);
    expect(isValidTheme('system')).toBe(true);
  });

  it('rejects anything else', () => {
    expect(isValidTheme('blue')).toBe(false);
    expect(isValidTheme(null)).toBe(false);
    expect(isValidTheme(undefined)).toBe(false);
    expect(isValidTheme(1)).toBe(false);
  });
});
