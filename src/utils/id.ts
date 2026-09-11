export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'exp_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

