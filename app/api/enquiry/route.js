import { getDb } from '../../../lib/db';
import { hasDatabase } from '../../../lib/config';
import { validateEnquiry } from '../../../lib/enquiry';

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const result = validateEnquiry(body);
  if (!result.ok) {
    return Response.json({ fieldErrors: result.fieldErrors }, { status: 422 });
  }

  const enquiry = result.value;
  const payload = {
    ...enquiry,
    submittedAt: new Date().toISOString(),
    source: 'website',
  };

  if (hasDatabase) {
    try {
      const db = getDb();
      await db.auditEvent.create({
        data: {
          action: 'ENQUIRY',
          entity: 'ContactForm',
          meta: payload,
        },
      });
    } catch (err) {
      console.error('[enquiry] database persist failed:', err);
      return Response.json({ error: 'Unable to save enquiry. Please email us directly.' }, { status: 500 });
    }
  }

  const webhook = process.env.ENQUIRY_WEBHOOK_URL;
  if (webhook) {
    try {
      await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error('[enquiry] webhook failed:', err);
    }
  }

  if (!hasDatabase && !webhook) {
    console.info('[enquiry] received (no persistence configured):', enquiry.email);
  }

  return Response.json({ ok: true });
}
