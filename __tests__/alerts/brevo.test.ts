import { getWhatsAppTemplateId, sendBrevoWhatsApp, sendBrevoEmail } from '@/lib/alerts/brevo';

const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  jest.clearAllMocks();
  process.env.BREVO_API_KEY = 'test-api-key';
  process.env.BREVO_TEMPLATE_A1_FR = 'tpl-a1-fr';
  process.env.BREVO_TEMPLATE_A1_EN = 'tpl-a1-en';
  process.env.BREVO_TEMPLATE_A2_FR = 'tpl-a2-fr';
  process.env.BREVO_TEMPLATE_A2_EN = 'tpl-a2-en';
});

describe('getWhatsAppTemplateId', () => {
  it.each([
    ['daily_ca', 'fr', 'tpl-a1-fr'],
    ['daily_ca', 'en', 'tpl-a1-en'],
    ['weekly_mb', 'fr', 'tpl-a2-fr'],
    ['weekly_mb', 'en', 'tpl-a2-en'],
  ])('returns correct template ID for %s / %s', (alertType, locale, expected) => {
    expect(getWhatsAppTemplateId(alertType, locale)).toBe(expected);
  });

  it('throws for unknown alertType', () => {
    expect(() => getWhatsAppTemplateId('unknown_type', 'fr')).toThrow('No WhatsApp template');
  });

  it('throws for unknown locale', () => {
    expect(() => getWhatsAppTemplateId('daily_ca', 'de')).toThrow('No WhatsApp template');
  });

  it('throws when env var is missing', () => {
    delete process.env.BREVO_TEMPLATE_A1_FR;
    expect(() => getWhatsAppTemplateId('daily_ca', 'fr')).toThrow('No WhatsApp template');
  });
});

describe('sendBrevoWhatsApp', () => {
  it('calls Brevo WhatsApp API and returns messageId', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ messageId: 'wa-msg-123' }),
    });

    const id = await sendBrevoWhatsApp('42', '+33612345678', { revenue: '100.00' });

    expect(id).toBe('wa-msg-123');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.brevo.com/v3/whatsapp/sendMessage',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'api-key': 'test-api-key' }),
      }),
    );
  });

  it('returns "ok" when messageId is absent', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    const id = await sendBrevoWhatsApp('42', '+336', {});
    expect(id).toBe('ok');
  });

  it('throws on Brevo API error', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 400, text: async () => 'Bad Request' });
    await expect(sendBrevoWhatsApp('42', '+336', {})).rejects.toThrow('Brevo WhatsApp error 400');
  });

  it('throws when BREVO_API_KEY is missing', async () => {
    delete process.env.BREVO_API_KEY;
    await expect(sendBrevoWhatsApp('42', '+336', {})).rejects.toThrow('BREVO_API_KEY not configured');
  });
});

describe('sendBrevoEmail', () => {
  it('calls Brevo SMTP API and returns messageId', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ messageId: 'email-456' }),
    });

    const id = await sendBrevoEmail('owner@example.com', 'Subject', '<p>body</p>');

    expect(id).toBe('email-456');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.brevo.com/v3/smtp/email',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('throws on Brevo email error', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500, text: async () => 'Server Error' });
    await expect(sendBrevoEmail('x@x.com', 'S', '<p/>')).rejects.toThrow('Brevo Email error 500');
  });
});
