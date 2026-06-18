import { describe, it, expect } from 'vitest';
import { validateEnquiry } from './enquiry';

describe('validateEnquiry', () => {
  it('accepts valid enquiry', () => {
    const result = validateEnquiry({
      name: 'Jane Captain',
      email: 'jane@yacht.example',
      message: 'We need uniforms for a 45m motor yacht crew of 14.',
    });
    expect(result.ok).toBe(true);
  });

  it('rejects missing email', () => {
    const result = validateEnquiry({
      name: 'Jane',
      email: 'not-an-email',
      message: 'Need uniforms please help us out here.',
    });
    expect(result.ok).toBe(false);
    expect(result.fieldErrors.email).toBeTruthy();
  });

  it('rejects short message', () => {
    const result = validateEnquiry({
      name: 'Jane',
      email: 'jane@yacht.example',
      message: 'Hi',
    });
    expect(result.ok).toBe(false);
    expect(result.fieldErrors.message).toBeTruthy();
  });
});
