# London flats — Telegram Mini App

Static Mini App (no build) for Grisha & Masha's London flat search. Served by GitHub Pages:
https://gowritegrisha.github.io/london-flats-app/ — opened from the Telegram bot's "Flats" menu button.

- `index.html` — app (telegram-web-app.js, theme-aware, filters/sort, enquiry drafts, local status via localStorage). It never sends anything to agents. Draft screen has "Confirm & send" / "Regenerate" which deliver a JSON request to the bot via Telegram.WebApp.sendData (works only when opened from the 🏠 Flats reply-keyboard button); picked up by rightmove-watch/tg_inbox.py.
- `listings.json` — data. `photos/` — compressed images (≤1000px).

## Adding listings (used by the 2-hourly routine)
```
python3 /workspace/rightmove-watch/publish_app.py new_matches.json            # append, commit, push
python3 /workspace/rightmove-watch/publish_app.py new_matches.json --update   # also overwrite existing ids (e.g. status change)
python3 /workspace/rightmove-watch/publish_app.py new_matches.json --no-push  # local only
```
`new_matches.json` is a list (or one object):
```json
[{"id":"94287432","title":"Lysia Street","area":"Fulham SW6","price":1950,"size":"51 m²",
  "floor":"Ground","furnished":"Furnished","available":"2026-11-11","commute":"~35-40 min",
  "pets":"","status":"new","notes":"","date_found":"2026-10-14",
  "photos":["handoff_1254/94287432_0.jpg","/abs/path/fp.jpg"]}]
```
Photo paths are absolute or relative to `/workspace/rightmove-watch/`. Pages redeploys ~1 min after push.

## Hidden cards: commute > 45 min (Grisha, 19 Oct 2026)
Cards with `commute_min` > 45 (TfL, metro-only / bus-only ≤30 rules) get `hidden: true` + `hidden_reason: "commute>45"`;
nothing is deleted. The app hides them by default; chip **🚇 показать скрытые (дальше 45 мин)** reveals them.
Flats with any activity stay visible (`kept_reason`): enquired (sent.json / masha_enquiries.json / agent_threads.json,
status ≠ new), liked/saved, viewing (viewings.json), replies, agent mail facts. Locally liked/saved/sent cards also stay visible.
Flags are set by `rightmove-watch/commute_hide.py`, called from commute_tfl.py, score.py, publish_app.py and
sources/apply_freshness.py, so new far flats never show by default. Test: `python3 rightmove-watch/test_commute_hide.py`.
