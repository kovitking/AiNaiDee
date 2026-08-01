# AGENTS.md

Instructions for coding agents working in this repository.
See `CLAUDE.md` for commands and architecture.

## Package manager

Always use `pnpm` (pinned to `11.1.3`). Never `npm`, `yarn`, `npx`, or `bun install` / `bun run`.
Do not add npm, Yarn, or Bun lockfiles.

Install from the workspace root. To run a script in one package:

```bash
pnpm --filter runai <script>
```

`packages/runai` still targets the Bun *runtime* in its implementation code — keep APIs like
`Bun.spawn` and `bun:sqlite` unless the task is explicitly to migrate it off Bun.

## Verification

Run `pnpm test` and `pnpm packages:typecheck` after changing code. Both complete in about a second.

This reverses the previous instruction in this file, which told agents to skip verification on the
grounds that it was slow. Measured on this repo: 200 tests in ~1.5s, typecheck in <1s, full build
in ~27s.
