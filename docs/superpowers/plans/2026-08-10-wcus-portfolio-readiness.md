# WordCamp US 2026 Portfolio Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish a concise, current, attribution-safe WordCamp US 2026 portfolio experience across the Job Placement Digest, About page, one-page résumé, stable résumé route, and global footer.

**Architecture:** The live WordPress database remains canonical for the Digest and About bodies; tracked drafts are review candidates and tracked snapshots become accepted mirrors only after publication. Theme code owns a narrow temporary redirect from `/one-page-resume/` to the cache-busted PDF, while page-specific CSS and phase-aware verifiers let candidate work ship without making production checks expect unpublished database content. Production is a two-gate release: deploy and prove the theme/PDF first, then separately authorize the two page updates and custom footer override before promoting snapshots.

**Tech Stack:** WordPress block child theme (PHP 8.0+, Gutenberg block markup, `theme.json` tokens), dependency-free Node.js 22 contract scripts, WordPress Studio/WP-CLI, WordPress.com content and site-editing APIs, Microsoft Word 365 DOCX/PDF export, bundled Python with `python-docx`/`pdfplumber`, and bundled Poppler.

## Global Constraints

- Treat `docs/superpowers/specs/2026-08-10-wcus-portfolio-readiness-design.md` as the approved product and copy contract.
- WordCamp US programming is August 16–19, 2026; never present August 20 as a conference day.
- Use the exact public wording “selected to staff the Core AI booth”; never use “man the booth” in published copy.
- `/job-placement-digest/` remains the recruiter page; `#root-cause-investigation` remains a compact in-page fragment and `/root-cause-investigation/` remains nonexistent.
- `/one-page-resume/` is a temporary semantic redirect, not a WordPress page, and every visible résumé action points there.
- Preserve the explicit enterprise-monitoring/scale evidence gap unless publication-day evidence genuinely closes it.
- Never call open, fork-only, agent-authored, prerelease, merged-unreleased, or another contributor’s work “shipped upstream.”
- Keep WordPress/ai PR #501 authored/merged; PRs #263 and #40 authored/open; issue #529 reported and fixed by a maintainer; issue #732 reported/tested with PR #757 authored by Anubhav Anand.
- Keep Flavor Agent RC3 prerelease separate from post-RC3 main work, and HPerkins Tokens v0.3.53 released evidence separate from later merged-unreleased work.
- The résumé stays one US Letter page with a 9.5pt body-text floor, searchable text, meaningful links, tagged structure, and text-identical DOCX/PDF recruiter content.
- Reuse the existing Imladris tokens and components; add no WordCamp logos, Phoenix imagery, event palette, gradients, or animation.
- Maintain one H1, sequential heading order, visible focus, 44px targets, AA contrast, reduced-motion behavior, and no horizontal overflow at 320px.
- The live WordPress database body is canonical; drafts are candidates and snapshots are verified mirrors. Never seed production from either local Studio database.
- Use `C:\Users\htper\Studio\hperkins-tokens-dev` for local review, with explicit page selectors. Do not use `studio push` or a full-site sync.
- Preserve the older Media Library PDF; remove public links to it without deleting it.
- A commit, push, merge, deployment, production content update, snapshot promotion, and public browser proof are separate evidence gates.
- Any production write requires a fresh authenticated read, a drift comparison, an exact description of the pending write, and a new explicit user confirmation.

---

## File Structure

| Path | Responsibility |
|---|---|
| `inc/resume-route.php` | Match only the semantic résumé path and issue the same-origin temporary redirect. |
| `functions.php` | Load the focused redirect module; no route logic lives inline. |
| `scripts/verify-resume-route.js` | Verify route source, public GET/HEAD behavior, redirect count, query stripping, final PDF, and phase-aware public link output. |
| `scripts/lib/resume-route-contract.test.js` | Exercise redirect-chain validation with synthetic direct, loop, query, and unexpected-preflight cases. |
| `content/page-drafts/job-placement-digest.html` | Single reviewed candidate for production Page 433. |
| `content/page-drafts/about.html` | Single reviewed candidate for production Page 6. |
| `content/page-snapshots/job-placement-digest.html` | Accepted production mirror; unchanged until Task 13. |
| `content/page-snapshots/about.html` | Accepted production mirror; unchanged until Task 13. |
| `scripts/verify-job-placement-digest-source.js` | Exact Digest copy, structure, evidence-state, attribution, link, and forbidden-copy contract. |
| `scripts/verify-job-placement-pages.js` | Phase-aware Digest source/browser contract at desktop and mobile widths. |
| `scripts/lib/page-phase-contract.js` | Shared, dependency-free draft/snapshot source selection for Digest and About verifiers. |
| `scripts/lib/page-phase-contract.test.js` | Exact phase-selection tests, including local-implies-draft behavior. |
| `scripts/lib/about-page-contract.js` | Exact About-page structure, event, evidence, link, heading, and word-budget contract. |
| `scripts/lib/about-page-contract.test.js` | Positive and mutation tests for the About contract. |
| `scripts/verify-about-page-rendered.js` | Phase-aware rendered About contract. |
| `scripts/verify-prominent-actions.js` | Phase-aware action-rail copy, order, size, wrapping, and focus contract. |
| `assets/imladris-pages.css` | Page-scoped WCUS callout, compact debugging proof, and About status layout. |
| `patterns/about-resume.php` | Portrait-only thin adapter over the accepted About snapshot. |
| `parts/footer.html` | Tracked footer source with semantic résumé link. |
| `assets/documents/henry-perkins-wordpress-support-engineer-resume.docx` | Editable one-page résumé source. |
| `assets/documents/henry-perkins-wordpress-support-engineer-resume.pdf` | Public tagged/searchable PDF generated from the DOCX. |
| `scripts/update-support-resume.py` | Idempotent, surgical DOCX content/style/link update. |
| `scripts/export-support-resume.ps1` | Microsoft Word tagged-PDF export with guaranteed cleanup. |
| `scripts/verify-placement-text-parity.py` | Local DOCX/PDF text, page, tag, and link parity gate using bundled document tools. |
| `scripts/verify-placement-artifacts.js` | Portable CI gate for artifact allowlist, copy, links, page count, searchability, and PDF structure. |
| `scripts/lib/placement-artifact-contract.test.js` | Unit tests for normalized copy, forbidden claims, and PDF tag inspection. |
| `.github/workflows/verify.yml` | Candidate-aware source checks and accepted-snapshot production checks. |
| `scripts/lib/production-gates-workflow.test.js` | Pin the source/deployed phase split and the route gate. |
| `CLAUDE.md`, `readme.txt`, `docs/design-system/INDEX.md` | Document semantic route ownership, portrait-only adapter behavior, and exact verification commands. |
| `docs/runbooks/2026-08-20-wcus-event-copy-retirement.md` | Manual post-event removal checklist; no automatic date mutation. |
| `docs/audits/2026-08-10-wordpress-github-activity.md` | Complete evidence inventory and publication-day freshness record. |
| `docs/audits/wcus-2026-production-proof.md` | Final release evidence with the actual publication timestamp recorded inside it. |

## Shared Interfaces

The tasks below use these exact public interfaces:

```php
function hperkins_tokens_is_one_page_resume_request(): bool;
function hperkins_tokens_redirect_one_page_resume(): void;
```

```js
// scripts/verify-resume-route.js
function validateRedirectChain( steps, requestedUrl, expectedOrigin, options = { strict: true } ) {
  // steps: Array<{ requestUrl, status, location, redirectBy, contentType }>
  // options.strict: true rejects even a recognized hosting preflight.
  // returns: { finalPdfUrl: string, themeRedirects: number, platformPreflights: number }
}
```

`scripts/verify-placement-text-parity.py` exposes `extract_docx(path: Path) -> tuple[str, list[str]]`, `extract_pdf(path: Path) -> tuple[str, list[str], int]`, and `normalize_text(value: str) -> str`; URL lists preserve document/tab order and duplicates.

### Task 1: Establish an isolated, fresh, read-only baseline

**Files:**
- Read: `docs/superpowers/specs/2026-08-10-wcus-portfolio-readiness-design.md`
- Read: `docs/audits/2026-08-10-wordpress-github-activity.md`
- Read: `content/page-drafts/job-placement-digest.html`
- Read: `content/page-drafts/about.html`
- Create temporarily with `apply_patch`: `.cache/wcus-2026/production-baseline/job-placement-digest.html`
- Create temporarily with `apply_patch`: `.cache/wcus-2026/production-baseline/about.html`
- Create temporarily with `apply_patch`: `.cache/wcus-2026/production-baseline/footer.html`
- Create temporarily with `apply_patch`: `.cache/wcus-2026/production-baseline/metadata.json`

**Interfaces:**
- Consumes: WordPress.com site `253647414` (`hperkins.blog`), Pages 433 and 6, template part `hperkins-tokens//footer`.
- Produces: authenticated raw production bodies and a metadata/hash ledger that later tasks use as their only authoring baseline.

- [ ] **Step 1: Create an isolated implementation worktree**

Invoke `superpowers:using-git-worktrees` and create branch `feat/wcus-portfolio-readiness` from the commit containing this plan. Confirm the source repo and worktree are clean before edits:

```powershell
git status --short --branch
git rev-parse HEAD
git log -1 --format=%H -- docs/superpowers/plans/2026-08-10-wcus-portfolio-readiness.md
git diff --check
```

Expected: the two hashes are identical; only the branch name differs; no tracked or untracked task files exist.

- [ ] **Step 2: Load the bundled document runtime**

Call `codex_app__load_workspace_dependencies` and record these resolved executables for Task 7:

```text
Python: C:\Users\htper\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe
Poppler: C:\Users\htper\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\poppler\Library\bin
Word: C:\Program Files\Microsoft Office\root\Office16\WINWORD.EXE
```

Expected: Python and Word exist; `pdfinfo.exe` and `pdftoppm.exe` exist under the Poppler directory.

- [ ] **Step 3: Fetch canonical production bodies without writing WordPress**

Use WordPress.com content authoring `pages.get` with `context=edit` for Page 433 and Page 6, and site editing `template-parts.get` for `hperkins-tokens//footer`. Request raw content plus `id`, `slug`, `status`, and `modified`.

```json
{
  "page_433": { "id": 433, "slug": "job-placement-digest", "status": "publish" },
  "page_6": { "id": 6, "slug": "about", "status": "publish" },
  "footer": { "id": "hperkins-tokens//footer", "status": "publish" }
}
```

Save the three raw bodies under `.cache/wcus-2026/production-baseline/` using `apply_patch`. Save returned modification timestamps, byte lengths, and SHA-256 values in `metadata.json`. The footer body must contain the old upload URL exactly once before any production update.

- [ ] **Step 4: Prove local sources are not being mistaken for production**

```powershell
Get-FileHash -Algorithm SHA256 content\page-drafts\job-placement-digest.html
Get-FileHash -Algorithm SHA256 content\page-drafts\about.html
Get-FileHash -Algorithm SHA256 content\page-snapshots\job-placement-digest.html
Get-FileHash -Algorithm SHA256 content\page-snapshots\about.html
Get-FileHash -Algorithm SHA256 .cache\wcus-2026\production-baseline\job-placement-digest.html
Get-FileHash -Algorithm SHA256 .cache\wcus-2026\production-baseline\about.html
```

Expected: production hashes are recorded independently. Any mismatch is normal and means Tasks 4 and 5 must rebase approved edits onto the authenticated raw body; it is never permission to overwrite production from local content.

- [ ] **Step 5: Run the publication-freshness evidence probes**

```powershell
gh api repos/WordPress/ai/pulls/501 --jq '{number,state,merged_at,user:.user.login,html_url}'
gh api repos/WordPress/php-ai-client/issues/262 --jq '{number,state,user:.user.login,html_url}'
gh api repos/WordPress/php-ai-client/pulls/263 --jq '{number,state,merged_at,user:.user.login,html_url}'
gh api repos/WordPress/ai-provider-for-openai/pulls/40 --jq '{number,state,merged_at,user:.user.login,html_url}'
gh api repos/WordPress/ai/issues/529 --jq '{number,state,user:.user.login,html_url}'
gh api repos/WordPress/ai/pulls/593 --jq '{number,state,merged_at,user:.user.login,html_url}'
gh api repos/WordPress/ai/issues/732 --jq '{number,state,user:.user.login,html_url}'
gh api repos/WordPress/ai/pulls/757 --jq '{number,state,merged_at,user:.user.login,html_url}'
gh api repos/WordPress/ai/releases/tags/1.0.1 --jq '{tag_name,published_at,html_url}'
gh api repos/henryperkins/flavor-agent/releases/tags/v0.1.0-rc.3 --jq '{tag_name,prerelease,published_at,html_url}'
gh api repos/henryperkins/ai-provider-for-codex/releases/tags/v2.1 --jq '{tag_name,prerelease,published_at,html_url}'
gh api repos/henryperkins/hperkins-tokens/releases/tags/v0.3.53 --jq '{tag_name,prerelease,published_at,html_url}'
gh search prs --author=henryperkins --updated='>=2026-08-10' --limit 100 --json number,title,state,repository,url,updatedAt
gh search issues --author=henryperkins --updated='>=2026-08-10' --limit 100 --json number,title,state,repository,url,updatedAt
```

Expected: author, state, merge, release, and prerelease facts agree with the audit. If a state changed or new qualifying WordPress work appears, update the audit first and use the new absolute state throughout every surface.

- [ ] **Step 6: Preserve the read-only baseline**

Do not commit `.cache/`. Keep it until production publication is complete so every later remote re-fetch can be compared with the original authenticated source.

### Task 2: Implement the semantic résumé redirect and its unit contract

**Files:**
- Create: `inc/resume-route.php`
- Create: `scripts/verify-resume-route.js`
- Create: `scripts/lib/resume-route-contract.test.js`
- Modify: `functions.php:30-34`
- Modify: `parts/footer.html`

**Interfaces:**
- Consumes: `hperkins_tokens_asset_url( string $relative_path ): string` from `functions.php`.
- Produces: `hperkins_tokens_is_one_page_resume_request(): bool`, `hperkins_tokens_redirect_one_page_resume(): void`, and `validateRedirectChain( steps, requestedUrl, expectedOrigin, options = { strict: true } )`.

- [ ] **Step 1: Write failing redirect-chain tests**

Create `scripts/lib/resume-route-contract.test.js` with these cases:

```js
test( 'accepts exactly one theme-owned 302 to the same-origin PDF', () => {
  const result = validateRedirectChain( [
    {
      requestUrl: 'https://hperkins.blog/one-page-resume/?utm_source=wcus',
      status: 302,
      location: 'https://hperkins.blog/wp-content/themes/hperkins-tokens/assets/documents/henry-perkins-wordpress-support-engineer-resume.pdf?v=123',
      redirectBy: 'hperkins-tokens',
      contentType: 'text/html; charset=UTF-8',
    },
    {
      requestUrl: 'https://hperkins.blog/wp-content/themes/hperkins-tokens/assets/documents/henry-perkins-wordpress-support-engineer-resume.pdf?v=123',
      status: 200,
      location: null,
      redirectBy: null,
      contentType: 'application/pdf',
    },
  ], 'https://hperkins.blog/one-page-resume/?utm_source=wcus', 'https://hperkins.blog' );
  assert.equal( result.themeRedirects, 1 );
  assert.equal( result.platformPreflights, 0 );
} );

test( 'rejects a loop, a permanent redirect, a foreign origin, or inbound query propagation', () => {
  assert.throws( () => validateRedirectChain( [
    { requestUrl: 'https://hperkins.blog/one-page-resume/', status: 302, location: 'https://hperkins.blog/one-page-resume/', redirectBy: 'hperkins-tokens', contentType: 'text/html' },
  ], 'https://hperkins.blog/one-page-resume/', 'https://hperkins.blog' ), /loop|PDF/ );
  assert.throws( () => validateRedirectChain( [
    { requestUrl: 'https://hperkins.blog/one-page-resume/', status: 301, location: 'https://hperkins.blog/wp-content/themes/hperkins-tokens/assets/documents/henry-perkins-wordpress-support-engineer-resume.pdf', redirectBy: 'hperkins-tokens', contentType: 'text/html' },
  ], 'https://hperkins.blog/one-page-resume/', 'https://hperkins.blog' ), /302/ );
  assert.throws( () => validateRedirectChain( [
    { requestUrl: 'https://hperkins.blog/one-page-resume/', status: 302, location: 'https://example.com/resume.pdf', redirectBy: 'hperkins-tokens', contentType: 'text/html' },
  ], 'https://hperkins.blog/one-page-resume/', 'https://hperkins.blog' ), /origin/ );
  assert.throws( () => validateRedirectChain( [
    { requestUrl: 'https://hperkins.blog/one-page-resume/?utm_source=wcus', status: 302, location: 'https://hperkins.blog/wp-content/themes/hperkins-tokens/assets/documents/henry-perkins-wordpress-support-engineer-resume.pdf?utm_source=wcus', redirectBy: 'hperkins-tokens', contentType: 'text/html' },
  ], 'https://hperkins.blog/one-page-resume/?utm_source=wcus', 'https://hperkins.blog' ), /query|v/ );
} );

test( 'classifies one WordPress cache-key preflight for diagnostics but not strict acceptance', () => {
  const steps = [
    { requestUrl: 'https://hperkins.blog/one-page-resume/', status: 307, location: 'https://hperkins.blog/one-page-resume/?v=0b3b97fa6688', redirectBy: 'WordPress', contentType: 'text/html' },
    { requestUrl: 'https://hperkins.blog/one-page-resume/?v=0b3b97fa6688', status: 302, location: 'https://hperkins.blog/wp-content/themes/hperkins-tokens/assets/documents/henry-perkins-wordpress-support-engineer-resume.pdf?v=123', redirectBy: 'hperkins-tokens', contentType: 'text/html' },
    { requestUrl: 'https://hperkins.blog/wp-content/themes/hperkins-tokens/assets/documents/henry-perkins-wordpress-support-engineer-resume.pdf?v=123', status: 200, location: null, redirectBy: null, contentType: 'application/pdf' },
  ];
  const diagnostic = validateRedirectChain( steps, steps[0].requestUrl, 'https://hperkins.blog', { strict: false } );
  assert.equal( diagnostic.platformPreflights, 1 );
  assert.throws( () => validateRedirectChain( steps, steps[0].requestUrl, 'https://hperkins.blog', { strict: true } ), /preflight|one redirect/ );
} );
```

Export `validateRedirectChain` from `scripts/verify-resume-route.js`; the synthetic step shape is fixed by Shared Interfaces.

- [ ] **Step 2: Run the test and capture the expected failure**

```powershell
node --test scripts/lib/resume-route-contract.test.js
```

Expected: FAIL because `scripts/verify-resume-route.js` and `validateRedirectChain` do not exist.

- [ ] **Step 3: Add the focused PHP route module**

Create `inc/resume-route.php` with this implementation:

```php
<?php
/**
 * Stable semantic route for the current one-page résumé artifact.
 */

function hperkins_tokens_is_one_page_resume_request(): bool {
	if ( is_admin() || wp_doing_ajax() ) {
		return false;
	}

	$method = isset( $_SERVER['REQUEST_METHOD'] )
		? strtoupper( sanitize_text_field( wp_unslash( $_SERVER['REQUEST_METHOD'] ) ) )
		: 'GET';
	if ( ! in_array( $method, array( 'GET', 'HEAD' ), true ) ) {
		return false;
	}

	$request_uri  = isset( $_SERVER['REQUEST_URI'] ) ? wp_unslash( $_SERVER['REQUEST_URI'] ) : '';
	$request_path = wp_parse_url( $request_uri, PHP_URL_PATH );
	$route_path   = wp_parse_url( home_url( '/one-page-resume/' ), PHP_URL_PATH );

	return is_string( $request_path )
		&& is_string( $route_path )
		&& untrailingslashit( $request_path ) === untrailingslashit( $route_path );
}

function hperkins_tokens_redirect_one_page_resume(): void {
	if ( ! hperkins_tokens_is_one_page_resume_request() ) {
		return;
	}

	$target = hperkins_tokens_asset_url(
		'assets/documents/henry-perkins-wordpress-support-engineer-resume.pdf'
	);
	if ( wp_safe_redirect( $target, 302, 'hperkins-tokens' ) ) {
		exit;
	}
}

add_action( 'template_redirect', 'hperkins_tokens_redirect_one_page_resume', 1 );
```

Load it immediately after the other focused modules in `functions.php`:

```php
require_once get_stylesheet_directory() . '/inc/resume-route.php';
```

- [ ] **Step 4: Implement the dependency-free redirect validator**

In `scripts/verify-resume-route.js`, implement `validateRedirectChain()` so it enforces all of the following:

```js
const RESUME_PATH = '/one-page-resume/';
const PDF_PATH = '/wp-content/themes/hperkins-tokens/assets/documents/henry-perkins-wordpress-support-engineer-resume.pdf';

// Required invariants:
// - no repeated request URL;
// - one 302 with redirectBy === 'hperkins-tokens';
// - Location stays on expectedOrigin and pathname === PDF_PATH;
// - final response is 200 or 206 and application/pdf;
// - no inbound query key survives; only a destination key named v is allowed;
// - diagnostic mode recognizes at most one 307 WordPress preflight whose
//   Location retains RESUME_PATH and contains only v=<hex>;
// - strict public verification rejects any platform preflight.
```

Guard execution with `if ( require.main === module )`; `--source-only` initially checks the PHP include, hook priority, `302`, safe redirect, semantic path, PDF path, and footer source link. Public GET/HEAD checks are added to CI in Task 6.

- [ ] **Step 5: Point the tracked footer source at the semantic route**

Replace only the résumé anchor `href` in `parts/footer.html`:

```html
<a href="/one-page-resume/">…One-page résumé PDF</a>
```

Do not edit or delete the production footer override in this task.

- [ ] **Step 6: Run focused verification**

```powershell
php -l inc\resume-route.php
php -l functions.php
node --test scripts/lib/resume-route-contract.test.js
node scripts/verify-resume-route.js --source-only
git diff --check
```

Expected: all pass; source verification reports the semantic footer link and the temporary safe redirect.

- [ ] **Step 7: Commit the route slice**

```powershell
git add -- inc/resume-route.php functions.php parts/footer.html scripts/verify-resume-route.js scripts/lib/resume-route-contract.test.js
git commit -m "feat: add stable one-page resume route"
```

### Task 3: Make candidate and production verifiers phase-aware

**Files:**
- Create: `scripts/lib/page-phase-contract.js`
- Create: `scripts/lib/page-phase-contract.test.js`
- Modify: `scripts/verify-job-placement-pages.js`
- Modify: `scripts/verify-prominent-actions.js`
- Modify: `scripts/verify-about-page-rendered.js`
- Modify: `.github/workflows/verify.yml`
- Modify: `scripts/lib/production-gates-workflow.test.js`

**Interfaces:**
- Consumes: `--drafts`, `--source-only`, and `--require-local` CLI flags.
- Produces: source jobs that validate reviewed candidates and deployed jobs that continue to validate accepted snapshots until Task 13.

- [ ] **Step 1: Write failing workflow phase assertions**

Extend `scripts/lib/production-gates-workflow.test.js` with exact command assertions:

```js
assert.match( sourceJob, /node scripts\/verify-job-placement-pages\.js --source-only --drafts/ );
assert.match( sourceJob, /node scripts\/verify-prominent-actions\.js --source-only --drafts/ );
assert.match( deployedJob, /node scripts\/verify-job-placement-pages\.js/ );
assert.doesNotMatch( deployedJob, /verify-job-placement-pages\.js[^\n]*--drafts/ );
assert.doesNotMatch( deployedJob, /verify-prominent-actions\.js[^\n]*--drafts/ );
```

Create `scripts/lib/page-phase-contract.test.js` with:

```js
const path = require( 'node:path' );
const themeRoot = path.join( __dirname, '..', '..' );
assert.equal( selectDigestSource( [ '--drafts' ] ), path.join( themeRoot, 'content', 'page-drafts', 'job-placement-digest.html' ) );
assert.equal( selectDigestSource( [] ), path.join( themeRoot, 'content', 'page-snapshots', 'job-placement-digest.html' ) );
assert.equal( selectAboutSource( { drafts: true, requireLocal: false } ), path.join( themeRoot, 'content', 'page-drafts', 'about.html' ) );
assert.equal( selectAboutSource( { drafts: false, requireLocal: true } ), path.join( themeRoot, 'content', 'page-drafts', 'about.html' ) );
assert.equal( selectAboutSource( { drafts: false, requireLocal: false } ), path.join( themeRoot, 'content', 'page-snapshots', 'about.html' ) );
```

- [ ] **Step 2: Run the phase tests and capture failure**

```powershell
node --test scripts/lib/production-gates-workflow.test.js scripts/lib/about-page-rendered-probe.test.js
```

Expected: FAIL because source workflow commands and selector exports do not yet implement the approved phase split.

- [ ] **Step 3: Implement draft/snapshot selection once per verifier**

Create `scripts/lib/page-phase-contract.js` and import it from both rendered verifiers:

```js
const path = require( 'node:path' );
const themeRoot = path.join( __dirname, '..', '..' );

function selectDigestSource( argv = [] ) {
  const relative = argv.includes( '--drafts' )
    ? 'content/page-drafts/job-placement-digest.html'
    : 'content/page-snapshots/job-placement-digest.html';
  return path.join( themeRoot, relative );
}

function selectAboutSource( { drafts = false, requireLocal = false } = {} ) {
  const relative = drafts || requireLocal
    ? 'content/page-drafts/about.html'
    : 'content/page-snapshots/about.html';
  return path.join( themeRoot, relative );
}

module.exports = { selectAboutSource, selectDigestSource };
```

In `verify-job-placement-pages.js` and `verify-prominent-actions.js`, reject unknown flags and call `selectDigestSource( process.argv.slice( 2 ) )` instead of keeping separate path logic. Derive `DIGEST_COPY` and action counts from that selected body instead of hard-coding candidate copy into deployed mode.

In `verify-about-page-rendered.js`, import `selectAboutSource( { drafts = false, requireLocal = false } = {} )` from `scripts/lib/page-phase-contract.js`. Use the draft when either option is true and the accepted snapshot otherwise. `--require-local` independently enforces a localhost origin and implies draft expectations for backward compatibility. Add `--source-only` to run selected-body and CSS contracts without resolving Chrome or making HTTP requests; reject every unknown flag. Rendered expectations must be parsed from the selected source, not duplicated as production-only literals.

```js
verifySourceContracts( selectedAboutBody, pageCss );
if ( process.argv.includes( '--source-only' ) ) {
  console.log( 'About rendered-page source contracts verified.' );
  return;
}
await verifyRenderedPage( selectedAboutBody );
```

- [ ] **Step 4: Update CI commands without changing deployed expectations**

Change only the source-job commands:

```yaml
- name: Recruiter rendered-page source contract
  run: node scripts/verify-job-placement-pages.js --source-only --drafts

- name: Prominent actions source contract
  run: node scripts/verify-prominent-actions.js --source-only --drafts
```

Leave production commands flagless. This lets candidate commits deploy route/CSS/PDF code while the public pages still contain their accepted snapshot-era bodies.

Add `scripts/lib/page-phase-contract.test.js` to the workflow’s `node --test` list, and make `production-gates-workflow.test.js` assert that active command line is present.

- [ ] **Step 5: Run the phase contract**

```powershell
node --test scripts/lib/page-phase-contract.test.js scripts/lib/production-gates-workflow.test.js scripts/lib/about-page-rendered-probe.test.js
node scripts/verify-job-placement-pages.js --source-only --drafts
node scripts/verify-prominent-actions.js --source-only --drafts
git diff --check
```

Expected: pass against the current candidates before editorial expectations change in Tasks 4 and 5.

- [ ] **Step 6: Commit phase isolation**

```powershell
git add -- .github/workflows/verify.yml scripts/lib/page-phase-contract.js scripts/lib/page-phase-contract.test.js scripts/verify-job-placement-pages.js scripts/verify-prominent-actions.js scripts/verify-about-page-rendered.js scripts/lib/production-gates-workflow.test.js scripts/lib/about-page-rendered-probe.test.js
git commit -m "test: separate candidate and published page gates"
```

### Task 4: Rebuild the Digest candidate around event context and current evidence

**Files:**
- Modify: `scripts/verify-job-placement-digest-source.js`
- Modify: `content/page-drafts/job-placement-digest.html`

**Interfaces:**
- Consumes: authenticated Page 433 raw body from Task 1 and the approved evidence audit.
- Produces: one reviewed Digest candidate with exact event, compact proof, evidence-state, attribution, and semantic résumé-link contracts.

- [ ] **Step 1: Write the failing Digest source contract**

Update `verifyMain()` in `scripts/verify-job-placement-digest-source.js` to require these exact ordered actions and proof labels:

```js
const WCUS_ACTIONS = [
  [ 'Start a WordCamp conversation', '/contact/' ],
  [ 'View one-page résumé', '/one-page-resume/' ],
  [ 'Review selected WordPress evidence', '#evidence-register' ],
];

const DEBUG_PROOF = [
  [ 'Signal', 'Codex provider generations never appeared in the WordPress AI request log.' ],
  [ 'Diagnosis', 'Logging decorated one SDK HTTP transporter.' ],
  [ 'Constraint', 'Lifecycle-hook capture restored the missing success rows in integration testing.' ],
  [ 'Result', 'Anubhav Anand authored PR #757.' ],
];
```

Require the exact event eyebrow, heading, body, one `#root-cause-investigation`, one proof H2, four ordered proof terms, and the six approved root-cause permalinks. Reject:

```js
const FORBIDDEN_DIGEST_COPY = [
  'Read the root-cause investigation',
  'Two merged pull requests · one open pull request',
  '54 commits ahead of RC3',
  '30 contracts',
  '35 contracts',
  'as of Jul 30, 2026',
  '<h3 class="wp-block-heading">Symptom</h3>',
  '<h3 class="wp-block-heading">Root cause</h3>',
  '<h3 class="wp-block-heading">Why the fix is not one line</h3>',
  '<h3 class="wp-block-heading">Impact</h3>',
  '<h3 class="wp-block-heading">What happened next</h3>',
  '<h3 class="wp-block-heading">Whether the reports get acted on</h3>',
  '/wp-content/themes/hperkins-tokens/assets/documents/henry-perkins-wordpress-support-engineer-resume.pdf',
];
```

- [ ] **Step 2: Run the source contract and capture the red state**

```powershell
node scripts/verify-job-placement-digest-source.js
```

Expected: FAIL first on the missing WCUS panel or old four-action hero rail.

- [ ] **Step 3: Rebase the candidate on the authenticated Page 433 body**

Use `.cache/wcus-2026/production-baseline/job-placement-digest.html` as the base. Apply the approved edits with `apply_patch`; preserve the opening Support Engineer positioning, fit ledger, explicit enterprise-scale gap, primary proof cards, governance section, method link, and closing invitation unless this plan names a change. Do not copy either Studio database body or the tracked snapshot over the production baseline.

- [ ] **Step 4: Replace the hero action rail with the separate WCUS panel**

Place this block immediately after the closing `</section>` of `.hp-digest__hero` and before `#why-support-engineer-now`:

```html
<!-- wp:group {"tagName":"section","align":"wide","className":"hp-wcus-callout hp-action-panel","layout":{"type":"constrained"}} -->
<section class="wp-block-group alignwide hp-wcus-callout hp-action-panel"><!-- wp:paragraph {"className":"hp-page-hero__eyebrow"} -->
<p class="hp-page-hero__eyebrow">WORDCAMP US 2026 · PHOENIX</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":2} -->
<h2 class="wp-block-heading">I’ll be at WordCamp US.</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>I’ll be in Phoenix August 16–19, and I’ve been selected to staff the Core AI booth. If you’re hiring for WordPress support engineering, working on WordPress AI, or carrying an interesting incident, come say hello.</p>
<!-- /wp:paragraph -->

<!-- wp:buttons {"className":"hp-action-rail hp-wcus-callout__actions","layout":{"type":"flex","flexWrap":"wrap"}} -->
<div class="wp-block-buttons hp-action-rail hp-wcus-callout__actions"><!-- wp:button -->
<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="/contact/">Start a WordCamp conversation</a></div>
<!-- /wp:button -->
<!-- wp:button {"className":"is-style-secondary"} -->
<div class="wp-block-button is-style-secondary"><a class="wp-block-button__link wp-element-button" href="/one-page-resume/">View one-page résumé</a></div>
<!-- /wp:button -->
<!-- wp:button {"className":"is-style-secondary"} -->
<div class="wp-block-button is-style-secondary"><a class="wp-block-button__link wp-element-button" href="#evidence-register">Review selected WordPress evidence</a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons --></section>
<!-- /wp:group -->
```

Remove the old four-button rail from `.hp-digest__hero`. Update the dateline to `Last verified 10 Aug 2026`; if Task 10 runs on a later date, use that publication-verification date instead.

- [ ] **Step 5: Replace the long investigation with the compact proof block**

Retain the section’s `id="root-cause-investigation"` and incident-card classes. Its content must be exactly this semantic shape:

```html
<p class="hp-chip is-status-review has-mono-font-family has-xs-font-size">Issue #732 open · PR #757 by another contributor open</p>
<h2 class="wp-block-heading">Debugging proof: a request log that silently under-reported</h2>
<dl class="hp-debug-proof__grid">
  <div class="hp-debug-proof__item"><dt>Signal</dt><dd>Codex provider generations never appeared in the WordPress AI request log. Nothing errored; the diagnostic silently looked complete.</dd></div>
  <div class="hp-debug-proof__item"><dt>Diagnosis</dt><dd>Logging decorated one SDK HTTP transporter. Supported providers using a sidecar, custom handler, or direct WordPress HTTP request bypassed that boundary and disappeared from the record.</dd></div>
  <div class="hp-debug-proof__item"><dt>Constraint</dt><dd>Lifecycle-hook capture restored the missing success rows in integration testing, but it double-logged successes when the provider bridge remained active and still omitted failures. Capture, attribution, and ownership cannot be collapsed into a one-line fix.</dd></div>
  <div class="hp-debug-proof__item"><dt>Result</dt><dd>Henry authored issue #732 and its reproduction. Anubhav Anand authored PR #757. Henry tested the integration and proposed the ownership split. An earlier report, issue #529, was reproduced and fixed by a maintainer in PR #593 and shipped in WordPress AI 1.0.1.</dd></div>
</dl>
```

Implement the `<dl>` inside one `core/html` block because Gutenberg has no definition-list core block. Follow it with meaningful anchors for issue #732, the two exact PR #757 comments, issue #529, PR #593, and release 1.0.1. Do not add any H3 inside this section.

- [ ] **Step 6: Replace the stale register with twelve high-signal rows**

Pin this exact ordered contract in the source verifier and render it in the existing accessible ledger table:

```js
const EXPECTED_EVIDENCE_ROWS = [
  [ 'WordPress/ai PR #501', 'Authored · merged upstream', [ 'https://github.com/WordPress/ai/pull/501' ] ],
  [ 'WordPress/php-ai-client issue #262 and PR #263', 'Authored · open upstream', [ 'https://github.com/WordPress/php-ai-client/issues/262', 'https://github.com/WordPress/php-ai-client/pull/263' ] ],
  [ 'WordPress/ai-provider-for-openai PR #40', 'Authored · open upstream', [ 'https://github.com/WordPress/ai-provider-for-openai/pull/40' ] ],
  [ 'WordPress/ai issue #529', 'Reported · fixed upstream by another contributor', [ 'https://github.com/WordPress/ai/issues/529', 'https://github.com/WordPress/ai/pull/593', 'https://github.com/WordPress/ai/releases/tag/1.0.1' ] ],
  [ 'WordPress/ai issue #732 and PR #757', 'Reproduced · integration-tested · technical feedback (non-formal)', [ 'https://github.com/WordPress/ai/issues/732', 'https://github.com/WordPress/ai/pull/757', 'https://github.com/WordPress/ai/pull/757#issuecomment-4980297831', 'https://github.com/WordPress/ai/pull/757#issuecomment-4981567682' ] ],
  [ 'WordPress/ai PR #749 feedback', 'Reproduced · integration-tested · technical feedback (non-formal)', [ 'https://github.com/WordPress/ai/pull/749#issuecomment-5010134375' ] ],
  [ 'Flavor Agent v0.1.0-rc.3', 'Released owned work · prerelease', [ 'https://github.com/henryperkins/flavor-agent/releases/tag/v0.1.0-rc.3' ] ],
  [ 'Flavor Agent post-RC3 main', 'Merged to owned main · unreleased', [ 'https://github.com/henryperkins/flavor-agent/pull/53', 'https://github.com/henryperkins/flavor-agent/pull/61', 'https://github.com/henryperkins/flavor-agent/pull/74', 'https://github.com/henryperkins/flavor-agent/pull/76' ] ],
  [ 'AI Provider for Codex v2.1', 'Released owned work', [ 'https://github.com/henryperkins/ai-provider-for-codex/releases/tag/v2.1' ] ],
  [ 'HPerkins Tokens v0.3.53', 'Released owned work', [ 'https://github.com/henryperkins/hperkins-tokens/releases/tag/v0.3.53' ] ],
  [ 'HPerkins Tokens commerce work', 'Merged to owned main · unreleased', [ 'https://github.com/henryperkins/hperkins-tokens/commit/f82d52bf30e5576f73654e11af34bc638c28fc62', 'https://github.com/henryperkins/hperkins-tokens/commit/0bf1e2c6e3c0b9d9bac7e725d8561c7fff289ce2' ] ],
  [ 'roadmaptrac', 'Active evidence tooling · no release', [ 'https://github.com/henryperkins/roadmaptrac', 'https://github.com/henryperkins/roadmaptrac/commit/b101bca432825a34135c9b3d8a224031a1a7ad18' ] ],
];
```

For #262/#263, mention finite-vector validation and regression coverage. For #40, mention model-aware sampling compatibility and tests. For Flavor Agent post-RC3, mention governed apply/undo, schema hardening, and canonical target authorization without counts. Remove the aggregate WordPress row, RC1 contract row, branch-distance row, current-contract row, and duplicate evidence already explained in primary proof cards.

- [ ] **Step 7: Normalize all remaining résumé actions**

Change the closing résumé action and any register link to `/one-page-resume/`. Keep the closing invitation focused on contact, résumé, and selected evidence. Verify no direct theme-PDF href remains in the candidate.

- [ ] **Step 8: Run the Digest red-green gate**

```powershell
node scripts/verify-job-placement-digest-source.js
node scripts/verify-job-placement-pages.js --source-only --drafts
node scripts/verify-prominent-actions.js --source-only --drafts
node scripts/verify-resume-route.js --source-only
git diff --check
```

Expected: all source checks pass; the accepted snapshot remains byte-for-byte unchanged.

- [ ] **Step 9: Commit the Digest candidate**

```powershell
git add -- content/page-drafts/job-placement-digest.html scripts/verify-job-placement-digest-source.js
git commit -m "content: prepare WCUS job placement digest"
```

### Task 5: Refresh the About candidate and thin adapter

**Files:**
- Modify: `scripts/lib/about-page-contract.js`
- Modify: `scripts/lib/about-page-contract.test.js`
- Modify: `content/page-drafts/about.html`
- Modify: `patterns/about-resume.php`

**Interfaces:**
- Consumes: authenticated Page 6 raw body from Task 1 and `RESUME_HREF = '/one-page-resume/'`.
- Produces: exact WCUS status, four-row Core AI board, corrected Tableau label, and portrait-only snapshot adapter.

- [ ] **Step 1: Write failing About mutation tests**

Add this exact contract to `scripts/lib/about-page-contract.js`:

```js
const RESUME_HREF = '/one-page-resume/';
const EXPECTED_WCUS_STATUS = {
  label: 'WordCamp US 2026 · Phoenix · Aug 16–19',
  copy: 'I’ll be there, and I’ve been selected to staff the Core AI booth.',
  action: { text: 'Start a conversation', href: '/contact/' },
};
```

In `about-page-contract.test.js`, mutate each date, `staff`, `Core AI`, action destination, `/one-page-resume/`, and `Tableau` independently and require `verifyAboutBody()` to throw. Add attribution mutations that replace “a maintainer fixed” with “I fixed” and “Anubhav Anand authored PR #757” with “my PR #757”; both must fail.

- [ ] **Step 2: Run the About tests and capture the red state**

```powershell
node --test scripts/lib/about-page-contract.test.js
node scripts/verify-about-page-source.js --drafts
```

Expected: FAIL because the current candidate has no event status, still says `Tableu`, uses direct PDF links, and carries the closed agent-skills row.

- [ ] **Step 3: Rebase the candidate on the authenticated Page 6 body**

Use `.cache/wcus-2026/production-baseline/about.html` as the base and apply only this plan’s edits with `apply_patch`. Preserve the existing page hierarchy, project cards, capabilities, experience, foundations, contact close, portrait URL, and one-H1 outline.

- [ ] **Step 4: Add the compact event status inside the hero copy**

Insert this group after the existing hero action rail, still inside `.hp-about-hero__copy`:

```html
<!-- wp:group {"className":"hp-about-wcus","layout":{"type":"default"}} -->
<div class="wp-block-group hp-about-wcus"><!-- wp:paragraph {"className":"hp-about-wcus__label"} -->
<p class="hp-about-wcus__label">WordCamp US 2026 · Phoenix · Aug 16–19</p>
<!-- /wp:paragraph -->
<!-- wp:paragraph {"className":"hp-about-wcus__copy"} -->
<p class="hp-about-wcus__copy">I’ll be there, and I’ve been selected to staff the Core AI booth.</p>
<!-- /wp:paragraph -->
<!-- wp:buttons {"className":"hp-about-wcus__action"} -->
<div class="wp-block-buttons hp-about-wcus__action"><!-- wp:button {"className":"is-style-secondary"} -->
<div class="wp-block-button is-style-secondary"><a class="wp-block-button__link wp-element-button" href="/contact/">Start a conversation</a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons --></div>
<!-- /wp:group -->
```

Do not add `hp-action-rail` to this single event action. The page must retain exactly two prominent-action rails: the main hero rail and the closing rail.

- [ ] **Step 5: Replace the Core AI board with four exact evidence rows**

Set `EXPECTED_EVIDENCE.rows` to this content and mirror it in Gutenberg markup:

```js
[
  {
    label: 'WordPress/ai PR #501 · authored and merged',
    links: [ [ 'Experiment documentation merged upstream', 'https://github.com/WordPress/ai/pull/501' ] ],
    meta: 'Authored the Content Resizing and Title Generation experiment documentation; merged May 18, 2026.',
  },
  {
    label: 'WordPress/ai issue #529 · report fixed by a maintainer',
    links: [
      [ 'Issue #529', 'https://github.com/WordPress/ai/issues/529' ],
      [ 'Maintainer PR #593', 'https://github.com/WordPress/ai/pull/593' ],
      [ 'WordPress AI 1.0.1', 'https://github.com/WordPress/ai/releases/tag/1.0.1' ],
    ],
    meta: 'Reported and reproduced the Guidelines content-type defect; a maintainer fixed it and WordPress AI 1.0.1 shipped it.',
  },
  {
    label: 'Open upstream code · PRs #263 and #40',
    links: [
      [ 'php-ai-client issue #262', 'https://github.com/WordPress/php-ai-client/issues/262' ],
      [ 'php-ai-client PR #263', 'https://github.com/WordPress/php-ai-client/pull/263' ],
      [ 'ai-provider-for-openai PR #40', 'https://github.com/WordPress/ai-provider-for-openai/pull/40' ],
    ],
    meta: 'Authored finite-vector validation and regression coverage in #263, and model-aware sampling compatibility with tests in #40; both remain open upstream.',
  },
  {
    label: 'WordPress/ai issue #732 · report, integration test, technical feedback',
    links: [
      [ 'Issue #732', 'https://github.com/WordPress/ai/issues/732' ],
      [ 'PR #757 test result', 'https://github.com/WordPress/ai/pull/757#issuecomment-4980297831' ],
      [ 'Ownership proposal', 'https://github.com/WordPress/ai/pull/757#issuecomment-4981567682' ],
    ],
    meta: 'Authored the report and reproduction. Anubhav Anand authored PR #757; Henry integration-tested it and supplied non-formal technical feedback.',
  },
]
```

Do not add PR #749 here; keep that detail in the Digest so this board stays scannable.

- [ ] **Step 6: Correct naming, résumé links, and word budgets**

Replace all visible `Tableu` text with `Tableau`, including project heading and meaningful link text. Change all three About résumé destinations to `/one-page-resume/`.

Set only these section caps higher:

```js
ABOUT_SECTION_WORD_CAPS.hero = 70;
ABOUT_SECTION_WORD_CAPS.coreAi = 210;
```

Keep `ABOUT_WORD_RANGE = { min: 850, max: 950 }`. If the exact candidate exceeds 950, tighten redundant evidence summaries before changing any other cap.

- [ ] **Step 7: Reduce the pattern adapter to portrait substitution**

Remove `$hperkins_about_resume_*` matching and replacement from `patterns/about-resume.php`. The fail-closed condition becomes:

```php
if (
	1 !== $hperkins_about_portrait_found
	|| 1 !== $hperkins_about_portrait_count
) {
	return;
}
```

Update the header comment to say the adapter substitutes exactly one portrait URL, never reads the draft, and emits the accepted snapshot unchanged otherwise. Update `verifyPatternAdapter()` and its tests to require portrait-only behavior and reject any direct-PDF replacement logic.

- [ ] **Step 8: Run the About red-green gate**

```powershell
php -l patterns\about-resume.php
node --test scripts/lib/about-page-contract.test.js
node scripts/verify-about-page-source.js --drafts
node scripts/verify-about-page-rendered.js --source-only --drafts
node scripts/verify-resume-route.js --source-only
git diff --check
```

Expected: all checks pass; candidate word count remains 850–950; accepted About snapshot is unchanged.

- [ ] **Step 9: Commit the About candidate**

```powershell
git add -- content/page-drafts/about.html patterns/about-resume.php scripts/lib/about-page-contract.js scripts/lib/about-page-contract.test.js
git commit -m "content: refresh About page for WCUS"
```

### Task 6: Add page-scoped presentation and complete browser/CI contracts

**Files:**
- Modify: `assets/imladris-pages.css`
- Modify: `scripts/verify-job-placement-pages.js`
- Modify: `scripts/verify-about-page-rendered.js`
- Modify: `scripts/verify-prominent-actions.js`
- Modify: `scripts/verify-resume-route.js`
- Modify: `.github/workflows/verify.yml`
- Modify: `scripts/lib/production-gates-workflow.test.js`

**Interfaces:**
- Consumes: `.hp-wcus-callout`, `.hp-debug-proof__grid`, `.hp-about-wcus`, phase-aware body selection, and `validateRedirectChain()`.
- Produces: source, local, and strict public verification at the approved viewports.

- [ ] **Step 1: Add failing source and geometry assertions**

Require these selectors and behaviors in the source/browser verifiers:

```js
// Digest
'.hp-digest__hero + .hp-wcus-callout'
'.hp-wcus-callout__actions .wp-block-button' // exactly 3, ordered
'#root-cause-investigation .hp-debug-proof__item' // exactly 4

// About
'.hp-about-hero__copy .hp-about-wcus'
'.hp-about-wcus__action .wp-block-button' // exactly 1, not inside hp-action-rail
'.hp-about-core-ai .hp-evidence-row' // exactly 4
```

At 1440×1000, 1024, 768, 390×844, and 320px, assert no page-level overflow; links/buttons are at least 44px; action labels wrap without clipping; proof items stack in Signal → Diagnosis → Constraint → Result order below 782px; `#root-cause-investigation` scrolls to the proof section and receives focus without changing the heading outline.

- [ ] **Step 2: Run source checks and capture missing-style failures**

```powershell
node scripts/verify-job-placement-pages.js --source-only --drafts
node scripts/verify-prominent-actions.js --source-only --drafts
node scripts/verify-about-page-rendered.js --source-only --drafts
```

Expected: FAIL on missing `.hp-wcus-callout`, `.hp-debug-proof__grid`, or `.hp-about-wcus` CSS contracts.

- [ ] **Step 3: Add the minimal page-scoped CSS**

Add these rules in the Digest/About sections of `assets/imladris-pages.css`, preserving the repository’s formatting:

```css
.hp-wcus-callout {
  margin-block-start: var(--wp--preset--spacing--6);
  padding: var(--wp--preset--spacing--6);
  border-inline-start: 0.25rem solid var(--wp--preset--color--gold-600);
  background: color-mix(in srgb, var(--wp--preset--color--parchment-100) 88%, var(--wp--preset--color--gold-100));
}

.hp-wcus-callout__actions {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.hp-debug-proof__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--wp--preset--spacing--4);
  margin: var(--wp--preset--spacing--5) 0 0;
}

.hp-debug-proof__item {
  min-inline-size: 0;
  padding-block-start: var(--wp--preset--spacing--3);
  border-block-start: 2px solid var(--wp--preset--color--river-500);
}

.hp-debug-proof__item dt {
  color: var(--wp--preset--color--green-700);
  font-family: var(--wp--preset--font-family--mono);
  font-size: var(--wp--preset--font-size--xs);
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.hp-debug-proof__item dd {
  margin: var(--wp--preset--spacing--2) 0 0;
  overflow-wrap: anywhere;
}

.hp-about-wcus {
  margin-block-start: var(--wp--preset--spacing--4);
  padding: var(--wp--preset--spacing--4);
  border-inline-start: 0.25rem solid var(--wp--preset--color--gold-600);
  background: color-mix(in srgb, var(--wp--preset--color--parchment-100) 90%, var(--wp--preset--color--gold-100));
}

.hp-about-wcus__label {
  margin: 0;
  color: var(--wp--preset--color--green-700);
  font-family: var(--wp--preset--font-family--mono);
  font-size: var(--wp--preset--font-size--xs);
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.hp-about-wcus__copy,
.hp-about-wcus__action {
  margin-block-start: var(--wp--preset--spacing--3);
}

@media (max-width: 781px) {
  .hp-wcus-callout__actions,
  .hp-debug-proof__grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
```

If an existing token-owned rule already supplies one declaration, remove the duplicate rather than creating a parallel override. Do not modify `theme.json` or global `style.css`.

- [ ] **Step 4: Complete the route source and HTTP verifier**

Extend `--source-only` to require `/one-page-resume/` in the footer and both candidates; reject the old upload URL and direct theme-PDF hrefs from those visible-link sources. Keep artifact-level validation pointed directly at the PDF file.

Default HTTP mode must:

```text
GET /one-page-resume/?utm_source=wcus -> one 302, X-Redirect-By: hperkins-tokens
HEAD /one-page-resume/?utm_source=wcus -> one 302, X-Redirect-By: hperkins-tokens
Location -> same HTTPS origin, exact PDF path, only deliberate ?v=<mtime>
Final GET -> 200 or 206, application/pdf, body begins %PDF-
Final HEAD -> 200 or 206, application/pdf
```

Fail strict public mode if WordPress.com still inserts the currently observed same-path 307. The priority-1 theme hook should preempt canonical redirect handling; if it does not, Task 11 pauses for a targeted hosting diagnosis instead of silently weakening the approved one-hop criterion.

For rendered-link checks, enforce `/`, `/about/`, and `/job-placement-digest/` only when both accepted snapshots already contain `/one-page-resume/`. Before Task 13, log `candidate prepared; accepted snapshots still prepublication` and verify the route itself without expecting unpublished page/footer output.

- [ ] **Step 5: Add source and deployed workflow entries**

Add to the source job:

```yaml
- name: Résumé route source contract
  run: node scripts/verify-resume-route.js --source-only
```

Add to the deployed browser job:

```yaml
if ! node scripts/verify-resume-route.js; then
  echo "::error::verify-resume-route.js failed against production."
  fail=1
fi
```

Extend `production-gates-workflow.test.js` to pin both commands, and to prove only the source command carries `--source-only`.

Add `scripts/lib/resume-route-contract.test.js` to the workflow unit-test list, and pin that active command line in `production-gates-workflow.test.js`.

- [ ] **Step 6: Run page, route, style, and workflow checks**

```powershell
node --test scripts/lib/resume-route-contract.test.js scripts/lib/about-page-contract.test.js scripts/lib/about-page-rendered-probe.test.js scripts/lib/page-phase-contract.test.js scripts/lib/production-gates-workflow.test.js scripts/lib/style-coverage.test.js
node scripts/verify-job-placement-digest-source.js
node scripts/verify-about-page-source.js --drafts
node scripts/verify-job-placement-pages.js --source-only --drafts
node scripts/verify-about-page-rendered.js --source-only --drafts
node scripts/verify-prominent-actions.js --source-only --drafts
node scripts/verify-resume-route.js --source-only
node scripts/verify-style-token-usage.js
node scripts/verify-performance-assets.js
git diff --check
```

Expected: all pass; `style.css`, `theme.json`, and both accepted snapshots remain unchanged.

- [ ] **Step 7: Commit presentation and public gates**

```powershell
git add -- assets/imladris-pages.css .github/workflows/verify.yml scripts/verify-job-placement-pages.js scripts/verify-about-page-rendered.js scripts/verify-prominent-actions.js scripts/verify-resume-route.js scripts/lib/resume-route-contract.test.js scripts/lib/about-page-rendered-probe.test.js scripts/lib/production-gates-workflow.test.js scripts/lib/style-coverage.test.js
git commit -m "feat: add WCUS portfolio presentation contracts"
```

### Task 7: Update, export, and prove the one-page résumé

**Files:**
- Create: `scripts/update-support-resume.py`
- Create: `scripts/export-support-resume.ps1`
- Create: `scripts/verify-placement-text-parity.py`
- Create: `scripts/lib/placement-artifact-contract.test.js`
- Modify: `scripts/verify-placement-artifacts.js`
- Modify: `scripts/lib/placement-artifact-links.test.js`
- Modify: `.github/workflows/verify.yml`
- Modify: `scripts/lib/production-gates-workflow.test.js`
- Modify: `assets/documents/henry-perkins-wordpress-support-engineer-resume.docx`
- Modify: `assets/documents/henry-perkins-wordpress-support-engineer-resume.pdf`

**Interfaces:**
- Consumes: existing DOCX styles and layout, Microsoft Word `ExportAsFixedFormat`, released-version record from `scripts/lib/release-record.js`.
- Produces: text-identical one-page DOCX/PDF artifacts, local parity audit, and stronger portable artifact contracts.

- [ ] **Step 1: Write failing artifact-copy and PDF-structure tests**

Export pure helpers from `verify-placement-artifacts.js` under its existing `require.main` guard, then create `placement-artifact-contract.test.js`. Require:

```js
const REQUIRED_RESUME_COPY = [
  'WORDCAMP US 2026 — Phoenix, Aug 16–19 · Selected to staff the Core AI booth',
  'WordPress/ai PR #501',
  'WordPress/php-ai-client PR #263',
  'WordPress/ai-provider-for-openai PR #40',
  'Issue #529',
  'maintainer authored PR #593',
  'Issue #732',
  'Anubhav Anand authored PR #757',
  'Flavor Agent',
  'v0.1.0-rc.3',
  'unreleased',
  'AI Provider for Codex',
  'HPerkins Tokens',
];

const FORBIDDEN_RESUME_COPY = [
  'as of Jul 30, 2026',
  '54 commits ahead',
  '30 contracts',
  '35 contracts',
  'my PR #593',
  'my PR #757',
  'final v0.1.0',
];
```

Require the DOCX hyperlink set to contain PR #263, PR #40, PR #593, release 1.0.1, PR #757, Flavor Agent RC3, Codex v2.1, and HPerkins Tokens v0.3.53. Require the PDF annotation URL sequence to equal the DOCX hyperlink sequence, including duplicates, so keyboard traversal follows reading order. Require PDF raw structure to include `/MarkInfo`, `/Marked true`, `/StructTreeRoot`, at least one `/H1`, and at least four `/H2` tags, in addition to the existing one-page, ToUnicode, text-operator, and link-set assertions.

Add `scripts/lib/placement-artifact-contract.test.js` to the workflow unit-test list and make `production-gates-workflow.test.js` pin its active command line.

- [ ] **Step 2: Run the artifact contract and capture the red state**

```powershell
node --test scripts/lib/placement-artifact-contract.test.js scripts/lib/placement-artifact-links.test.js
node scripts/verify-placement-artifacts.js
```

Expected: FAIL on the missing event line, PR #263/#40 links, current attribution, Flavor Agent line, and heading tags.

- [ ] **Step 3: Implement an idempotent surgical DOCX updater**

Create `scripts/update-support-resume.py` with `python-docx` and OOXML hyperlink helpers. It must:

```python
# Fixed behavior:
# 1. Open the existing DOCX; never create a blank document.
# 2. Capture the existing first-paragraph, Resume Section, Resume Entry, and
#    Resume Body visual formatting before changing content.
# 3. Rebuild only body paragraphs using the exact model below.
# 4. Use built-in Heading 1 for the title and Heading 2 for section labels,
#    then reapply captured visual formatting so Word exports semantic headings.
# 5. Preserve US Letter size and 0.52in top/bottom, 0.60in side margins.
# 6. Keep body text at or above 9.5pt.
# 7. Set core_properties.title and author.
# 8. Save to the same stable DOCX path.
```

Use this exact content model; `segments` entries are `(visible_text, external_url_or_None)`:

```python
RESUME = [
    ('Heading 1', [('Henry Perkins — WordPress Support Engineer', None)]),
    ('Normal', [('PHP · JavaScript · Gutenberg · REST/HTTP/DNS · Root-cause debugging · Customer communication', None)]),
    ('Normal', [
        ('Chicago, IL  ·  ', None),
        ('htperkins@gmail.com', 'mailto:htperkins@gmail.com'),
        ('  ·  ', None),
        ('hperkins.blog', 'https://hperkins.blog/'),
        ('  ·  ', None),
        ('GitHub', 'https://github.com/henryperkins'),
    ]),
    ('Resume Event', [('WORDCAMP US 2026 — Phoenix, Aug 16–19 · Selected to staff the Core AI booth', None)]),
    ('Normal', [('TARGET: SUPPORT ENGINEER — WordPress support, site delivery, root-cause debugging, and clear handoff between customers and engineering.', None)]),
    ('Heading 2', [('WORDPRESS.COM SUPPORT', None)]),
    ('Resume Entry', [('Automattic — Happiness Engineer  |  Remote · Oct–Nov 2012', None)]),
    ('Resume Body', [('Resolved WordPress.com issues across publishing, configuration, billing, domains, and DNS; wrote root-cause troubleshooting and reproducible details for customers, product, and engineering.', None)]),
    ('Heading 2', [('NAMED CLIENT DELIVERY', None)]),
    ('Resume Entry', [('Independent Technology Consultant  |  Oct 2022–Present · selected delivery in 2026', None)]),
    ('Resume Body', [
        ('LIVE — Delivered ', None),
        ('DJ Lee & Voices of Judah', 'https://thevoicesofjudah.com/'),
        (' from discovery through launch: a booking-first static JavaScript experience on one Cloudflare Worker with a validated server-side booking route; ', None),
        ('public source', 'https://github.com/henryperkins/dj-judas-v2'),
        (' keeps the handoff inspectable.', None),
    ]),
    ('Heading 2', [('UPSTREAM WORDPRESS CONTRIBUTION RECORD', None)]),
    ('Resume Body', [
        ('MERGED — ', None),
        ('WordPress/ai PR #501', 'https://github.com/WordPress/ai/pull/501'),
        (': authored Content Resizing and Title Generation experiment documentation; merged May 18, 2026.', None),
    ]),
    ('Resume Body', [
        ('OPEN UPSTREAM CODE — ', None),
        ('WordPress/php-ai-client PR #263', 'https://github.com/WordPress/php-ai-client/pull/263'),
        (': authored regression coverage and finite-vector validation rejecting NAN, INF, and -INF embedding values.', None),
    ]),
    ('Resume Body', [
        ('OPEN UPSTREAM CODE — ', None),
        ('WordPress/ai-provider-for-openai PR #40', 'https://github.com/WordPress/ai-provider-for-openai/pull/40'),
        (': authored model-aware sampling compatibility metadata and tests for OpenAI reasoning models.', None),
    ]),
    ('Resume Body', [
        ('REPORTED · FIX SHIPPED — ', None),
        ('Issue #529', 'https://github.com/WordPress/ai/issues/529'),
        (': reported and reproduced a Guidelines content-type defect; a maintainer authored ', None),
        ('PR #593', 'https://github.com/WordPress/ai/pull/593'),
        (' and ', None),
        ('WordPress AI 1.0.1', 'https://github.com/WordPress/ai/releases/tag/1.0.1'),
        (' shipped it.', None),
    ]),
    ('Resume Body', [
        ('REPORTED · INTEGRATION TESTED — ', None),
        ('Issue #732', 'https://github.com/WordPress/ai/issues/732'),
        (': authored the report and reproduction. Anubhav Anand authored ', None),
        ('PR #757', 'https://github.com/WordPress/ai/pull/757'),
        ('; Henry tested lifecycle capture, found duplicate successes and missing failures, and proposed the ownership split.', None),
    ]),
    ('Heading 2', [('TECHNICAL PROOF', None)]),
    ('Resume Entry', [('Flavor Agent — Author  |  WordPress agent-governance plugin', None)]),
    ('Resume Body', [
        ('PRERELEASE + ACTIVE — ', None),
        ('v0.1.0-rc.3', 'https://github.com/henryperkins/flavor-agent/releases/tag/v0.1.0-rc.3'),
        (' is the latest public prerelease; post-RC3 main adds governed content/template apply and undo, schema hardening, and canonical target authorization; unreleased.', None),
    ]),
    ('Resume Entry', [('AI Provider for Codex — Author  |  independent WordPress plugin', None)]),
    ('Resume Body', [
        ('RELEASED OWNED WORK — ', None),
        ('v2.1', 'https://github.com/henryperkins/ai-provider-for-codex/releases/tag/v2.1'),
        (': WordPress AI Client provider for Codex text and capability-gated image generation with isolated per-user runtime state.', None),
    ]),
    ('Resume Entry', [('HPerkins Tokens — Author  |  WordPress theme', None)]),
    ('Resume Body', [
        ('RELEASED OWNED WORK — ', None),
        ('v0.3.53', 'https://github.com/henryperkins/hperkins-tokens/releases/tag/v0.3.53'),
        (' · ', None),
        ('hperkins.blog', 'https://hperkins.blog/'),
        (': token-governed block theme and accessible evidence system. Later commerce work is merged to main and unreleased.', None),
    ]),
    ('Heading 2', [('SKILLS & CAREER CONTEXT', None)]),
    ('Resume Body', [('WordPress: PHP, JavaScript, Gutenberg, REST API, WP-CLI  ·  Support: HTTP, DNS, CSS cascade, browser debugging, escalation triage, customer communication  ·  Tooling: Git/GitHub, GitHub Actions, Plugin Check, PHPStan, Cloudflare Workers.', None)]),
    ('Resume Body', [('Earlier customer and operations roles: Starbucks Shift Supervisor (2019–2022); Sodexo Starbucks Manager (2018–2019); Clinique Consultant (2015–2017); PageLines Developer Community Manager (2012); Micro Center Customer Service/Sales (2009–2012).', None)]),
]
```

Define `Resume Event` as an 8.5pt bold style based on Normal, in existing muted-gold/ink colors. If the first Word export exceeds one page, first tighten paragraph spacing in `Resume Event` and the evidence bodies within the existing visual rhythm; do not reduce body text below 9.5pt or margins below their current values.

- [ ] **Step 4: Run the updater and the DOCX accessibility audit**

```powershell
& 'C:\Users\htper\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' scripts\update-support-resume.py
& 'C:\Users\htper\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' 'C:\Users\htper\.codex\plugins\cache\openai-primary-runtime\documents\26.805.11740\skills\documents\scripts\a11y_audit.py' assets\documents\henry-perkins-wordpress-support-engineer-resume.docx --out_json output\wcus-resume-a11y.json
```

Expected: updater reports one section, Letter size, unchanged margins, minimum body size 9.5pt, and the exact event line once. Accessibility audit reports no images/tables requiring fixes and identifies the heading structure.

- [ ] **Step 5: Add the reproducible Word tagged-PDF exporter**

Create `scripts/export-support-resume.ps1` with:

```powershell
$ErrorActionPreference = 'Stop'
$themeRoot = Split-Path -Parent $PSScriptRoot
$docxPath = Join-Path $themeRoot 'assets\documents\henry-perkins-wordpress-support-engineer-resume.docx'
$pdfPath = Join-Path $themeRoot 'assets\documents\henry-perkins-wordpress-support-engineer-resume.pdf'
$word = $null
$document = $null
try {
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    $word.DisplayAlerts = 0
    $document = $word.Documents.Open($docxPath, $false, $true)
    $document.ExportAsFixedFormat(
        $pdfPath, 17, $false, 0, 0, 1, 1, 0,
        $true, $true, 1, $true, $true, $false
    )
} finally {
    if ($null -ne $document) {
        $document.Close($false)
        [void][Runtime.InteropServices.Marshal]::ReleaseComObject($document)
    }
    if ($null -ne $word) {
        $word.Quit()
        [void][Runtime.InteropServices.Marshal]::ReleaseComObject($word)
    }
    [GC]::Collect()
    [GC]::WaitForPendingFinalizers()
}
```

Run it once, then confirm no `WINWORD` process from the script remains.

- [ ] **Step 6: Implement and run the local text-parity gate**

Create `scripts/verify-placement-text-parity.py`. Extract DOCX text and hyperlink URLs from ordered body paragraphs including hyperlink `w:t` nodes; extract PDF text and link-annotation URLs in page/tab order with `pdfplumber`; normalize Unicode to NFC and collapse whitespace. Assert:

```python
assert docx_text == pdf_text
assert pdf_pages == 1
assert docx_urls == pdf_urls
assert 'WORDCAMP US 2026 — Phoenix, Aug 16–19 · Selected to staff the Core AI booth' in docx_text
assert all(term not in docx_text for term in ('as of Jul 30, 2026', '54 commits ahead', '30 contracts', '35 contracts'))
assert b'/MarkInfo' in pdf_bytes and b'/Marked true' in pdf_bytes
assert b'/StructTreeRoot' in pdf_bytes and b'/H1' in pdf_bytes and pdf_bytes.count(b'/H2') >= 4
```

Run:

```powershell
& 'C:\Users\htper\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' scripts\verify-placement-text-parity.py
```

Expected: exact normalized text and external-link parity, one PDF page, and meaningful heading tags.

- [ ] **Step 7: Render and visually inspect the sole page**

Attempt the packaged DOCX renderer first:

```powershell
& 'C:\Users\htper\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' 'C:\Users\htper\.codex\plugins\cache\openai-primary-runtime\documents\26.805.11740\skills\documents\render_docx.py' assets\documents\henry-perkins-wordpress-support-engineer-resume.docx --output_dir output\wcus-resume-docx --emit_pdf --verbose
```

On this workstation LibreOffice is absent; if that command reports the known missing-converter condition, use the Microsoft Word PDF produced in Step 5 as the authoritative DOCX render. Render that PDF with Poppler:

```powershell
& 'C:\Users\htper\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\poppler\Library\bin\pdfinfo.exe' assets\documents\henry-perkins-wordpress-support-engineer-resume.pdf
& 'C:\Users\htper\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\poppler\Library\bin\pdftoppm.exe' -png -r 144 assets\documents\henry-perkins-wordpress-support-engineer-resume.pdf output\wcus-resume
```

Use `view_image` on `output\wcus-resume-1.png` at original detail. Reject clipping, crowding, font substitution, broken rules, weak event hierarchy, unreadable 9.5pt text, or an accidental second page.

- [ ] **Step 8: Run portable artifact and live-link verification**

```powershell
node --test scripts/lib/placement-artifact-contract.test.js scripts/lib/placement-artifact-links.test.js scripts/lib/release-record.test.js
node scripts/verify-placement-artifacts.js
node scripts/verify-placement-artifacts.js --check-links
git diff --check
```

Expected: three-file artifact allowlist remains unchanged; DOCX/PDF pass; every immutable/public link resolves; the XLSX is untouched.

- [ ] **Step 9: Commit the artifact slice**

```powershell
git add -- assets/documents/henry-perkins-wordpress-support-engineer-resume.docx assets/documents/henry-perkins-wordpress-support-engineer-resume.pdf scripts/update-support-resume.py scripts/export-support-resume.ps1 scripts/verify-placement-text-parity.py scripts/verify-placement-artifacts.js scripts/lib/placement-artifact-contract.test.js scripts/lib/placement-artifact-links.test.js .github/workflows/verify.yml scripts/lib/production-gates-workflow.test.js
git commit -m "docs: refresh one-page support resume for WCUS"
```

### Task 8: Document ownership, retirement, and the complete source gate

**Files:**
- Modify: `CLAUDE.md`
- Modify: `readme.txt`
- Modify: `docs/design-system/INDEX.md`
- Create: `docs/runbooks/2026-08-20-wcus-event-copy-retirement.md`
- Modify: `scripts/verify-content-ownership-docs.js`

**Interfaces:**
- Consumes: final route, candidate, adapter, artifact, and phase split.
- Produces: exact operator guidance and a manual post-event cleanup contract.

- [ ] **Step 1: Write failing documentation ownership assertions**

Extend `verify-content-ownership-docs.js` to require all three documents to state:

```text
/one-page-resume/ is the stable visible-link destination.
The final PDF remains a theme-owned artifact verified directly.
about-resume substitutes only the portrait URL.
Digest and About database bodies remain canonical; drafts are candidates and snapshots are accepted mirrors.
Production page/footer writes are separate from a theme deploy.
```

Reject documentation that still says the About adapter substitutes résumé asset URLs.

- [ ] **Step 2: Run the docs contract and capture failure**

```powershell
node scripts/verify-content-ownership-docs.js
```

Expected: FAIL on the old portrait-and-résumé adapter wording.

- [ ] **Step 3: Update operator documentation**

Document these exact commands in `CLAUDE.md` and the route/adapter sections in `readme.txt` and `docs/design-system/INDEX.md`:

```powershell
node scripts/verify-resume-route.js --source-only
node scripts/verify-resume-route.js
node scripts/verify-job-placement-pages.js --source-only --drafts
node scripts/verify-prominent-actions.js --source-only --drafts
node scripts/verify-about-page-source.js --drafts
node scripts/verify-about-page-rendered.js --require-local --drafts
node scripts/verify-placement-artifacts.js --check-links
```

State that `patterns/about-resume.php` is portrait-only and that accepted snapshots are not changed before publication.

- [ ] **Step 4: Create the manual event-retirement runbook**

The runbook must schedule a review after August 20 and list exact removable elements:

```text
Digest: remove .hp-wcus-callout; preserve the evidence refresh and compact debugging proof.
About: remove .hp-about-wcus; preserve Tableau and contribution-attribution corrections.
Résumé: remove the exact WORDCAMP US 2026 line; regenerate DOCX/PDF together.
CSS: remove selectors only after all three event blocks are gone.
Route: keep /one-page-resume/ permanently unless a separately approved information-architecture change replaces it.
Publication: repeat the fresh-read, explicit-confirmation, snapshot-promotion, and public-proof gates.
```

Do not add cron, scheduled code, or date-driven mutation.

- [ ] **Step 5: Run the complete source gate**

```powershell
Get-ChildItem -Recurse -Filter *.php | ForEach-Object { php -l $_.FullName; if ($LASTEXITCODE -ne 0) { throw "PHP lint failed: $($_.FullName)" } }
node --test scripts/lib/about-page-contract.test.js scripts/lib/about-page-rendered-probe.test.js scripts/lib/about-gravatar-heading.test.js scripts/lib/content-integrity.test.js scripts/lib/job-placement-metadata-contract.test.js scripts/lib/market-screen-parity.test.js scripts/lib/navigation-content-contract.test.js scripts/lib/page-content-contract.test.js scripts/lib/page-markup-contract.test.js scripts/lib/page-phase-contract.test.js scripts/lib/placement-artifact-contract.test.js scripts/lib/placement-artifact-links.test.js scripts/lib/production-gates-workflow.test.js scripts/lib/release-record.test.js scripts/lib/resume-route-contract.test.js scripts/lib/site-url.test.js scripts/lib/style-coverage.test.js scripts/lib/wp-cli.test.js scripts/lib/zip-archive.test.js
node scripts/verify-placement-artifacts.js
node scripts/verify-header.js --source-only
node scripts/verify-typography.js --source-only
node scripts/verify-journal-templates.js
node scripts/verify-performance-assets.js
node scripts/verify-job-placement-digest-source.js
node scripts/verify-about-page-source.js --drafts
node scripts/verify-job-placement-pages.js --source-only --drafts
node scripts/verify-prominent-actions.js --source-only --drafts
node scripts/verify-resume-route.js --source-only
node scripts/verify-deployed-content-ownership.js --source-only
node scripts/verify-content-ownership-docs.js
node scripts/verify-style-token-usage.js
git diff --check
```

Expected: all pass with no accepted snapshot changes.

- [ ] **Step 6: Commit documentation and retirement guidance**

```powershell
git add -- CLAUDE.md readme.txt docs/design-system/INDEX.md docs/runbooks/2026-08-20-wcus-event-copy-retirement.md scripts/verify-content-ownership-docs.js
git commit -m "docs: record WCUS portfolio operating contract"
```

### Task 9: Apply candidates only to the isolated Studio site and review visually

**Files:**
- Local database mutation only: `C:\Users\htper\Studio\hperkins-tokens-dev`
- Create ignored evidence: `output/wcus-2026/local-review/`
- Do not modify: `content/page-snapshots/about.html`
- Do not modify: `content/page-snapshots/job-placement-digest.html`

**Interfaces:**
- Consumes: reviewed candidates and guarded local applicator.
- Produces: local rendered browser evidence without changing production or accepted mirrors.

- [ ] **Step 1: Start the intended dev site and verify identity**

```powershell
Push-Location 'C:\Users\htper\Studio\hperkins-tokens-dev'
studio start --skip-browser
Pop-Location
$env:HPERKINS_WP_PATH = 'C:\Users\htper\Studio\hperkins-tokens-dev'
$env:HPERKINS_WP_CLI_PHAR = 'C:\Users\htper\.local\bin\wp-cli.phar'
$env:HPERKINS_ORIGIN = 'http://localhost:8882'
node scripts\verify-content-ownership.js
```

Run commands from the feature worktree. The initial ownership verifier may report expected candidate/database drift, but it must identify only the localhost dev site. Stop if `home` is not `http://localhost:8882`.

- [ ] **Step 2: Validate both Gutenberg bodies before applying them**

Use the WordPress Studio `validate_blocks` tool with `nameOrPath = C:\Users\htper\Studio\hperkins-tokens-dev` and each candidate `filePath`. Accept only serialization-safe fixes whose diff does not change approved words, links, IDs, classes, or evidence states.

- [ ] **Step 3: Apply exactly two candidate bodies**

```powershell
node scripts/apply-local-page-drafts.js --confirm-local --page=job-placement-digest --page=about
```

Expected: exactly two existing pages update. The explicit keys are mandatory; do not run the default selection because it includes Placement Method and omits About.

- [ ] **Step 4: Prove local DB equals candidates without exporting snapshots**

```powershell
node scripts/export-page-snapshots.js --check --expect-draft --page=job-placement-digest --page=about
node scripts/verify-deployed-content-ownership.js --drafts --page=job-placement-digest --page=about
```

Expected: both candidate/database hashes match; `--check` writes nothing.

- [ ] **Step 5: Run full local browser contracts**

```powershell
node scripts/verify-job-placement-pages.js --drafts
node scripts/verify-about-page-rendered.js --require-local --drafts
node scripts/verify-prominent-actions.js --drafts
node scripts/verify-typography.js
node scripts/verify-resume-route.js
```

Expected: all approved widths pass; strict local route is one 302; no horizontal overflow, heading skip, small target, missing focus, or stale direct résumé link appears.

- [ ] **Step 6: Capture and inspect deliberate screenshots**

Use WordPress Studio `take_screenshot` with `display: false` for both pages at desktop and mobile. Long Digest captures must be paged with offsets until the event panel, proof block, evidence ledger, and close are all inspected. Use `inspect_design` for:

```text
.hp-wcus-callout
.hp-wcus-callout__actions .wp-block-button__link
.hp-debug-proof__grid
.hp-debug-proof__item
.hp-about-wcus
.hp-about-core-ai .hp-evidence-row
```

Reject clipped copy, weak contrast, accidental full-width mobile tables, action wrapping that obscures labels, or an event block that visually overwhelms the page’s main title.

- [ ] **Step 7: Restore Studio’s prior offline state**

```powershell
Push-Location 'C:\Users\htper\Studio\hperkins-tokens-dev'
studio stop
Pop-Location
git status --short
```

Expected: the site is offline again; repository changes consist only of the planned commits; snapshots are unchanged.

### Task 10: Recheck evidence and obtain candidate approval

**Files:**
- Modify only if facts changed: `docs/audits/2026-08-10-wordpress-github-activity.md`
- Modify only if facts changed: `content/page-drafts/job-placement-digest.html`
- Modify only if facts changed: `content/page-drafts/about.html`
- Modify only if facts changed: `assets/documents/henry-perkins-wordpress-support-engineer-resume.docx`
- Modify only if facts changed: `assets/documents/henry-perkins-wordpress-support-engineer-resume.pdf`

**Interfaces:**
- Consumes: Task 1 evidence probes, Task 9 local captures, Task 7 résumé render.
- Produces: publication-day factual state and explicit approval of the actual candidate visuals/copy.

- [ ] **Step 1: Repeat every publication-freshness probe**

Run all `gh api` and `gh search` commands from Task 1 again. Also inspect the two PR #757 comment permalinks and PR #749 comment directly. Compare author, open/closed/merged state, release state, and attribution vocabulary independently.

Expected: either no material state change, or an exact list of changed facts. A merged PR changes its state label; it does not retroactively change authorship.

- [ ] **Step 2: Search for new WordPress work after the audit cutoff**

```powershell
gh search prs --author=henryperkins --updated='>=2026-08-10' --limit 100 --json number,title,state,repository,url,updatedAt
gh search issues --author=henryperkins --updated='>=2026-08-10' --limit 100 --json number,title,state,repository,url,updatedAt
gh api 'users/henryperkins/events?per_page=100' --jq '.[] | select(.created_at >= "2026-08-10T00:00:00Z") | {type,repo:.repo.name,created_at,payload}'
```

Classify results using the audit taxonomy. Add only stronger recruiter-relevant evidence; do not replace stable authored/merged or released proof with lower-signal activity merely because it is newer.

- [ ] **Step 3: Re-fetch production content and detect concurrent edits**

Read Pages 433/6 and `hperkins-tokens//footer` again with edit context. Compare `modified`, normalized raw hashes, and footer hash with `.cache/wcus-2026/production-baseline/metadata.json`.

Expected: unchanged baselines. If any body changed, stop publication, save the fresh raw body as the new baseline, rebase only the approved edits, and repeat Tasks 4–9 for that surface.

- [ ] **Step 4: Apply any factual drift through the full artifact set**

If a cited state changed, update the audit, every affected candidate, the DOCX model, regenerated PDF, and exact verifier literals together. Run the complete Task 8 source gate and Task 9 local gate. Commit only the affected paths with an explicit allowlist:

```powershell
git add -- docs/audits/2026-08-10-wordpress-github-activity.md content/page-drafts/job-placement-digest.html content/page-drafts/about.html assets/documents/henry-perkins-wordpress-support-engineer-resume.docx assets/documents/henry-perkins-wordpress-support-engineer-resume.pdf scripts/verify-job-placement-digest-source.js scripts/lib/about-page-contract.js scripts/lib/about-page-contract.test.js scripts/verify-placement-artifacts.js
git commit -m "content: refresh WCUS publication evidence"
```

Skip this commit when there is no drift.

- [ ] **Step 5: Present the actual candidates for approval**

Show the user:

```text
1. Digest desktop event/proof/evidence captures and 390px mobile captures.
2. About desktop hero/evidence captures and 390px mobile captures.
3. The one-page résumé render at readable resolution.
4. A concise factual ledger for #501, #263, #40, #529/#593, #732/#757, Flavor Agent RC3/post-RC3, Codex v2.1, theme v0.3.53/unreleased commerce, and roadmaptrac.
5. The known publication sequence: theme/PDF first; page bodies/footer only after a second explicit confirmation.
```

Pause until the user approves the actual implementation. This approval does not yet authorize a production write or merge-to-main deploy.

### Task 11: Deploy and prove the theme, route, CSS, and PDF

**Files:**
- Remote Git branch/PR mutation after approval.
- No WordPress database writes.

**Interfaces:**
- Consumes: approved feature branch with green source/local gates.
- Produces: deployed route/CSS/PDF code while public database-owned page bodies and footer override remain unchanged.

- [ ] **Step 1: Run the exact-head release gate**

```powershell
git status --short --branch
git rev-parse HEAD
git diff --check
Get-ChildItem -Recurse -Filter *.php | ForEach-Object { php -l $_.FullName; if ($LASTEXITCODE -ne 0) { throw "PHP lint failed: $($_.FullName)" } }
node --test scripts/lib/about-page-contract.test.js scripts/lib/about-page-rendered-probe.test.js scripts/lib/content-integrity.test.js scripts/lib/page-content-contract.test.js scripts/lib/page-phase-contract.test.js scripts/lib/placement-artifact-contract.test.js scripts/lib/placement-artifact-links.test.js scripts/lib/production-gates-workflow.test.js scripts/lib/resume-route-contract.test.js scripts/lib/style-coverage.test.js
node scripts/verify-job-placement-digest-source.js
node scripts/verify-about-page-source.js --drafts
node scripts/verify-job-placement-pages.js --source-only --drafts
node scripts/verify-prominent-actions.js --source-only --drafts
node scripts/verify-resume-route.js --source-only
node scripts/verify-placement-artifacts.js --check-links
```

Expected: clean worktree and all green at the exact commit proposed for deployment.

- [ ] **Step 2: Push a review branch and wait for CI**

```powershell
git push --set-upstream origin feat/wcus-portfolio-readiness
gh pr create --base main --head feat/wcus-portfolio-readiness --title "Prepare portfolio for WordCamp US 2026" --body "Adds the stable résumé route, WCUS page candidates, current WordPress evidence, page-scoped presentation, and a refreshed one-page résumé. Production page bodies and the custom footer override remain a separate guarded write."
gh pr checks --watch
```

Expected: source-contract job passes. Deployed-production jobs do not run on the feature branch.

- [ ] **Step 3: Ask for the separate theme-deployment authorization**

State exactly:

```text
Merging this PR pushes the theme to production. It will deploy the new redirect,
page CSS, verifier code, footer source, and updated PDF at its current asset URL.
It will not update production Pages 433/6 or the custom footer database override.
Approve merge and theme deployment?
```

Wait for a direct yes before merging.

- [ ] **Step 4: Merge and identify the deployed commit**

After approval, invoke `superpowers:finishing-a-development-branch`, then:

```powershell
gh pr merge --merge --delete-branch
git fetch origin main
git rev-parse origin/main
```

Record the exact merged `origin/main` SHA. Do not describe it as deployed until the public probes below pass.

- [ ] **Step 5: Verify the strict one-hop résumé route publicly**

Poll no more than twelve times with ten-second intervals:

```powershell
$env:HPERKINS_ORIGIN = 'https://hperkins.blog'
node scripts/verify-resume-route.js
```

Expected: both GET and HEAD receive one theme-owned 302 to the same-origin PDF; final content type is `application/pdf`; incoming query keys are absent; the public PDF hash equals the committed PDF hash.

If WordPress.com still inserts the pre-deploy 307, stop before page/footer publication. Diagnose hook order and hosting canonicalization; do not mark the approved one-hop route complete or make the event CTAs public until the route passes or the user explicitly approves a revised redirect criterion.

- [ ] **Step 6: Verify old accepted content still passes during the transition**

```powershell
node scripts/verify-deployed-content-ownership.js --page=job-placement-digest --page=about
node scripts/verify-job-placement-pages.js
node scripts/verify-about-page-rendered.js
node scripts/verify-prominent-actions.js
```

Expected: production remains aligned with the prepublication snapshots; new CSS is non-disruptive to old markup; the custom footer may still expose the old upload until Task 12.

### Task 12: Publish the two page bodies and custom footer under an explicit write gate

**Files:**
- Production WordPress Page 433 `job-placement-digest`.
- Production WordPress Page 6 `about`.
- Production template part `hperkins-tokens//footer`.
- No repository snapshot edits until Task 13.

**Interfaces:**
- Consumes: publicly proven semantic route and fresh authenticated production bodies.
- Produces: live approved page candidates and a footer override whose only content change is the résumé href.

- [ ] **Step 1: Re-fetch and assert write preconditions immediately before mutation**

Use `pages.get(context=edit)` for IDs 433/6 and `template-parts.get` for `hperkins-tokens//footer`. Assert:

```text
Page 433: id=433, slug=job-placement-digest, status=publish, raw hash equals Task 10 baseline.
Page 6: id=6, slug=about, status=publish, raw hash equals Task 10 baseline.
Footer: status=publish, raw hash equals Task 10 baseline, old upload href count=1, /one-page-resume/ href count=0.
```

Abort on any mismatch. Do not attempt an automatic three-way merge into production.

- [ ] **Step 2: Describe and request one explicit grouped publication authorization**

State exactly:

```text
This production write will:
1. replace only Page 433 post_content with the approved Digest candidate;
2. replace only Page 6 post_content with the approved About candidate;
3. replace the custom footer's single old résumé href with /one-page-resume/;
4. preserve titles, slugs, publish status, all other footer markup, and the old media file;
5. immediately re-fetch and hash all three records, then promote matching snapshots in a follow-up mirror commit.
Approve these three production content updates and the required snapshot-mirror follow-up?
```

Wait for a direct yes. Earlier design, candidate, or theme-deployment approvals do not satisfy this write gate.

- [ ] **Step 3: Update Page 433 and verify it before continuing**

Describe `pages.update`, read the full approved candidate, assert its normalized SHA-256 equals the Task 12 precondition ledger, and pass that exact string as `content` with `user_confirmed: true`:

```js
const digestContent = fs.readFileSync( 'content/page-drafts/job-placement-digest.html', 'utf8' );
assert.equal( sha256( normalizeContent( digestContent ) ), approvedDigestHash );
const digestParams = { id: 433, content: digestContent, status: 'publish', user_confirmed: true };
```

Use `digestParams` as the parameters to the WordPress.com `pages.update` operation; do not serialize the variable name as page content.

Inspect `_content_warnings`; require none. Re-fetch with edit context and require normalized raw body equality with the candidate before updating Page 6.

- [ ] **Step 4: Update Page 6 and verify it before continuing**

Read and hash the approved About candidate, then execute `pages.update` with the exact string:

```js
const aboutContent = fs.readFileSync( 'content/page-drafts/about.html', 'utf8' );
assert.equal( sha256( normalizeContent( aboutContent ) ), approvedAboutHash );
const aboutParams = { id: 6, content: aboutContent, status: 'publish', user_confirmed: true };
```

Use `aboutParams` as the parameters to the WordPress.com `pages.update` operation.

Inspect `_content_warnings`; require none. Re-fetch and require normalized raw equality with the candidate.

- [ ] **Step 5: Update only the footer href and verify it**

Take the freshly fetched footer raw body and replace exactly one occurrence of:

```text
https://hperkins.blog/wp-content/uploads/2026/06/henry-perkins-wordpress-ai-open-source-resume-2026-06-30.pdf
```

with:

```text
/one-page-resume/
```

Execute `template-parts.update` for `hperkins-tokens//footer` with the full minimally changed body and `user_confirmed: true`. Re-fetch and require: old href count zero, semantic route count one, and all other normalized bytes identical to the pre-write footer body.

- [ ] **Step 6: Handle partial failure without broad rollback**

If any write or re-fetch fails, stop the sequence, report exactly which records changed, and re-read each record. Do not use `studio push`, full-site restore, or stale local bodies. Resume only from the fresh remote state under the already approved exact candidate; ask again if the required content changes.

- [ ] **Step 7: Prove the new live content against candidates**

```powershell
$env:HPERKINS_ORIGIN = 'https://hperkins.blog'
node scripts/verify-deployed-content-ownership.js --drafts --page=job-placement-digest --page=about
node scripts/verify-job-placement-pages.js --drafts
node scripts/verify-about-page-rendered.js --drafts
node scripts/verify-prominent-actions.js --drafts
node scripts/verify-resume-route.js
```

The explicit `--drafts` remote mode compares rendered production with `content/page-drafts/about.html`; `--require-local` remains absent so its localhost safety contract is not misapplied to production.

Expected: both remote bodies equal candidates, event copy is live, all visible résumé links use the semantic route, and the public footer no longer links the old upload.

### Task 13: Promote verified mirrors and complete public acceptance

**Files:**
- Modify by guarded export: `content/page-snapshots/job-placement-digest.html`
- Modify by guarded export: `content/page-snapshots/about.html`
- Create: `docs/audits/wcus-2026-production-proof.md`
- Delete temporary baseline files with `apply_patch`: `.cache/wcus-2026/production-baseline/*`

**Interfaces:**
- Consumes: production bodies proven equal to reviewed candidates and local dev DB proven equal to the same candidates.
- Produces: accepted mirrors, green deployed ownership checks, final browser/PDF evidence, and a durable production record.

- [ ] **Step 1: Re-prove the three-way body equality**

Start the mirror branch from the theme commit already proven in Task 11:

```powershell
git fetch origin main
git switch -c chore/wcus-production-mirrors origin/main
```

Record normalized SHA-256 for each surface in this exact relationship:

```text
production Page 433 raw == content/page-drafts/job-placement-digest.html == local dev Page job-placement-digest
production Page 6 raw   == content/page-drafts/about.html               == local dev Page about
```

Run:

```powershell
$env:HPERKINS_WP_PATH = 'C:\Users\htper\Studio\hperkins-tokens-dev'
$env:HPERKINS_WP_CLI_PHAR = 'C:\Users\htper\.local\bin\wp-cli.phar'
$env:HPERKINS_ORIGIN = 'http://localhost:8882'
node scripts/export-page-snapshots.js --check --expect-draft --page=job-placement-digest --page=about
```

Expected: both local DB bodies equal both drafts. Separately retain the Task 12 authenticated remote-equality result; local WP-CLI is not production proof.

- [ ] **Step 2: Export exactly two accepted snapshots**

```powershell
node scripts/export-page-snapshots.js --expect-draft --page=job-placement-digest --page=about
node scripts/verify-content-ownership.js
node scripts/verify-about-page-source.js
```

Expected: exactly two snapshot files change; each normalized snapshot hash equals its draft and the just-re-fetched production raw body.

- [ ] **Step 3: Write the permanent production proof record**

Create `docs/audits/wcus-2026-production-proof.md` containing actual values for:

```text
publication timestamp in America/Chicago
theme merge commit and first successful public probe timestamp
Page 433 modified timestamp, normalized SHA-256, and candidate/snapshot parity
Page 6 modified timestamp, normalized SHA-256, and candidate/snapshot parity
footer template-part identifier, modified timestamp, normalized SHA-256, and exact one-href delta
GET and HEAD redirect chains, statuses, X-Redirect-By, Location, and final content type
DOCX SHA-256, PDF SHA-256, one-page result, text-parity result, tag result, and live-link result
publication-day GitHub states and attribution summary
paths to local/public desktop/mobile captures retained in output evidence
statement that the old media file was not deleted
```

Do not call the merge commit deployed until the public probes in Task 11 are recorded.

- [ ] **Step 4: Run accepted-mode source and local checks**

```powershell
node scripts/verify-job-placement-digest-source.js
node scripts/verify-about-page-source.js
node scripts/verify-job-placement-pages.js --source-only
node scripts/verify-prominent-actions.js --source-only
node scripts/verify-resume-route.js --source-only
node scripts/verify-deployed-content-ownership.js --source-only
node scripts/verify-content-ownership-docs.js
node scripts/verify-placement-artifacts.js --check-links
git diff --check
```

Expected: accepted snapshot mode now expects the WCUS content; all checks pass.

- [ ] **Step 5: Commit only mirrors and the proof record**

With the mirror branch already active, stage only the accepted mirrors and proof record:

```powershell
git add -- content/page-snapshots/job-placement-digest.html content/page-snapshots/about.html docs/audits/wcus-2026-production-proof.md
git diff --cached --name-only
git commit -m "content: mirror published WCUS portfolio pages"
git push --set-upstream origin chore/wcus-production-mirrors
gh pr create --base main --head chore/wcus-production-mirrors --title "Mirror published WCUS portfolio pages" --body "Promotes only the two production-equal page snapshots and records the guarded publication proof."
gh pr checks --watch
gh pr merge --merge --delete-branch
```

The grouped Task 12 approval includes this required mirror follow-up. Abort if the staged allowlist contains any other file.

- [ ] **Step 6: Run final public accepted-mode gates**

After the snapshot-mirror deployment converges:

```powershell
$env:HPERKINS_ORIGIN = 'https://hperkins.blog'
node scripts/verify-deployed-content-ownership.js --page=job-placement-digest --page=about
node scripts/verify-job-placement-digest-metadata.js
node scripts/verify-job-placement-pages.js
node scripts/verify-about-page-rendered.js
node scripts/verify-prominent-actions.js
node scripts/verify-header.js
node scripts/verify-typography.js
node scripts/verify-resume-route.js
node scripts/verify-placement-artifacts.js --check-links
```

Expected: every accepted-mode gate passes against public production.

- [ ] **Step 7: Perform final visual and accessibility acceptance**

Capture Digest and About at 1440×1000, 1024, 768, 390×844, and 320px. Inspect the public footer on `/`, `/about/`, and `/job-placement-digest/`. Keyboard-check event actions, the root-cause fragment, evidence links, and footer résumé link. Confirm one H1 per page, sequential headings, visible focus, 44px controls, reduced-motion behavior, no horizontal overflow, and meaningful non-color state text.

Download the public PDF and compare its SHA-256 with the committed artifact. Render it again with Poppler and inspect the one page at original detail.

- [ ] **Step 8: Remove temporary baselines and hand off**

Delete only `.cache/wcus-2026/production-baseline/` with `apply_patch` after the permanent production proof contains the required hashes and timestamps. Confirm the local Studio site is offline and the worktree is clean.

Report separately:

```text
source commits
theme merge/deployment commit
production page publication timestamps
footer update timestamp
snapshot-mirror merge/deployment commit
public route/PDF proof
remaining manual Aug 20 retirement action
```

## Self-Review Checklist

- [x] Every section of the approved design maps to at least one task: event facts/copy (Tasks 4–5/7), information architecture (Tasks 2/4), evidence taxonomy/freshness (Tasks 1/4/5/10), compact proof (Task 4), stable route/footer (Tasks 2/6/11/12), visual/accessibility (Tasks 6/9/13), document contract (Task 7), ownership/publication (Tasks 1/3/11–13), and retirement (Task 8).
- [x] The plan never writes production before a fresh authenticated read and direct confirmation.
- [x] Candidate commits do not change accepted snapshots; Task 13 is the only snapshot-writing task.
- [x] The route deploy precedes every public link update.
- [x] Production verifiers remain snapshot-based before publication and candidate/accepted-mode checks are never conflated.
- [x] Every issue, PR, release, and comment uses an immutable direct link and attribution-safe wording.
- [x] The DOCX and PDF share exact recruiter text and link order, and the PDF has a one-page/tag/searchability gate plus visual inspection.
- [x] No task deletes the old Media Library PDF, creates a root-cause route, creates a résumé page, or introduces automatic event-copy retirement.
- [x] Every `git add` uses an explicit path allowlist.
- [x] All shared function names and CLI flags match across producing and consuming tasks.
