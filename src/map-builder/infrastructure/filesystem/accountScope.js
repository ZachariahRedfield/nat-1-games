import { getSession } from "../../../auth/services/authService.js";

export const SHARED_ACCOUNT_KEY = "__shared__";

export function normalizeAccountKey(accountId, { treatAsUsername = false } = {}) {
  const raw = accountId == null ? "" : String(accountId);
  const trimmed = raw.trim();
  if (!trimmed) return SHARED_ACCOUNT_KEY;
  return `acct:${treatAsUsername ? trimmed.toLowerCase() : trimmed}`;
}

export function resolveAccountKey(explicitAccountId) {
  if (explicitAccountId) {
    return normalizeAccountKey(explicitAccountId);
  }

  try {
    const session = getSession?.();
    if (session?.userId) {
      return normalizeAccountKey(session.userId);
    }
    if (session?.username) {
      return normalizeAccountKey(session.username, { treatAsUsername: true });
    }
  } catch {
    // ignore session lookup issues
  }

  return SHARED_ACCOUNT_KEY;
}
