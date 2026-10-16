# London flats app — automated gates

Fast checks that keep iPhone / Telegram Mini App regressions from shipping.

## Tests

| Script | What |
|--------|------|
| `undefined_calls.mjs` | Parse `app.js` with [acorn](https://github.com/acornjs/acorn); fail if any `foo(` call refers to an undeclared name (catches deleted helpers like `chanOf` / `isAs`). |
| `smoke.mjs` | Playwright **WebKit**, iPhone 13, dark scheme, stubbed `Telegram.WebApp` (iOS) + `#tgWebAppData`. Loads the app URL, asserts listings &gt; 0, visits every tab, opens enquiry sheets for **Email / WhatsApp / OpenRent / Rightmove** (injects stubs into `sent.json` when a channel is missing), opens a viewing action + flat `⋯` menu + score sheet, scrolls/load-more. **Fails** on `pageerror`, `console.error`, or a visible `#errbox`. Debug panel `#dbgp` must stay hidden by default. |
| `run.sh` | Starts a local `python3 -m http.server`, runs both tests. Target **&lt; 30s**. |
| `postdeploy.sh` | After push: wait until GitHub Pages HTML contains the expected version string, then run `smoke.mjs` against the live URL. Prints a loud banner on failure. |

```bash
# local gate
./tests/run.sh

# against an already-running server or live Pages
node tests/smoke.mjs http://127.0.0.1:8765/
node tests/smoke.mjs https://gowritegrisha.github.io/london-flats-app/
```

Env: `FLATS_TEST_PORT` (default `8765`), `FLATS_APP_URL`, `FLATS_EXPECT_VER` (default `v4.5`), `FLATS_PAGES_WAIT` (seconds, default `120`).

## Wired into ship path

1. **git pre-commit** in this repo runs `tests/run.sh` (also refreshes `listings_lite.json` via `make_lite.py`). A failing test **aborts the commit**.
2. **rightmove-watch** publish/sync scripts call `flats_app_gate.py` before `git commit`/`push` (data-only pushes included) and `flats_app_gate.postdeploy()` after a successful push.

First run may download Playwright WebKit; subsequent runs reuse `~/.cache/ms-playwright` and `tests/node_modules`.

## Install local git hook

```bash
./tests/install-hooks.sh
```

The hook runs `make_lite.py` then `tests/run.sh` and aborts the commit on failure.
