jest.mock('@/lib/db/client', () => ({ getDb: jest.fn() }));
jest.mock('@/lib/alerts/config', () => ({ getAlertConfig: jest.fn() }));
jest.mock('@/lib/alerts/delivery', () => ({
  deliverWithRetry: jest.fn().mockResolvedValue(undefined),
  alertDeliveryConfig: { retryDelaysMs: [0] },
}));
jest.mock('@/lib/alerts/brevo', () => ({
  getWhatsAppTemplateId: jest.fn().mockReturnValue('tpl-42'),
  sendBrevoWhatsApp: jest.fn().mockResolvedValue('wa-ok'),
  sendBrevoEmail: jest.fn().mockResolvedValue('em-ok'),
}));

import { evaluateDailyCA } from '@/lib/alerts/daily-ca';
import { getAlertConfig } from '@/lib/alerts/config';
import { deliverWithRetry } from '@/lib/alerts/delivery';
import { getDb } from '@/lib/db/client';

const mockGetAlertConfig = getAlertConfig as jest.Mock;
const mockDeliverWithRetry = deliverWithRetry as jest.Mock;
const mockGetDb = getDb as jest.Mock;
const mockSql = jest.fn();

const enabledConfig = {
  alert_type: 'daily_ca',
  enabled: true,
  threshold: 500,
  recipient_email: 'owner@test.com',
  recipient_phone: '+33600000000',
  locale: 'fr',
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGetDb.mockReturnValue(mockSql);
  mockDeliverWithRetry.mockResolvedValue(undefined);
});

describe('evaluateDailyCA', () => {
  it('returns triggered=false when revenue >= threshold', async () => {
    mockGetAlertConfig.mockResolvedValueOnce(enabledConfig);
    mockSql.mockResolvedValueOnce([{ revenue: 600 }]);

    const result = await evaluateDailyCA();

    expect(result).toEqual({ triggered: false, revenue: 600, threshold: 500 });
    expect(mockDeliverWithRetry).not.toHaveBeenCalled();
  });

  it('sends WhatsApp + email and returns triggered=true when revenue < threshold', async () => {
    mockGetAlertConfig.mockResolvedValueOnce(enabledConfig);
    mockSql.mockResolvedValueOnce([{ revenue: 200 }]);

    const result = await evaluateDailyCA();

    expect(result.triggered).toBe(true);
    expect(result.revenue).toBe(200);
    expect(result.threshold).toBe(500);
    expect(mockDeliverWithRetry).toHaveBeenCalledTimes(2);
    expect(mockDeliverWithRetry.mock.calls[0][0].channel).toBe('whatsapp');
    expect(mockDeliverWithRetry.mock.calls[1][0].channel).toBe('email');
  });

  it('returns triggered=false and skips DB query when config.enabled is false', async () => {
    mockGetAlertConfig.mockResolvedValueOnce({ ...enabledConfig, enabled: false });

    const result = await evaluateDailyCA();

    expect(result.triggered).toBe(false);
    expect(mockSql).not.toHaveBeenCalled();
    expect(mockDeliverWithRetry).not.toHaveBeenCalled();
  });

  it('returns triggered=false when getAlertConfig returns null', async () => {
    mockGetAlertConfig.mockResolvedValueOnce(null);

    const result = await evaluateDailyCA();

    expect(result).toEqual({ triggered: false, revenue: 0, threshold: 0 });
  });
});
