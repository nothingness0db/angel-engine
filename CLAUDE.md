# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Rust

```sh
cargo test --workspace --all-targets        # build and run all tests
cargo test -p angel-engine -p angel-engine-client  # run core crates only (faster iteration)
cargo fmt --all                             # format
cargo fmt --all --check                     # check format (CI gate)
# Smoke tests require installed+authenticated codex/kimi CLIs:
cargo test -p angel-engine --test process_smoke -- --ignored
```

### pnpm workspace (from repo root)

```sh
pnpm napi:build               # build NAPI .node binding (release) — run after any Rust type change
pnpm napi:build:debug         # build NAPI binding (debug)
pnpm js-client:build          # compile packages/js-client TypeScript → dist/
pnpm js-client:test           # run vitest tests for @angel-engine/js-client
pnpm desktop:start            # start Electron dev server
pnpm desktop:make             # package + produce installer (outputs to desktop/out/make)
pnpm desktop:typecheck        # typecheck desktop only
pnpm typecheck                # typecheck all packages
pnpm lint                     # lint all packages
```

### Desktop-specific

```sh
pnpm --filter desktop run db:generate   # generate Drizzle migration after schema changes
pnpm --filter desktop run format        # prettier format
```

### Critical build order

After editing `packages/js-client` TypeScript sources, `pnpm js-client:build` must run before `desktop:make` — Vite does not bundle `@angel-engine/js-client` (it is external), so the make step copies the `dist/` output directly.

After any change to Rust API types in `angel-engine`, `angel-engine-client`, or the NAPI crate, rebuild the NAPI binding before running desktop:

```sh
pnpm napi:build
```

## Architecture

### Layer model (read AGENTS.md for full rules)

```
angel-engine (Rust, protocol-neutral state machine)
  ↑ EngineEvent / ProtocolEffect
angel-provider (Rust, protocol adapters: Codex, ACP)
  ↑ runtime IO
angel-engine-client (Rust, client ergonomics + snapshots)
  ↑ N-API binding
@angel-engine/client-napi (TypeScript types + .node file)
  ↑
@angel-engine/js-client (TypeScript helpers + Claude Code session)
  ↑
desktop (Electron, React UI)
```

**Core rule**: Provider-specific wire-format quirks belong in `angel-provider` adapters only. `angel-engine` state/reducers, `angel-engine-client`, `@angel-engine/client-napi`, and desktop must never branch on Codex/ACP-specific payload shapes. If a runtime needs special interpretation, add it to the corresponding adapter and surface the result as a protocol-neutral engine concept.

### angel-engine (core state machine)

`AngelEngine::plan_command()` produces `CommandPlan` / `ProtocolEffect` from UI commands. `AngelEngine::apply_event()` commits facts into state from `EngineEvent`. Only `apply_event` mutates business state — `plan_command` records pending requests only. Design docs live in `crates/angel-engine/docs/`.

### angel-provider (adapters)

- `src/codex/` — all Codex app-server wire format, hydrate replay, request/response decoding
- `src/acp/` — all ACP wire format, session updates, tool call mapping

For protocol fields with a closed value set, use typed enums or exact canonical wire names via serde. Unknown values must fail fast — no casing fallbacks or prefix matching.

### @angel-engine/client-napi

Thin N-API binding. Built from `crates/angel-engine-client-napi/` via `napi build --platform`. The `.node` file is platform-specific and cannot cross-compile. Rebuild whenever Rust API or snapshot/event/settings types change.

### @angel-engine/js-client (`packages/js-client/`)

TypeScript client helpers. Key subpath exports:

- `@angel-engine/js-client` — main client/store/types
- `@angel-engine/js-client/claude` — `ClaudeCodeSession` and Claude runtime adapter
- `@angel-engine/js-client/utils/*` — typed helpers (attachments, messages, tools, plans, elicitations). Runtime validation uses ArkType schemas.
- `@angel-engine/js-client/mock` — mock transport for tests

Tests live in `src/**/__tests__` and run with vitest.

### desktop (Electron app)

**Main process** (`src/main/`):

- `features/chat/engine-runtime.ts` — session lifecycle; creates either `DesktopAngelSession` (native NAPI) or `ClaudeCodeSession` (Claude Code SDK) depending on `chat.runtime`
- `features/chat/repository.ts` — SQLite via Drizzle (chats + projects metadata only; messages are never stored, they come from runtime hydrate)
- `ipc/router.ts` — `@egoist/tipc` type-safe IPC router

**Preload** (`src/preload/bridges/`) — exposes typed IPC bridges to renderer.

**Renderer** (`src/renderer/`) — React 19 + Tailwind CSS v4 + assistant-ui + Wouter routing + TanStack Query + Zustand.

**UI constraint**: All select controls must use `NativeSelect` / `NativeSelectOption` / `NativeSelectOptGroup` from `@/components/ui/native-select`. Do not use Radix `Select` or `@/components/ui/select`.

**DB schema changes**: After editing `desktop/src/main/db/schema.ts`, run `pnpm --filter desktop run db:generate` to produce the Drizzle migration.

### Electron packaging (`desktop/forge.config.ts`)

- `@angel-engine/js-client` and `@anthropic-ai/claude-agent-sdk` are Vite externals — Vite does not bundle them. The `packageAfterCopy` forge hook copies them (and their transitive `dependencies`) from workspace `node_modules` into the build.
- Native modules (`better-sqlite3`, `@angel-engine/client-napi`) are unpacked from the asar by `AutoUnpackNativesPlugin`.
- The Claude Code CLI binary (`claude.exe` / `claude`) is placed outside the asar via `extraResource` (platform detected at build time from `@anthropic-ai/claude-agent-sdk-<platform>-<arch>`). At runtime, when `app.isPackaged`, `engine-runtime.ts` passes `pathToClaudeCodeExecutable: path.join(process.resourcesPath, "claude.exe")` to `ClaudeCodeSession` so the SDK uses the extracted binary instead of searching inside the asar.

### Verification gates before cross-layer changes

```sh
cargo test -p angel-engine -p angel-engine-client
cargo fmt --all --check
pnpm napi:build
pnpm desktop:typecheck
```
