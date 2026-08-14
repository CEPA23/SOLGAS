import { describe, expect, it } from 'vitest';
const valid = (ruc: string) => /^\d{11}$/.test(ruc);
describe('RUC validation', () => { it('rejects fewer than 11 digits', () => expect(valid('123')).toBe(false)); it('rejects more than 11 digits', () => expect(valid('123456789012')).toBe(false)); it('rejects letters', () => expect(valid('2054626991A')).toBe(false)); it('accepts 11 digits', () => expect(valid('20546269915')).toBe(true)); });
