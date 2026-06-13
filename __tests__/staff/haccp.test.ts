jest.mock('@/lib/db/client');

import { getDb } from '@/lib/db/client';
import {
  computeCompliance,
  fetchHaccpLogs,
  submitHaccpReading,
} from '@/lib/staff/haccp';

const mockSql = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (getDb as jest.Mock).mockReturnValue(mockSql);
});

describe('computeCompliance', () => {
  it.each([
    ['cold_room', 3, true],
    ['cold_room', 4, true],
    ['cold_room', 4.1, false],
    ['cold_room', 8, false],
    ['prep_area', 2, true],
    ['prep_area', 4, true],
    ['prep_area', 5, false],
    ['dishwasher', 63, true],
    ['dishwasher', 70, true],
    ['dishwasher', 62.9, false],
    ['dishwasher', 50, false],
  ])('%s at %s°C → compliant=%s', (location, temp, expected) => {
    expect(computeCompliance(location as any, temp)).toBe(expected);
  });
});

describe('fetchHaccpLogs', () => {
  it('returns mapped logs for a specific date', async () => {
    const dbRow = {
      id: 'abc',
      log_date: '2026-06-13',
      location: 'cold_room',
      temperature_c: '3.5',
      is_compliant: true,
      notes: null,
      recorded_by: null,
      created_at: '2026-06-13T08:00:00Z',
    };
    mockSql.mockResolvedValueOnce([dbRow]);

    const result = await fetchHaccpLogs('2026-06-13');

    expect(result).toHaveLength(1);
    expect(result[0].temperature_c).toBe(3.5);
    expect(result[0].is_compliant).toBe(true);
    expect(result[0].notes).toBeNull();
  });

  it('returns empty array when no logs exist', async () => {
    mockSql.mockResolvedValueOnce([]);
    const result = await fetchHaccpLogs('2026-06-13');
    expect(result).toEqual([]);
  });

  it('fetches recent logs when no date given', async () => {
    mockSql.mockResolvedValueOnce([]);
    const result = await fetchHaccpLogs();
    expect(result).toEqual([]);
  });
});

describe('submitHaccpReading', () => {
  it('inserts a cold_room reading and returns the log', async () => {
    const dbRow = {
      id: 'xyz',
      log_date: '2026-06-13',
      location: 'cold_room',
      temperature_c: '3.2',
      is_compliant: true,
      notes: null,
      recorded_by: 'user-1',
      created_at: '2026-06-13T09:00:00Z',
    };
    mockSql.mockResolvedValueOnce([dbRow]);

    const result = await submitHaccpReading({
      log_date: '2026-06-13',
      location: 'cold_room',
      temperature_c: 3.2,
      recorded_by: 'user-1',
    });

    expect(result.temperature_c).toBe(3.2);
    expect(result.location).toBe('cold_room');
    expect(result.recorded_by).toBe('user-1');
  });

  it('passes is_compliant=false for non-compliant dishwasher temp', async () => {
    const dbRow = {
      id: 'xyz',
      log_date: '2026-06-13',
      location: 'dishwasher',
      temperature_c: '55.0',
      is_compliant: false,
      notes: null,
      recorded_by: null,
      created_at: '2026-06-13T09:00:00Z',
    };
    mockSql.mockResolvedValueOnce([dbRow]);

    const result = await submitHaccpReading({
      log_date: '2026-06-13',
      location: 'dishwasher',
      temperature_c: 55.0,
    });

    // Verify computeCompliance was applied: 55 < 63 → false
    // The value passed to SQL is checked via the mock call args
    const callArgs = mockSql.mock.calls[0];
    // callArgs[0] is the TemplateStringsArray; subsequent args are interpolated values
    // is_compliant=false should appear as one of the interpolated values
    expect(callArgs).toContain(false);
    expect(result.is_compliant).toBe(false);
  });

  it('passes is_compliant=true for compliant cold_room temp', async () => {
    const dbRow = {
      id: 'xyz',
      log_date: '2026-06-13',
      location: 'cold_room',
      temperature_c: '2.0',
      is_compliant: true,
      notes: null,
      recorded_by: null,
      created_at: '2026-06-13T09:00:00Z',
    };
    mockSql.mockResolvedValueOnce([dbRow]);

    await submitHaccpReading({
      log_date: '2026-06-13',
      location: 'cold_room',
      temperature_c: 2.0,
    });

    const callArgs = mockSql.mock.calls[0];
    expect(callArgs).toContain(true);
  });
});
