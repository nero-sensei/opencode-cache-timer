/** @jsxImportSource @opentui/solid */
import type { TuiPlugin, TuiPluginApi, TuiPluginModule } from "@opencode-ai/plugin/tui"
import { createMemo, createSignal, onCleanup, Show } from "solid-js"
import { findLastCacheActivity } from "./lib/find"
import { formatTime } from "./lib/format"
import { getCacheTTL } from "./providers/registry"

const id = "cache-timer"

function View(props: { api: TuiPluginApi; session_id: string }) {
  const theme = () => props.api.theme.current
  const msgs = createMemo(() => props.api.state.session.messages(props.session_id))

  // 1 Hz tick for the countdown
  const [now, setNow] = createSignal(Date.now())
  const tick = setInterval(() => setNow(Date.now()), 1000)
  onCleanup(() => clearInterval(tick))

  const lastCache = createMemo(() => findLastCacheActivity(msgs()))

  const ttlMs = createMemo(() => {
    const m = lastCache()
    return m ? getCacheTTL(m.providerID, m.modelID) : null
  })

  const remaining = createMemo(() => {
    const m = lastCache()
    const ttl = ttlMs()
    if (!m || ttl === null || m.time.completed === undefined) return null
    return Math.max(0, ttl - (now() - m.time.completed))
  })

  return (
    <box flexDirection="column">
      <text fg={theme().text}>
        <b>Cache</b>
      </text>
      <Show
        when={remaining() !== null}
        fallback={<text fg={theme().textMuted}>◦ idle</text>}
      >
        <text fg={remaining()! > 0 ? theme().textMuted : theme().error}>
          {formatTime(remaining()!)}
        </text>
      </Show>
    </box>
  )
}

const tui: TuiPlugin = async (api) => {
  api.slots.register({
    order: 150,
    slots: {
      sidebar_content(_ctx, props) {
        return <View api={api} session_id={props.session_id} />
      },
    },
  })
}

const plugin: TuiPluginModule & { id: string } = { id, tui }
export default plugin
