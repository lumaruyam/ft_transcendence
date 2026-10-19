# End-to-end tests

Each file in `e2e/` is one suite. It builds the real Fastify application (and a Socket.IO hub when it needs one) and talks to it the way a client does,
against a PostgreSQL database that exists only for the run. A suite prints one `PASS` / `FAIL` line per check and exits non-zero if any failed.

```bash
npm test                          # every suite
npm test -- permissions oauth     # only these (file name without .e2e.ts)
npm run test:types                # type-check the tests
```

`run.sh` starts a disposable `postgres:16` container, creates an empty database per suite with every migration applied, gives each suite its own
upload folder (`UPLOADS_DIR`), runs it with `tsx`, and removes everything at the end. Needs Docker and `npm ci` in `backend/`.

| Suite | What it proves |
|---|---|
| `git-webhooks` | Signature checks, the push / pull request / merge lifecycle and its regression guards, audit log, notifications |
| `oauth` | State bound to the browser, private and unverified emails, linking, encrypted token, refusal, identity conflicts (GitHub is stubbed) |
| `permissions` | A matrix over the project routes (403 below the minimum role, 401 without a token), role changes, profile edit, account deletion |
| `permissions-live` | Roles on open sockets: viewers read-only, a demoted or removed member is cut off (about 35 s) |
| `public-api` | Keys (hash only, scope, revocation), CRUD with validation, roles through the key owner, rate limiting, served documentation |
| `notifications` | Who is told and who is not, coalescing, inbox endpoints, retention, live delivery |
| `realtime` | Authentication, every kanban event in order and only to its project, presence per person, membership events, eviction, shutdown |
| `notes-collab` | Three people typing in one note converge, a late joiner catches up, the saved state matches, a viewer cannot edit |
| `whiteboard-merge` | Many simultaneous saves, including the first one, keep every element |
| `concurrency` | Simultaneous requests: one board per project, distinct positions, 30 moves at once, tags, invite limits, signups, deletions |
| `proxy-ip` | The client address behind nginx can be trusted but not forged |

To add a suite: create `e2e/<name>.e2e.ts`, import `check`, `report` and `testConfig` from `./helpers.js`, and finish with `report()` then `process.exit(failures === 0 ? 0 : 1)`.
