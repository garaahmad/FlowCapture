const secretPatterns = [
  /\bsk-[a-zA-Z0-9_-]{12,}\b/g,
  /\b(Bearer\s+)[a-zA-Z0-9._~+/=-]{8,}/gi,
  /\b((?:api[_-]?key|access[_-]?token|client[_-]?secret|password|secret)\s*[:=]\s*)([^\s,;]{4,})/gi,
];

export function redactPotentialSecrets(content: string): { content: string; redacted: boolean } {
  let redacted = false;
  let sanitized = content;
  for (const pattern of secretPatterns) {
    sanitized = sanitized.replace(pattern, (_match, prefix: string | undefined) => {
      redacted = true;
      return prefix ? `${prefix}[REDACTED_SECRET]` : "[REDACTED_SECRET]";
    });
  }
  return { content: sanitized, redacted };
}
