# Manual WCUS event-copy retirement review

This is a manual review runbook, not an automation schedule. Run it only after
August 20, 2026 (no earlier than August 21). WordCamp US programming is August
16–19; August 20 is only the post-event/travel boundary and is not a conference
day. Do not add cron, scheduled code, or any date-driven content mutation.

## Ownership and phase boundaries

The Digest and About WordPress database bodies remain canonical. Their files
under `content/page-drafts/` are review candidates; files under
`content/page-snapshots/` are accepted mirrors and must not change before the
corresponding production bodies are approved, written, freshly re-read, and
proven equal. The final résumé DOCX and PDF are theme-owned artifacts.
`patterns/about-resume.php` remains a portrait-only adapter over the accepted
About snapshot. `/one-page-resume/` remains the stable visible-link destination.

Theme deployment and production database writes are separate phases. This
runbook prepares source changes only. It neither authorizes nor performs a
production page/footer write, snapshot promotion, theme deployment, or route
retirement.

## Manual retirement edit

Start by freshly reading the production Digest, About, and database-owned
footer with edit context. Record their modified timestamps and normalized
hashes, compare them with the last approved publication evidence, and stop if
any surface drifted. Rebase the narrowly approved removal on that fresh state;
never publish a stale local body.

Make only these event-copy removals:

- Digest: remove the complete `.hp-wcus-callout` block; preserve the evidence
  refresh and compact debugging proof.
- About: remove the complete `.hp-about-wcus` block; preserve the Tableau and
  contribution-attribution corrections.
- Résumé: remove the exact line `WORDCAMP US 2026 — Phoenix, Aug 16–19 · Selected to staff the Core AI booth`; regenerate the DOCX and PDF together,
  and update the artifact contract for that deliberate retirement in the same
  reviewed change.
- CSS: remove the event-only selectors only after all three event blocks are
  gone. Preserve any selector still used by non-event content.
- Route: keep `/one-page-resume/` permanently unless a separately approved
  information-architecture change replaces it. Event-copy retirement does not
  authorize a route change.

Do not remove the evidence refresh, compact debugging proof, Tableau fix,
contribution attribution, stable route, or unrelated résumé evidence while
retiring the event-specific copy.

## Candidate verification

Run the candidate-aware source and local-render gates before seeking any
publication confirmation:

```powershell
node scripts/verify-resume-route.js --source-only
node scripts/verify-resume-route.js
node scripts/verify-job-placement-pages.js --source-only --drafts
node scripts/verify-prominent-actions.js --source-only --drafts
node scripts/verify-about-page-source.js --drafts
node scripts/verify-about-page-rendered.js --require-local --drafts
node scripts/verify-placement-artifacts.js --check-links
```

The unflagged résumé-route command proves the public semantic route and its PDF
response. The artifact command verifies the regenerated files directly. The
candidate checks do not promote drafts and must leave accepted snapshots
byte-identical.

## Publication gates

Publication must repeat, in order:

1. Fresh-read gate: re-fetch the full production Digest, About, and footer
   records with edit context immediately before writing; compare timestamps,
   normalized hashes, titles, slugs, status, and the intended minimal delta.
2. Explicit-confirmation gate: present those fresh preconditions and the exact
   candidate/artifact changes for direct approval. Do not treat this runbook,
   an earlier approval, or a theme deploy as write authorization.
3. Snapshot-promotion gate: after the separately approved production writes,
   re-fetch the complete bodies, prove exact equality with the approved
   candidates, and only then export and commit the accepted mirrors. Never
   promote a snapshot from an assumed or partially observed write.
4. Public-proof gate: rerun the public route, rendered page/action, deployed
   ownership, footer-link, artifact, accessibility, and responsive checks
   against the actual public origin. Preserve the fresh remote equality record;
   local WordPress evidence is not production proof.

If any write, equality check, or public proof fails, stop, identify exactly
which records changed, and freshly read every affected record before proposing
recovery. Do not compensate with a broad site push or a stale snapshot.
