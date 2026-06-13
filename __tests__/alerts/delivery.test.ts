jest.mock('@/lib/db/client', () => ({ getDb: jest.fn() }));

import { deliverWithRetry, alertDeliveryConfig } from '@/lib/alerts/delivery';
import { getDb } from '@/lib/db/client';

const mockGetDb = getDb as jest.Mock;
const mockSql = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  mockGetDb.mockReturnValue(mockSql);
  // Override delays to 0 so tests run instantly without timer mocking
  alertDeliveryConfig.retryDelaysMs = [0, 0, 0];
});

const baseOpts = {
  alertType: 'daily_ca',
  channel: 'whatsapp' as const,
  templateId: '42',
  payload: { revenue: '200.00' },
};

describe('deliverWithRetry', () => {
  it('inserts sent log and returns on first-try success', async () => {
    const sendFn = jest.fn().mockResolvedValueOnce('msg-ok');
    mockSql.mockResolvedValueOnce([]); // INSERT sent

    await deliverWithRetry({ ...baseOpts, sendFn });

    expect(sendFn).toHaveBeenCalledTimes(1);
    expect(mockSql).toHaveBeenCalledTimes(1);
    // 'sent' is an interpolated value — check the call args
    const callArgs = mockSql.mock.calls[0];
    expect(callArgs.slice(1)).toContain('sent');
  });

  it('retries on transient error and logs retrying then sent', async () => {
    const sendFn = jest
      .fn()
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValueOnce('msg-ok');
    mockSql.mockResolvedValueOnce([]); // INSERT retrying
    mockSql.mockResolvedValueOnce([]); // INSERT sent

    await deliverWithRetry({ ...baseOpts, sendFn });

    expect(sendFn).toHaveBeenCalledTimes(2);
    expect(mockSql).toHaveBeenCalledTimes(2);
    expect(mockSql.mock.calls[0].slice(1)).toContain('retrying');
    expect(mockSql.mock.calls[1].slice(1)).toContain('sent');
  });

  it('logs failed and calls console.error after all retries exhausted', async () => {
    const sendFn = jest.fn().mockRejectedValue(new Error('permanent error'));
    // 4 attempts: delays=[0,0,0] means 3 retries + 1 initial = 4 total
    for (let i = 0; i < 4; i++) mockSql.mockResolvedValueOnce([]);

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await deliverWithRetry({ ...baseOpts, sendFn });

    expect(sendFn).toHaveBeenCalledTimes(4);
    expect(mockSql).toHaveBeenCalledTimes(4);
    // Last log entry is 'failed'
    expect(mockSql.mock.calls[3].slice(1)).toContain('failed');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Permanent failure'));
    consoleSpy.mockRestore();
  });

  it('uses email channel label in log', async () => {
    const sendFn = jest.fn().mockResolvedValueOnce('email-ok');
    mockSql.mockResolvedValueOnce([]);

    await deliverWithRetry({ ...baseOpts, channel: 'email', templateId: 'smtp', sendFn });

    expect(mockSql.mock.calls[0].slice(1)).toContain('email');
  });
});
