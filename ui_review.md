# UI/UX review — London Flats mini app (v4)

## Problems found
- Raw email junk in the chats (markdown links, footers, "Similar properties", homeflow templates); system mails looked like agent replies.
- OpenRent cards said "OpenRent, London" and "text not available", with no way to see that the enquiry was never sent.
- Too many badges per card (5–8), several equal-weight buttons, and no clear primary action.
- The enquiries list was a wall of full conversations, and "our move" items were buried.
- Mixed English/Russian labels; small tap targets; Telegram theme and safe areas ignored.

## Principles
1. One card = one decision: a single primary CTA, with everything else in a ⋯ menu.
2. Status is one coloured pill (at most 2 badges).
3. Inbox-first: an "👉 Наш ход (N)" section at the top, then "Ждём агента", with "Закрыто" collapsed.
4. List → detail: compact rows; the conversation and drafts live in a bottom sheet.
5. Clean content: system mails collapsed into one-line labels; bubbles clamped to 3 lines with "ещё".
6. Native feel: Russian labels, --tg-theme-* colours, safe-area insets, tap targets ≥44px, sticky chips.

## Changes
- Mail sync: SYSTEM classification + one-line labels; Masha's text extracted from homeflow "Comments:"; markdown, footers and similar-listing blocks stripped.
- OpenRent: channel OpenRent, real area (postcodes.io ward + outcode), link to the openrent.co.uk listing, status pill "Не отправлено", text "Enquiry drafted on OpenRent, not yet sent to landlord", primary CTA "✅ Подтвердить на OpenRent" (bookviewing confirm link verified: it opens the "Confirm & Send" page).
- Flats: photo carousel with a score bubble, price and photo count; title; area · commute; 4 tags; enquiry line (avatar + pill + next step); CTA + 👍 👎 ⋯.
- Enquiries: sender chips (Все / Маша / Ассистент), sections by owner, compact rows (avatar, title, price, area · agency, pill, one-line next step) → detail sheet (next-step block, Masha-style draft with Send via bot / Edit / Copy, clean conversation, contacts).
- Viewings: upcoming / proposed / past (collapsed), London + Madrid time, one CTA per row.
- Kept: ratings + sync, deep links (reply_confirm), #flat- hash links, filters/sort; tab badge with the "our move" count; cache-busting version.
