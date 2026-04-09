import { describe, test, expect } from "bun:test"
import { getCacheTTL, DEFAULT_REGISTRY, type TTLRegistry } from "../src/providers/registry"

describe("getCacheTTL", () => {
  test("anthropic provider returns 5 minutes for any model", () => {
    expect(getCacheTTL("anthropic", "claude-3-5-sonnet")).toBe(300_000)
  })

  test("anthropic provider falls back to provider-level TTL for unknown model", () => {
    expect(getCacheTTL("anthropic", "any-model-id")).toBe(300_000)
  })

  test("unknown provider returns null", () => {
    expect(getCacheTTL("unknown", "x")).toBeNull()
  })

  test("mistral is intentionally absent — undocumented TTL", () => {
    expect(getCacheTTL("mistral", "mistral-large")).toBeNull()
  })

  test("model-level override wins over provider-level", () => {
    const reg: TTLRegistry = { "foo:bar": 1000, foo: 2000 }
    expect(getCacheTTL("foo", "bar", reg)).toBe(1000)
  })

  test("falls back to provider-level when no model match", () => {
    const reg: TTLRegistry = { "foo:bar": 1000, foo: 2000 }
    expect(getCacheTTL("foo", "baz", reg)).toBe(2000)
  })

  test("returns null when neither model nor provider match", () => {
    const reg: TTLRegistry = { "foo:bar": 1000, foo: 2000 }
    expect(getCacheTTL("zzz", "bar", reg)).toBeNull()
  })
})

describe("DEFAULT_REGISTRY", () => {
  test("anthropic is exactly 5 minutes (ephemeral cache default)", () => {
    expect(DEFAULT_REGISTRY.anthropic).toBe(5 * 60 * 1000)
  })

  test("openai is 5 minutes (conservative; actual 5-10 min)", () => {
    expect(DEFAULT_REGISTRY.openai).toBe(5 * 60 * 1000)
  })

  test("deepseek is 2 hours (conservative for disk-based cache)", () => {
    expect(DEFAULT_REGISTRY.deepseek).toBe(2 * 60 * 60 * 1000)
  })

  test("google is 1 hour (explicit Context Caching default)", () => {
    expect(DEFAULT_REGISTRY.google).toBe(60 * 60 * 1000)
  })

  test("xai is 5 minutes (no SLA, treated as ephemeral)", () => {
    expect(DEFAULT_REGISTRY.xai).toBe(5 * 60 * 1000)
  })

  test("mistral is intentionally absent from default registry", () => {
    expect(DEFAULT_REGISTRY.mistral).toBeUndefined()
  })
})
