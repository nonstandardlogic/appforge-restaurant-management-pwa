jest.mock('@/lib/db/client', () => ({ getDb: jest.fn() }));
jest.mock('@/lib/alerts/config', () => ({ getAlertConfig: jest.fn() }));
jest.mock('@/lib/alerts/delivery', () => ({
  deliverWithRetry: jest.fn().mockResolvedValue(undefined),
  alertDeliveryConfig: { retryDelaysMs: [0] },
}));
jest.mock('@/lib/alerts/brevo', () => ({
  getWhatsAppTemplateId: jest.fn().mockReturnValue('tpl-43'),
  sendBrevoWhatsApp: jest.fn().mockResolvedValue('wa-ok'),
  sendBrevoEmail: jest.fn().mockResolvedValue('em-ok'),
}));

import { evaluateWeeklyMB } from '@/lib/alerts/weekly-mb';
import { getAlertConfig } from '@/lib/alerts/config';
import { deliverWithRetry } from '@/lib/alerts/delivery';
import { getDb } from '@/lib/db/client';

const mockGetAlertConfig = getAlertConfig as jest.Mock;
const mockDeliverWithRetry = deliverWithRetry as jest.Mock;
const mockGetDb = getDb as jest.Mock;
const mockSql = jest.fn();

const enabledConfig = {
  alert_type: 'weekly_mb',
  enabled: true,
  threshold: 30,
  recipient_email: 'owner@test.com',
  recipient_phone: '+33600000000',
  locale: 'fr',
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGetDb.mockReturnValue(mockSql);
  mockDeliverWithRetry.mockResolvedValue(undefined);
});

describe('evaluateWeeklyMB', () => {
  it('returns triggered=false and skips send when alert already sent this week (dedup)', async () => {
    mockGetAlertConfig.mockResolvedValueOnce(enabledConfig);
    mockSql.mockResolvedValueOnce([{ cnt: 1 }]); // dedup check → already sent

    const result = await evaluateWeeklyMB();

    expect(result.triggered).toBe(false);
    expect(mockSql).toHaveBeenCalledTimes(1);
    expect(mockDeliverWithRetry).not.toHaveBeenCalled();
  });

  it('sends WhatsApp + email when MB% < threshold and no alert this week', async () => {
    mockGetAlertConfig.mockResolvedValueOnce(enabledConfig);
    mockSql.mockResolvedValueOnce([{ cnt: 0 }]);  // dedup → not sent yet
    mockSql.mockResolvedValueOnce([{ total_revenue: 10000, total_margin: 2000 }]); // MB% = 20%

    const result = await evaluateWeeklyMB();

    expect(result.triggered).toBe(true);
    expect(result.mbPercent).toBeCloseTo(20, 1);
    expect(result.threshold).toBe(30);
    expect(mockDeliverWithRetry).toHaveBeenCalledTimes(2);
    expect(mockDeliverWithRetry.mock.calls[0][0].channel).toBe('whatsapp');
    expect(mockDeliverWithRetry.mock.calls[1][0].channel).toBe('email');
  });

  it('returns triggered=false when MB% >= threshold', async () => {
    mockGetAlertConfig.mockResolvedValueOnce(enabledConfig);
    mockSql.mockResolvedValueOnce([{ cnt: 0 }]);  // dedup → not sent
    mockSql.mockResolvedValueOnce([{ total_revenue: 10000, total_margin: 3500 }]); // MB% = 35%

    const result = await evaluateWeeklyMB();

    expect(result.triggered).toBe(false);
    expect(mockDeliverWithRetry).not.toHaveBeenCalled();
  });

  it('returns triggered=false when config is disabled', async () => {
    mockGetAlertConfig.mockResolvedValueOnce({ ...enabledConfig, enabled: false });

    const result = await evaluateWeeklyMB();

    expect(result.triggered).toBe(false);
    expect(mockSql).not.toHaveBeenCalled();
  });

  it('returns triggered=false when getAlertConfig returns null', async () => {
    mockGetAlertConfig.mockResolvedValueOnce(null);

    const result = await evaluateWeeklyMB();

    expect(result).toEqual({ triggered: false, mbPercent: 0, threshold: 0 });
  });

  it('handles zero revenue gracefully (mbPercent = 0)', async () => {
    mockGetAlertConfig.mockResolvedValueOnce(enabledConfig);
    mockSql.mockResolvedValueOnce([{ cnt: 0 }]);
    mockSql.mockResolvedValueOnce([{ total_revenue: 0, total_margin: 0 }]);

    const result = await evaluateWeeklyMB();

    expect(result.triggered).toBe(true); // 0% < 30% threshold
    expect(result.mbPercent).toBe(0);
  });
});
