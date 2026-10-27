---
name: deploy-cloudflare
description: "Cloudflare hosting, end to end and LIVE at readthegame.co. Tokens deliberately too weak for the next job, the domain binding, the CORS trap curl cannot see, gates that check what a visitor gets — and ⭐ since 2026-09-17 THE RELEASE GATE: a src/ change deploys a PREVIEW first, browser checks run on it, then the same commit ships; R2 CORS allows *.read-the-game.pages.dev."
metadata: 
  node_type: memory
  type: project
  originSessionId: c63eca5f-d848-4a71-b19c-07da95096e3a
  modified: 2026-08-08T13:33:16.305Z
---

**Kevin, 2026-08-08: "connect my Cloudflare account and do some *live* testing, just to verify we get that path up and running."**

The goal is to prove the deployment path end-to-end **before** anything is built on top of it — not to build the platform yet. A working deploy is the prerequisite for Phases 4–6 in `docs/platform-architecture.md`.

**Why Cloudflare fits what was already designed** (see that doc, CHENG-reviewed):
- The apps are self-contained single HTML files with no network calls — exactly what static hosting serves best. **Pages** takes them with zero config.
- **Reducers never run server-side** ([[product-replay-not-realtime]]). The server ingests, stores, indexes and serves; the browser derives every metric. So traffic costs stay ~flat via CDN, and 10,000 users cost about what 100 do.
- Cloudflare covers the whole shape without a backend to babysit: **Pages** (static), **Cron Triggers** (the nightly ingest), **R2** (raw feeds + extracts), **D1** (the small game index — facts about games, never their events).

## DONE, 2026-08-08 — live; custom domain added 2026-08-09

**The site is https://readthegame.co** — NO HYPHENS in the domain, while the Pages project and its `*.pages.dev` name are `read-the-game` WITH hyphens. Both spellings are load-bearing and easy to swap; a DNS lookup of the hyphenated domain finds nothing, because it does not exist.

Kevin's call was to skip a throwaway test project and claim the real name. Shipped in `c3d0ad1` + the follow-up fix, via `.github/workflows/deploy.yml` on push to `main`.

**Deploy from CI, never from the laptop, for three reasons that still hold:**
- Wrangler needs Node ≥ 22; this machine has 20 hand-installed in `~/.local/bin` with no version manager. Deploying locally would mean upgrading the runtime the test matrix is pinned against.
- The Cloudflare token stays in GitHub and never touches the laptop.
- CI builds from a **clean checkout**, so only committed files can be published. `builders/build_rules.py` reached the repo by accident once — this closes that path to the public site.

**The two credential types are NOT interchangeable, and this cost a round trip.** Kevin first created an **R2 API token** (`ACCESS_KEY_ID` / `SECRET_ACCESS_KEY` / `S3_API_ENDPOINT` — R2 mimics S3, hence the shape). That authorizes bucket I/O only. Pages deploys need a **Cloudflare API token** (`CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID`, permission `Account → Cloudflare Pages → Edit`, from dash.cloudflare.com/profile/api-tokens). Both sets are now GitHub repo secrets. Note: **the account ID is the first segment of the `S3_API_ENDPOINT`** (`https://<ACCOUNT_ID>.r2.cloudflarestorage.com`) — no need to hunt for it.

**Pages serves a folder verbatim: `/` is answered by `index.html` or by a 404.** There was none, and `python3 -m http.server` had hidden that all through development by generating a directory listing — the root worked locally and would have 404'd in production. `builders/build_index.py` + `test/index.test.js` now generate and gate it.

**Cold start bit the verification, not the deploy.** A brand-new `*.pages.dev` hostname answers **522 for ~40 seconds** while the edge provisions, and `000` while DNS propagates. The first run published perfectly and failed anyway because retry was on the root only. Retry belongs on **every** request — but never on a 404, which is a real answer.

**The deploy gate asserts published bytes == committed bytes**, per page, via `cmp`. HTTP 200 only proves something answered. Pages serves byte-identical (no minification), so this holds. Confirmed it can fail before trusting it.

## The custom domain, 2026-08-09

**Binding a domain to Pages is TWO steps with TWO different permissions, and this is the trap.**
1. **Claim the hostname on the Pages project** — `POST /accounts/{acct}/pages/projects/{project}/domains`. Needs `Pages → Edit`, which our token has. It returns success immediately.
2. **Create the DNS record** so the name resolves at the project. Needs `Zone → DNS → Edit`, which our token does **not** have.

Doing step 1 alone leaves the domain at `status=pending, validation=pending` **while reporting success** — the site stays unreachable and the workflow retries a name that can never resolve. `.github/workflows/domain.yml` now reads the status back and says exactly this, instead of leaving a wall of HTTP 000 to interpret.

**Kevin finished it in the dashboard with two CNAMEs**, both proxied, TTL auto, in the `readthegame.co` zone:
`@ → read-the-game.pages.dev` and `www → read-the-game.pages.dev`. A CNAME at the apex is normally illegal; Cloudflare flattens it, which is why `@` works here. Activation and the certificate took a few minutes, during which both names answered **522** — that is the normal not-ready state, not a fault. Verified afterwards: all 8 pages on both hostnames byte-identical to the repo.

**`deploy.yml` now verifies all three public hostnames** (`readthegame.co`, `www`, `read-the-game.pages.dev`) via `PUBLIC_HOSTS`, because the binding lives in Cloudflare rather than in the repo and can come detached — a gate checking only `pages.dev` would stay green while the real site was down. The per-page byte diff stays on the immutable deployment URL; the hostnames are a separate claim.

**Open, deliberately not decided:** apex and `www` both serve the site with no canonical redirect. Fine for now; a Redirect Rule would need zone scope too.

**`data.readthegame.co` is a public R2 binding** (proxied, currently 404 because the bucket is empty). Anything the nightly ingest writes there becomes **publicly readable** at that hostname. That may be exactly right under the show-your-work doctrine — but it is a choice, and it should be made before the ingest runs, not discovered after.

## The ingest is live, 2026-08-10

**R2 now holds data and the nightly job runs unattended** — see [[hockey-legibility-build]]. `.github/workflows/ingest.yml` at 11:00 UTC, confirmed firing with `event=schedule`. **No Cron Trigger and no D1**: the job runs in GitHub Actions and writes a directory that `aws s3 sync` pushes to R2, so `fetch_nhl.py` needs no S3 client, no credentials and no dependencies.

## THE CORS TRAP — the one that would have shipped a broken front page

The site is `readthegame.co`; its data is `data.readthegame.co`. **Different origins**, so the browser applies CORS — and **R2 sends no `Access-Control-Allow-Origin` unless the bucket is told to**. Every visitor would have seen *"No data loaded yet"*: a true sentence about a broken situation, on a file that was public, reachable and correct, discarded by the browser after it arrived.

**Nothing we had could see it.** `curl` does not apply CORS, so every fetch-and-diff check passed. The deploy's browser gate loaded the page over `file://`, where the fetch fails for an unrelated reason, so it proved the script was *permitted to run* and never that the page *worked*.

Fixed by a named-origin policy set **in the Cloudflare dashboard** (R2 → `readthegame` → Settings → CORS Policy) — not `*`, since the bucket being public is a decision about our pages rather than every site on the internet; anyone wanting the raw feeds can still fetch them directly, because CORS governs browsers, not people. `.github/workflows/r2-cors.yml` verifies it from outside with an `Origin` header and also checks an unlisted origin is refused, since a policy allowing everything reads identically to one allowing the right things.

## EVERY TOKEN IS DELIBERATELY TOO WEAK FOR THE NEXT JOB, AND THAT IS CORRECT

This has now bitten three times and each time the answer was the dashboard, not a stronger credential:
| Token | Can | Cannot |
|---|---|---|
| R2 S3 (`ACCESS_KEY_ID`…) | read/write objects | **set bucket CORS** (`PutBucketCors` → AccessDenied) |
| Cloudflare API (`CLOUDFLARE_API_TOKEN`, Pages→Edit) | deploy, claim a hostname | **write DNS** (needs Zone→DNS→Edit) |

A one-time config action is **not** a reason to put a broader credential in GitHub for every future run to carry. Do the one-time thing in the dashboard.

## The gates now check what a visitor gets

- Per-page byte diff against the **immutable deployment URL**, where "published bytes are committed bytes" is decidable.
- All three public hostnames checked, with the **content comparison retried** — a just-deployed host can be perfectly ready and briefly serve the previous bytes with a 200.
- **Headless Chrome loads `https://readthegame.co` after deploying** and fails the run if the freshness line does not say something true. That is the gate that would have caught CORS, and it is the answer to five straight checks that tested a proxy for the claim instead of the claim.
- README carries `gates`/`deploy`/`ingest` badges — see [[rerun-failed-runs-in-place]].

**Constraints to carry in:**
- **Do not fetch from the NHL at render time.** Ingest and keep; a feed change must break tomorrow's data, never yesterday's page.
- **NHL logos and marks must not be reproduced** — team colours and three-letter abbreviations only. This becomes live the moment anything is public.
- The **undocumented-API / redistribution question is still unresolved** and is not an engineering one. **It is now live**: the site is public, so this stopped being hypothetical on 2026-08-08. Kevin chose to go public knowingly ("throw caution to the wind"). The index carries a not-affiliated disclaimer and cites the data provenance.
- Pages has **no private mode by default**. A preview deployment gets an unlisted hash URL, which means anyone-with-the-link, not access-controlled. Real gating is Pages' preview access control via Cloudflare Access (free tier, but a Zero Trust setup). Worth knowing if the redistribution question ever forces a retreat.

Related: [[product-replay-not-realtime]], [[hockey-legibility-build]], [[builders-are-the-source]].


## ⭐ 2026-09-17 — THE RELEASE GATE, AND PREVIEWS THAT READ DATA

- **R2 CORS** now includes `https://*.read-the-game.pages.dev` (Kevin, dashboard). R2 accepts a
  single-label wildcard though Cloudflare's CORS docs are silent; measured: our subdomains echoed,
  `evilread-the-game.pages.dev`, `read-the-game.pages.dev.evil.com`, http and example.com refused.
  `r2-cors.yml` records it and checks all four look-alikes. `*` was NOT needed (08-10 decision stands).
- **deploy.yml release gate** (Kevin ruled, no branches): step `did this push change the site`
  compares `src/` with the last SUCCESSFUL deploy run's sha (`gh run list`, needs `actions: read`);
  unchanged → nothing deploys. Changed → `deploy this commit as a preview` (`--branch candidate`,
  proves index/game bytes), then data readable / phone fit / preview fits frame / verdict dot / watch
  a game / no CSP refusal — ALL on the preview — then `deploy to production`, then fetch-back diff,
  data readable and CSP on production only (the zone rewrites only there). Byte identity is what
  lets a preview check stand for production. ~2m07s vs ~1m55s before.
- ⏭ **At beta:** add `environment:` with Kevin as required reviewer on the production deploy step.
- ⚠️ No local Cloudflare credentials: wrangler runs only in CI. A throwaway branch with its own
  workflow (never on main) is how to test previews; delete via Pages API
  `DELETE …/deployments/<id>?force=true`.


---

## ⭐⭐ 2026-09-23 — THE SITE GAINED A WORKER, AND 404 STOPPED MEANING WHAT IT MEANT

`functions/_middleware.js` (the per-game unfurl) is the first server-side code
here. Two things it broke, both in the deploy gate rather than in the site:

⛔ **"did this push change the site" compared `src/` ALONE.** Correct while every
byte a visitor received came from there. A middleware runs on the way out, so it
changes what readers get while `src/` is untouched — the step would have answered
*nothing to ship*, skipping the deploy AND the gate written to prove the
middleware works. **A deploy trigger blind to half the deployable surface is the
quietest failure available.** Now watches `src/ functions/`.

⛔⛔ **A FRESH DEPLOYMENT'S ROOT 404s WHILE PROPAGATING.** Before the Worker, a
deployment that was not ready answered 5xx or nothing, so the fetch helper retries
5xx and deliberately refuses to retry 404 — *"a missing file is a real answer."*
With a Worker in front, the Worker goes live before the asset manifest finishes
propagating: `next()` finds no asset for `/` and returns an honest 404. The gate
failed a deploy whose site was serving correctly ninety seconds later. **The
middleware did not manufacture it — it passed through exactly what the asset
server said.** Fix: the ROOT and only the root retries 404, because `/` is not a
file we deploy, it is a route Pages resolves.

⭐ **AND THE CANDIDATE NEVER FETCHED `/`.** It checked `index.html` and
`game.html` — both FILES — and never the ROUTE. Different questions, and the one
nobody asked is the one that reached production. `/` is in that loop now.

✅ **PLACEMENT, ANSWERED:** `wrangler pages deploy src` DOES compile a `functions/`
at the repo ROOT. No unit test could settle it; the candidate step did.

---

## ⛔⛔⛔ THE 404 RULE, WRONG TWICE IN ONE DAY — 2026-09-23

**Round one.** Adding `functions/_middleware.js` put a Worker in front of every
request. The byte-diff gate retried 5xx and not 404, on the reasoning that a
missing file is a real answer worth reporting fast. With Functions in front, a
deployment that is not ready answers an honest **404** instead of a 5xx —
`next()` finds no asset yet and says so — and the gate failed a deploy whose site
was serving correctly ninety seconds later. Fixed by retrying 404 **on the root
only**, with a comment arguing that `/` is a route rather than a file, so *"a
named page that 404s IS a missing file."*

**⛔ Round two, eight hours later, and it falsified that comment.**
`/faceoffs.html` 404'd on the candidate while the other thirteen pages — one of
them added in the same commit — came back byte-identical. **The same candidate URL
served that page 200 a few minutes later.** The asset manifest does not propagate
atomically. Any path can be briefly absent.

⭐⭐ **THE LESSON IS ABOUT THE SHAPE OF THE FIX, NOT ABOUT CLOUDFLARE.** Both
versions were me narrowing a rule to the one case I had evidence for and writing
the narrowing up as a principle. The real question — *is this missing, or is it
slow?* — **cannot be answered from one response at all.** It is answered by
waiting. A distinction that cannot be observed is not a distinction, however well
it reads in a comment.

✅ Now: the candidate page loop retries 404 too. The original reason survives, and
this is the part worth keeping — that loop's page list comes from `src/*.html` in
the checkout, so a 404 there can only be propagation or a deploy that genuinely
failed to upload, and both are worth waiting out. The cost is that a real miss is
reported 72 seconds later by the *"never became available"* line. ⚠️ The
production poll deliberately does NOT retry 404: it has its own outer loop, so a
404 there is one cheap attempt of many.

⚠️ **AND THE GATE IS POST-DEPLOY, NOT PRE-PROMOTION.** `wrangler pages deploy` on
the production branch publishes to production AND returns a candidate URL; the
byte-diff runs afterwards. So a red gate does not mean the site is broken — check
production before assuming a rollback is needed. Both times here the content was
live and correct while the gate was red.

Related: [[verify-inherited-claims]] — a claim I wrote this morning was not
evidence either.


## ⛔⛔⛔ 2026-09-24 — THE 404 RULE WAS WRONG A THIRD TIME, BY BEING IN ONE PLACE

`/preview.html` answered **404 on the candidate** while `/preview.html?game=...`
answered 200 **from the same deployment, in the same step, seconds earlier**.
Both served 200 minutes later. The site was never wrong — that commit changed no
built page, because `census.js` is not inlined anywhere.

⭐ **THE RULE ITSELF WAS ALREADY RIGHT AND ALREADY WRITTEN DOWN.** What was wrong
is that `deploy.yml` had **two ways of fetching from a candidate**: the page loop
used a helper that waits out a 404, and the unfurl check — added later with
`functions/_middleware.js` — used a bare one-shot `curl`. **Actions steps cannot
share a shell function, so the second spelling was not laziness; a FILE was the
only thing that would have worked and nobody reached for one.**

✅ **`tools/edge-fetch.sh`** is that file. Both steps source it, no bare `curl`
against a candidate is left, and `test/edge-fetch.test.js` serves 404 twice then
200 against a local server to prove the waiting. The wait is a parameter with a
production default so the test costs no seconds.

⚠️ **AND TWO THINGS THAT WASTED TIME BEFORE THE DIAGNOSIS EVEN STARTED:**
- **`curl` without `-L` says 308 for every page here** — the `.html` suffix is
  redirected away. Production reads as broken when it is fine. Always `-L`.
- **`readthegame.co` answers 200 for ANY missing path.** A 404 cannot be
  provoked against production, so a test that tries is vacuous. Serve your own.

## ✅ AND THE WORKER DEPLOY, END TO END — what it took

Two account-side steps, in this order, because **a secret cannot be attached to a
Worker that does not exist yet**:
1. `CLOUDFLARE_API_TOKEN` needs **Account · Workers Scripts · EDIT**. Read is not
   enough and looks identical from outside: listing scripts returns 200 on Read
   while `wrangler deploy` is refused with *"No access to the specified
   resource."* ⛔ There is no read-only call that establishes Edit.
2. Then the Worker exists, and the `GITHUB_TOKEN` secret goes on it **in the
   dashboard** — not `wrangler secret put`, which needs **Node 22** while the dev
   machine is pinned to **20**, a fact `deploy.yml` has stated in its opening
   paragraph since the day it was written.

⛔⛔ **A RESOURCE THAT DOES NOT EXIST YET DOES NOT REFUSE YOUR WRITE.** The secret
was added before the first successful deploy, so it landed on the **Pages project
one row away** in the same Workers & Pages list, which accepted it and displayed
it. `wrangler secret list` returned `[]` against a Worker that had deployed
cleanly seconds earlier. ⭐ *The neighbour takes the write and looks right.*

## ⛔⛔⛔ 2026-09-25 — A PIPE ATE THE EXIT CODE OF BOTH WRANGLER DEPLOYS

Found by a gate written for the same defect in `derive.yml`, within a minute of
that gate existing. Both `wrangler pages deploy … | tee …` steps in `deploy.yml`
ran under GitHub's default shell — `bash -e {0}`, which has **no `-o pipefail`** —
so the step reported `tee`'s status. **A failed deploy did not fail its own step.**

⭐ WHY IT NEVER SHIPPED A SILENT FAILURE, which is worth knowing before assuming
the worst: the preview step greps the log for a `*.pages.dev` URL and exits 1 when
there is none, and the production step is followed by the byte-for-byte read-back.
Those caught the common case. What they do not catch is a deploy that errors
**after** printing a URL.

⛔⛔ THE CLASS IS LOGGED THREE TIMES IN THIS REPO AND WAS LIVE IN THREE PLACES.
`ingest.yml`'s fetch step carries a comment reading *"This exact mistake is logged
twice in this project's history against `| tail`; writing it a third time while
implementing the design that warns about it would be quite something."* It was
written a third time in `derive.yml`, in the step directly above a comment
explaining the trap — and these two deploys were the fourth and fifth.

✅ **THE GATE, in `test/workflows.test.js`:** every step in every workflow that
pipes into `tee` must name the shell, `set -o pipefail`, or read `PIPESTATUS`.
Three spellings of one guarantee, all accepted — accepting them is not a
weakening, and two of the five were already careful, which is what made the other
three worth a rule instead of a comment. See [[mechanize-the-review]] #15 and §145.

⚠️ **AND ONE `shell: bash` CAME BACK OUT.** Beside a `PIPESTATUS` read it is two
mechanisms for one guarantee, and mutation proved it: removing it changed nothing,
removing `PIPESTATUS` went red. The redundant one goes, so the next reader knows
which line is load-bearing.

## 2026-10-21 — deploy.yml is FOUR JOBS (Kevin: "only run what's required at deploy")
`site` (stop if src/ + functions/ unchanged since last good deploy; dispatch always = changed) →
`verify` (build reproduces src/, `npm test` once, card+snapshots, page-network grep, measures_fresh,
learn game published) ‖ `browser` (the tools/browser checks on committed src/) → `ship` (preview, its
checks, production, live checks, seal LAST). Measured: non-site push 13 s; full deploy 3 m 07 s (was ~5.5).
Clock sweep / Python suite / refcheck / corpus / health / tiers are gates.yml-only and do NOT block a deploy.
The nightly is still fully gated: it runs `npm run gates` itself before its GITHUB_TOKEN push.
`health --check --js-from` reads the clock sweep's saved run (SUITE_OUT) instead of a 4th suite run.
