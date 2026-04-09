/**
 * Cache TTL registry.
 *
 * Maps providers (and optionally specific models) to their prompt-cache
 * time-to-live in milliseconds. The TUI plugin uses this to compute how long
 * the provider's prompt cache is expected to remain warm after the last
 * message with cache activity.
 *
 * -----------------------------------------------------------------------------
 * Key formats:
 *   "<providerID>"             applies to every model under that provider
 *   "<providerID>:<modelID>"   applies to that specific model (overrides provider)
 *
 * Lookup precedence (most specific first):
 *   1. providerID:modelID
 *   2. providerID
 *   3. null                    (no entry → no timer shown for that provider)
 *
 * -----------------------------------------------------------------------------
 * To add a provider or per-model override, edit DEFAULT_REGISTRY below.
 *
 * All values are sourced from official provider documentation (April 2026).
 * See README.md for the full provenance table.
 */

export type TTLRegistry = Readonly<Record<string, number>>

// Common TTL constants in milliseconds for readability.
const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE

export const DEFAULT_REGISTRY: TTLRegistry = {
  // ---------------------------------------------------------------------------
  // Anthropic — default ephemeral cache TTL is 5 minutes.
  // Source: https://platform.claude.com/docs/en/build-with-claude/prompt-caching
  // Note: A 1-hour tier is available via cache_control ttl:"1h" on Claude 4.5+.
  //       If you use the 1h tier on a specific model, override it below.
  // Example override for a model using the 1-hour tier:
  //   "anthropic:claude-opus-4-6": 1 * HOUR,
  // ---------------------------------------------------------------------------
  anthropic: 5 * MINUTE,

  // ---------------------------------------------------------------------------
  // OpenAI — automatic cache, 5–10 minute inactivity window (max 1 hour).
  // Source: https://platform.openai.com/docs/guides/prompt-caching
  // Using the conservative 5-min estimate. If you opt into the 24h extended
  // tier via prompt_cache_retention:"24h" (gpt-5.x / gpt-4.1 only), override
  // per-model, e.g.:
  //   "openai:gpt-5.4": 24 * HOUR,
  // ---------------------------------------------------------------------------
  openai: 5 * MINUTE,

  // ---------------------------------------------------------------------------
  // DeepSeek — disk-based cache, documented as "a few hours to a few days".
  // Source: https://api-docs.deepseek.com/guides/kv_cache
  // Using a conservative 2-hour estimate since no exact SLA is published.
  // ---------------------------------------------------------------------------
  deepseek: 2 * HOUR,

  // ---------------------------------------------------------------------------
  // Google Gemini — explicit Context Caching API, default TTL 1 hour.
  // Source: https://ai.google.dev/api/caching
  // Range is 60s to 7 days, user-configured. Implicit (automatic) caching
  // on Gemini 2.0+ is Google-managed with no user-visible TTL; this entry
  // assumes the common explicit-cache default.
  // ---------------------------------------------------------------------------
  google: 1 * HOUR,

  // ---------------------------------------------------------------------------
  // xAI Grok — automatic, no TTL SLA. Docs explicitly state entries "can be
  // evicted at any time due to server load or restarts."
  // Source: https://docs.x.ai/developers/advanced-api-usage/prompt-caching
  // Treated as ephemeral with a conservative 5-min window.
  // ---------------------------------------------------------------------------
  xai: 5 * MINUTE,

  // ---------------------------------------------------------------------------
  // Mistral — cached_tokens field exists in responses but caching behavior
  // is entirely undocumented. No cache_control parameter in the API spec.
  // Intentionally omitted: we do not claim a TTL we cannot justify.
  // Add your own entry if you have empirical measurements for your workload.
  // ---------------------------------------------------------------------------
}

/**
 * Look up the cache TTL for a given provider/model pair.
 *
 * @param providerID the provider id (e.g. "anthropic")
 * @param modelID    the model id (e.g. "claude-opus-4-6")
 * @param registry   optional custom registry (defaults to DEFAULT_REGISTRY)
 * @returns TTL in milliseconds, or null if no entry found
 */
export function getCacheTTL(
  providerID: string,
  modelID: string,
  registry: TTLRegistry = DEFAULT_REGISTRY,
): number | null {
  const specific = registry[`${providerID}:${modelID}`]
  if (specific !== undefined) return specific
  const fallback = registry[providerID]
  if (fallback !== undefined) return fallback
  return null
}
