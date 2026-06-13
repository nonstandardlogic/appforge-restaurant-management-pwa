jest.mock('@/lib/db/client');

import { getDb } from '@/lib/db/client';
import { fetchStaffDashboard } from '@/lib/staff/dashboard';

const mockSql = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (getDb as jest.Mock).mockReturnValue(mockSql);
});

describe('fetchStaffDashboard', () => {
  it('returns correct progress and next HACCP check for an unchecked location', async () => {
    // Promise.all returns [checklistRows, haccpRows, nonCompliantRows]
    mockSql
      .mockResolvedValueOnce([{ total: '7', done: '5' }])
      .mockResolvedValueOnce([
        { location: 'cold_room', last_checked: '2026-06-13' },
        { location: 'prep_area', last_checked: '2026-06-13' },
        // dishwasher not checked yet
      ])
      .mockResolvedValueOnce([{ count: '0' }]);

    const result = await fetchStaffDashboard('user-1');

    expect(result.checklistProgress).toEqual({ done: 5, total: 7 });
    expect(result.nextHaccpCheck?.location).toBe('dishwasher');
    expect(result.nextHaccpCheck?.lastChecked).toBeNull();
    expect(result.nonCompliantToday).toBe(0);
    expect(result.allClear).toBe(false); // not all 3 HACCP locations checked
  });

  it('sets allClear=true when all tasks done and all HACCP locations checked with no violations', async () => {
    mockSql
      .mockResolvedValueOnce([{ total: '7', done: '7' }])
      .mockResolvedValueOnce([
        { location: 'cold_room', last_checked: '2026-06-13' },
        { location: 'prep_area', last_checked: '2026-06-13' },
        { location: 'dishwasher', last_checked: '2026-06-13' },
      ])
      .mockResolvedValueOnce([{ count: '0' }]);

    const result = await fetchStaffDashboard('user-1');

    expect(result.allClear).toBe(true);
  });

  it('sets allClear=false when there are non-compliant HACCP readings', async () => {
    mockSql
      .mockResolvedValueOnce([{ total: '7', done: '7' }])
      .mockResolvedValueOnce([
        { location: 'cold_room', last_checked: '2026-06-13' },
        { location: 'prep_area', last_checked: '2026-06-13' },
        { location: 'dishwasher', last_checked: '2026-06-13' },
      ])
      .mockResolvedValueOnce([{ count: '1' }]);

    const result = await fetchStaffDashboard('user-1');

    expect(result.allClear).toBe(false);
    expect(result.nonCompliantToday).toBe(1);
  });

  it('sets allClear=false when checklist is empty (no entries seeded yet)', async () => {
    mockSql
      .mockResolvedValueOnce([{ total: '0', done: '0' }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ count: '0' }]);

    const result = await fetchStaffDashboard('user-1');

    expect(result.allClear).toBe(false);
    expect(result.checklistProgress.total).toBe(0);
  });
});
