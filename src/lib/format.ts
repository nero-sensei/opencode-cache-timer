/**
 * Format a millisecond duration as a human-readable countdown string.
 *
 *   formatTime(0)       => "expired"
 *   formatTime(-1)      => "expired"
 *   formatTime(999)     => "0s"
 *   formatTime(45_000)  => "45s"
 *   formatTime(60_000)  => "1m 0s"
 *   formatTime(263_000) => "4m 23s"
 */
export function formatTime(ms: number): string {
  if (ms <= 0) return "expired"
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`
}
