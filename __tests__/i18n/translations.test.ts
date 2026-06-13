import fr from '@/messages/fr.json';
import en from '@/messages/en.json';

type NestedObj = Record<string, NestedObj | string>;

function leafKeys(obj: NestedObj, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) => {
    const full = prefix ? `${prefix}.${k}` : k;
    return typeof v === 'object' && v !== null
      ? leafKeys(v as NestedObj, full)
      : [full];
  });
}

function getValue(obj: NestedObj, key: string): string | NestedObj {
  return key.split('.').reduce<NestedObj | string>((cur, part) => {
    if (typeof cur === 'string') return cur;
    return (cur as NestedObj)[part];
  }, obj);
}

describe('Translation file completeness', () => {
  const frKeys = leafKeys(fr as unknown as NestedObj);
  const enKeys = leafKeys(en as unknown as NestedObj);

  it('en.json contains every key from fr.json', () => {
    const missing = frKeys.filter((k) => !enKeys.includes(k));
    expect(missing).toEqual([]);
  });

  it('fr.json contains every key from en.json', () => {
    const missing = enKeys.filter((k) => !frKeys.includes(k));
    expect(missing).toEqual([]);
  });

  it('fr.json has no empty string values', () => {
    const empty = frKeys.filter((k) => getValue(fr as unknown as NestedObj, k) === '');
    expect(empty).toEqual([]);
  });

  it('en.json has no empty string values', () => {
    const empty = enKeys.filter((k) => getValue(en as unknown as NestedObj, k) === '');
    expect(empty).toEqual([]);
  });

  it('fr.json has all required top-level namespaces', () => {
    const required = [
      'common', 'login', 'dashboard', 'checklist', 'haccp',
      'hours', 'planning', 'finances', 'alerts', 'admin', 'language_toggle',
    ];
    const frTopLevel = Object.keys(fr);
    const missing = required.filter((ns) => !frTopLevel.includes(ns));
    expect(missing).toEqual([]);
  });
});
