import { z } from 'zod';

export const enquiryInput = z.object({
  name: z.string().trim().min(2, 'Name is required'),
  email: z.string().trim().email('Valid email is required'),
  phone: z.string().trim().optional().default(''),
  yachtName: z.string().trim().optional().default(''),
  crewSize: z.string().trim().optional().default(''),
  items: z.string().trim().optional().default(''),
  timeline: z.string().trim().optional().default(''),
  location: z.string().trim().optional().default(''),
  message: z.string().trim().min(10, 'Please include a brief message (at least 10 characters)'),
});

export function validateEnquiry(data) {
  const parsed = enquiryInput.safeParse(data);
  if (!parsed.success) {
    const fieldErrors = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, fieldErrors };
  }
  return { ok: true, value: parsed.data };
}
