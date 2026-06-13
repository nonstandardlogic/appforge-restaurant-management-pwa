jest.mock('@/lib/db/client');

import { getDb } from '@/lib/db/client';
import { fetchPlanningGrid, validateSchedule } from '@/lib/staff/planning';

const mockSql = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (getDb as jest.Mock).mockReturnValue(mockSql);
});

describe('fetchPlanningGrid', () => {
  it('groups rows by staff member', async () => {
    const rows = [
      {
        id: 'h1', staff_id: 'staff-a', week_start: '2026-06-09', day_of_week: 1,
        availability: 'DISPO', time_slot_start: '09:00', time_slot_end: '17:00',
        validated: false, email: 'alice@example.com',
      },
      {
        id: 'h2', staff_id: 'staff-a', week_start: '2026-06-09', day_of_week: 2,
        availability: 'REPOS', time_slot_start: null, time_slot_end: null,
        validated: false, email: 'alice@example.com',
      },
      {
        id: 'h3', staff_id: 'staff-b', week_start: '2026-06-09', day_of_week: 1,
        availability: 'DISPO', time_slot_start: '10:00', time_slot_end: '18:00',
        validated: true, email: 'bob@example.com',
      },
    ];
    mockSql.mockResolvedValueOnce(rows);

    const grid = await fetchPlanningGrid('2026-06-09');

    expect(grid.weekStart).toBe('2026-06-09');
    expect(grid.staff).toHaveLength(2);

    const alice = grid.staff.find((s) => s.email === 'alice@example.com');
    expect(alice).toBeDefined();
    expect(alice!.days).toHaveLength(2);

    const bob = grid.staff.find((s) => s.email === 'bob@example.com');
    expect(bob).toBeDefined();
    expect(bob!.days[0].validated).toBe(true);
  });

  it('returns empty staff array when no entries exist', async () => {
    mockSql.mockResolvedValueOnce([]);
    const grid = await fetchPlanningGrid('2026-06-09');
    expect(grid.staff).toEqual([]);
  });
});

describe('validateSchedule', () => {
  it('calls UPDATE with correct params', async () => {
    mockSql.mockResolvedValueOnce([]);

    await validateSchedule('staff-1', '2026-06-09', 'manager-1');

    expect(mockSql).toHaveBeenCalledTimes(1);
    const callArgs = mockSql.mock.calls[0];
    expect(callArgs).toContain('staff-1');
    expect(callArgs).toContain('2026-06-09');
    expect(callArgs).toContain('manager-1');
  });
});
