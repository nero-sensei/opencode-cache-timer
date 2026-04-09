import { describe, test, expect } from "bun:test"
import { formatTime } from "../src/lib/format"

describe("formatTime", () => {
  test("zero returns expired", () => {
    expect(formatTime(0)).toBe("expired")
  })

  test("negative small returns expired", () => {
    expect(formatTime(-1)).toBe("expired")
  })

  test("negative large returns expired", () => {
    expect(formatTime(-99_999)).toBe("expired")
  })

  test("500ms rounds down to 0s", () => {
    expect(formatTime(500)).toBe("0s")
  })

  test("999ms rounds down to 0s", () => {
    expect(formatTime(999)).toBe("0s")
  })

  test("1000ms is 1s", () => {
    expect(formatTime(1000)).toBe("1s")
  })

  test("45s under a minute", () => {
    expect(formatTime(45_000)).toBe("45s")
  })

  test("exactly 60s is 1m 0s", () => {
    expect(formatTime(60_000)).toBe("1m 0s")
  })

  test("61.5s is 1m 1s", () => {
    expect(formatTime(61_500)).toBe("1m 1s")
  })

  test("4m 23s", () => {
    expect(formatTime(263_000)).toBe("4m 23s")
  })

  test("5 minutes exact", () => {
    expect(formatTime(300_000)).toBe("5m 0s")
  })
})
