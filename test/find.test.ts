import { describe, test, expect } from "bun:test"
import type { AssistantMessage, Message, UserMessage } from "@opencode-ai/sdk/v2"
import { findLastCacheActivity } from "../src/lib/find"

function mkAssistant(opts: {
  id?: string
  completed: number | undefined
  read: number
  write: number
}): AssistantMessage {
  return {
    id: opts.id ?? "asst_" + Math.random().toString(36).slice(2),
    sessionID: "ses_test",
    role: "assistant",
    time: { created: 1_000_000, completed: opts.completed },
    parentID: "parent",
    modelID: "claude-test",
    providerID: "anthropic",
    mode: "build",
    agent: "build",
    path: { cwd: "/", root: "/" },
    cost: 0,
    tokens: {
      input: 10,
      output: 20,
      reasoning: 0,
      cache: { read: opts.read, write: opts.write },
    },
  } as AssistantMessage
}

function mkUser(id: string = "user_" + Math.random().toString(36).slice(2)): UserMessage {
  return {
    id,
    sessionID: "ses_test",
    role: "user",
    time: { created: 999_999 },
    agent: "build",
    model: { providerID: "anthropic", modelID: "claude-test" },
  } as UserMessage
}

describe("findLastCacheActivity", () => {
  test("empty array returns null", () => {
    expect(findLastCacheActivity([])).toBeNull()
  })

  test("only user messages returns null", () => {
    const msgs: Message[] = [mkUser("u1"), mkUser("u2")]
    expect(findLastCacheActivity(msgs)).toBeNull()
  })

  test("incomplete assistant (completed undefined) is skipped", () => {
    const msgs: Message[] = [mkAssistant({ completed: undefined, read: 100, write: 0 })]
    expect(findLastCacheActivity(msgs)).toBeNull()
  })

  test("assistant with no cache activity returns null", () => {
    const msgs: Message[] = [mkAssistant({ completed: 1000, read: 0, write: 0 })]
    expect(findLastCacheActivity(msgs)).toBeNull()
  })

  test("read-only cache counts as activity", () => {
    const msg = mkAssistant({ id: "target", completed: 1000, read: 50, write: 0 })
    expect(findLastCacheActivity([msg])?.id).toBe("target")
  })

  test("write-only cache counts as activity", () => {
    const msg = mkAssistant({ id: "target", completed: 1000, read: 0, write: 50 })
    expect(findLastCacheActivity([msg])?.id).toBe("target")
  })

  test("returns the LATER of two cache messages", () => {
    const first = mkAssistant({ id: "first", completed: 1000, read: 100, write: 0 })
    const second = mkAssistant({ id: "second", completed: 2000, read: 0, write: 50 })
    expect(findLastCacheActivity([first, second])?.id).toBe("second")
  })

  test("skips user messages between cache messages", () => {
    const first = mkAssistant({ id: "first", completed: 1000, read: 100, write: 0 })
    const second = mkAssistant({ id: "second", completed: 2000, read: 50, write: 0 })
    const msgs: Message[] = [first, mkUser(), second]
    expect(findLastCacheActivity(msgs)?.id).toBe("second")
  })

  test("returns earlier cache message when later assistant has no cache", () => {
    const first = mkAssistant({ id: "first", completed: 1000, read: 100, write: 0 })
    const second = mkAssistant({ id: "second", completed: 2000, read: 0, write: 0 })
    expect(findLastCacheActivity([first, second])?.id).toBe("first")
  })
})
