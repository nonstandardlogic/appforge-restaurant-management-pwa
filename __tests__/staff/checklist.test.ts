jest.mock('@/lib/db/client');

import { getDb } from '@/lib/db/client';
import {
  fetchTodayChecklist,
  markChecklistItem,
  DEFAULT_TASK_KEYS,
} from '@/lib/staff/checklist';

const mockSql = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (getDb as jest.Mock).mockReturnValue(mockSql);
});

describe('fetchTodayChecklist', () => {
  it('seeds entries when none exist and returns them', async () => {
    // First call: COUNT returns 0
    mockSql.mockResolvedValueOnce([{ count: '0' }]);
    // Subsequent calls: INSERT for each task key
    for (let i = 0; i < DEFAULT_TASK_KEYS.length; i++) {
      mockSql.mockResolvedValueOnce([]);
    }
    // Final SELECT
    const entries = DEFAULT_TASK_KEYS.map((task_key, i) => ({
      id: `id-${i}`,
      entry_date: '2026-06-13',
      task_key,
      is_done: false,
      done_at: null,
      done_by: null,
    }));
    mockSql.mockResolvedValueOnce(entries);

    const result = await fetchTodayChecklist('2026-06-13');

    expect(result).toHaveLength(DEFAULT_TASK_KEYS.length);
    expect(result[0].is_done).toBe(false);
    // Verify that INSERT calls were made (COUNT + inserts + SELECT)
    expect(mockSql).toHaveBeenCalledTimes(1 + DEFAULT_TASK_KEYS.length + 1);
  });

  it('skips seeding when entries already exist', async () => {
    // COUNT returns non-zero
    mockSql.mockResolvedValueOnce([{ count: '7' }]);
    // SELECT
    mockSql.mockResolvedValueOnce([
      { id: 'id-1', entry_date: '2026-06-13', task_key: 'checklist.open_doors', is_done: true, done_at: '2026-06-13T07:00:00Z', done_by: 'u1' },
    ]);

    const result = await fetchTodayChecklist('2026-06-13');

    expect(result).toHaveLength(1);
    expect(result[0].is_done).toBe(true);
    // Only COUNT + SELECT were called
    expect(mockSql).toHaveBeenCalledTimes(2);
  });
});

describe('markChecklistItem', () => {
  it('updates the entry and returns the updated record', async () => {
    const dbRow = {
      id: 'entry-1',
      entry_date: '2026-06-13',
      task_key: 'checklist.open_doors',
      is_done: true,
      done_at: '2026-06-13T07:30:00Z',
      done_by: 'user-1',
    };
    mockSql.mockResolvedValueOnce([dbRow]);

    const result = await markChecklistItem('entry-1', 'user-1');

    expect(result.id).toBe('entry-1');
    expect(result.is_done).toBe(true);
    expect(result.done_by).toBe('user-1');
  });
});
