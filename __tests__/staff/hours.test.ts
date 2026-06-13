jest.mock('@/lib/db/client');

import { getDb } from '@/lib/db/client';
import { fetchWeekHours, submitWeekHours } from '@/lib/staff/hours';

const mockSql = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (getDb as jest.Mock).mockReturnValue(mockSql);
});

describe('fetchWeekHours', () => {
  it('returns mapped week entries for a staff member', async () => {
    const rows = [
      {
        id: 'h1',
        staff_id: 'staff-1',
        week_start: '2026-06-09',
        day_of_week: 1,
        availability: 'DISPO',
        time_slot_start: '09:00',
        time_slot_end: '17:00',
        validated: false,
      },
      {
        id: 'h2',
        staff_id: 'staff-1',
        week_start: '2026-06-09',
        day_of_week: 2,
        availability: 'REPOS',
        time_slot_start: null,
        time_slot_end: null,
        validated: false,
      },
    ];
    mockSql.mockResolvedValueOnce(rows);

    const result = await fetchWeekHours('staff-1', '2026-06-09');

    expect(result).toHaveLength(2);
    expect(result[0].availability).toBe('DISPO');
    expect(result[0].time_slot_start).toBe('09:00');
    expect(result[1].time_slot_start).toBeNull();
  });

  it('returns empty array when no hours submitted', async () => {
    mockSql.mockResolvedValueOnce([]);
    const result = await fetchWeekHours('staff-1', '2026-06-09');
    expect(result).toEqual([]);
  });
});

describe('submitWeekHours', () => {
  it('deletes unvalidated entries then inserts new ones', async () => {
    const days = [
      { day_of_week: 1, availability: 'DISPO' as const, time_slot_start: '09:00', time_slot_end: '17:00' },
      { day_of_week: 2, availability: 'REPOS' as const },
    ];

    // DELETE call
    mockSql.mockResolvedValueOnce([]);
    // INSERT calls (one per day)
    mockSql.mockResolvedValue([]);
    // fetchWeekHours SELECT at the end
    const finalRows = days.map((d, i) => ({
      id: `h${i}`,
      staff_id: 'staff-1',
      week_start: '2026-06-09',
      day_of_week: d.day_of_week,
      availability: d.availability,
      time_slot_start: 'time_slot_start' in d ? d.time_slot_start ?? null : null,
      time_slot_end: 'time_slot_end' in d ? d.time_slot_end ?? null : null,
      validated: false,
    }));
    mockSql.mockResolvedValueOnce(finalRows);

    const result = await submitWeekHours('staff-1', '2026-06-09', days);

    // DELETE + 2 INSERTs + SELECT
    expect(mockSql).toHaveBeenCalledTimes(1 + days.length + 1);
    expect(result).toHaveLength(2);
  });
});
