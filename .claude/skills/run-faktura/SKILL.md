---
name: run-faktura
description: Build, launch, and drive the faktura Next.js inventory app locally — start the dev server, stand up a throwaway MongoDB replica set with seeded data, bypass the Auth0 login wall, and click through pages in headless Chrome to take screenshots. Use when asked to run, start, or screenshot faktura, or to verify a UI change works in the real app rather than just typechecking.
---

# Run faktura

Next.js 15/16 (App Router, Turbopack) inventory app on MongoDB + Auth0.
All dashboard routes sit behind auth, and the DB it expects is a **local
Mongo replica set** that is not running by default. So "run the app"
means four things: Mongo up, data seeded, dev server up, and a browser
driver that carries a forged session cookie.

The driver is `.claude/skills/run-faktura/driver.mjs` — a stdin REPL over
headless Chrome (playwright-core). It mints and injects the session
cookie itself.

All paths below are relative to the repo root.

## Prerequisites

One-time. `playwright-core` installs into the skill dir (gitignored) so
it never touches the app's `package.json`:

```bash
npm install
npm --prefix .claude/skills/run-faktura install playwright-core
```

The driver reuses a Chrome already in the `ms-playwright` cache
(`~/Library/Caches/ms-playwright/chromium-*/`), falling back to
`/Applications/Google Chrome.app`. If neither exists, either
`npx playwright install chromium` or point at any Chrome:
`FAKTURA_CHROME=/path/to/chrome`.

`.env` must exist at the repo root — the driver reads `AUTH_SECRET` from
it to sign the session cookie, and `MONGODB_URI` for seeding.

## Start the stack

```bash
./.claude/skills/run-faktura/mongo.sh start      # boots colima if needed, then mongod --replSet rs0
node .claude/skills/run-faktura/seed.mjs         # tenant + customer + product + proposal
npm run dev                                      # background this; ~2s to ready
```

Wait for the port rather than sleeping (macOS has no `timeout`):

```bash
for i in $(seq 1 90); do curl -s -o /dev/null http://localhost:3000/ && break; sleep 1; done
```

`seed.mjs` prints the IDs it wrote and the URLs worth visiting. Fixed
IDs, upserts, safe to re-run:

- proposal `68f48a2050abe41246b22a02` (customer Ada Lovelace, date `2026-03-14`)
- customer `68f48a2050abe41246b22a01`, product `68f48a2050abe41246b22a03`
- tenant `67f48a2050abe41246b22a87` — must stay in sync with the
  `defaultTenantId` in `lib/auth-utils.ts`

## Run: the driver (agent path)

Pipe commands in. Every line answers `ok …` or `ERR …`, and the process
exits non-zero if any command failed:

```bash
node .claude/skills/run-faktura/driver.mjs <<'EOF'
nav /proposals/68f48a2050abe41246b22a02/edit
wait #customerFirstName
dump form
fill #customerFirstName Grace
fill #customerLastName Hopper
click button:has-text("Update Proposal")
waiturl /proposals/.*/view
wait text=Grace
shot proposal-view
errors
quit
EOF
```

Commands: `nav <path>` · `wait <sel>` · `fill <sel> <value>` ·
`click <sel>` · `read <sel>` · `dump <sel>` · `url` ·
`waiturl <regex>` · `text` · `shot [name]` · `errors` · `quit`.

- Bare paths resolve against `http://localhost:3000` (override with `FAKTURA_URL`).
- `dump form` is the fast way to see every input's `value` and `disabled`
  at once — usually more useful than a screenshot for form work.
- `read` returns an input's value, or a non-input's text.
- `shot <name>` → `.claude/skills/run-faktura/screenshots/<name>.png`.
  Append `!` for full-page. **Open the PNG and look at it** — a blank
  frame means the page never rendered.
- `errors` prints console + page errors collected so far.
- For step-by-step debugging, run the same driver under tmux and
  `send-keys` one command at a time.

Verified working routes: `/home`, `/products`, `/customers`, `/invoices`,
`/proposals`, `/proposals/<id>/edit`, `/proposals/<id>/view`.

### Asserting server-side state

The UI can lie about what got saved (see the date gotcha below). Check Mongo:

```bash
./.claude/skills/run-faktura/mongo.sh shell --quiet --eval \
  'const p=db.proposals.findOne({_id:ObjectId("68f48a2050abe41246b22a02")}); print(p.customerFirstName, p.customerLastName, p.date.toISOString())'
```

### Fetching a page without a browser

For checking server-rendered HTML only. `session.mjs` prints a cookie:

```bash
TOK=$(node .claude/skills/run-faktura/session.mjs)
curl -s -H "Cookie: authjs.session-token=$TOK" \
  http://localhost:3000/proposals/68f48a2050abe41246b22a02/edit \
  | grep -oE 'id="(customerFirstName|date)"[^>]*'
```

## Run: human path

`npm run dev` then open http://localhost:3000 and log in through Auth0
for real. Only useful if you have working Auth0 credentials; the driver
path does not.

## Stop

```bash
lsof -ti:3000 -sTCP:LISTEN | xargs kill      # npm does not forward SIGTERM to next
./.claude/skills/run-faktura/mongo.sh stop   # removes container + throwaway volume
colima stop                                  # only if you want the VM down again
```

## Gotchas

- **Auth is real and it 302s.** Unauthenticated `/proposals` returns
  `302 → /`, and `curl` without `-L` then shows an *empty 1-byte body* —
  which reads like "the page is broken" but means "you're not logged in."
  The gate is the `authorized()` callback in `auth.ts`, covering
  `/products /customers /invoices /returns /repairs /loginitems
  /logoutitems /reports /profile /proposals /wanted`.
- **The auth middleware is `proxy.ts`, not `middleware.ts`.** Next 16
  renamed it. `CLAUDE.md` still says middleware; there is no
  `middleware.ts` in this repo. `proxy.ts` is what turns the session into
  the `x-tenant-id` / `x-user-*` request headers that server actions read.
- **Session cookie details matter.** Name is `authjs.session-token`
  (plain http — *not* `__Secure-`), and in `@auth/core` ≥ 0.30 the JWE
  `salt` must equal that cookie name. Wrong salt = silently
  unauthenticated. `session.mjs` handles both.
- **`MONGODB_URI` demands a replica set.** It ends in `?replicaSet=rs0`,
  so a plain `docker run mongo:8` will not connect — you need
  `--replSet rs0` plus `rs.initiate()`. `mongo.sh` does it.
- **Do not mount the existing `lager2_mongodb_data` volume.**
  `rs.initiate()` writes `local.oplog.rs` into the data directory,
  mutating that data in place. `mongo.sh` uses its own
  `faktura_verify_data` volume for this reason. Seed instead of
  borrowing real data.
- **Docker is colima and it is usually stopped.** `mongo.sh start` boots
  it (~1 min).
- **Dates are stored as UTC midnight and rendered in local time.** A
  proposal saved as `2026-03-14T00:00:00.000Z` displays as *March 13,
  2026* on the view page (`components/proposals/view-proposal.tsx`
  `toLocaleDateString`) and is indexed as `2026-03-13` in the `search`
  field (`lib/actions/proposal-actions.ts` `format(doc.date, …)`) west of
  UTC. Pre-existing bug, unrelated to whatever you're testing — don't
  chase it unless that's the task. For `<input type="date">`, slice the
  ISO string (`date.split('T')[0]`) rather than round-tripping through
  `new Date()`, or you shift the day.
- **`next dev` rewrites `CLAUDE.md`** on boot, appending an
  `nextjs-agent-rules` block. Expect that dirty file; it re-adds itself
  if you revert it.
- **Hydration-mismatch spam is environmental.** Something injects
  `caret-color: transparent` onto every input post-SSR, so React logs a
  huge mismatch dump on each load. `driver.mjs` filters it out of
  `errors`; it is not your bug.
- **React controlled inputs need `fill`, not `eval el.value = …`** — the
  latter skips onChange and the state never updates.
- **First `nav` to a route can take 10s+** while Turbopack compiles it.
  `wait` absorbs it; `sleep` doesn't.

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `ECONNREFUSED ::1:27017` from seed.mjs | Mongo isn't up → `mongo.sh start` |
| Page renders but tables are empty | Mongo up but unseeded → `node .claude/skills/run-faktura/seed.mjs` |
| `curl` returns 1 byte / empty body | 302 to `/`; you sent no session cookie (or add `-L`) |
| `ERR playwright-core not found` | `npm --prefix .claude/skills/run-faktura install playwright-core` |
| `Failed to launch chromium because executable doesn't exist` | Cache holds `Google Chrome for Testing.app`, not `Chromium.app`; the driver globs for both — if it still fails, set `FAKTURA_CHROME` to a real binary |
| `next dev` fails with `EADDRINUSE` | `lsof -ti:3000 -sTCP:LISTEN \| xargs kill` |
| `mongod never became primary` | colima low on resources; `colima stop && colima start`, then retry |
