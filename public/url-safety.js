/* ══════════════════════════════════════
   URL Safety Helpers
   Validate / sanitize URLs from untrusted (scraped) sources before
   placing them in href/src attributes. All helpers return null when
   the input cannot be considered safe; callers MUST treat null as
   "do not render a link".
   ══════════════════════════════════════ */

/* Accept E.164-style and common formatted phone numbers. Strip wrapping
   whitespace; reject anything containing characters that could break out
   of a "tel:" URL or carry control codes. */
function safeTelHref(num) {
  if (typeof num !== 'string') return null;
  const trimmed = num.trim();
  if (!trimmed) return null;
  // Allow leading '+', digit or '(' followed by digits/whitespace/punctuation
  // commonly used as visual phone separators. Cap total length.
  if (!/^[+]?[\d(][\d\s().\-/]{0,40}$/.test(trimmed)) return null;
  return 'tel:' + trimmed;
}

/* Strict but practical email validation. The address must look like a
   reasonable mailbox; if not, refuse the URL entirely. */
function safeMailtoHref(addr) {
  if (typeof addr !== 'string') return null;
  const trimmed = addr.trim();
  if (!trimmed || trimmed.length > 254) return null;
  if (!/^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$/.test(trimmed)) return null;
  return 'mailto:' + trimmed;
}

/* Allow only http: / https: URLs. Reject javascript:, data:, vbscript:,
   file:, etc. Returns the canonical href on success, null otherwise. */
function safeHttpHref(url) {
  if (typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch (_) {
    return null;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
  return parsed.href;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { safeTelHref, safeMailtoHref, safeHttpHref };
}
