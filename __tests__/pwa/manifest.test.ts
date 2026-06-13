import manifest from '@/app/manifest';

describe('PWA manifest', () => {
  const m = manifest();

  it('has a name and short_name', () => {
    expect(m.name).toBeTruthy();
    expect(m.short_name).toBeTruthy();
  });

  it('starts at the root url', () => {
    expect(m.start_url).toBe('/');
  });

  it('uses standalone display for home-screen install', () => {
    expect(m.display).toBe('standalone');
  });

  it('has brand theme_color and background_color', () => {
    expect(m.theme_color).toBe('#1d4ed8');
    expect(m.background_color).toBe('#ffffff');
  });

  it('provides 192×192 and 512×512 PNG icons', () => {
    const icons = (m.icons ?? []) as Array<{ src: string; sizes: string; type: string }>;
    expect(icons.length).toBeGreaterThanOrEqual(2);
    const sizes = icons.map((i) => i.sizes);
    expect(sizes).toContain('192x192');
    expect(sizes).toContain('512x512');
    icons.forEach((icon) => {
      expect(icon.src).toBeTruthy();
      expect(icon.type).toBe('image/png');
    });
  });
});
