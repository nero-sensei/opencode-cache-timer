#!/usr/bin/env bun
/**
 * Build script: copy source files from src/ to dist/.
 *
 * Why copy instead of bundle: OpenCode loads TUI plugins via a runtime
 * Babel-based Bun plugin (@opentui/solid/bun-plugin) that transforms JSX
 * from .tsx source at load time. Pre-bundling with Bun's built-in JSX
 * transformer produces output that targets a jsx-runtime module which
 * @opentui/solid does not ship (it's a .d.ts stub). So the only valid
 * distribution format for a TUI plugin with JSX is source .tsx/.ts.
 *
 * This script:
 *   1. Cleans dist/
 *   2. Recursively copies every .ts/.tsx file under src/ into dist/
 *      preserving directory structure
 *   3. Does NOT copy tests, scripts, or configs
 *   4. Verifies the entry file exists in the output
 */

import { readdir, mkdir, copyFile, rm, stat } from "node:fs/promises"
import { join, dirname, relative } from "node:path"

const ROOT = new URL("..", import.meta.url).pathname
const SRC = join(ROOT, "src")
const DIST = join(ROOT, "dist")

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const files: string[] = []
  for (const entry of entries) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await walk(full)))
    } else if (entry.isFile() && (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx"))) {
      files.push(full)
    }
  }
  return files
}

async function main() {
  // Clean
  await rm(DIST, { recursive: true, force: true })
  await mkdir(DIST, { recursive: true })

  // Copy
  const files = await walk(SRC)
  for (const src of files) {
    const rel = relative(SRC, src)
    const dest = join(DIST, rel)
    await mkdir(dirname(dest), { recursive: true })
    await copyFile(src, dest)
  }

  // Verify entry
  const entry = join(DIST, "index.tsx")
  const entryStat = await stat(entry).catch(() => null)
  if (!entryStat || !entryStat.isFile()) {
    console.error(`[build] FATAL: entry file missing at ${entry}`)
    process.exit(1)
  }

  // Summary
  const total = files.length
  const sizes = await Promise.all(files.map(async (f) => (await stat(f)).size))
  const bytes = sizes.reduce((a, b) => a + b, 0)
  console.log(`[build] copied ${total} files (${bytes} bytes) from src/ -> dist/`)
}

await main()
