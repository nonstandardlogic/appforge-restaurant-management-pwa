import vercelConfig from '../../vercel.json';
import lighthouseConfig from '../../.lighthouserc.json';

describe('NSLRMP-26 — Vercel deployment pipeline', () => {
  describe('vercel.json — Vercel project configuration', () => {
    it('specifies nextjs as the framework so Vercel auto-detects build output', () => {
      expect(vercelConfig.framework).toBe('nextjs');
    });

    it('uses pnpm build as the build command', () => {
      expect(vercelConfig.buildCommand).toBe('pnpm build');
    });

    it('uses frozen pnpm lockfile to guarantee reproducible installs', () => {
      expect(vercelConfig.installCommand).toContain('--frozen-lockfile');
    });

    it('configures cron jobs that POST to /api/alerts/trigger/daily or /api/alerts/trigger/weekly', () => {
      expect(vercelConfig.crons).toBeDefined();
      expect(vercelConfig.crons.length).toBeGreaterThan(0);
      const validPaths = ['/api/alerts/trigger/daily', '/api/alerts/trigger/weekly'];
      vercelConfig.crons.forEach((cron: { path: string; schedule: string }) => {
        expect(validPaths).toContain(cron.path);
      });
    });

    it('schedules a daily CA alert at 05:00 UTC (06:00 CET)', () => {
      const daily = vercelConfig.crons.find(
        (c: { path: string; schedule: string }) => c.schedule === '0 5 * * *',
      );
      expect(daily).toBeDefined();
    });

    it('schedules a weekly MB% alert on Monday at 07:00 UTC (08:00 CET)', () => {
      const weekly = vercelConfig.crons.find(
        (c: { path: string; schedule: string }) => c.schedule === '0 7 * * 1',
      );
      expect(weekly).toBeDefined();
    });
  });

  describe('.lighthouserc.json — production load-time enforcement (AFI-44 4G constraint)', () => {
    it('defines a performance score assertion targeting production quality', () => {
      const assertions = lighthouseConfig.ci.assert.assertions;
      expect(assertions['categories:performance']).toBeDefined();
    });

    it('enforces first-contentful-paint ≤ 2 000 ms on throttled 4G mobile', () => {
      const fcp = lighthouseConfig.ci.assert.assertions[
        'first-contentful-paint'
      ] as [string, { maxNumericValue: number }];
      expect(fcp).toBeDefined();
      const [, config] = fcp;
      expect(config.maxNumericValue).toBeLessThanOrEqual(2000);
    });

    it('uses mobile form factor with 4G-equivalent throughput throttling', () => {
      const { settings } = lighthouseConfig.ci.collect;
      expect(settings.emulatedFormFactor).toBe('mobile');
      // 4G typical DL ~1.6 Mbps = 1 638 Kbps
      expect(settings.throttling.throughputKbps).toBeLessThan(2000);
    });

    it('defines PWA quality assertions', () => {
      expect(lighthouseConfig.ci.assert.assertions['categories:pwa']).toBeDefined();
    });
  });
});
