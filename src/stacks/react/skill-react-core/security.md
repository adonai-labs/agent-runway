# react-core/security.md

# Security for React

OWASP-aligned security standards for React applications.

---

## XSS prevention

React escapes text content by default. The two main XSS risks are `dangerouslySetInnerHTML` and `href` with `javascript:` URLs.

```tsx
// React escapes this safely — no risk
<p>{userSuppliedText}</p>

// DANGEROUS — bypasses React escaping
<div dangerouslySetInnerHTML={{ __html: userContent }} />

// Safe — sanitise before rendering HTML
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userContent) }} />

// DANGEROUS — javascript: URL
<a href={userSuppliedUrl}>Click</a>

// Safe — validate the URL scheme before rendering
function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:', 'mailto:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}
<a href={isSafeUrl(url) ? url : '#'}>{label}</a>
```

**Rules:**
- Never use `dangerouslySetInnerHTML` without `DOMPurify.sanitize()`
- Validate URL schemes before rendering them in `href` or `src` attributes
- Never construct `eval()` or `new Function()` from user input

---

## Input validation

Client-side validation is UX; server-side validation is security. Both are required.

```tsx
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  email: z.string().email('Invalid email'),
  amount: z.number().positive().max(10_000, 'Amount too large'),
});

type FormData = z.infer<typeof schema>;

export function PaymentForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    // data is typed and validated; send to server — server must re-validate
    await api.createPayment(data);
  };
}
```

**Rules:**
- Use `zod` + `react-hook-form` for form validation; it provides type inference and runtime safety
- Always re-validate on the server; never trust client-side validation alone
- Sanitise display values that originate from user input before rendering

---

## Sensitive data in client state

```tsx
// Do not store tokens in localStorage or sessionStorage
// Use httpOnly cookies (set by the server) for auth tokens

// If you must hold a token client-side, use memory (not storage)
// and clear it on tab close / session end

// Do not log or expose sensitive fields in error tracking
import * as Sentry from '@sentry/react';
Sentry.init({
  beforeSend(event) {
    // Scrub sensitive form data before sending
    if (event.request?.data) {
      const safe = { ...event.request.data };
      delete safe.password;
      delete safe.cardNumber;
      event.request.data = safe;
    }
    return event;
  },
});
```

---

## Content Security Policy

For production, configure CSP headers on the server. React apps with inline styles and scripts need explicit directives.

```http
Content-Security-Policy:
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' https://api.example.com;
```

**Rules:**
- Set CSP headers on the server or CDN — not in a `<meta>` tag (bypassed by some attacks)
- Avoid `'unsafe-eval'` and `'unsafe-inline'` for scripts; use nonces or hashes if inline scripts are required
- Run `npm audit` and `npx snyk test` in CI to catch known vulnerabilities in dependencies

---

## Security checklist

- [ ] No `dangerouslySetInnerHTML` without `DOMPurify.sanitize()`
- [ ] URL schemes validated before rendering in `href` / `src`
- [ ] Client-side validation with Zod; server re-validates all input
- [ ] Auth tokens in httpOnly cookies, not `localStorage`
- [ ] Sensitive fields scrubbed before error tracking
- [ ] CSP headers set at the server / CDN level
- [ ] `npm audit` passes in CI
