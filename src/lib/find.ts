import type { AssistantMessage, Message } from "@opencode-ai/sdk/v2"

/**
 * Find the most recent assistant message that had prompt-cache activity
 * (either a cache read or a cache write) and has finished streaming.
 *
 * This is the anchor for the cache-expiration countdown: the TTL is measured
 * from this message's `time.completed` timestamp.
 *
 * Walks the array from the end for O(1) early exit on the typical case.
 *
 * @returns the matching assistant message, or null if none
 */
export function findLastCacheActivity(
  messages: ReadonlyArray<Message>,
): AssistantMessage | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i]
    if (
      m.role === "assistant" &&
      m.time.completed !== undefined &&
      (m.tokens.cache.read > 0 || m.tokens.cache.write > 0)
    ) {
      return m
    }
  }
  return null
}
