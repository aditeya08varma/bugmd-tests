# BugMD Pest Defense Pro — Quiz Funnel E2E Tests

Playwright end-to-end test suite for the BugMD Pest Defense Pro quiz funnel on Shopify.

## 📊 Live Test Report

👉 **[View Full Report](https://aditeya08varma.github.io/bugmd-tests/playwright-report/)**

99 tests · 3 devices · 0 failures

## Setup

```bash
npm install
npx playwright install chromium webkit
```

## Run

```bash
# All tests, all browsers — headless (fastest, no browser window)
npm test

# Watch every test run live in a real browser window
npm run test:headed

# One browser only (recommended when watching)
npx playwright test --project="Desktop Chrome" --headed

# Single test to debug one thing
npx playwright test --project="Desktop Chrome" --headed -g "annual plan adds"
```

## Seeing the results

**Option 1 — Live in the terminal (during the run)**
The `list` reporter prints each test as it finishes:
```
✓ completes quiz and lands on offer page (28s)
✓ annual plan adds pest-defense-pro-annual-kit to cart (31s)
✗ quarterly plan ... (FAILED)
```

**Option 2 — Watch it happen in a browser window**
```bash
npm run test:headed
```
A real browser opens and you can see every click, pause, and page transition as it runs.

**Option 3 — HTML report after the run**
```bash
npm run test:report
```
Opens a full interactive report at `playwright-report/index.html` showing:
- Pass / fail status for every test
- Screenshot taken at the end of each test
- Video recording of the full test run
- Step-by-step trace viewer (click any test → "Traces" to replay it action by action)

**Option 4 — Trace viewer for a failed test**
If a test fails, open its trace to see exactly what the browser saw:
```bash
npx playwright show-trace playwright-report/data/<trace-file>.zip
```

## Store Password

If the Shopify storefront is password-protected, set `STORE_PASSWORD` at the top of
`tests/quiz-funnel.spec.js`:

```js
const STORE_PASSWORD = 'yourpassword';
```

---

## What the tests cover and why

### Full quiz flow (tests 1–2)
The core spec requirement: walk through every step of the quiz and confirm the user
lands on the offer page. Tests home size selection, multi-select pest cards, severity,
and ZIP code entry. Without this working end-to-end, nothing else matters.

### Correct product added to cart (tests 2–3)
Verifies that clicking "Get This Plan" calls `/cart/add.js` with the right variant and
that the cart JSON reflects the correct product handle (`pest-defense-pro-annual-kit` or
`pest-defense-pro-quarterly-kit`) and price. Checks both plans independently to catch
any cross-wiring between variant IDs.

### Cart attributes carry quiz data (test 4)
The spec requires quiz data (ZIP, pests, home size) to be stored alongside the order.
We store these as Shopify cart attributes which persist to the order in the admin.
This test reads `/cart.js` and asserts the attributes were written correctly.

### Home size routing logic (tests 5–6)
The spec calls out home size as a routing signal. Tests that:
- Large home → Annual plan is featured/recommended
- Standard home + low severity → Quarterly plan is featured/recommended

### Offer page personalisation (tests 7–8)
Confirms the quiz state (ZIP badge, pest subtitle) appears correctly on the offer page,
validating that sessionStorage transfer between pages works across a real navigation.

### Flip card interaction (test 9)
Plan cards flip on click to show full feature details. Tests the forward flip and the
"← Back to overview" link, ensuring no broken states.

### Input validation guards (tests 10–11)
Confirms the quiz cannot be advanced without required selections — the Continue button
stays disabled until at least one pest is selected, and the Build button stays disabled
until a valid 5-digit ZIP is entered.

### Home size + severity routing (tests 5–9)
The routing rule is `(homeSize === 'large' || severity === 'high') ? 'annual' : 'quarterly'`.
All four combinations are tested:
- Large + low severity → Annual (large home always overrides)
- Large + high severity → Annual
- Standard + high severity → Annual
- Standard + medium severity → Quarterly
- Standard + low severity → Quarterly

For Quarterly-recommended cases, the test also asserts the sticky bar label, button
text ("Get Quarterly Plan"), and price ("$45") all update — not just the card styling.

### Facebook Pixel events (tests 10–17)
Full coverage of all 8 pixel events across the funnel:

| Event | Trigger | Test approach |
|---|---|---|
| `QuizStart` | Hero CTA click | `window.fbq` spy |
| `QuizStep1Complete` | Home size selected | `window.fbq` spy |
| `QuizStep2Complete` | Pest Continue clicked | `window.fbq` spy |
| `QuizStep3Complete` | Severity selected | `window.fbq` spy |
| `QuizStep4Complete` | ZIP submitted | `window.fbq` spy |
| `Lead` | ZIP submitted | `window.fbq` spy |
| `ViewContent` | Offer page load | Network beacon interception |
| `AddToCart` | Plan button clicked (annual) | `window.fbq` spy |
| `AddToCart` | Plan button clicked (quarterly) | `window.fbq` spy |

Quiz-page events use a `window.fbq` spy installed before each action.
`ViewContent` uses network request interception because it fires in `BO.init()`
on the offer page's DOMContentLoaded — before a cross-page spy could be installed.

---

## Design decisions

**Playwright over Cypress** — Playwright runs natively on WebKit (Safari engine) and
Chromium, matching the spec's required test environments (mobile Safari, Chrome) without
needing a separate paid Cypress Cloud plan.

**`/cart.js` for cart verification** — Rather than parsing the UI, reading the Shopify
cart API gives a deterministic assertion on product handle and price. It survives any
copy or layout changes without needing to update selectors.

**`waitForResponse` before clicking plan buttons** — The offer page fetches product
variant IDs asynchronously after load. Clicking before the fetch completes would trigger
an alert and fail the add-to-cart. Waiting for the `.js` response makes the test
reliable without arbitrary `page.waitForTimeout` calls.

**`STORE_PASSWORD` constant** — Centralised so it only needs to be set once, and the
test handles the unlock flow automatically before every test.
