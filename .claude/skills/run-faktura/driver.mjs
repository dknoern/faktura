#!/usr/bin/env node
// Headless-Chrome REPL for the faktura dev server. Reads one command per line
// from stdin, so it works both piped (`driver.mjs <<'EOF' ... EOF`) and
// interactively under tmux via send-keys.
//
// It auto-injects a minted authjs session cookie, so protected routes
// (/proposals, /products, /customers, /invoices, /reports, /profile) load
// instead of 302-ing to `/`.
//
// Commands:
//   nav <path|url>          navigate (bare paths resolve against localhost:3000)
//   wait <selector>         waitForSelector, 30s timeout ("text=Foo" works)
//   fill <selector> <value> set a value through React's onChange pipeline
//   click <selector>        click ("button:has-text(\"Update Proposal\")")
//   read <selector>         print value of an input, else its text content
//   dump <selector>         print JSON of every input/select under selector
//   url                     print current URL
//   waiturl <regex>         wait for the URL to match
//   text                    print the page's visible text (collapsed)
//   shot [name]             screenshot -> screenshots/<name>.png
//   errors                  print console errors + page errors so far
//   quit                    close and exit
//
// Every command prints a line starting with "ok" or "ERR" so a piped script's
// output is greppable.
import { createRequire } from 'node:module'
import { existsSync, mkdirSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import readline from 'node:readline'
import os from 'node:os'
import { mintSessionToken, COOKIE_NAME } from './session.mjs'

const require = createRequire(import.meta.url)
const SKILL_DIR = path.dirname(fileURLToPath(import.meta.url))
const SHOTS = path.join(SKILL_DIR, 'screenshots')
const BASE = process.env.FAKTURA_URL || 'http://localhost:3000'

// --- resolve playwright-core (installed into this skill dir; see SKILL.md) ---
let chromium
for (const spec of ['playwright-core', '/tmp/pw-driver/node_modules/playwright-core']) {
  try {
    const mod = await import(require.resolve(spec, { paths: [SKILL_DIR] }))
    chromium = mod.chromium ?? mod.default?.chromium
    if (chromium) break
  } catch {}
}
if (!chromium) {
  console.error(
    'ERR playwright-core not found. Run:\n' +
      '  npm --prefix .claude/skills/run-faktura install playwright-core'
  )
  process.exit(1)
}

// --- resolve a Chrome binary --------------------------------------------------
// playwright-core ships no browser. Reuse whatever the ms-playwright cache
// already downloaded (dir name is version-stamped: chromium-1208, -1228, ...),
// else fall back to a system Chrome.
function findChrome() {
  if (process.env.FAKTURA_CHROME) return process.env.FAKTURA_CHROME

  const cache =
    process.env.PLAYWRIGHT_BROWSERS_PATH ||
    (process.platform === 'darwin'
      ? path.join(os.homedir(), 'Library/Caches/ms-playwright')
      : path.join(os.homedir(), '.cache/ms-playwright'))

  if (existsSync(cache)) {
    const versioned = readdirSync(cache)
      .filter((d) => d.startsWith('chromium-'))
      .sort()
      .reverse()
    const leaves = [
      'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
      'chrome-mac-x64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
      'chrome-mac-arm64/Chromium.app/Contents/MacOS/Chromium',
      'chrome-linux/chrome',
    ]
    for (const v of versioned) {
      for (const leaf of leaves) {
        const p = path.join(cache, v, leaf)
        if (existsSync(p)) return p
      }
    }
  }

  for (const p of [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
  ]) {
    if (existsSync(p)) return p
  }
  throw new Error('no Chrome binary found; set FAKTURA_CHROME=<path>')
}

// --- launch -------------------------------------------------------------------
mkdirSync(SHOTS, { recursive: true })
const browser = await chromium.launch({ executablePath: findChrome(), args: ['--no-sandbox'] })
const ctx = await browser.newContext({ viewport: { width: 1400, height: 1100 } })
await ctx.addCookies([
  {
    name: COOKIE_NAME,
    value: await mintSessionToken(),
    domain: 'localhost',
    path: '/',
    httpOnly: true,
    secure: false,
    sameSite: 'Lax',
  },
])
const page = await ctx.newPage()

const errors = []
page.on('console', (m) => {
  if (m.type() !== 'error') return
  const t = m.text()
  // Environmental noise: something injects `caret-color: transparent` onto
  // every input after SSR, so React logs one hydration-mismatch dump per load.
  if (t.includes('tree hydrated but some attributes')) return
  errors.push(t)
})
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))

console.log(`ok launched ${BASE}`)

// --- REPL ---------------------------------------------------------------------
const T = { timeout: 30000 }
const abs = (u) => (/^https?:/.test(u) ? u : BASE + (u.startsWith('/') ? u : '/' + u))
let shotN = 0

async function run(line) {
  const [cmd, ...rest] = line.trim().split(/\s+/)
  const arg = rest.join(' ')
  switch (cmd) {
    case '':
    case undefined:
    case '#':
      return
    case 'nav':
      await page.goto(abs(arg), { waitUntil: 'domcontentloaded', ...T })
      return console.log('ok nav ' + page.url())
    case 'wait':
      await page.waitForSelector(arg, T)
      return console.log('ok wait ' + arg)
    case 'fill': {
      // Split on the LAST space-separated selector token is ambiguous, so use
      // the convention: selector, then a single space, then the rest is value.
      const i = line.trim().indexOf(' ')
      const body = line.trim().slice(i + 1)
      const j = body.indexOf(' ')
      const sel = j === -1 ? body : body.slice(0, j)
      const val = j === -1 ? '' : body.slice(j + 1)
      await page.fill(sel, val, T) // goes through React onChange, unlike el.value=
      return console.log(`ok fill ${sel} = ${JSON.stringify(val)}`)
    }
    case 'click':
      await page.click(arg, T)
      return console.log('ok click ' + arg)
    case 'read': {
      const el = await page.waitForSelector(arg, T)
      const tag = (await el.evaluate((n) => n.tagName)).toLowerCase()
      const v =
        tag === 'input' || tag === 'textarea' || tag === 'select'
          ? await el.inputValue()
          : (await el.textContent())?.replace(/\s+/g, ' ').trim()
      return console.log(`ok read ${arg} = ${JSON.stringify(v)}`)
    }
    case 'dump': {
      const out = await page.$$eval(
        `${arg} input, ${arg} select, ${arg} textarea`,
        (els) =>
          els.map((e) => ({
            id: e.id || undefined,
            type: e.type || undefined,
            value: e.value,
            disabled: e.disabled,
          }))
      )
      return console.log('ok dump ' + JSON.stringify(out))
    }
    case 'url':
      return console.log('ok url ' + page.url())
    case 'waiturl':
      await page.waitForURL(new RegExp(arg), T)
      return console.log('ok waiturl ' + page.url())
    case 'text': {
      const t = (await page.textContent('body')) || ''
      return console.log('ok text ' + t.replace(/\s+/g, ' ').trim().slice(0, 2000))
    }
    case 'shot': {
      const name = arg || `shot-${String(++shotN).padStart(2, '0')}`
      const file = path.join(SHOTS, `${name}.png`)
      await page.screenshot({ path: file, fullPage: arg.endsWith('!') })
      return console.log('ok shot ' + file)
    }
    case 'errors':
      return console.log('ok errors ' + (errors.length ? JSON.stringify(errors) : 'none'))
    case 'quit':
      await browser.close()
      process.exit(0)
    default:
      return console.log('ERR unknown command: ' + cmd)
  }
}

const rl = readline.createInterface({ input: process.stdin, terminal: false })
let failed = false
for await (const line of rl) {
  try {
    await run(line)
  } catch (e) {
    failed = true
    console.log('ERR ' + line.trim() + ' :: ' + e.message.split('\n')[0])
  }
}
if (errors.length) console.log('ok errors ' + JSON.stringify(errors))
await browser.close()
process.exit(failed ? 1 : 0)
