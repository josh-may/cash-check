// Cache duration: 3.5 hours (Plaid tokens valid for 4 hours, leaving buffer)
const CACHE_DURATION_MS = 3.5 * 60 * 60 * 1000;

function getCacheKey(plaidItemId) {
  return plaidItemId
    ? `plaid_link_token_relink_${plaidItemId}`
    : "plaid_link_token_new";
}

function getCachedToken(plaidItemId) {
  if (typeof window === "undefined") return null;

  const key = getCacheKey(plaidItemId);
  const cached = localStorage.getItem(key);
  if (!cached) return null;

  try {
    const { token, timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;
    if (age < CACHE_DURATION_MS) {
      return token;
    }
    localStorage.removeItem(key);
  } catch {
    localStorage.removeItem(key);
  }
  return null;
}

function setCachedToken(token, plaidItemId) {
  if (typeof window === "undefined") return;

  const key = getCacheKey(plaidItemId);
  localStorage.setItem(key, JSON.stringify({ token, timestamp: Date.now() }));
}

export async function fetchLinkToken(plaidItemId = null) {
  // Check cache first
  const cached = getCachedToken(plaidItemId);
  if (cached) return cached;

  // Fetch from API
  const res = await fetch("/api/plaid/create_link_token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(plaidItemId ? { plaidItemId } : {}),
  });

  if (!res.ok) return null;

  const data = await res.json();
  const token = data.link_token;

  if (token) {
    setCachedToken(token, plaidItemId);
  }

  return token;
}

export function clearLinkTokenCache(plaidItemId = null) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(getCacheKey(plaidItemId));
}
