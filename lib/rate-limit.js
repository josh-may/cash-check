// Simple in-memory rate limiter for email sends
const emailAttempts = new Map();
const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_ATTEMPTS = 3; // 3 emails per hour per user

export function checkRateLimit(userId) {
  const now = Date.now();
  const userAttempts = emailAttempts.get(userId) || [];
  
  // Clean old attempts
  const recentAttempts = userAttempts.filter(
    timestamp => now - timestamp < WINDOW_MS
  );
  
  if (recentAttempts.length >= MAX_ATTEMPTS) {
    return false;
  }
  
  // Add new attempt
  recentAttempts.push(now);
  emailAttempts.set(userId, recentAttempts);
  
  // Clean up old entries periodically
  if (Math.random() < 0.01) { // 1% chance
    for (const [key, attempts] of emailAttempts.entries()) {
      const valid = attempts.filter(t => now - t < WINDOW_MS);
      if (valid.length === 0) {
        emailAttempts.delete(key);
      } else {
        emailAttempts.set(key, valid);
      }
    }
  }
  
  return true;
}