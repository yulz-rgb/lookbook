'use client';

import { useState, useCallback } from 'react';

const INITIAL = {
  name: '',
  email: '',
  phone: '',
  yachtName: '',
  crewSize: '',
  items: '',
  timeline: '',
  location: '',
  message: '',
};

export function EnquiryForm() {
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [serverError, setServerError] = useState('');

  const update = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (status === 'loading') return;
    setStatus('loading');
    setServerError('');
    setErrors({});

    try {
      const res = await fetch('/api/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.fieldErrors) {
          setErrors(data.fieldErrors);
          setStatus('idle');
          return;
        }
        setServerError(data.error || 'Something went wrong. Please try again.');
        setStatus('error');
        return;
      }
      setForm(INITIAL);
      setStatus('success');
    } catch {
      setServerError('Network error. Check your connection and try again.');
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className="enquiry-success" role="status" aria-live="polite">
        <h3>Enquiry received</h3>
        <p>
          Thank you. We will review your requirements and respond within one business day.
        </p>
        <button type="button" className="btn secondary" onClick={() => setStatus('idle')}>
          Send another enquiry
        </button>
      </div>
    );
  }

  return (
    <form className="enquiry-form" onSubmit={handleSubmit} noValidate aria-label="Uniform enquiry form">
      <div className="enquiry-grid">
        <div className="field">
          <label htmlFor="enq-name">Name *</label>
          <input
            id="enq-name"
            name="name"
            type="text"
            autoComplete="name"
            required
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'enq-name-error' : undefined}
          />
          {errors.name && <span id="enq-name-error" className="field-error" role="alert">{errors.name}</span>}
        </div>
        <div className="field">
          <label htmlFor="enq-email">Email *</label>
          <input
            id="enq-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'enq-email-error' : undefined}
          />
          {errors.email && <span id="enq-email-error" className="field-error" role="alert">{errors.email}</span>}
        </div>
        <div className="field">
          <label htmlFor="enq-phone">Phone / WhatsApp</label>
          <input
            id="enq-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="enq-yacht">Yacht or company</label>
          <input
            id="enq-yacht"
            name="yachtName"
            type="text"
            value={form.yachtName}
            onChange={(e) => update('yachtName', e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="enq-crew">Crew size</label>
          <input
            id="enq-crew"
            name="crewSize"
            type="text"
            inputMode="numeric"
            placeholder="e.g. 12"
            value={form.crewSize}
            onChange={(e) => update('crewSize', e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="enq-items">Required items</label>
          <input
            id="enq-items"
            name="items"
            type="text"
            placeholder="Polo shirts, epaulettes, footwear…"
            value={form.items}
            onChange={(e) => update('items', e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="enq-timeline">Timeline</label>
          <input
            id="enq-timeline"
            name="timeline"
            type="text"
            placeholder="Season start, refit date…"
            value={form.timeline}
            onChange={(e) => update('timeline', e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="enq-location">Location / port</label>
          <input
            id="enq-location"
            name="location"
            type="text"
            value={form.location}
            onChange={(e) => update('location', e.target.value)}
          />
        </div>
      </div>
      <div className="field field--full">
        <label htmlFor="enq-message">Message *</label>
        <textarea
          id="enq-message"
          name="message"
          rows={4}
          required
          placeholder="Describe your uniform requirements, branding, and any supplier preferences."
          value={form.message}
          onChange={(e) => update('message', e.target.value)}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? 'enq-message-error' : undefined}
        />
        {errors.message && <span id="enq-message-error" className="field-error" role="alert">{errors.message}</span>}
      </div>
      {serverError && (
        <p className="enquiry-server-error" role="alert">{serverError}</p>
      )}
      <button type="submit" className="btn primary enquiry-submit" disabled={status === 'loading'}>
        {status === 'loading' ? 'Sending…' : 'Request a consultation'}
      </button>
    </form>
  );
}
