/**
 * Formats elapsed duration in seconds into human-readable relative time.
 * Handles seconds, minutes, hours, and days cleanly to prevent awkward "1240s ago" displays.
 * @param {number} seconds - Elapsed time in seconds
 * @returns {string} Human-readable relative string
 */
export function formatTimeAgo(seconds) {
  if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) {
    return 'recently';
  }
  if (seconds < 5) {
    return 'just now';
  }
  if (seconds < 60) {
    return `${Math.floor(seconds)}s ago`;
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * Formats a duration in seconds into concise minutes/seconds.
 * @param {number} seconds
 * @returns {string}
 */
export function formatDuration(seconds) {
  if (typeof seconds !== 'number' || isNaN(seconds) || seconds <= 0) {
    return '0s';
  }
  if (seconds < 60) {
    return `${Math.floor(seconds)}s`;
  }
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}
